import type {Metadata} from 'next';
import HomeClient from './home-client';
import {MARKET_REGISTRY} from '@/lib/markets/registry';

const allowedTop=[10,20,50,100,200,300,400,500,1000];
const country=(value:string|undefined)=>value&&MARKET_REGISTRY[value.toUpperCase()]?value.toUpperCase():'EG';

export async function generateMetadata({searchParams}:{searchParams:Promise<{country?:string}>}):Promise<Metadata>{
  const {country:raw}=await searchParams;const market=MARKET_REGISTRY[country(raw)];
  return {title:`EGYstocks — ${market.config.countryName} Stock Market Rankings`,description:`Track ${market.config.countryName}'s listed companies by market capitalization on the ${market.config.exchangeName}.`};
}

export default async function Home({searchParams}:{searchParams:Promise<{country?:string;top?:string;sector?:string;search?:string;exchange?:string}>}){
  const params=await searchParams;const selected=country(params.country);const top=allowedTop.includes(Number(params.top))?Number(params.top):100;
  return <HomeClient initialCountry={selected} initialTop={top} initialSector={params.sector??'All'} initialSearch={params.search??''} initialExchange={params.exchange??'All'}/>;
}
