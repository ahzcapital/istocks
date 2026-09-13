import {getMarketCompanies,MARKET_REGISTRY} from './registry';
import type {MarketCompany} from './types';

export const NORTH_AFRICA_CODE='NA';
export const NORTH_AFRICA_MARKETS=['EG','MA','TN','DZ'] as const;
export const NORTH_AFRICA_LIMIT=1000;

export type NorthAfricaCompany=MarketCompany & {
  regionalRank:number;
  countryName:string;
  countryFlag:string;
};

type RegionalCandidate=MarketCompany & {
  countryName:string;
  countryFlag:string;
  marketCapUSD:number;
};

function stableKey(company:MarketCompany){
  return company.id||`${company.countryCode}-${company.exchangeCode}-${company.ticker}`;
}

export function buildNorthAfricaUniverse(companiesByMarket:Record<string,MarketCompany[]>):NorthAfricaCompany[]{
  const seen=new Set<string>();
  const combined:RegionalCandidate[]=[];
  for(const code of NORTH_AFRICA_MARKETS){
    const config=MARKET_REGISTRY[code]?.config;
    if(!config)continue;
    for(const company of companiesByMarket[code]??[]){
      const marketCapUSD=company.marketCapUSD;
      if(marketCapUSD===undefined||!Number.isFinite(marketCapUSD)||marketCapUSD<0)continue;
      const key=stableKey(company);
      if(seen.has(key))continue;
      seen.add(key);
      combined.push({...company,marketCapUSD,countryCode:code,countryName:config.countryName,countryFlag:config.flag});
    }
  }
  return combined
    .sort((a,b)=>{
      const cap=b.marketCapUSD-a.marketCapUSD;
      if(cap!==0)return cap;
      return `${a.name}|${a.id}`.localeCompare(`${b.name}|${b.id}`);
    })
    .slice(0,NORTH_AFRICA_LIMIT)
    .map((company,index)=>({...company,regionalRank:index+1}));
}

export async function getNorthAfricaUniverse(){
  const entries=await Promise.all(NORTH_AFRICA_MARKETS.map(async code=>[code,await getMarketCompanies(code)] as const));
  return buildNorthAfricaUniverse(Object.fromEntries(entries));
}

export function filterNorthAfricaUniverse(companies:NorthAfricaCompany[],country:string){
  const normalized=country.toUpperCase();
  return normalized==='All'?companies:companies.filter(company=>company.countryCode===normalized);
}
