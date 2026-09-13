import {cookies} from 'next/headers';
import {randomUUID, createHash} from 'crypto';
import {prisma} from '@/lib/prisma';
import {PUBLIC_PEOPLE} from './data';
import type {Person, RankedPerson} from './types';

export const PEOPLE_PAGE_SIZE = 50;
const VOTER_COOKIE = 'na_people_voter';

function normalize(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase()
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

// The first category in the normalized dataset is the person's primary field.
// Keep the source dataset backward-compatible while exposing exactly one field in the index.
export function getPrimaryField(person: Person) {
  return person.categories[0] ?? 'Culture';
}

// "Football" is the public-facing field name; the legacy dataset stores it as Sports.
function normalizeFieldFilter(value: string) {
  const normalized = normalize(value);
  return normalized === 'football' ? 'sports' : normalized;
}

export function formatPrimaryField(person: Person) {
  const field = getPrimaryField(person);
  return field === 'Sports' ? 'Football' : field;
}

function hashVoter(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export async function getVoterKey() {
  const jar = await cookies();
  let value = jar.get(VOTER_COOKIE)?.value;
  if (!value) {
    value = randomUUID();
    jar.set(VOTER_COOKIE, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 2,
      path: '/',
    });
  }
  return hashVoter(value);
}

async function getExistingVoterKey() {
  const value = (await cookies()).get(VOTER_COOKIE)?.value;
  return value ? hashVoter(value) : null;
}

export async function getVoteStats() {
  if (!process.env.DATABASE_URL) return new Map<string, {likes: number; dislikes: number}>();
  try {
    const rows = await prisma.personVote.groupBy({
      by: ['personId', 'vote'],
      _count: {_all: true},
    });
    const stats = new Map<string, {likes: number; dislikes: number}>();
    for (const row of rows) {
      const current = stats.get(row.personId) ?? {likes: 0, dislikes: 0};
      if (row.vote === 'like') current.likes = row._count._all;
      else current.dislikes = row._count._all;
      stats.set(row.personId, current);
    }
    return stats;
  } catch {
    return new Map<string, {likes: number; dislikes: number}>();
  }
}

export async function getUserVotes(personIds: string[]) {
  if (!personIds.length || !process.env.DATABASE_URL) return new Map<string, 'like' | 'dislike'>();
  try {
    const voterKey = await getExistingVoterKey();
    if (!voterKey) return new Map<string, 'like' | 'dislike'>();
    const rows = await prisma.personVote.findMany({
      where: {voterKey, personId: {in: personIds}},
      select: {personId: true, vote: true},
    });
    return new Map(rows.map((row) => [row.personId, row.vote] as const));
  } catch {
    return new Map<string, 'like' | 'dislike'>();
  }
}

export async function rankPeople(params: {
  q?: string;
  country?: string;
  category?: string;
  period?: string;
  sort?: string;
}) {
  const q = normalize(params.q ?? '');
  const country = normalize(params.country ?? '');
  const category = normalizeFieldFilter(params.category ?? '');
  const period = normalize(params.period ?? '');

  const people = PUBLIC_PEOPLE.filter((person) => {
    if (
      country &&
      country !== 'all' &&
      !person.countries.some((value) => normalize(value) === country)
    ) return false;

    if (
      category &&
      category !== 'all' &&
      normalize(getPrimaryField(person)) !== category
    ) return false;

    if (
      period &&
      period !== 'all' &&
      !person.historicalPeriods?.some((value) => normalize(value) === period)
    ) return false;

    if (!q) return true;

    const haystack = [
      person.name,
      person.nativeName,
      ...(person.alternateNames ?? []),
      ...person.countries,
      ...person.categories,
      ...person.occupations,
      ...(person.knownFor ?? []),
      person.shortDescription,
    ]
      .filter((value): value is string => Boolean(value))
      .map(normalize)
      .join(' ');

    return haystack.includes(q);
  });

  const stats = await getVoteStats();
  const rows = people.map((person) => {
    const s = stats.get(person.id) ?? {likes: 0, dislikes: 0};
    return {
      ...person,
      likes: s.likes,
      dislikes: s.dislikes,
      netLikes: s.likes - s.dislikes,
      rank: 0,
      userVote: 'none' as const,
    };
  });

  const sort = params.sort ?? 'rank';
  rows.sort((a, b) => {
    if (sort === 'likes') return b.likes - a.likes || b.dislikes - a.dislikes || a.name.localeCompare(b.name);
    if (sort === 'dislikes') return b.dislikes - a.dislikes || b.likes - a.likes || a.name.localeCompare(b.name);
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'country') return normalize(a.countries[0]).localeCompare(normalize(b.countries[0])) || a.name.localeCompare(b.name);
    return b.netLikes - a.netLikes || b.likes - a.likes || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });

  rows.forEach((row, index) => {row.rank = index + 1;});
  const votes = await getUserVotes(rows.map((row) => row.id));
  return rows.map((row) => ({...row, userVote: votes.get(row.id) ?? 'none'})) satisfies RankedPerson[];
}

export async function getPerson(slug: string) {
  return PUBLIC_PEOPLE.find((person) => person.slug === slug);
}
