import {describe,it,expect} from 'vitest';
import {rankCompanies} from './market';
import {MARKET_REGISTRY,getMarketCompaniesSync,getMarketSummarySync} from './markets/registry';

const MARKETS=['EG','MA','TN','DZ'] as const;

describe('market engine',()=>{
  it('calculates market cap from price and shares',()=>{const c=rankCompanies().find(x=>x.ticker==='COMI')!;expect(c.marketCapEGP).toBeCloseTo(470.49e9,0)});
  it('ranks largest first',()=>{const rows=rankCompanies();expect(rows[0].ticker).toBe('COMI');expect(rows.every((x,i)=>!i||rows[i-1].marketCapEGP>=x.marketCapEGP)).toBe(true)});
  it('converts EGP market cap to USD',()=>{const c=rankCompanies().find(x=>x.ticker==='COMI')!;expect(c.marketCapUSD).toBeCloseTo(470.49e9/51.36,0)});
});

describe('North Africa market registry',()=>{
  it('registers the supported North Africa markets',()=>{expect(MARKETS.every(code=>Boolean(MARKET_REGISTRY[code]))).toBe(true)});
  it('uses the correct currencies',()=>{expect(MARKET_REGISTRY.EG.config.currencyCode).toBe('EGP');expect(MARKET_REGISTRY.MA.config.currencyCode).toBe('MAD');expect(MARKET_REGISTRY.TN.config.currencyCode).toBe('TND');expect(MARKET_REGISTRY.DZ.config.currencyCode).toBe('DZD')});
  it('provides non-empty company snapshots for every supported market',()=>{for(const code of MARKETS)expect(getMarketCompaniesSync(code).length).toBeGreaterThan(0)});
  it('keeps available USD market caps internally consistent with the registry FX rate',()=>{for(const code of MARKETS){const rows=getMarketCompaniesSync(code);const fx=getMarketSummarySync(code).fxRate;for(const row of rows){if(row.marketCapLocal===undefined||row.marketCapUSD===undefined)continue;const expected=row.marketCapLocal/fx;expect(Math.abs(row.marketCapUSD-expected)/Math.max(expected,1)).toBeLessThan(0.000001)}}});
});
