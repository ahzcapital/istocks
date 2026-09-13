import {NextRequest,NextResponse} from 'next/server';
import {formatMarketCap,getMarket,hasMarket,getMarketCompanies,rankMarketCompanies} from '@/lib/markets/registry';
import {filterNorthAfricaCompanies,getCanonicalNorthAfricaCompanies,isNorthAfrica,NORTH_AFRICA_CONFIG} from '@/lib/markets/north-africa';

const ALLOWED_LIMITS=[10,20,50,100,200,300,400,500,1000] as const;

export async function GET(req:NextRequest,{params}:{params:Promise<{country:string}>}){
  const {country}=await params;
  const normalized=country.toUpperCase();
  const requestedRaw=Number(req.nextUrl.searchParams.get('top')??req.nextUrl.searchParams.get('limit')??'100');
  const requested=ALLOWED_LIMITS.includes(requestedRaw as (typeof ALLOWED_LIMITS)[number])?requestedRaw:100;
  const sector=req.nextUrl.searchParams.get('sector')??'All';
  const exchange=req.nextUrl.searchParams.get('exchange')??'All';
  const search=(req.nextUrl.searchParams.get('search')??'').trim().toLowerCase();
  const countryFilter=req.nextUrl.searchParams.get('marketCountry')??'All';
  try{
    if(isNorthAfrica(normalized)){
      const ranked=await getCanonicalNorthAfricaCompanies();
      const filtered=filterNorthAfricaCompanies(ranked,{country:countryFilter,sector,exchange,search});
      const data=filtered.slice(0,requested);
      const timestamps=ranked.map(c=>c.timestamp).filter(Boolean).sort().reverse();
      return NextResponse.json({market:{countryCode:NORTH_AFRICA_CONFIG.countryCode,countryName:NORTH_AFRICA_CONFIG.countryName,exchangeCode:NORTH_AFRICA_CONFIG.exchangeCode,exchangeName:NORTH_AFRICA_CONFIG.exchangeName,exchanges:[],currency:NORTH_AFRICA_CONFIG.currencyCode,timezone:NORTH_AFRICA_CONFIG.timezone,benchmark:NORTH_AFRICA_CONFIG.benchmark},data,meta:{available:filtered.length,regionalUniverse:ranked.length,requestedLimit:requested,returned:data.length,knownMarketCaps:ranked.length,lastUpdated:timestamps[0]??'—',source:NORTH_AFRICA_CONFIG.dataSource,delay:NORTH_AFRICA_CONFIG.delay,sector,exchange,search,marketCountry:countryFilter,formattedExample:formatMarketCap(data[0]?.marketCapUSD,'USD')}},{headers:{'Cache-Control':'s-maxage=60, stale-while-revalidate=300'}});
    }
    if(!hasMarket(normalized))return NextResponse.json({error:'Unsupported market',country:normalized},{status:404});
    const market=getMarket(normalized);
    const ranked=rankMarketCompanies(await getMarketCompanies(normalized));
    const filtered=ranked.filter(c=>(exchange==='All'||c.exchangeCode===exchange)&&(sector==='All'||c.sector===sector)&&(!search||`${c.name} ${c.ticker}`.toLowerCase().includes(search)));
    const data=filtered.slice(0,requested);
    const knownCaps=ranked.filter(c=>c.marketCapLocal!==undefined).length;
    const timestamps=data.map(c=>c.timestamp).filter(Boolean).sort().reverse();
    return NextResponse.json({market:{countryCode:market.config.countryCode,countryName:market.config.countryName,exchangeCode:market.config.exchangeCode,exchangeName:market.config.exchangeName,exchanges:market.config.exchanges??[{code:market.config.exchangeCode,name:market.config.exchangeName}],currency:market.config.currencyCode,timezone:market.config.timezone,benchmark:market.config.benchmark},data,meta:{available:filtered.length,requestedLimit:requested,returned:data.length,knownMarketCaps:knownCaps,lastUpdated:timestamps[0]??new Date().toISOString(),source:market.config.dataSource,delay:market.config.delay,sector,exchange,search,formattedExample:formatMarketCap(data[0]?.marketCapLocal,market.config.currencyCode)}},{headers:{'Cache-Control':'s-maxage=60, stale-while-revalidate=300'}});
  }catch(error){return NextResponse.json({error:'Market data provider unavailable',country:normalized,details:error instanceof Error?error.message:'Unknown provider error'},{status:503});}
}
