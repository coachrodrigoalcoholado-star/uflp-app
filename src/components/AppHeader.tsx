"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import NotificationsMenu from "./NotificationsMenu";
import ThemeToggle from "./ThemeToggle";
import styles from "./AppHeader.module.css";

export default function AppHeader() {
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className={styles.header} style={{ position: 'fixed', top: 0, left: 0, right: 0, width: '100%', zIndex: 99999 }}>
            <div className={styles.container}>
                {/* Logo UFLP */}
                <div className={styles.logoContainer}>
                    <Link href="/" onClick={closeMenu}>
                        <Image
                            src="/images/logo-uflp.png"
                            alt="Universidad Fray Luca Paccioli"
                            width={140}
                            height={50}
                            style={{ objectFit: 'contain' }}
                            priority
                            sizes="(max-width: 768px) 120px, 140px"
                        />
                    </Link>
                </div>

                {/* Hamburger Button (Mobile Only) */}
                <button
                    className={styles.hamburger}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                >
                    <span
                        className={styles.hamburgerLine}
                        style={{ transform: isMenuOpen ? 'rotate(45deg)' : 'rotate(0)' }}
                    />
                    <span
                        className={styles.hamburgerLine}
                        style={{ opacity: isMenuOpen ? '0' : '1', transform: isMenuOpen ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                    <span
                        className={styles.hamburgerLine}
                        style={{ transform: isMenuOpen ? 'rotate(-45deg)' : 'rotate(0)' }}
                    />
                </button>

                {/* Main Navigation */}
                <nav className={`${styles.nav} ${isMenuOpen ? styles.open : ''}`}>
                    <Link href="/" className={styles.navLink} onClick={closeMenu}>
                        Inicio
                    </Link>
                    <Link href="/dashboard/documents" className={styles.navLink} onClick={closeMenu}>
                        Documentos
                    </Link>
                    <Link href="/dashboard/payments" className={styles.navLink} onClick={closeMenu}>
                        Pagos
                    </Link>
                    <Link href="/dashboard/profile" className={styles.navLink} onClick={closeMenu}>
                        Perfil
                    </Link>
                    <Link href="/dashboard/contact" className={styles.navLink} onClick={closeMenu}>
                        Contacto
                    </Link>

                    {/* Extras inside Mobile Menu for access */}
                    <div className={styles.menuExtras}>
                        <ThemeToggle />
                        <NotificationsMenu />
                    </div>
                </nav>

                {/* Secondary Group (Right Side on Desktop, Integrated/Modified on Mobile) */}
                {/* On mobile we might want to hide the ECOA logo to save space or keep it small. 
                    The ThemeToggle/Notifs are inside the menu for mobile, but outside for desktop.
                    We can use a purely CSS/Media query approach to hide duplicate instances or conditional rendering.
                    For simplicity, we'll keep duplicated toggles if needed or just use flex order.
                    
                    Better approach: Keep them in header bar for easy access? 
                    Actually, Notifications are better in the header bar.
                */}
                <div className={styles.secondaryGroup} style={{ display: isMenuOpen ? 'none' : 'flex' }}>
                    {/* Show Notifs/Theme on Desktop only here? OR show on both? 
                        The provided CSS hides .nav on mobile default. 
                        Let's keep Notifs/Theme always visible in Header for quick access, 
                        and remove them from the mobile menu to avoid duplicates if possible, 
                        OR keep them in mobile menu if space is tight.
                        Current choice: They are IN the menu logic above for mobile. 
                        So hide them here on mobile.
                     */}
                    <div style={{ display: 'none' }} className="desktop-only-extras">
                        {/* We need a utility class or media query to hide this div on mobile */}
                        {/* Implementing inline for now based on CSS module limitation without global utility */}
                    </div>

                    {/* We'll use a hack to show/hide based on width if we don't want to duplicate.
                        Let's put them in the nav (which becomes the mobile menu) AND here, 
                        and use display:none in CSS.
                    */}
                </div>

                {/* Desktop Only Right Side items */}
                <div className={styles.secondaryGroup}>
                    {/* Hide these on small mobile if needed, but ECOA logo is brand. Keep it. */}
                    <div style={{ height: '50px', display: 'flex', alignItems: 'center' }} className="hide-on-mobile">
                        <Image
                            src="/images/logo-ecoa.png"
                            alt="ECOA"
                            width={100}
                            height={40}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>

                    {(session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'AUDITOR') && (
                        <Link
                            href="/admin"
                            className={styles.superAdminBtn}
                        >
                            Vista Admin
                        </Link>
                    )}

                    {/* Desktop Toggles - Hide on Mobile via CSS module helper if possible, or just Render here.
                        Let's actually Move Theme/Notifs to be strictly inside the Nav on mobile, 
                        and strictly outside on Desktop.
                    */}
                    <div style={{ display: 'flex', gap: '1rem' }} className="desktop-toggles">
                        <style jsx>{`
                             @media (max-width: 768px) {
                                 .desktop-toggles, .hide-on-mobile {
                                     display: none !important;
                                 }
                             }
                         `}</style>
                        <ThemeToggle />
                        <NotificationsMenu />
                    </div>
                </div>
            </div>
        </header>
    );
}
