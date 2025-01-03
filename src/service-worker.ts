/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

interface ExtendedNotificationOptions extends NotificationOptions {
    vibrate?: number[];
}

const CACHE = `cache-${version}`;
const ASSETS = [
    ...build, // the app itself
    ...files  // everything in `static`
];

self.addEventListener('install', (event: ExtendableEvent) => {
    // Create a new cache and add all files to it
    async function addFilesToCache() {
        const cache = await caches.open(CACHE);
        await cache.addAll(ASSETS);
    }

    event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
    // Remove previous cached data from disk
    async function deleteOldCaches() {
        for (const key of await caches.keys()) {
            if (key !== CACHE) await caches.delete(key);
        }
    }

    event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event: FetchEvent) => {
    // ignore POST requests etc
    if (event.request.method !== 'GET') return;

    async function respond() {
        const url = new URL(event.request.url);
        const cache = await caches.open(CACHE);

        // `build`/`files` can always be served from cache
        if (ASSETS.includes(url.pathname)) {
            const response = await cache.match(url.pathname);
            if (response) {
                return response;
            }
        }

        // for everything else, try the network first, but fall back to cache
        try {
            const response = await fetch(event.request);

            // if we're offline, fetch can return a value that is not a Response
            // instead of throwing - and we can't pass this non-Response to cache.put
            if (response instanceof Response) {
                if (response.status === 200) {
                    cache.put(event.request, response.clone());
                }
                return response;
            }
        } catch {
            const response = await cache.match(event.request);
            if (response) {
                return response;
            }
        }

        // if all else fails, return a 404
        return new Response('Not found', { status: 404 });
    }

    event.respondWith(respond());
});

// Handle push notifications
self.addEventListener('push', (event: PushEvent) => {
    const data = event.data?.json() ?? {};
    const title = data.title ?? 'New Notification';
    const options: ExtendedNotificationOptions = {
        body: data.body ?? '',
        icon: '/icon2.png',
        badge: '/icon1.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url ?? '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();

    const url = event.notification.data?.url ?? '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (const client of windowClients) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window/tab is open, open a new one
            return self.clients.openWindow(url);
        })
    );
}); 