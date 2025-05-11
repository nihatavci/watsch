import { writable } from 'svelte/store';

interface Notification {
	id: number;
	message: string;
	type?: 'success' | 'error' | 'info';
}

const notifications = writable<Notification[]>([]);

export function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
	const id = Date.now();
	notifications.update((n) => [...n, { id, message, type }]);

	setTimeout(() => {
		notifications.update((n) => n.filter((notification) => notification.id !== id));
	}, 3000);
}

export const notificationStore = {
	subscribe: notifications.subscribe
};
