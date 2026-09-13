import {getCanonicalMarketCompanies} from '@/lib/market-data/canonical';
import {getMarketCompaniesSync,getMarketStatusSync,MARKET_REGISTRY} from './registry';
import type {MarketCompany,MarketConfig} from './types';

export const NORTH_AFRICA_CODE='NA';
export const NORTH_AFRICA_COUNTRIES=['EG','MA','TN','DZ'] as const;
export type NorthAfricaCountry=typeof NORTH_AFRICA_COUNTRIES[number];

export const NORTH_AFRICA_CONFIG:MarketConfig={
  countryCode:NORTH_AFRICA_CODE,
  countryName:'North Africa',
  flag:'🌍',
  exchangeCode:'REGIONAL',
  exchangeName:'North Africa Market',
  currencyCode:'USD',
  currencySymbol:'$',
  timezone:'Africa/Cairo',
  benchmark:'North Africa Top 1,000',
  dataSource:'Aggregated from Egypt, Morocco, Tunisia and Algeria market sources',
  delay:'Source-dependent',
  lastUpdated:'',
};

export type NorthAfricaCompany=MarketCompany & {
  regionalRank:number;
  countryName:string;
  countryFlag:string;
};

export function isNorthAfrica(code:string|undefined):boolean{return code?.toUpperCase()===NORTH_AFRICA_CODE;}

function rankNorthAfricaRows(rows:MarketCompany[]):NorthAfricaCompany[]{
  const seen=new Set<string>();
  return rows.filter(company=>{
    const key=company.id;
    if(seen.has(key)||company.marketCapUSD===undefined||!Number.isFinite(company.marketCapUSD)||company.marketCapUSD<=0)return false;
    seen.add(key);
    return true;
  }).sort((a,b)=>{const cap=b.marketCapUSD!-a.marketCapUSD!;return cap!==0?cap:a.id.localeCompare(b.id);}).map((company,index)=>({...company,regionalRank:index+1,countryName:MARKET_REGISTRY[company.countryCode].config.countryName,countryFlag:MARKET_REGISTRY[company.countryCode].config.flag}));
}

export function getNorthAfricaCompanies():NorthAfricaCompany[]{
  const rows=NORTH_AFRICA_COUNTRIES.flatMap(code=>getMarketCompaniesSync(code).map(company=>({...company,countryCode:code})));
  return rankNorthAfricaRows(rows);
}

export async function getCanonicalNorthAfricaCompanies():Promise<NorthAfricaCompany[]>{
  const responses=await Promise.all(NORTH_AFRICA_COUNTRIES.map(code=>getCanonicalMarketCompanies(code)));
  const rows=responses.flatMap((response,index)=>response.data.map(company=>({...company,countryCode:NORTH_AFRICA_COUNTRIES[index],dataSource:company.dataSource??response.meta.source})));
  return rankNorthAfricaRows(rows);
}

export function filterNorthAfricaCompanies(companies:NorthAfricaCompany[],options?:{country?:string;sector?:string;exchange?:string;search?:string}):NorthAfricaCompany[]{
  const country=options?.country?.toUpperCase()??'All';
  const sector=options?.sector??'All';
  const exchange=options?.exchange??'All';
  const search=options?.search?.trim().toLowerCase()??'';
  return companies.filter(company=>(country==='All'||company.countryCode===country)&&(sector==='All'||company.sector===sector)&&(exchange==='All'||company.exchangeCode===exchange)&&(!search||`${company.name} ${company.ticker}`.toLowerCase().includes(search)));
}

export function getNorthAfricaStatus():'open'|'closed'|'auction'{
  const statuses=NORTH_AFRICA_COUNTRIES.map(code=>getMarketStatusSync(code));
  if(statuses.some(status=>status==='open'))return 'open';
  if(statuses.some(status=>status==='auction'))return 'auction';
  return 'closed';
}
