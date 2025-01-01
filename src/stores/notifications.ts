import { writable } from 'svelte/store';

export const sidebarNotification = writable({
  show: false,
  message: ''
});

export function showNotification(message: string) {
  sidebarNotification.set({ show: true, message });
  setTimeout(() => {
    sidebarNotification.set({ show: false, message: '' });
  }, 3000);
} 