import type {BoycottEntry} from '@/lib/boycott/types';
import styles from './boycott-table.module.css';

export default function BoycottTable({entries}:{entries:BoycottEntry[]}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className="sr-only">Boycott products and companies</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.rank}>#</th>
            <th scope="col">Company</th>
            <th scope="col">Product</th>
            <th scope="col">Reason</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id}>
              <td className={`${styles.rank} ${styles.rankValue}`} data-label="#">{entry.rank}</td>
              <td className={styles.company} data-label="Company">{entry.company}</td>
              <td className={styles.product} data-label="Product">{entry.product}</td>
              <td className={styles.reason} data-label="Reason">{entry.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
