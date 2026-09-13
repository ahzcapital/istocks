import {NextResponse} from 'next/server';
import {headers} from 'next/headers';
import {prisma} from '@/lib/prisma';
import {getPerson,getVoterKey} from '@/lib/people/service';

export const runtime = 'nodejs';

const recentRequests = new Map<string,number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

function allowed(key:string) {
  const now = Date.now();
  const previous = (recentRequests.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  if (previous.length >= MAX_REQUESTS) return false;
  previous.push(now);
  recentRequests.set(key, previous);
  if (recentRequests.size > 5000) {
    for (const [k,times] of recentRequests) if (times.every(t => now - t >= WINDOW_MS)) recentRequests.delete(k);
  }
  return true;
}

export async function POST(request:Request) {
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || headerStore.get('x-real-ip') || 'unknown';
  if (!allowed(ip)) return NextResponse.json({error:'Too many requests. Please try again shortly.'},{status:429});

  try {
    const body = await request.json() as {personId?:unknown;vote?:unknown};
    if (typeof body.personId !== 'string' || !/^[a-z0-9-]{2,100}$/.test(body.personId)) return NextResponse.json({error:'Invalid person.'},{status:400});
    if (body.vote !== 'like' && body.vote !== 'dislike' && body.vote !== 'none') return NextResponse.json({error:'Invalid vote.'},{status:400});
    if (!getPerson(body.personId)) return NextResponse.json({error:'Person not found.'},{status:404});

    const voterKey = await getVoterKey();
    const existing = await prisma.personVote.findUnique({where:{personId_voterKey:{personId:body.personId,voterKey}}});

    if (body.vote === 'none') {
      if (existing) await prisma.personVote.delete({where:{id:existing.id}});
    } else if (!existing) {
      await prisma.personVote.create({data:{personId:body.personId,voterKey,vote:body.vote}});
    } else if (existing.vote !== body.vote) {
      await prisma.personVote.update({where:{id:existing.id},data:{vote:body.vote}});
    }

    const counts = await prisma.personVote.groupBy({by:['vote'],where:{personId:body.personId},_count:{_all:true}});
    const likes = counts.find(x => x.vote === 'like')?._count._all ?? 0;
    const dislikes = counts.find(x => x.vote === 'dislike')?._count._all ?? 0;
    return NextResponse.json({personId:body.personId,likes,dislikes,netLikes:likes-dislikes,userVote:body.vote});
  } catch {
    return NextResponse.json({error:'Voting is temporarily unavailable.'},{status:503});
  }
}
