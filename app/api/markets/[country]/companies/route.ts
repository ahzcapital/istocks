import {NextRequest,NextResponse} from 'next/server';
import {formatMarketCap,getMarket,hasMarket,getMarketCompaniesSync,rankMarketCompanies} from '@/lib/markets/registry';

const ALLOWED_LIMITS=[10,20,50,100,200,300,400,500,1000] as const;

export async function GET(req:NextRequest,{params}:{params:Promise<{country:string}>}){
  const {country}=await params;
  const normalized=country.toUpperCase();
  if(!hasMarket(normalized))return NextResponse.json({error:'Unsupported market',country:normalized},{status:404});
  const market=getMarket(normalized);
  const requestedRaw=Number(req.nextUrl.searchParams.get('top')??req.nextUrl.searchParams.get('limit')??'100');
  const requested=ALLOWED_LIMITS.includes(requestedRaw as (typeof ALLOWED_LIMITS)[number])?requestedRaw:100;
  const sector=req.nextUrl.searchParams.get('sector')??'All';
  const exchange=req.nextUrl.searchParams.get('exchange')??'All';
  const search=(req.nextUrl.searchParams.get('search')??'').trim().toLowerCase();
  const ranked=rankMarketCompanies(getMarketCompaniesSync(normalized));
  const filtered=ranked.filter(c=>(exchange==='All'||c.exchangeCode===exchange)&&(sector==='All'||c.sector===sector)&&(!search||`${c.name} ${c.ticker}`.toLowerCase().includes(search)));
  const data=filtered.slice(0,requested);
  const knownCaps=ranked.filter(c=>c.marketCapLocal!==undefined).length;
  return NextResponse.json({market:{countryCode:market.config.countryCode,countryName:market.config.countryName,exchangeCode:market.config.exchangeCode,exchangeName:market.config.exchangeName,exchanges:market.config.exchanges??[{code:market.config.exchangeCode,name:market.config.exchangeName}],currency:market.config.currencyCode,timezone:market.config.timezone,benchmark:market.config.benchmark},data,meta:{available:filtered.length,requestedLimit:requested,returned:data.length,knownMarketCaps:knownCaps,lastUpdated:market.config.lastUpdated,source:market.config.dataSource,delay:market.config.delay,sector,exchange,search,formattedExample:formatMarketCap(data[0]?.marketCapLocal,market.config.currencyCode)}});
}
