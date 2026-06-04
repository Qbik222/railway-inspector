import type { ReactNode } from "react";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden>
            ⛽
          </span>
          <div>
            <h1>Розрахунок об'єму та маси наливів</h1>
            <p className={styles.subtitle}>
              Залізничні цистерни · калібровка · приведення густини до 15°C
            </p>
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <span>v0.1.0 · Автоматичне збереження в localStorage</span>
      </footer>
    </div>
  );
}
