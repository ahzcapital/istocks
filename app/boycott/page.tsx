import type {Metadata} from 'next';
import BoycottTable from '@/components/boycott/boycott-table';
import {BOYCOTT_ENTRIES} from '@/lib/boycott/data';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Boycott | North Africa Hub',
  description: 'A structured reference for documented boycott campaigns and targeted products across North Africa.',
};

export default function BoycottPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="boycott-title">
        <div>
          <p className={styles.eyebrow}>North Africa</p>
          <h1 id="boycott-title">Boycott</h1>
          <p className={styles.description}>
            Products and companies targeted by documented boycott campaigns across North Africa.
          </p>
        </div>
        <div className={styles.meta} aria-label="Dataset status">
          <span>Step 1</span>
          <strong>2 trial entries</strong>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="boycott-table-title">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>Reference table</p>
            <h2 id="boycott-table-title">Targeted products</h2>
          </div>
          <p className={styles.note}>This initial table is intentionally limited to two entries.</p>
        </div>
        <BoycottTable entries={BOYCOTT_ENTRIES} />
      </section>
    </main>
  );
}
