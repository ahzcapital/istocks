import type {HistoricalPricePoint,MarketCompany} from '@/lib/markets/types';
import {getCompanyMaxHistory} from '@/lib/company-max-history';
import {getHistoricalPrices} from '@/lib/market-data/historical-prices';

type YahooChartResult={
  meta?:{symbol?:string;currency?:string;regularMarketPrice?:number;previousClose?:number;chartPreviousClose?:number;regularMarketTime?:number};
  timestamp?:number[];
  indicators?:{quote?:Array<{open?:Array<number|null>;high?:Array<number|null>;low?:Array<number|null>;close?:Array<number|null>;volume?:Array<number|null>}>};
};
type YahooResponse={chart?:{result?:YahooChartResult[];error?:{description?:string}|null}};
type YahooSearchResponse={quotes?:Array<{symbol?:string;longname?:string;shortname?:string;quoteType?:string}>};

const YAHOO_SUFFIX:Record<string,string>={EG:'.CA',MA:'.CS',TN:'.TN',DZ:'.AL'};
const YAHOO_SOURCE='Yahoo Finance';

function finite(value:number|null|undefined):value is number{return typeof value==='number'&&Number.isFinite(value);}
function providerTicker(countryCode:string,ticker:string){const clean=ticker.trim().toUpperCase();if(clean.includes('.'))return clean;const suffix=YAHOO_SUFFIX[countryCode.toUpperCase()];return suffix?`${clean}${suffix}`:undefined;}

