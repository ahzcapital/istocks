import type {Metadata} from 'next';
import HomeClient from '../home-client';
import Link from 'next/link';
import {hasMarket,getMarketCompanies} from '@/lib/markets/registry';
import {getCanonicalNorthAfricaCompanies,isNorthAfrica} from '@/lib/markets/north-africa';
import type {MarketCompany} from '@/lib/markets/types';

export const metadata:Metadata={
  title:'North Africa Hub | Stock Market',
  description:'North Africa Hub stock-market rankings, company data and North African market intelligence.',
};

const allowedTop=[10,20,50,100,200,300,400,500,1000];
const country=(value:string|undefined)=>value&&((value.toUpperCase()==='NA')||hasMarket(value.toUpperCase()))?value.toUpperCase():'EG';

export default async function MarketsPage({searchParams}:{searchParams:Promise<{country?:string;top?:string;sector?:string;search?:string;exchange?:string;marketCountry?:string}>}){
  const params=await searchParams;
  const selected=country(params.country);
  const top=allowedTop.includes(Number(params.top))?Number(params.top):(isNorthAfrica(selected)?1000:100);
  let initialCompanies:MarketCompany[]= [];
  if(isNorthAfrica(selected))initialCompanies=await getCanonicalNorthAfricaCompanies();
  else{try{initialCompanies=await getMarketCompanies(selected);}catch{}}
  return <>
    <div style={{maxWidth:1280,margin:'0 auto',padding:'18px 28px 0',display:'flex',justifyContent:'flex-end'}}>
      <Link href="/markets/matrix" style={{fontSize:11,color:'var(--muted)',textDecoration:'none',letterSpacing:'.04em'}}>North Africa Market Matrix →</Link>
    </div>
    <HomeClient initialCountry={selected} initialTop={top} initialSector={params.sector??'All'} initialSearch={params.search??''} initialExchange={params.exchange??'All'} initialRegionalCountry={params.marketCountry??'All'} initialCompanies={initialCompanies}/>
  </>;
}
