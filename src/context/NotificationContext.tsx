import React, { createContext, useContext, useMemo, useState } from 'react';
import { NotificationType, NotificationPriority } from '../services/Notification';

export interface RealtimeNotification {
	id: number;
	title: string;
	message: string;
	type: NotificationType;
	priority: NotificationPriority;
	userId: string;
	isRead: boolean;
	readAt?: string | null;
	entityType?: string | null;
	entityId?: number | null;
	actionUrl?: string | null;
	iconClass?: string | null;
	metaData?: Record<string, string | number | boolean> | null;
	createdAt: string;
}

interface NotificationContextValue {
	unread: number;
	items: RealtimeNotification[];
	setUnread: (n: number) => void;
	pushItem: (n: any) => void;
	setItems: (items: RealtimeNotification[]) => void;
	updateItemById: (id: number, patch: Partial<RealtimeNotification>) => void;
	removeItemById: (id: number) => void;
	clearItems: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
	unread: 0,
	items: [],
	setUnread: () => {},
	pushItem: () => {},
	setItems: () => {},
	updateItemById: () => {},
	removeItemById: () => {},
	clearItems: () => {},
});

export const useNotification = (): NotificationContextValue => useContext(NotificationContext);

export const NotificationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [unread, setUnread] = useState<number>(0);
	const [items, setItems] = useState<RealtimeNotification[]>([]);

	const ctxValue = useMemo<NotificationContextValue>(() => ({
		unread,
		items,
		setUnread,
		pushItem: (n: any) => {
			// Validate notification object to prevent runtime errors
			if (!n || typeof n !== 'object') {
				console.warn('Invalid notification object:', n);
				return;
			}

      // Ensure required properties exist with fallbacks
      const notification: RealtimeNotification = {
        id: n.id || Date.now(), // Fallback to timestamp if no id
        title: n.title || 'Thông báo',
        message: n.message || '',
        type: n.type || NotificationType.ApplicationStatusChanged, // Use a valid enum value
        priority: n.priority || NotificationPriority.Medium,
        userId: n.userId || '',
        isRead: n.isRead !== undefined ? n.isRead : false,
        readAt: n.readAt || null,
        entityType: n.entityType || null,
        entityId: n.entityId || null,
        actionUrl: n.actionUrl || null,
        iconClass: n.iconClass || null,
        metaData: n.metaData || null,
        createdAt: n.createdAt || new Date().toISOString(),
      };

			setItems(prev => {
				// Kiểm tra xem notification đã tồn tại chưa (theo id)
				const existingIndex = prev.findIndex(item => item.id === notification.id);
				if (existingIndex !== -1) {
					// Nếu đã tồn tại, cập nhật notification đó và di chuyển lên đầu
					const updated = [...prev];
					updated.splice(existingIndex, 1);
					// Cập nhật unread: nếu notification cũ chưa đọc nhưng mới đã đọc thì giảm, ngược lại tăng
					const oldItem = prev[existingIndex];
					if (!oldItem.isRead && notification.isRead) {
						setUnread(prevUnread => Math.max(0, prevUnread - 1));
					} else if (oldItem.isRead && !notification.isRead) {
						setUnread(prevUnread => prevUnread + 1);
					}
					return [notification, ...updated];
				} else {
					// Nếu chưa tồn tại, thêm mới vào đầu
					// Tự động tăng unread nếu notification chưa đọc
					if (!notification.isRead) {
						setUnread(prevUnread => prevUnread + 1);
					}
					return [notification, ...prev];
				}
			});
		},
		setItems: (next: RealtimeNotification[]) => setItems(next),
		updateItemById: (id: number, patch: Partial<RealtimeNotification>) => {
			setItems(prev => {
				const updated = prev.map(it => it.id === id ? { ...it, ...patch } : it);
				// Tính lại unread sau khi cập nhật
				const newUnreadCount = updated.filter(n => !n.isRead).length;
				setUnread(newUnreadCount);
				return updated;
			});
		},
		removeItemById: (id: number) => {
			setItems(prev => {
				const updated = prev.filter(it => it.id !== id);
				// Tính lại unread từ danh sách còn lại
				const newUnreadCount = updated.filter(n => !n.isRead).length;
				setUnread(newUnreadCount);
				return updated;
			});
		},
		clearItems: () => {
			setItems([]);
			setUnread(0);
		},
	}), [unread, items]);

	return (
		<NotificationContext.Provider value={ctxValue}>
			{children}
		</NotificationContext.Provider>
	);
};

