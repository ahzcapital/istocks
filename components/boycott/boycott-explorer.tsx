'use client';

import {useEffect,useMemo,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import type {BoycottCategory,BoycottEntry} from '@/lib/boycott/types';
import {CATEGORY_LABELS} from '@/lib/boycott/data';
import styles from './boycott-explorer.module.css';

function normalize(value:string){return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function initials(name:string){
  const words=name.trim().split(/\s+/).filter(Boolean);
  if(!words.length)return '—';
  if(words.length===1)return Array.from(words[0]).slice(0,2).join('').toUpperCase();
  return `${Array.from(words[0])[0]??''}${Array.from(words[1])[0]??''}`.toUpperCase();
}

function Logo({entry}:{entry:BoycottEntry}){
  const [src,setSrc]=useState(entry.logo??'');
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    if(src||failed)return;
    let cancelled=false;
    fetch(`/api/logos?name=${encodeURIComponent(entry.company)}`,{cache:'force-cache'}).then(async response=>{
      if(!response.ok)throw new Error('logo');
      const data=await response.json() as {website?:string|null};
      if(!data.website)throw new Error('logo');
      if(!cancelled)setSrc(`https://cdn.tickerlogos.com/${data.website.replace(/^https?:\/\//,'').replace(/\/$/,'')}`);
    }).catch(()=>{if(!cancelled)setFailed(true);});
    return ()=>{cancelled=true;};
  },[entry.company,failed,src]);
  return <span className={styles.logo}>{!failed&&src?<img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>{setSrc('');setFailed(true)}}/>:<span aria-hidden="true">{initials(entry.company)}</span>}</span>;
}

function categoryLabel(category?:BoycottCategory){return category?CATEGORY_LABELS[category]:'Other';}

