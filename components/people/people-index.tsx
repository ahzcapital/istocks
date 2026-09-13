import Link from 'next/link';
import PeopleTable from '@/components/people/people-table';
import {PERSON_CATEGORIES,PERSON_PERIODS} from '@/lib/people/types';
import {PEOPLE_COUNTRIES} from '@/lib/people';
import {rankPeople,PEOPLE_PAGE_SIZE} from '@/lib/people/service';
import styles from './people-index.module.css';

type Props={title?:string;description?:string;countrySlug?:string;categorySlug?:string;query?:string;period?:string;sort?:string;page?:number};

export default async function PeopleIndex({title='People',description='The people who shaped North Africa.',countrySlug,categorySlug,query='',period='all',sort='rank',page=1}:Props) {
  const rows=await rankPeople({q:query,country:countrySlug,category:categorySlug ? PERSON_CATEGORIES.find(x=>x.toLowerCase()===categorySlug.toLowerCase()) : undefined,period,sort});
  const total=rows.length;
  const safePage=Math.max(1,Math.min(page,Math.max(1,Math.ceil(total/PEOPLE_PAGE_SIZE))));
  const visible=rows.slice((safePage-1)*PEOPLE_PAGE_SIZE,safePage*PEOPLE_PAGE_SIZE);
  const pages=Math.max(1,Math.ceil(total/PEOPLE_PAGE_SIZE));
  const href=(n:number)=>{const p=new URLSearchParams();if(query)p.set('q',query);if(period!=='all')p.set('period',period);if(sort!=='rank')p.set('sort',sort);if(n>1)p.set('page',String(n));return `/people${p.toString()?`?${p}`:''}`};

  return <div className={styles.page}>
    <section className={styles.hero}><div><div className={styles.eyebrow}>North Africa Hub / People</div><h1>{title}</h1><p>{description}</p></div><div className={styles.heroMeta}><span>{total}</span><small>{query?'matching profiles':'published profiles'}</small></div></section>
    <section className={styles.section}>
      <form className={styles.search} action="/people" method="get">
        <label className={styles.srOnly} htmlFor="people-query">Search people</label><input id="people-query" name="q" type="search" placeholder="Search people..." defaultValue={query}/>
        <select name="country" defaultValue={countrySlug??'all'} aria-label="Country"><option value="all">All countries</option>{PEOPLE_COUNTRIES.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <select name="category" defaultValue={categorySlug??'all'} aria-label="Field"><option value="all">All fields</option>{PERSON_CATEGORIES.map(c=><option key={c} value={c.toLowerCase()}>{c}</option>)}</select>
        <select name="period" defaultValue={period} aria-label="Period"><option value="all">All periods</option>{PERSON_PERIODS.map(p=><option key={p}>{p}</option>)}</select>
        <select name="sort" defaultValue={sort} aria-label="Sort"><option value="rank">Community Rank</option><option value="likes">Likes</option><option value="dislikes">Dislikes</option><option value="name">Name</option><option value="country">Country</option></select>
        <button type="submit">APPLY</button>
      </form>
    </section>
    <section className={styles.section} aria-labelledby="index-title">
      <div className={styles.sectionHeading}><div><h2 id="index-title">North Africa People Index</h2><span>Ranked by community votes</span></div><span>{total ? `Showing ${(safePage-1)*PEOPLE_PAGE_SIZE+1}–${Math.min(safePage*PEOPLE_PAGE_SIZE,total)} of ${total}` : 'No matching profiles'}</span></div>
      {visible.length?<PeopleTable initialRows={visible}/>:<div className={styles.empty}>No published profiles match these filters.</div>}
      {pages>1&&<nav className={styles.pagination} aria-label="People pages">{safePage>1&&<Link href={href(safePage-1)}>← Previous</Link>}{Array.from({length:pages},(_,i)=>i+1).slice(Math.max(0,safePage-3),Math.min(pages,safePage+2)).map(n=><Link key={n} aria-current={n===safePage?'page':undefined} href={href(n)}>{n}</Link>)}{safePage<pages&&<Link href={href(safePage+1)}>Next →</Link>)}</nav>}
    </section>
    <section className={styles.section}><div className={styles.note}><strong>Community Rank</strong><p>Net Likes = Likes − Dislikes. The ranking measures community interest; it is not an objective measure of historical importance.</p></div></section>
    <section className={styles.section}><div className={styles.sectionHeading}><h2>Explore by country</h2></div><div className={styles.countryList}>{PEOPLE_COUNTRIES.map(c=><Link key={c.slug} href={`/people/${c.slug}`} className={styles.country}><span aria-hidden="true">{c.flag}</span><span>{c.name}</span><b>→</b></Link>)}</div></section>
  </div>;
}
