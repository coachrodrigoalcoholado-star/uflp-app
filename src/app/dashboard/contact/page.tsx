'use client';

import { Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
    const router = useRouter();
    const message = "¡Hola! Tengo una duda sobre mi trámite de la DIPLOMATURA DE COACHING EN UFLP de ECOA. Por favor necesito hacer una consulta. Saludos!";
    const whatsappLink = `https://wa.me/5492614194014?text=${encodeURIComponent(message)}`;

    return (
        <>
            <AppHeader />
            <main style={{
                maxWidth: '1200px',
                margin: '100px auto 2rem auto',
                padding: '0 2rem',
                minHeight: 'calc(100vh - 200px)'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    padding: '2rem',
                    textAlign: 'center',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    <h1 style={{
                        color: '#0B5394',
                        fontSize: '2rem',
                        marginBottom: '1rem'
                    }}>
                        Contacto
                    </h1>

                    <p style={{
                        fontSize: '1.1rem',
                        color: '#4b5563',
                        marginBottom: '2rem'
                    }}>
                        Estamos aquí para ayudarte. Si tienes alguna duda o consulta sobre la diplomatura, no dudes en contactarnos.
                    </p>

                    <div style={{
                        padding: '1.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        marginBottom: '2rem'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                            Comunicate con nosotros
                        </h2>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0B5394', marginBottom: '1.5rem' }}>
                            RODRIGO ALCOHOLADO
                        </div>

                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#25D366',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                transition: 'background-color 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382C17.112 14.382 16.812 14.092 16.272 13.912C15.732 13.732 15.112 13.512 14.472 13.312C13.832 13.112 13.322 13.232 13.062 13.632C12.802 14.032 12.562 14.542 12.332 14.822C12.102 15.102 11.752 15.152 11.232 14.932C10.712 14.712 8.97198 14.002 7.78198 12.942C6.88198 12.142 6.30198 11.122 6.07198 10.662C5.84198 10.202 6.03198 10.002 6.27198 9.772C6.48198 9.572 6.70198 9.292 6.95198 8.992C7.26198 8.632 7.37198 8.352 7.57198 7.952C7.77198 7.552 7.68198 7.182 7.53198 6.882C7.38198 6.582 6.64198 4.792 6.31198 3.992C6.01198 3.232 5.67198 3.322 5.41198 3.322H4.80198C4.30198 3.322 3.84198 3.532 3.49198 3.932C2.96198 4.532 2.22198 5.762 2.22198 7.922C2.22198 10.082 3.79198 12.992 4.02198 13.312C4.25198 13.632 6.94198 17.782 11.022 19.542C12.192 20.042 13.012 20.182 13.912 20.042C14.902 19.892 16.372 19.102 16.892 17.632C17.412 16.162 17.412 14.902 17.272 14.662C17.132 14.422 16.842 14.422 16.472 14.382V14.382ZM12.002 22.002C10.202 22.002 8.49198 21.542 6.98198 20.722L6.64198 20.522L2.76198 21.542L3.81198 17.752L3.58198 17.392C2.65198 15.912 2.16198 14.212 2.16198 12.442C2.16198 7.022 6.57198 2.612 12.002 2.612C14.632 2.612 17.102 3.632 18.962 5.492C20.822 7.352 21.842 9.822 21.842 12.452C21.842 17.872 17.432 22.002 12.002 22.002ZM12.002 0.00200009C5.372 0.00200009 0.00198364 5.372 0.00198364 12.002C0.00198364 14.122 0.551984 16.112 1.51198 17.842L0.00198364 24.002L6.16198 22.382C7.86198 23.312 9.792 23.822 11.832 23.822L12.002 23.822C18.632 23.822 24.002 18.452 24.002 11.822C24.002 8.662 22.772 5.692 20.532 3.452C18.292 1.212 15.312 0.00200009 12.002 0.00200009Z" fill="white" />
                            </svg>
                            Enviar mensaje por WhatsApp
                        </a>
                    </div>
                </div>
            </main>
        </>
    );
}
