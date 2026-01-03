import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import LogoutButton from "@/components/LogoutButton";
import AppHeader from "@/components/AppHeader";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProgressMap from "@/components/ProgressMap";


export default async function Home() {
  const session = await getServerSession(authOptions);

  let user = null;
  let paymentsCompleted = false;

  if (session?.user?.email) {
    const [fetchedUser, costSetting] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          cohort: true,
          payments: true
        }
      }),
      prisma.systemSetting.findUnique({
        where: { key: 'diploma_total_cost' }
      })
    ]);

    user = fetchedUser;

    if (user) {
      const TOTAL_COST = costSetting ? parseFloat(costSetting.value) : 350.00;

      const totalPaid = user.payments
        .filter(p => p.status === 'APPROVED')
        .reduce((sum, p) => sum + p.amount, 0);

      // Allow a small epsilon for float comparison or just check strict >=
      paymentsCompleted = totalPaid >= (TOTAL_COST - 1.0);
    }
  }

  // Determine if we should trigger confetti (All steps completed)
  const allCompleted = user?.profileCompleted && user?.documentsCompleted && paymentsCompleted;

  return (
    <>
      {session && <AppHeader />}
      <div className={styles.page} style={{ paddingTop: session ? '100px' : '0' }}>
        <main className={styles.main}>
          {session ? (
            <div className={styles.dashboard}>
              <div className={styles.dashboardHeader}>
                <h1>¡Hola, {user?.firstName || session.user?.name || "Estudiante"}! 👋</h1>
                <p className={styles.welcomeText}>
                  {allCompleted
                    ? "¡Felicitaciones! Has completado todo el proceso de inscripción."
                    : "Sigue tu camino para completar tu inscripción en la Diplomatura."}
                </p>
              </div>

              {(session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'AUDITOR') && (
                <div style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a202c' }}>Panel de Administración</h3>
                    <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
                      Accede a la gestión de usuarios, pagos y documentos.
                    </p>
                  </div>
                  <Link
                    href="/admin"
                    style={{
                      backgroundColor: '#0f172a',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '6px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Ir al Panel →
                  </Link>
                </div>
              )}

              {user?.cohort && (
                <div className={styles.cohortBadge}>
                  <strong>🎓 Tu Camada:</strong> {user.cohort.code}
                </div>
              )}

              {/* Visualize the Journey */}
              <div style={{ marginTop: '2rem' }}>
                <ProgressMap
                  profileCompleted={!!user?.profileCompleted}
                  documentsCompleted={!!user?.documentsCompleted}
                  paymentsCompleted={paymentsCompleted}
                />
              </div>



              <div className={styles.actions} style={{ marginTop: '3rem' }}>
                <LogoutButton />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.hero}>
                <h1>Sistema de Gestión</h1>
                <p>
                  Plataforma exclusiva para estudiantes certificados en ECOA
                </p>
                <div className={styles.ctas}>
                  <Link href="/login" className={styles.primary}>
                    Iniciar Sesión
                  </Link>
                  <Link href="/register" className={styles.secondary}>
                    Registrarse
                  </Link>
                </div>
              </div>

              <div className={styles.logoContainer}>
                <div className={styles.logoBox}>
                  <Image
                    src="/images/logo-uflp.png"
                    alt="Universidad Fray Luca Paccioli"
                    width={250}
                    height={100}
                    style={{ objectFit: 'contain' }}
                    priority
                    sizes="(max-width: 768px) 80vw, 250px"
                  />
                </div>
                <div className={styles.logoBox}>
                  <Image
                    src="/images/logo-ecoa.png"
                    alt="ECOA - Escuela Coaching Ontológico Americano"
                    width={250}
                    height={100}
                    style={{ objectFit: 'contain' }}
                    priority
                    sizes="(max-width: 768px) 80vw, 250px"
                  />
                </div>
              </div>

              <footer style={{
                marginTop: '4rem',
                paddingBottom: '2rem',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.85rem',
                width: '100%'
              }}>
                Desarrollado por Rodrigo Alcoholado © 2025
              </footer>
            </>
          )}
        </main>
      </div>
    </>
  );
}