async function fetchJson<T>(url:string,init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,headers:{'User-Agent':'Mozilla/5.0 iStocks/1.0','Accept':'application/json',...(init?.headers??{})}});
  if(!response.ok)throw new Error(`${YAHOO_SOURCE} returned HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function fetchYahooChart(symbol:string,range:'5d'|'max'){
  const url=new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  url.searchParams.set('range',range);url.searchParams.set('interval','1d');url.searchParams.set('events','div,splits');
  const body=await fetchJson<YahooResponse>(url.toString(),{next:{revalidate:range==='max'?900:300}} as RequestInit & {next?:{revalidate:number}});
  if(body.chart?.error)throw new Error(body.chart.error.description??`${YAHOO_SOURCE} chart error`);
  const result=body.chart?.result?.[0];if(!result)throw new Error(`${YAHOO_SOURCE} returned no chart data`);return result;
}

async function resolveYahooSymbol(company:MarketCompany):Promise<string|undefined>{
  const direct=providerTicker(company.countryCode,company.ticker);
  if(direct){try{const result=await fetchYahooChart(direct,'5d');if(result.timestamp?.length)return direct;}catch{}}
  const url=new URL('https://query1.finance.yahoo.com/v1/finance/search');
  url.searchParams.set('q',`${company.ticker} ${company.name}`);url.searchParams.set('quotesCount','20');url.searchParams.set('newsCount','0');
  try{
    const body=await fetchJson<YahooSearchResponse>(url.toString(),{next:{revalidate:86400}} as RequestInit & {next?:{revalidate:number}});
    const candidates=(body.quotes??[]).filter(q=>q.quoteType==='EQUITY'&&q.symbol);
    const exact=candidates.find(q=>q.symbol?.toUpperCase()===direct?.toUpperCase());
    const sameTicker=candidates.find(q=>q.symbol?.split('.')[0]?.toUpperCase()===company.ticker.toUpperCase());
    const sameName=candidates.find(q=>`${q.longname??''} ${q.shortname??''}`.toLowerCase().includes(company.name.toLowerCase().split(' ')[0]));
    return exact?.symbol??sameTicker?.symbol??sameName?.symbol;
  }catch{return undefined;}
}

function normalizeHistory(result:YahooChartResult):HistoricalPricePoint[]{
  const timestamps=result.timestamp??[];const quote=result.indicators?.quote?.[0]??{};const points:HistoricalPricePoint[]=[];
  timestamps.forEach((timestamp,index)=>{const close=quote.close?.[index];if(!finite(timestamp)||!finite(close))return;points.push({date:new Date(timestamp*1000).toISOString(),close,open:finite(quote.open?.[index])?quote.open?.[index]:undefined,high:finite(quote.high?.[index])?quote.high?.[index]:undefined,low:finite(quote.low?.[index])?quote.low?.[index]:undefined,volume:finite(quote.volume?.[index])?quote.volume?.[index]:undefined});});
  return points.sort((a,b)=>a.date.localeCompare(b.date));
}

function buildQuote(result:YahooChartResult,company:MarketCompany):Partial<MarketCompany>{
  const meta=result.meta??{};const latest=result.indicators?.quote?.[0];const close=latest?.close?.filter(finite).at(-1);const previous=finite(meta.previousClose)?meta.previousClose:finite(meta.chartPreviousClose)?meta.chartPreviousClose:undefined;const price=finite(meta.regularMarketPrice)?meta.regularMarketPrice:close;const open=latest?.open?.filter(finite).at(-1);const high=latest?.high?.filter(finite).at(-1);const low=latest?.low?.filter(finite).at(-1);const volume=latest?.volume?.filter(finite).at(-1);const changePercent=price!==undefined&&previous!==undefined&&previous!==0?((price-previous)/previous)*100:company.changePercent;const timestamp=meta.regularMarketTime?new Date(meta.regularMarketTime*1000).toISOString():new Date().toISOString();const marketCapLocal=price!==undefined&&company.sharesOutstanding!==undefined?price*company.sharesOutstanding:company.marketCapLocal;return {...company,price,previousClose:previous??company.previousClose,changePercent,open:open??company.open,high:high??company.high,low:low??company.low,volume:volume??company.volume,marketCapLocal,marketCapUSD:marketCapLocal!==undefined&&company.marketCapUSD!==undefined&&company.marketCapLocal?company.marketCapUSD*(marketCapLocal/company.marketCapLocal):company.marketCapUSD,marketCapSource:marketCapLocal!==undefined&&company.sharesOutstanding!==undefined&&price!==undefined?'calculated':company.marketCapSource,timestamp,dataSource:YAHOO_SOURCE,providerTicker:meta.symbol};
}

function normalizeDatabaseHistory(rows:Awaited<ReturnType<typeof getHistoricalPrices>>):HistoricalPricePoint[]{
  return rows.filter(row=>Number.isFinite(row.price)&&row.price>0).map(row=>({date:row.timestamp,close:row.price,volume:row.volume,source:row.source}));
}

async function getDatabaseHistory(company:MarketCompany){
  if(!process.env.DATABASE_URL)return undefined;
  try{
    const rows=await getHistoricalPrices({ticker:company.ticker,limit:5000});
    const history=normalizeDatabaseHistory(rows);
    return history.length>1?{history,source:'Production market database',providerTicker:company.ticker,error:undefined}:undefined;
  }catch{return undefined;}
}

export async function getCompanyMarketData(company:MarketCompany){
  const databaseHistory=await getDatabaseHistory(company);
  const symbol=await resolveYahooSymbol(company);
  if(!symbol){
    if(databaseHistory)return {quote:company,history:databaseHistory.history,source:databaseHistory.source,retrievedAt:new Date().toISOString(),providerTicker:databaseHistory.providerTicker,delay:'Verified database history',historyAvailable:true,error:undefined};
    const fallback=await getCompanyMaxHistory(company);return {quote:company,history:fallback.history,source:company.dataSource??'Configured market snapshot',retrievedAt:new Date().toISOString(),providerTicker:fallback.providerTicker,delay:'Delayed snapshot',historyAvailable:fallback.history.length>1,error:fallback.error};
  }
  try{
    const [quoteResult,maxHistory]=await Promise.all([fetchYahooChart(symbol,'5d'),databaseHistory?Promise.resolve(databaseHistory):getCompanyMaxHistory(company)]);
    const history=maxHistory.history.length>1?maxHistory.history:normalizeHistory(await fetchYahooChart(symbol,'max'));
    if(history.length===0)throw new Error('Provider returned no usable historical observations');
    const quote=buildQuote(quoteResult,company);
    return {quote,history,source:maxHistory.source??YAHOO_SOURCE,retrievedAt:new Date().toISOString(),providerTicker:quoteResult.meta?.symbol??symbol,delay:maxHistory.source==='Production market database'?'Verified database history':'Delayed / provider-defined',historyAvailable:true,error:maxHistory.error||undefined};
  }catch(error){
    if(databaseHistory)return {quote:company,history:databaseHistory.history,source:databaseHistory.source,retrievedAt:new Date().toISOString(),providerTicker:databaseHistory.providerTicker,delay:'Verified database history',historyAvailable:true,error:error instanceof Error?error.message:'External quote provider error'};
    const fallback=await getCompanyMaxHistory(company);
    return {quote:company,history:fallback.history,source:company.dataSource??'Configured market snapshot',retrievedAt:new Date().toISOString(),providerTicker:fallback.providerTicker??symbol,delay:'Delayed snapshot',historyAvailable:fallback.history.length>1,error:error instanceof Error?error.message:'Unknown market-data provider error'};
  }
}
