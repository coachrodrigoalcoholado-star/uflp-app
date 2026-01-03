import styles from './admin.module.css';

export default function AdminLoading() {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Cargando panel de administración...</p>
        </div>
    );
}
