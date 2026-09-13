import {NextRequest,NextResponse} from 'next/server';

const CACHE_SECONDS=60*60*24*30;
type LogoResult={website:string;name:string;symbol:string;exchange:string};
const cache=new Map<string,LogoResult|null>();

function normalize(value:string){return value.trim().toLowerCase();}
function cachedHeaders(){return {'Cache-Control':`public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS*7}`,'X-Content-Type-Options':'nosniff'};}

async function lookup(query:string):Promise<LogoResult|null>{
  const key=normalize(query);
  if(!key)return null;
  if(cache.has(key))return cache.get(key)??null;
  try{
    const response=await fetch(`https://www.allinvestview.com/api/logo-search/?q=${encodeURIComponent(query)}`,{next:{revalidate:CACHE_SECONDS}});
    if(!response.ok){cache.set(key,null);return null;}
    const payload=await response.json() as {results?:Array<{symbol?:string;name?:string;website?:string;exchange?:string}>};
    const result=payload.results?.find(item=>item.website&&item.website.trim());
    const mapped=result?.website?{website:result.website.trim(),name:result.name??query,symbol:result.symbol??'',exchange:result.exchange??''}:null;
    cache.set(key,mapped);
    return mapped;
  }catch{
    cache.set(key,null);
    return null;
  }
}

export async function GET(request:NextRequest){
  const ticker=request.nextUrl.searchParams.get('ticker')?.trim();
  const name=request.nextUrl.searchParams.get('name')?.trim();
  const exchange=request.nextUrl.searchParams.get('exchange')?.trim();
  if(!ticker&&!name)return NextResponse.json({error:'Missing company identifier'},{status:400});

  const queries=[ticker,name].filter(Boolean) as string[];
  for(const query of queries){
    const result=await lookup(query);
    if(result){
      if(exchange&&result.exchange&&normalize(result.exchange)!==normalize(exchange)&&ticker){
        const nameResult=name?await lookup(name):null;
        if(nameResult)return NextResponse.json(nameResult,{headers:cachedHeaders()});
      }
      return NextResponse.json(result,{headers:cachedHeaders()});
    }
  }
  return NextResponse.json({website:null},{status:404,headers:{'Cache-Control':'public, max-age=300'}});
}
