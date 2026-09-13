'use client';

import {useEffect,useMemo,useState} from 'react';
import type {MarketCompany} from '@/lib/markets/types';

const LOGO_CACHE_KEY='north-africa-hub-company-logo-cache-v1';
const TICKER_LOGO_BASE='https://cdn.tickerlogos.com';

function initials(name:string){
  const words=name.replace(/[^\p{L}\p{N}\s&-]/gu,' ').trim().split(/\s+/).filter(Boolean);
  if(!words.length)return '—';
  if(words.length===1)return words[0].slice(0,2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function tickerLogoCandidates(company:MarketCompany){
  const ticker=company.ticker.toLowerCase().replace(/[^a-z0-9.-]/g,'');
  return [`https://s3-symbol-logo.tradingview.com/${ticker}.svg`];
}

function readCache():Record<string,string>{
  if(typeof window==='undefined')return {};
  try{return JSON.parse(window.localStorage.getItem(LOGO_CACHE_KEY)??'{}') as Record<string,string>;}catch{return {};}
}

function writeCache(key:string,url:string){
  try{
    const cache=readCache();
    cache[key]=url;
    window.localStorage.setItem(LOGO_CACHE_KEY,JSON.stringify(cache));
  }catch{}
}

export default function CompanyIdentity({company}:{company:MarketCompany}){
  const candidates=useMemo(()=>tickerLogoCandidates(company),[company.ticker]);
  const cacheKey=`${company.countryCode}:${company.exchangeCode}:${company.ticker}`.toUpperCase();
  const [sourceIndex,setSourceIndex]=useState(0);
  const [logoUrl,setLogoUrl]=useState<string|undefined>();
  const [failed,setFailed]=useState(false);
  const [resolverTried,setResolverTried]=useState(false);
  const fallback=initials(company.name);

  useEffect(()=>{
    const cached=readCache()[cacheKey];
    if(cached)setLogoUrl(cached);
  },[cacheKey]);

  async function resolveLogo(){
    if(resolverTried)return;
    setResolverTried(true);
    try{
      const params=new URLSearchParams({ticker:company.ticker,name:company.name,exchange:company.exchangeCode});
      const response=await fetch(`/api/logos?${params.toString()}`,{cache:'force-cache'});
      if(!response.ok)throw new Error('Logo not found');
      const data=await response.json() as {website?:string|null};
      if(data.website){
        const url=`${TICKER_LOGO_BASE}/${data.website.replace(/^https?:\/\//,'').replace(/\/$/,'')}`;
        writeCache(cacheKey,url);
        setLogoUrl(url);
        setFailed(false);
        return;
      }
    }catch{}
    setFailed(true);
  }

  const currentUrl=logoUrl??candidates[sourceIndex];

  return <span className="companyIdentity">
    <span className="companyLogo" aria-hidden={failed}>
      {!failed&&<img
        src={currentUrl}
        alt={`${company.name} logo`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={()=>{
          if(logoUrl){setFailed(true);return;}
          if(sourceIndex<candidates.length-1)setSourceIndex(sourceIndex+1);
          else void resolveLogo();
        }}
      />}
      {failed&&<span className="companyLogoFallback" aria-hidden="true">{fallback}</span>}
    </span>
    <span className="companyIdentityName">{company.name}</span>
  </span>;
}
