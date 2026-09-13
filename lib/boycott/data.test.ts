import {describe,expect,it} from 'vitest';
import {BOYCOTT_ENTRIES} from './data';


describe('boycott trial dataset',()=>{
  it('contains exactly two trial entries',()=>{
    expect(BOYCOTT_ENTRIES).toHaveLength(2);
  });

  it('has complete unique entries with sequential ranks',()=>{
    expect(new Set(BOYCOTT_ENTRIES.map(entry=>entry.id)).size).toBe(BOYCOTT_ENTRIES.length);
    expect(BOYCOTT_ENTRIES.map(entry=>entry.rank)).toEqual([1,2]);
    for(const entry of BOYCOTT_ENTRIES){
      expect(entry.company.trim()).not.toBe('');
      expect(entry.product.trim()).not.toBe('');
      expect(entry.reason.trim()).not.toBe('');
    }
  });
});
