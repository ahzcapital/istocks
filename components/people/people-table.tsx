'use client';

import Link from 'next/link';
import {useState} from 'react';
import type {RankedPerson} from '@/lib/people/types';
import styles from './people-table.module.css';

export default function PeopleTable({initialRows}:{initialRows:RankedPerson[]}) {
  const [rows,setRows] = useState(initialRows);
  const [pending,setPending] = useState<string|null>(null);

  async function vote(personId:string,vote:'like'|'dislike'|'none') {
    if (pending === personId) return;
    setPending(personId);
    try {
      const response = await fetch('/api/people/vote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({personId,vote})});
      if (!response.ok) throw new Error('Vote failed');
      const result = await response.json() as {personId:string;likes:number;dislikes:number;netLikes:number;userVote:'like'|'dislike'|'none'};
      setRows(current => current.map(row => row.id === result.personId ? {...row,likes:result.likes,dislikes:result.dislikes,netLikes:result.netLikes,userVote:result.userVote} : row));
    } finally { setPending(null); }
  }

  return <div className={styles.wrap}>
    <div className={styles.explainer}>Community Rank · higher Net Likes = higher rank. Voting reflects community interest, not historical importance.</div>
    <div className={styles.tableScroller}>
      <table className={styles.table}>
        <thead><tr><th scope="col">Rank</th><th scope="col">Person</th><th scope="col">Country</th><th scope="col">Field</th><th scope="col" className={styles.number}>Likes</th><th scope="col" className={styles.number}>Dislikes</th><th scope="col" className={styles.number}>Net Likes</th><th scope="col"><span className={styles.srOnly}>Vote</span></th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}>
          <td className={styles.rank}>#{row.rank}</td>
          <td><Link href={`/people/person/${row.slug}`} className={styles.person}><strong>{row.name}</strong>{row.nativeName && <span>{row.nativeName}</span>}<small>{row.shortDescription}</small></Link></td>
          <td className={styles.country}>{row.countries.map(c => c.charAt(0).toUpperCase()+c.slice(1)).join(' · ')}</td>
          <td className={styles.field}>{row.categories.slice(0,2).join(' · ')}</td>
          <td className={styles.number}>{row.likes.toLocaleString()}</td>
          <td className={styles.number}>{row.dislikes.toLocaleString()}</td>
          <td className={`${styles.number} ${styles.net}`}>{row.netLikes.toLocaleString()}</td>
          <td><div className={styles.actions} aria-label={`Vote for ${row.name}`}>
            <button type="button" className={row.userVote === 'like' ? styles.selected : ''} disabled={pending === row.id} onClick={() => vote(row.id,row.userVote === 'like' ? 'none' : 'like')} aria-label={row.userVote === 'like' ? `Remove like for ${row.name}` : `Like ${row.name}`}>LIKE</button>
            <button type="button" className={row.userVote === 'dislike' ? styles.selected : ''} disabled={pending === row.id} onClick={() => vote(row.id,row.userVote === 'dislike' ? 'none' : 'dislike')} aria-label={row.userVote === 'dislike' ? `Remove dislike for ${row.name}` : `Dislike ${row.name}`}>DISLIKE</button>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
