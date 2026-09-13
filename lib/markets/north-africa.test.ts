import {describe,expect,it} from 'vitest';
import {buildNorthAfricaUniverse,filterNorthAfricaUniverse,NORTH_AFRICA_LIMIT} from './north-africa';
import type {MarketCompany} from './types';

const company=(id:string,countryCode:string,marketCapUSD:number,name=id):MarketCompany=>({id,countryCode,exchangeCode:`${countryCode}-X`,ticker:id,name,currency:'USD',marketCapUSD,marketCapLocal:marketCapUSD,price:10});

describe('North Africa company universe',()=>{
  const data={
    EG:[company('EG1','EG',8,'Egypt One'),company('EG2','EG',5,'Egypt Two')],
    MA:[company('MA1','MA',6,'Morocco One')],
    TN:[company('TN1','TN',2,'Tunisia One')],
    DZ:[company('DZ1','DZ',1.5,'Algeria One')],
  };

  it('combines all four markets into one regional ranking',()=>{
    const rows=buildNorthAfricaUniverse(data);
    expect(rows.map(row=>row.id)).toEqual(['EG1','MA1','EG2','TN1','DZ1']);
    expect(rows.map(row=>row.regionalRank)).toEqual([1,2,3,4,5]);
    expect(rows.map(row=>row.countryCode)).toEqual(['EG','MA','EG','TN','DZ']);
  });

  it('drops missing or invalid USD market caps instead of fabricating ranks',()=>{
    const rows=buildNorthAfricaUniverse({EG:[company('GOOD','EG',10),{...company('MISSING','EG',0),marketCapUSD:undefined},{...company('INVALID','EG',0),marketCapUSD:NaN}],MA:[],TN:[],DZ:[]});
    expect(rows.map(row=>row.id)).toEqual(['GOOD']);
  });

  it('protects against duplicate stable company identifiers',()=>{
    const rows=buildNorthAfricaUniverse({EG:[company('DUP','EG',10)],MA:[company('DUP','MA',20)],TN:[],DZ:[]});
    expect(rows).toHaveLength(1);
    expect(rows[0].countryCode).toBe('EG');
  });

  it('caps the regional universe at 1,000 companies',()=>{
    const eg=Array.from({length:1200},(_,index)=>company(`EG${index}`,'EG',1200-index));
    const rows=buildNorthAfricaUniverse({EG:eg,MA:[],TN:[],DZ:[]});
    expect(rows).toHaveLength(NORTH_AFRICA_LIMIT);
    expect(rows[0].regionalRank).toBe(1);
    expect(rows.at(-1)?.regionalRank).toBe(1000);
  });

  it('filters within North Africa without changing regional rank',()=>{
    const rows=buildNorthAfricaUniverse(data);
    const egypt=filterNorthAfricaUniverse(rows,'EG');
    expect(egypt.map(row=>row.id)).toEqual(['EG1','EG2']);
    expect(egypt.map(row=>row.regionalRank)).toEqual([1,3]);
    expect(filterNorthAfricaUniverse(rows,'All')).toHaveLength(5);
  });
});
