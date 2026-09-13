'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../admin.module.css';
import { Menu, X, LayoutDashboard, Users, FileCheck, CreditCard, Search, Database, Settings, ShieldCheck, Sparkles } from 'lucide-react';

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
        { href: '/admin/dashboard', label: 'Estado de Alumnos', icon: FileCheck },
        { href: '/admin/users', label: 'Usuarios & Perfiles', icon: Users },
        { href: '/admin/documents', label: 'Documentos', icon: FileCheck },
        { href: '/admin/payments', label: 'Pagos & Cuotas', icon: CreditCard },
        { href: '/admin/search', label: 'Búsqueda Rápida', icon: Search },
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
                <Menu size={22} />
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
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h1 className={styles.sidebarTitle}>UFLP Admin</h1>
                                <p className={styles.sidebarSubtitle}>Panel de Control Élite</p>
                            </div>
                        </div>
                        <button
                            className={styles.closeButton}
                            onClick={() => setIsOpen(false)}
                            aria-label="Close Menu"
                        >
                            <X size={22} />
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
                                        <span>{item.label}</span>
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
                            <div className={styles.userName}>{user.name || user.email?.split('@')[0]}</div>
                            <div className={styles.userRole}>
                                <span className="inline-flex items-center gap-1">
                                    <Sparkles size={10} /> {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
