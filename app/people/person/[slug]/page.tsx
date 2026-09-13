import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import PeopleTable from '@/components/people/people-table';
import {getPerson,rankPeople} from '@/lib/people/service';
import {PEOPLE_COUNTRIES} from '@/lib/people';

export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const person=await getPerson(slug);if(!person)return {};return {title:`${person.name} | People | North Africa Hub`,description:person.shortDescription,alternates:{canonical:`/people/person/${person.slug}`}};}

export default async function PersonPage({params}:Props){
  const {slug}=await params; const person=await getPerson(slug); if(!person)notFound();
  const ranked=await rankPeople({}); const row=ranked.find(x=>x.id===person.id); if(!row)notFound();
  const countryNames=person.countries.map(slug=>PEOPLE_COUNTRIES.find(x=>x.slug===slug)?.name??slug);
  return <article className="person-profile">
    <div className="person-kicker">North Africa Hub / People / {countryNames.join(' · ')}</div>
    <header className="person-header"><div><h1>{person.name}</h1>{person.nativeName&&<div className="person-native">{person.nativeName}</div>}<p>{person.shortDescription}</p></div><div className="person-rank"><span>#{row.rank}</span><small>COMMUNITY RANK</small></div></header>
    <section className="person-vote-panel"><div><strong>{row.netLikes.toLocaleString()}</strong><span>NET LIKES</span></div><div><strong>{row.likes.toLocaleString()}</strong><span>LIKES</span></div><div><strong>{row.dislikes.toLocaleString()}</strong><span>DISLIKES</span></div><div className="person-vote-actions"><PeopleTable initialRows={[row]}/></div></section>
    <div className="person-grid">
      <main><section><div className="person-eyebrow">BIOGRAPHY</div><p className="person-bio">{person.biography}</p></section>{person.knownFor?.length&&<section><div className="person-eyebrow">KNOWN FOR</div><ul>{person.knownFor.map(x=><li key={x}>{x}</li>)}</ul></section>}</main>
      <aside><div className="person-eyebrow">PROFILE</div><dl>{person.birthDate&&<><dt>Born</dt><dd>{person.birthDate}{person.birthPlace?` · ${person.birthPlace}`:''}</dd></>}{person.deathDate&&<><dt>Died</dt><dd>{person.deathDate}{person.deathPlace?` · ${person.deathPlace}`:''}</dd></>}{<><dt>Country</dt><dd>{countryNames.join(' · ')}</dd></>}{<><dt>Fields</dt><dd>{person.categories.join(' · ')}</dd></>}{<><dt>Occupation</dt><dd>{person.occupations.join(' · ')}</dd></>}</dl></aside>
    </div>
    <section className="person-sources"><div className="person-eyebrow">SOURCES</div><ul>{person.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>{s.publisher&&<span>{s.publisher}</span>}</li>)}</ul></section>
    <Link className="person-back" href="/people">← Back to People Index</Link>
  </article>;
}
