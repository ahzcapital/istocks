import type {Metadata} from 'next';
import Link from 'next/link';
import {buildNorthAfricaMatrix} from '@/lib/markets/matrix';
import {formatMarketCap} from '@/lib/markets/registry';
import styles from './matrix.module.css';

export const metadata:Metadata={
  title:'North Africa Market Matrix | North Africa Hub',
  description:'Compare Egypt, Morocco, Tunisia and Algeria through one unified North Africa market view.',
};

function statusLabel(status:'open'|'closed'|'auction'){
  return status==='open'?'Open':status==='auction'?'Auction':'Closed';
}

function dateLabel(value:string){
  if(value==='—')return value;
  return new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
}

export default function MarketMatrixPage(){
  const matrix=buildNorthAfricaMatrix();
  return <div className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/markets" className={styles.brand}>North Africa Hub</Link>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link href="/markets">Markets</Link>
          <Link href="/markets/matrix" aria-current="page">Matrix</Link>
          <Link href="/industries">Industries</Link>
          <Link href="/methodology">About</Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>North Africa / Market view</p>
            <h1>Four markets.<br/><em>One matrix.</em></h1>
            <p className={styles.lede}>A single comparable view of listed equity markets across Egypt, Morocco, Tunisia and Algeria — without pretending the underlying data is more complete than it is.</p>
          </div>
          <div className={styles.heroNote}>
            <span>Coverage</span>
            <strong>{matrix.marketCount} markets</strong>
            <small>{matrix.totalCompanies.toLocaleString('en-US')} listed companies in the current registry</small>
          </div>
        </section>

        <section className={styles.kpis} aria-label="North Africa market totals">
          <div><span>Combined market cap</span><strong>{formatMarketCap(matrix.totalMarketCapUSD,'USD')}</strong><small>Sum of currently available company market-cap observations</small></div>
          <div><span>Markets</span><strong>{matrix.marketCount}</strong><small>EGX · Casablanca · Tunis · Algiers</small></div>
          <div><span>Companies</span><strong>{matrix.totalCompanies.toLocaleString('en-US')}</strong><small>Registry universe across the four markets</small></div>
        </section>

        <section className={styles.section} aria-labelledby="comparison-title">
          <div className={styles.sectionHead}>
            <div><p className={styles.eyebrow}>Capital scale</p><h2 id="comparison-title">Market size, side by side.</h2></div>
            <p>Bars are scaled to the largest market in the current verified dataset. They are comparisons of reported market-cap observations, not capital-flow estimates.</p>
          </div>
          <div className={styles.matrix}>
            {matrix.rows.map(row=>{
              const width=matrix.maxMarketCapUSD>0?Math.max(4,(row.totalMarketCapUSD/matrix.maxMarketCapUSD)*100):4;
              return <article className={styles.marketRow} key={row.code}>
                <div className={styles.marketIdentity}>
                  <div className={styles.flag} aria-hidden="true">{row.flag}</div>
                  <div><Link href={`/markets?country=${row.code}`} className={styles.country}>{row.countryName}</Link><span>{row.exchangeName} · {row.benchmark}</span></div>
                </div>
                <div className={styles.barArea} aria-label={`${row.countryName} market cap ${formatMarketCap(row.totalMarketCapUSD,'USD')}`}><div className={styles.bar} style={{width:`${width}%`}}/></div>
                <div className={styles.cap}><strong>{formatMarketCap(row.totalMarketCapUSD,'USD')}</strong><span>{row.knownMarketCaps}/{row.companies} with cap data</span></div>
                <div className={styles.status}><i className={row.status==='open'?styles.open:styles.closed}/><span>{statusLabel(row.status)}</span></div>
              </article>;
            })}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="market-detail-title">
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Market ledger</p><h2 id="market-detail-title">A closer read.</h2></div><p>Follow any market into its existing company ranking, filters and company intelligence pages.</p></div>
          <div className={styles.cards}>
            {matrix.rows.map(row=><Link href={`/markets?country=${row.code}`} className={styles.card} key={row.code}>
              <div className={styles.cardTop}><span>{row.flag} {row.countryName}</span><span className={row.status==='open'?styles.live:styles.muted}>{statusLabel(row.status)}</span></div>
              <div className={styles.cardValue}>{formatMarketCap(row.totalMarketCapUSD,'USD')}</div>
              <dl><div><dt>Exchange</dt><dd>{row.exchangeName}</dd></div><div><dt>Currency</dt><dd>{row.currencyCode}</dd></div><div><dt>Companies</dt><dd>{row.companies.toLocaleString('en-US')}</dd></div><div><dt>Largest by cap</dt><dd>{row.topCompany?.name??'—'}</dd></div></dl>
              <div className={styles.cardFoot}><span>{row.delay}</span><span>{dateLabel(row.lastUpdated)}</span></div>
            </Link>)}
          </div>
        </section>

        <section className={styles.note}>
          <strong>Data discipline</strong>
          <p>The matrix only aggregates values already present in the market registry. A missing quote or market cap remains missing; the interface never creates placeholder companies or synthetic market values to make a market look complete.</p>
        </section>
      </main>
      <footer className={styles.footer}><span>North Africa Hub</span><span>Egypt · Morocco · Tunisia · Algeria</span></footer>
    </div>
  </div>;
}
