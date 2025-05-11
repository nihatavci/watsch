import { writable } from 'svelte/store';

export const sidebarNotification = writable({
	show: false,
	message: ''
});

// Define the toast variant type
type ToastVariant = 'success' | 'error' | 'info';

// Toast notification store
export const toastNotification = writable<{
	show: boolean;
	message: string;
	variant: ToastVariant;
	duration: number;
}>({
	show: false,
	message: '',
	variant: 'success',
	duration: 3000
});

export function showNotification(message: string) {
	sidebarNotification.set({ show: true, message });
	setTimeout(() => {
		sidebarNotification.set({ show: false, message: '' });
	}, 3000);
}

export function showToast(message: string, variant: ToastVariant = 'success', duration = 3000) {
	toastNotification.set({ show: true, message, variant, duration });
	setTimeout(() => {
		toastNotification.set({ show: false, message: '', variant: 'success', duration: 3000 });
	}, duration);
}
