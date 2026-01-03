"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { CheckCircle2, Circle, Lock, ArrowRight, BookOpen } from 'lucide-react';
import styles from './ProgressMap.module.css';

interface ProgressMapProps {
    profileCompleted: boolean;
    documentsCompleted: boolean;
    paymentsCompleted: boolean;
}

type StepStatus = 'completed' | 'current' | 'locked';

export default function ProgressMap({ profileCompleted, documentsCompleted, paymentsCompleted }: ProgressMapProps) {

    const steps = useMemo(() => {
        const list = [
            {
                id: 'register',
                title: 'Registro',
                description: 'Tu cuenta ha sido creada exitosamente.',
                href: null,
                status: 'completed' as StepStatus,
                icon: CheckCircle2
            },
            {
                id: 'profile',
                title: 'Perfil de Alumno',
                description: 'Completa tus datos personales y académicos.',
                href: '/dashboard/profile',
                status: profileCompleted ? 'completed' : 'current' as StepStatus,
                icon: profileCompleted ? CheckCircle2 : Circle
            },
            {
                id: 'documents',
                title: 'Documentación',
                description: 'Sube tu DNI y comprobantes necesarios.',
                href: '/dashboard/documents',
                status: profileCompleted ? (documentsCompleted ? 'completed' : 'current') : 'locked' as StepStatus,
                icon: documentsCompleted ? CheckCircle2 : (profileCompleted ? Circle : Lock)
            },
            {
                id: 'payments',
                title: 'Inscripción y Pagos',
                description: 'Abona la matrícula o cuotas correspondientes.',
                href: '/dashboard/payments',
                status: documentsCompleted ? (paymentsCompleted ? 'completed' : 'current') : 'locked' as StepStatus,
                icon: paymentsCompleted ? CheckCircle2 : (documentsCompleted ? Circle : Lock)
            },
            {
                id: 'course',
                title: paymentsCompleted ? '¡Trámite Completado!' : 'Finalización',
                description: paymentsCompleted
                    ? 'Has presentado todo lo solicitado. Estaremos en contacto para enviar los diplomas digital y físicos.'
                    : 'Completa todos los pasos para finalizar tu trámite.',
                href: null,
                status: paymentsCompleted ? 'completed' : 'locked' as StepStatus,
                icon: paymentsCompleted ? BookOpen : Lock
            }
        ];
        return list;
    }, [profileCompleted, documentsCompleted, paymentsCompleted]);

    return (
        <div className={styles.mapContainer}>
            <div className={styles.timelineLine} />

            {steps.map((step, index) => {
                const isClickable = step.status !== 'locked' && step.href;
                const isActive = step.status === 'current';

                return (
                    <div key={step.id} className={`${styles.stepCard} ${styles[step.status]} ${isActive ? styles.activeCard : ''}`}>
                        <div className={styles.iconContainer}>
                            <step.icon size={24} className={styles.stepIcon} />
                        </div>

                        <div className={styles.content}>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDescription}>{step.description}</p>

                            {isClickable && (
                                <Link href={step.href!} className={styles.actionButton}>
                                    {isActive ? 'Continuar' : 'Revisar'} <ArrowRight size={16} />
                                </Link>
                            )}

                            {step.status === 'locked' && (
                                <span className={styles.lockedLabel}>Bloqueado</span>
                            )}

                            {step.status === 'completed' && step.id === 'course' && (
                                <div className={styles.successBadge}>¡Habilitado!</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
