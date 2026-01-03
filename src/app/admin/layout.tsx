import { requireAdminView } from '@/lib/adminAuth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from './admin.module.css';
import AdminSidebar from './components/AdminSidebar';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This will redirect if not authorized
    const session = await requireAdminView();

    return (
        <div className={styles.adminLayout}>
            <AdminSidebar user={session.user} />

            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
