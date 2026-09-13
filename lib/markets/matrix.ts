import {getMarketCompaniesSync,getMarketStatusSync,MARKET_REGISTRY} from './registry';
import type {MarketCompany} from './types';

export type NorthAfricaMatrixRow={
  code:string;
  countryName:string;
  flag:string;
  exchangeName:string;
  currencyCode:string;
  benchmark:string;
  status:'open'|'closed'|'auction';
  companies:number;
  totalMarketCapLocal:number;
  totalMarketCapUSD:number;
  topCompany?:MarketCompany;
  knownMarketCaps:number;
  dataSource:string;
  delay:string;
  lastUpdated:string;
};

export type NorthAfricaMatrix={
  rows:NorthAfricaMatrixRow[];
  totalMarketCapUSD:number;
  totalCompanies:number;
  marketCount:number;
  maxMarketCapUSD:number;
};

export function buildNorthAfricaMatrix():NorthAfricaMatrix{
  const rows=Object.entries(MARKET_REGISTRY).map(([code,{config}])=>{
    const companies=getMarketCompaniesSync(code);
    const ranked=[...companies].sort((a,b)=>(b.marketCapUSD??-1)-(a.marketCapUSD??-1));
    const totalMarketCapLocal=companies.reduce((sum,company)=>sum+(company.marketCapLocal??0),0);
    const totalMarketCapUSD=companies.reduce((sum,company)=>sum+(company.marketCapUSD??0),0);
    return {
      code,
      countryName:config.countryName,
      flag:config.flag,
      exchangeName:config.exchangeName,
      currencyCode:config.currencyCode,
      benchmark:config.benchmark,
      status:getMarketStatusSync(code),
      companies:companies.length,
      totalMarketCapLocal,
      totalMarketCapUSD,
      topCompany:ranked[0],
      knownMarketCaps:companies.filter(company=>company.marketCapUSD!==undefined).length,
      dataSource:config.dataSource,
      delay:config.delay,
      lastUpdated:companies.reduce((latest,company)=>company.timestamp&&company.timestamp>latest?company.timestamp:latest,config.lastUpdated),
    } satisfies NorthAfricaMatrixRow;
  });
  const totalCompanies=rows.reduce((sum,row)=>sum+row.companies,0);
  const totalMarketCapUSD=rows.reduce((sum,row)=>sum+row.totalMarketCapUSD,0);
  const maxMarketCapUSD=Math.max(...rows.map(row=>row.totalMarketCapUSD),0);
  return {rows,totalMarketCapUSD,totalCompanies,marketCount:rows.length,maxMarketCapUSD};
}
