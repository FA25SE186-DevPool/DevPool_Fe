import React, { createContext, useContext, useMemo, useState } from 'react';
import { type NotificationType, type NotificationPriority } from '../services/Notification';

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
	pushItem: (n: RealtimeNotification) => void;
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
		pushItem: (n: RealtimeNotification) => {
			setItems(prev => {
				// Kiểm tra xem notification đã tồn tại chưa (theo id)
				const existingIndex = prev.findIndex(item => item.id === n.id);
				if (existingIndex !== -1) {
					// Nếu đã tồn tại, cập nhật notification đó và di chuyển lên đầu
					const updated = [...prev];
					updated.splice(existingIndex, 1);
					// Cập nhật unread: nếu notification cũ chưa đọc nhưng mới đã đọc thì giảm, ngược lại tăng
					const oldItem = prev[existingIndex];
					if (!oldItem.isRead && n.isRead) {
						setUnread(prevUnread => Math.max(0, prevUnread - 1));
					} else if (oldItem.isRead && !n.isRead) {
						setUnread(prevUnread => prevUnread + 1);
					}
					return [n, ...updated];
				} else {
					// Nếu chưa tồn tại, thêm mới vào đầu
					// Tự động tăng unread nếu notification chưa đọc
					if (!n.isRead) {
						setUnread(prevUnread => prevUnread + 1);
					}
					return [n, ...prev];
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

