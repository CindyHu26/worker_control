"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    actorName: string;
    content: string;
    referenceId?: string;
    referenceType?: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            // In a real app, authenticated tokens are handled by browser cookies or interceptors
            const res = await fetch('http://localhost:3001/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    // Poll every 60s
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`http://localhost:3001/api/notifications/${id}/read`, { method: 'POST' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await fetch(`http://localhost:3001/api/notifications/read-all`, { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    const handleItemClick = async (n: Notification) => {
        if (!n.isRead) {
            // Mark read silently
            fetch(`http://localhost:3001/api/notifications/${n.id}/read`, { method: 'POST' });
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
        }
        setIsOpen(false);
        // Navigate based on type
        if (n.referenceType === 'incidents') {
            router.push(`/dashboard?incidentId=${n.referenceId}`);
        } else if (n.referenceType === 'workers') {
            router.push(`/workers?id=${n.referenceId}`);
        } else {
            // Default fallback
            router.push('/dashboard');
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in zoom-in-95 duration-200 origin-bottom-left">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h4 className="font-bold text-slate-700 text-sm">通知 (Notifications)</h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                                <Check size={12} /> Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleItemClick(n)}
                                        className={`p-3 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-800">{n.actorName}</span>
                                            <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-slate-600 leading-snug line-clamp-2">
                                            {n.content}
                                        </p>
                                        {!n.isRead && (
                                            <div className="mt-2 flex justify-end">
                                                <button
                                                    onClick={(e) => handleMarkRead(n.id, e)}
                                                    className="text-[10px] text-blue-500 hover:underline"
                                                >
                                                    Mark as read
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
