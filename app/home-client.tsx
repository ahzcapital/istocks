'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/theme-toggle';
import {MARKET_REGISTRY,formatMarketCap,formatPrice,getMarketCompaniesSync,getMarketStatusSync,getMarketSummarySync,rankMarketCompanies} from '@/lib/markets/registry';

const TOP_LIMITS=[10,20,50,100,200,300,400,500,1000] as const;
const validLimit=(value:string|null)=>{const parsed=Number(value);return TOP_LIMITS.includes(parsed as (typeof TOP_LIMITS)[number])?parsed:100;};
const validCountry=(value:string|null)=>value&&MARKET_REGISTRY[value.toUpperCase()]?value.toUpperCase():'EG';

export default function HomeClient({initialCountry='EG',initialTop=100,initialSector='All',initialSearch='',initialExchange='All'}:{initialCountry?:string;initialTop?:number;initialSector?:string;initialSearch?:string;initialExchange?:string}){
  const [country,setCountry]=useState(()=>validCountry(initialCountry));
  const [q,setQ]=useState(initialSearch);
  const [industry,setIndustry]=useState(initialSector);
  const [exchange,setExchange]=useState(initialExchange);
  const [limit,setLimit]=useState(initialTop);

  useEffect(()=>{const onPop=()=>{const p=new URLSearchParams(window.location.search);setCountry(validCountry(p.get('country')));setLimit(validLimit(p.get('top')));setIndustry(p.get('sector')??'All');setExchange(p.get('exchange')??'All');setQ(p.get('search')??'');};window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop);},[]);

  const market=MARKET_REGISTRY[country]??MARKET_REGISTRY.EG;const config=market.config;
  const allRows=useMemo(()=>rankMarketCompanies(getMarketCompaniesSync(country)),[country]);
  const summary=useMemo(()=>getMarketSummarySync(country),[country]);
  const status=useMemo(()=>getMarketStatusSync(country),[country]);
  const industries=useMemo(()=>[...new Set(allRows.map(c=>c.sector).filter(Boolean) as string[])].sort(),[allRows]);
  const exchanges=useMemo(()=>config.exchanges??[{code:config.exchangeCode,name:config.exchangeName}], [config]);
  const filtered=useMemo(()=>allRows.filter(c=>(exchange==='All'||c.exchangeCode===exchange)&&(industry==='All'||c.sector===industry)&&(`${c.name} ${c.ticker}`.toLowerCase().includes(q.trim().toLowerCase()))),[allRows,q,industry,exchange]);
  const rows=useMemo(()=>q.trim()?filtered:filtered.slice(0,limit),[filtered,q,limit]);
  const knownCaps=allRows.filter(c=>c.marketCapLocal!==undefined).length;

  function updateUrl(next:Partial<{country:string;limit:number;industry:string;q:string;exchange:string}>){
    const params=new URLSearchParams(window.location.search);const nextCountry=next.country??country;const nextLimit=next.limit??limit;const nextIndustry=next.industry??industry;const nextExchange=next.exchange??exchange;const nextQ=next.q??q;
    if(nextCountry==='EG')params.delete('country');else params.set('country',nextCountry);if(nextLimit===100)params.delete('top');else params.set('top',String(nextLimit));if(nextIndustry==='All')params.delete('sector');else params.set('sector',nextIndustry);if(nextExchange==='All')params.delete('exchange');else params.set('exchange',nextExchange);if(nextQ.trim())params.set('search',nextQ);else params.delete('search');
    window.history.pushState({},'',`${window.location.pathname}${params.toString()?`?${params}`:''}${window.location.hash}`);
  }
  function changeCountry(next:string){setCountry(next);setIndustry('All');setExchange('All');setQ('');setLimit(100);updateUrl({country:next,industry:'All',exchange:'All',q:'',limit:100});}
  function changeLimit(next:number){setLimit(next);updateUrl({limit:next});}
  function changeIndustry(next:string){setIndustry(next);updateUrl({industry:next});}
  function changeExchange(next:string){setExchange(next);updateUrl({exchange:next});}
  function changeSearch(next:string){setQ(next);updateUrl({q:next});}

  return <><div className="shell"><header className="header"><Link href="/" className="brand">EGYstocks</Link><nav className="nav"><Link href="#companies">Companies</Link><Link href={country==='EG'?'/industries':`/industries?country=${country}`}>Industries</Link><Link href="/methodology">About</Link></nav><div className="headerRight"><div className="status"><i className={`dot ${status==='open'?'positiveDot':''}`}/>{status==='open'?'Market open':'Market closed'}</div><ThemeToggle/></div></header>
  <main className="main"><section className="hero"><div><div className="eyebrow">{config.exchangeName}</div><div className="countryPicker"><label htmlFor="country">Market</label><select id="country" className="select countrySelect" value={country} onChange={e=>changeCountry(e.target.value)}>{Object.entries(MARKET_REGISTRY).map(([code,m])=><option value={code} key={code}>{m.config.flag} {m.config.countryName}</option>)}</select></div><h1>{config.countryName}'s largest<br/>listed companies.</h1><p>Ranked by market capitalization.</p></div><div className="heroMeta">Last verified snapshot<br/><strong>{new Intl.DateTimeFormat('en-GB',{timeZone:config.timezone,dateStyle:'medium'}).format(new Date())} · {config.countryName}</strong><br/>{config.delay} · source disclosed below</div></section>
  <section className="summary"><div className="stat"><strong>{summary.count}</strong><span>Companies available</span></div><div className="stat"><strong>{formatMarketCap(summary.totalLocal,config.currencyCode)}</strong><span>Combined market cap · {knownCaps}/{summary.count} with cap data</span></div><div className="stat"><strong>{formatMarketCap(summary.totalUSD,'USD')}</strong><span>Combined USD value</span></div><div className="stat"><strong>{summary.industries}</strong><span>Sectors available</span></div></section>
  <section id="companies"><div className="toolbar"><div className="filters"><select aria-label="Ranking depth" className="select" value={limit} onChange={e=>changeLimit(+e.target.value)}>{TOP_LIMITS.map(n=><option key={n} value={n}>Top {n.toLocaleString()}</option>)}</select>{exchanges.length>1&&<select aria-label="Filter by exchange" className="select" value={exchange} onChange={e=>changeExchange(e.target.value)}><option value="All">All exchanges</option>{exchanges.map(x=><option key={x.code} value={x.code}>{x.name}</option>)}</select>}<select aria-label="Filter by sector" className="select" value={industry} onChange={e=>changeIndustry(e.target.value)}><option>All</option>{industries.map(x=><option key={x}>{x}</option>)}</select></div><input aria-label="Search companies" className="search" placeholder={`Search ${config.countryName} companies…`} value={q} onChange={e=>changeSearch(e.target.value)}/></div>{!q&&limit>filtered.length&&<div className="searchNote">Showing all {filtered.length} available {config.countryName} listed companies. No placeholder rows are added.</div>}{q&&filtered.length>limit&&<div className="searchNote">Showing all matching companies across the full available {config.countryName} universe.</div>}
  <div className="table"><div className="thead"><span>Rank</span><span>Company</span><span>Ticker</span><span>Sector</span><span>Price</span><span>Change</span><span>Market cap</span></div>{rows.map(c=><Link href={`/company/${country}/${c.ticker}`} className="row" key={`${country}-${c.exchangeCode}-${c.ticker}`}><span className="rank">{c.rank?String(c.rank).padStart(2,'0'):'—'}</span><span><div className="company">{c.name}</div><div className="sub">{c.ticker} · {c.exchangeCode} · {c.sector??'—'}</div><div className="mobileMarketCap"><b>{formatMarketCap(c.marketCapLocal,config.currencyCode)}</b><span>{formatMarketCap(c.marketCapUSD,'USD')}</span></div></span><span className="value muted">{c.ticker}</span><span className="value muted">{c.sector??'—'}</span><span className="value mobilePrice">{formatPrice(c.price,config.currencyCode)}<span className={`mobileChange ${c.changePercent===undefined?'muted':c.changePercent>0?'positive':c.changePercent<0?'negative':'muted'}`}>{c.changePercent===undefined?'—':`${c.changePercent>0?'+':''}${c.changePercent.toFixed(2)}%`}</span></span><span className={`change ${c.changePercent===undefined?'muted':c.changePercent>0?'positive':c.changePercent<0?'negative':'muted'}`}>{c.changePercent===undefined?'—':`${c.changePercent>0?'+':''}${c.changePercent.toFixed(2)}%`}</span><span className="value desktopMarketCap"><b>{formatMarketCap(c.marketCapLocal,config.currencyCode)}</b><div className="sub">{formatMarketCap(c.marketCapUSD,'USD')}</div></span></Link>)}</div></section></main>
  <footer className="footer"><span>EGYstocks · Global listed markets, made simple.</span><span>{config.exchangeName} · {config.currencyCode} · {config.delay} · Updated {config.lastUpdated}</span></footer></div></>;
}
