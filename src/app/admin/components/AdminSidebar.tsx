'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../admin.module.css';
import { Menu, X, LayoutDashboard, Users, FileText, CreditCard, GraduationCap, Search, Database, Settings, LogOut } from 'lucide-react';

interface AdminSidebarProps {
    user: {
        name?: string | null;
        email?: string | null;
        role: string;
    };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar when route changes (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Usuarios', icon: Users },
        { href: '/admin/documents', label: 'Documentos', icon: FileText },
        { href: '/admin/payments', label: 'Pagos', icon: CreditCard },
        { href: '/admin/cohorts', label: 'Camadas', icon: GraduationCap },
        { href: '/admin/search', label: 'Búsqueda', icon: Search },
        { href: '/admin/reports/db', label: 'Base de Datos', icon: Database },
        { href: '/admin/settings', label: 'Configuración', icon: Settings },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className={styles.mobileToggle}
                onClick={toggleSidebar}
                aria-label="Toggle Menu"
            >
                <Menu size={24} />
            </button>

            {/* Overlay */}
            <div
                className={`${styles.sidebarOverlay} ${isOpen ? styles.overlayVisible : ''}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.headerTop}>
                        <div>
                            <h1 className={styles.sidebarTitle}>UFLP Admin</h1>
                            <p className={styles.sidebarSubtitle}>Panel de Control</p>
                        </div>
                        <button
                            className={styles.closeButton}
                            onClick={() => setIsOpen(false)}
                            aria-label="Close Menu"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <ul className={styles.navList}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href} className={styles.navItem}>
                                    <Link
                                        href={item.href}
                                        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                                    >
                                        <span className={styles.navIcon}>
                                            <Icon size={18} />
                                        </span>
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className={styles.userDetails}>
                            <div className={styles.userName}>{user.name || user.email}</div>
                            <div className={styles.userRole}>{user.role}</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
