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

export function getNorthAfricaCompanies():NorthAfricaCompany[]{
  const rows=NORTH_AFRICA_COUNTRIES.flatMap(code=>getMarketCompaniesSync(code).map(company=>({
    ...company,
    countryCode:code,
    countryName:MARKET_REGISTRY[code].config.countryName,
    countryFlag:MARKET_REGISTRY[code].config.flag,
  })));
  const seen=new Set<string>();
  const eligible=rows.filter(company=>{
    const key=company.id;
    if(seen.has(key)||company.marketCapUSD===undefined||!Number.isFinite(company.marketCapUSD)||company.marketCapUSD<=0)return false;
    seen.add(key);
    return true;
  });
  return eligible.sort((a,b)=>{
    const cap=b.marketCapUSD!-a.marketCapUSD!;
    if(cap!==0)return cap;
    return a.id.localeCompare(b.id);
  }).map((company,index)=>({...company,regionalRank:index+1}));
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
