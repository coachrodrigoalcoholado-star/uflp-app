'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    createdAt: string;
}

export default function NotificationsMenu() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'SUCCESS': return '#22c55e';
            case 'WARNING': return '#f59e0b';
            case 'ERROR': return '#ef4444';
            default: return '#3b82f6';
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b'
                }}
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '320px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0',
                    zIndex: 1001,
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                        Notificaciones
                    </div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                            No tienes notificaciones
                        </div>
                    ) : (
                        <div>
                            {notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: notification.read ? 'white' : '#eff6ff',
                                        cursor: notification.read ? 'default' : 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: getIconColor(notification.type),
                                            marginTop: '6px',
                                            flexShrink: 0
                                        }} />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#1e293b' }}>
                                                {notification.title}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                                                {notification.message}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
