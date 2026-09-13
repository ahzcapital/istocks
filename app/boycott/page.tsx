import type {Metadata} from 'next';
import BoycottTable from '@/components/boycott/boycott-table';
import {getBoycottEntries} from '@/lib/boycott/data';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Boycott | North Africa Hub',
  description: 'A structured reference for documented boycott campaigns and targeted products across North Africa.',
};

export default async function BoycottPage() {
  const entries = await getBoycottEntries();
  const sourceBackedCount = Math.max(entries.length - 2, 0);

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="boycott-title">
        <div>
          <p className={styles.eyebrow}>North Africa</p>
          <h1 id="boycott-title">Boycott</h1>
          <p className={styles.description}>
            Products and companies appearing in documented boycott campaigns and research databases.
          </p>
        </div>
        <div className={styles.meta} aria-label="Dataset status">
          <span>Reference dataset</span>
          <strong>{entries.length.toLocaleString()} entries</strong>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="boycott-table-title">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>Reference table</p>
            <h2 id="boycott-table-title">Targeted products & companies</h2>
          </div>
          <p className={styles.note}>
            {sourceBackedCount.toLocaleString()} additional source-backed company records are included. Source categories differ; inclusion does not mean every entry is an official BDS consumer target.
          </p>
        </div>
        <BoycottTable entries={entries} />
      </section>
    </main>
  );
}
