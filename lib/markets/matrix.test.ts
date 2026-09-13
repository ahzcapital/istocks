import {buildNorthAfricaMatrix} from './matrix';

describe('buildNorthAfricaMatrix',()=>{
  it('builds one comparable row for each registered North African market',()=>{
    const matrix=buildNorthAfricaMatrix();
    expect(matrix.marketCount).toBe(4);
    expect(matrix.rows.map(row=>row.code)).toEqual(['EG','MA','TN','DZ']);
    expect(matrix.totalCompanies).toBeGreaterThan(0);
    expect(matrix.totalMarketCapUSD).toBeGreaterThan(0);
  });

  it('does not invent market-cap data for companies without a verified value',()=>{
    const matrix=buildNorthAfricaMatrix();
    for(const row of matrix.rows){
      expect(row.knownMarketCaps).toBeLessThanOrEqual(row.companies);
      expect(row.totalMarketCapUSD).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps the largest market as the maximum comparison scale',()=>{
    const matrix=buildNorthAfricaMatrix();
    expect(matrix.maxMarketCapUSD).toBe(Math.max(...matrix.rows.map(row=>row.totalMarketCapUSD)));
  });
});