export default function BoycottExplorer({entries}:{entries:BoycottEntry[]}){
  const router=useRouter();
  const pathname=usePathname();
  const searchParams=useSearchParams();
  const [search,setSearch]=useState(searchParams.get('search')??'');
  const [category,setCategory]=useState<BoycottCategory|'all'>((searchParams.get('category') as BoycottCategory|'all')??'all');
  const [campaign,setCampaign]=useState(searchParams.get('campaign')??'all');
  const [source,setSource]=useState(searchParams.get('source')??'all');
  const [showFilters,setShowFilters]=useState(false);
  const [selected,setSelected]=useState<BoycottEntry|null>(null);

  const categories=useMemo(()=>Array.from(new Set(entries.map(e=>e.category??'other'))).sort((a,b)=>CATEGORY_LABELS[a as BoycottCategory].localeCompare(CATEGORY_LABELS[b as BoycottCategory])),[entries]);
  const campaigns=useMemo(()=>Array.from(new Set(entries.map(e=>e.campaignType).filter(Boolean) as string[])).sort(),[entries]);
  const sources=useMemo(()=>Array.from(new Set(entries.map(e=>e.source).filter(Boolean) as string[])).sort(),[entries]);
  const normalizedSearch=normalize(search);
  const filtered=useMemo(()=>entries.filter(entry=>{
    const haystack=normalize([entry.company,entry.product,entry.category?CATEGORY_LABELS[entry.category]:'',...(entry.aliases??[])].join(' '));
    return (!normalizedSearch||haystack.includes(normalizedSearch))&&(category==='all'||entry.category===category)&&(campaign==='all'||entry.campaignType===campaign)&&(source==='all'||entry.source===source);
  }),[entries,normalizedSearch,category,campaign,source]);

  useEffect(()=>{
    const params=new URLSearchParams();
    if(search.trim())params.set('search',search.trim());
    if(category!=='all')params.set('category',category);
    if(campaign!=='all')params.set('campaign',campaign);
    if(source!=='all')params.set('source',source);
    const next=params.toString();
    const current=searchParams.toString();
    if(next!==current)router.replace(`${pathname}${next?`?${next}`:''}`,{scroll:false});
  },[search,category,campaign,source,pathname,router,searchParams]);

  function clear(){setSearch('');setCategory('all');setCampaign('all');setSource('all');}
  const active=Boolean(search||category!=='all'||campaign!=='all'||source!=='all');

  return <div className={styles.explorer}>
    <div className={styles.searchPanel}>
      <div className={styles.searchBox}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company or product..." aria-label="Search company or product" />{search&&<button className={styles.clearSearch} onClick={()=>setSearch('')} aria-label="Clear search">×</button>}</div>
      <div className={styles.filterRow}>
        <div className={styles.categoryNav} role="tablist" aria-label="Quick categories"><button className={category==='all'?styles.activeTab:''} onClick={()=>setCategory('all')} role="tab" aria-selected={category==='all'}>All</button>{categories.slice(0,7).map(value=><button key={value} className={category===value?styles.activeTab:''} onClick={()=>setCategory(value as BoycottCategory)} role="tab" aria-selected={category===value}>{CATEGORY_LABELS[value as BoycottCategory]}</button>)}</div>
        <button className={styles.filtersButton} onClick={()=>setShowFilters(value=>!value)} aria-expanded={showFilters}>Filters{active&&<span>{filtered.length}</span>}</button>
      </div>
      {showFilters&&<div className={styles.filterPanel}><label>Category<select value={category} onChange={e=>setCategory(e.target.value as BoycottCategory|'all')}><option value="all">All categories</option>{categories.map(value=><option key={value} value={value}>{CATEGORY_LABELS[value as BoycottCategory]}</option>)}</select></label><label>Campaign<select value={campaign} onChange={e=>setCampaign(e.target.value)}><option value="all">All campaigns</option>{campaigns.map(value=><option key={value} value={value}>{value}</option>)}</select></label><label>Source<select value={source} onChange={e=>setSource(e.target.value)}><option value="all">All sources</option>{sources.map(value=><option key={value} value={value}>{value}</option>)}</select></label>{active&&<button className={styles.clearFilters} onClick={clear}>Clear all</button>}</div>}
      {active&&<div className={styles.activeFilters}><span>{filtered.length.toLocaleString()} results</span>{category!=='all'&&<button onClick={()=>setCategory('all')}>{CATEGORY_LABELS[category]} ×</button>}{campaign!=='all'&&<button onClick={()=>setCampaign('all')}>{campaign} ×</button>}{source!=='all'&&<button onClick={()=>setSource('all')}>{source} ×</button>}{search&&<button onClick={()=>setSearch('')}>“{search}” ×</button>}<button onClick={clear}>Clear filters</button></div>}
    </div>
    <div className={styles.resultHeader}><div><span className={styles.resultEyebrow}>Reference table</span><h2>Companies & products</h2></div><strong>{filtered.length.toLocaleString()} <span>of {entries.length.toLocaleString()}</span></strong></div>
    {filtered.length===0?<div className={styles.empty}><strong>No companies found</strong><p>Try another company, product, or filter combination.</p><button onClick={clear}>Clear filters</button></div>:<div className={styles.tableWrap}><table><caption className="sr-only">Boycott research database</caption><colgroup><col className={styles.colRank}/><col className={styles.colCompany}/><col className={styles.colProduct}/><col className={styles.colCategory}/><col className={styles.colReason}/><col className={styles.colStatus}/></colgroup><thead><tr><th>#</th><th>Company</th><th>Product / Brand</th><th>Category</th><th>Why it appears</th><th>Status</th></tr></thead><tbody>{filtered.map((entry,index)=><tr key={entry.id} onClick={()=>setSelected(entry)} tabIndex={0} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(entry)}}}><td className={styles.rank} data-label="#">{index+1}</td><td className={styles.company} data-label="Company"><Logo entry={entry}/><strong>{entry.company}</strong></td><td data-label="Product / Brand">{entry.product||'Not specified'}</td><td data-label="Category"><span className={styles.category}>{categoryLabel(entry.category)}</span></td><td className={styles.reason} data-label="Why it appears">{entry.reason}</td><td data-label="Status"><span className={styles.status}>{entry.status||'Documented entry'}</span></td></tr>)}</tbody></table></div>}
    {selected&&<div className={styles.overlay} role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setSelected(null)}}><aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="company-detail-title"><button className={styles.close} onClick={()=>setSelected(null)} aria-label="Close">×</button><div className={styles.drawerCompany}><Logo entry={selected}/><div><span>Company</span><h3 id="company-detail-title">{selected.company}</h3></div></div><dl><div><dt>Product / Brand</dt><dd>{selected.product||'Not specified'}</dd></div><div><dt>Category</dt><dd>{categoryLabel(selected.category)}</dd></div><div><dt>Why it appears</dt><dd>{selected.reason}</dd></div><div><dt>Campaign</dt><dd>{selected.campaignType||'Not specified'}</dd></div><div><dt>Source</dt><dd>{selected.source||'Not specified'}</dd></div><div><dt>Confidence</dt><dd>{selected.confidence||'Not specified'}</dd></div></dl>{selected.sourceUrl&&<a className={styles.sourceLink} href={selected.sourceUrl} target="_blank" rel="noreferrer">Open source</a>}</aside></div>}
  </div>;
}
