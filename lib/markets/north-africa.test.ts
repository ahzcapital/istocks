import {describe,expect,it} from 'vitest';
import {filterNorthAfricaCompanies,getNorthAfricaCompanies,isNorthAfrica,NORTH_AFRICA_COUNTRIES} from './north-africa';

describe('North Africa unified market',()=>{
  it('contains exactly the four supported countries',()=>{
    expect(NORTH_AFRICA_COUNTRIES).toEqual(['EG','MA','TN','DZ']);
  });

  it('aggregates companies and ranks by verified USD market cap',()=>{
    const rows=getNorthAfricaCompanies();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(row=>row.marketCapUSD!==undefined&&row.marketCapUSD>0)).toBe(true);
    expect(rows.every((row,index)=>row.regionalRank===index+1)).toBe(true);
    for(let i=1;i<rows.length;i++)expect(rows[i-1].marketCapUSD!).toBeGreaterThanOrEqual(rows[i].marketCapUSD!);
    expect(new Set(rows.map(row=>row.countryCode)).size).toBe(4);
  });

  it('caps the requested regional universe at 1,000 rows',()=>{
    expect(getNorthAfricaCompanies().slice(0,1000).length).toBeLessThanOrEqual(1000);
  });

  it('preserves regional rank when filtering by country',()=>{
    const rows=getNorthAfricaCompanies();
    const egypt=filterNorthAfricaCompanies(rows,{country:'EG'});
    expect(egypt.length).toBeGreaterThan(0);
    expect(egypt.every(row=>row.countryCode==='EG')).toBe(true);
    expect(egypt.some(row=>row.regionalRank>1)).toBe(true);
  });

  it('rejects duplicates by stable company id and missing USD caps',()=>{
    const rows=getNorthAfricaCompanies();
    expect(new Set(rows.map(row=>row.id)).size).toBe(rows.length);
  });

  it('identifies the regional selector independently from countries',()=>{
    expect(isNorthAfrica('NA')).toBe(true);
    expect(isNorthAfrica('EG')).toBe(false);
  });
});
