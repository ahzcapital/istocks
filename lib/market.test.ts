import {describe,it,expect} from 'vitest';
import {rankCompanies} from './market';
import {MARKET_REGISTRY,getMarketCompaniesSync} from './markets/registry';

const FX={SA:3.75,AE:3.6725,KW:0.3065,QA:3.64,BH:0.376,OM:0.3845} as const;

describe('market engine',()=>{
  it('calculates market cap from price and shares',()=>{const c=rankCompanies().find(x=>x.ticker==='COMI')!;expect(c.marketCapEGP).toBeCloseTo(470.49e9,0)});
  it('ranks largest first',()=>{const rows=rankCompanies();expect(rows[0].ticker).toBe('COMI');expect(rows.every((x,i)=>!i||rows[i-1].marketCapEGP>=x.marketCapEGP)).toBe(true)});
  it('converts EGP market cap to USD',()=>{const c=rankCompanies().find(x=>x.ticker==='COMI')!;expect(c.marketCapUSD).toBeCloseTo(470.49e9/51.36,0)});
});

describe('GCC market registry',()=>{
  it('registers all six GCC countries',()=>{expect(['SA','AE','KW','QA','BH','OM'].every(code=>Boolean(MARKET_REGISTRY[code]))).toBe(true)});
  it('uses the correct currencies',()=>{expect(MARKET_REGISTRY.SA.config.currencyCode).toBe('SAR');expect(MARKET_REGISTRY.AE.config.currencyCode).toBe('AED');expect(MARKET_REGISTRY.KW.config.currencyCode).toBe('KWD');expect(MARKET_REGISTRY.QA.config.currencyCode).toBe('QAR');expect(MARKET_REGISTRY.BH.config.currencyCode).toBe('BHD');expect(MARKET_REGISTRY.OM.config.currencyCode).toBe('OMR')});
  it('models UAE as ADX and DFM rather than a single exchange',()=>{expect(MARKET_REGISTRY.AE.config.exchanges?.map(x=>x.code)).toEqual(['ADX','DFM']);const rows=getMarketCompaniesSync('AE');expect(rows.some(x=>x.exchangeCode==='ADX')).toBe(true);expect(rows.some(x=>x.exchangeCode==='DFM')).toBe(true)});
  it('keeps GCC market caps internally consistent with USD conversion',()=>{for(const code of Object.keys(FX) as Array<keyof typeof FX>){const rows=getMarketCompaniesSync(code);expect(rows.length).toBeGreaterThan(0);for(const row of rows)expect(row.marketCapUSD).toBeCloseTo((row.marketCapLocal??0)/FX[code],-2)}});
});
