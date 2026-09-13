import type {Metadata} from 'next';
import PeopleIndex from '@/components/people/people-index';

export const dynamic='force-dynamic';
export const metadata: Metadata={title:'People | North Africa Hub',description:'Explore the people who shaped North Africa across history, business, culture, cinema, science, sports, literature and politics.'};

type Props={searchParams:Promise<{q?:string;country?:string;category?:string;period?:string;sort?:string;page?:string}>};
export default async function PeoplePage({searchParams}:Props){const p=await searchParams;return <PeopleIndex query={p.q} countrySlug={p.country} categorySlug={p.category} period={p.period} sort={p.sort} page={Number(p.page)||1}/>;}
