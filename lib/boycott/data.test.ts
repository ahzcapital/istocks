import {describe,expect,it} from 'vitest';
import {BOYCOTT_ENTRIES} from './data';

describe('boycott dataset seed',()=>{
  it('keeps the verified seed entries available for fallback',()=>{
    expect(BOYCOTT_ENTRIES).toHaveLength(2);
    expect(BOYCOTT_ENTRIES.map(entry=>entry.rank)).toEqual([1,2]);
  });

  it('has complete unique seed entries',()=>{
    expect(new Set(BOYCOTT_ENTRIES.map(entry=>entry.id)).size).toBe(BOYCOTT_ENTRIES.length);
    for(const entry of BOYCOTT_ENTRIES){
      expect(entry.company.trim()).not.toBe('');
      expect(entry.product.trim()).not.toBe('');
      expect(entry.reason.trim()).not.toBe('');
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});
