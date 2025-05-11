import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { authStore } from './auth';

interface WatchLaterItem {
  id: string;
  title: string;
  mediaType: 'movie' | 'tv';
  poster?: string;
  year?: number;
  addedAt: number;
}

interface WatchLaterStore {
  items: WatchLaterItem[];
  lastSync: number | null;
}

// Create the watch later store
function createWatchLaterStore() {
  const initialState: WatchLaterStore = {
    items: [],
    lastSync: null
  };

  const { subscribe, update, set } = writable<WatchLaterStore>(initialState);

  return {
    subscribe,
    
    // Add an item to watch later
    add: async (item: Omit<WatchLaterItem, 'addedAt'>) => {
      try {
        // Only allow this for authenticated users
        let isAuthenticated = false;
        authStore.subscribe(state => {
          isAuthenticated = state.isAuthenticated;
        })();
        
        if (!isAuthenticated) {
          throw new Error('You must be signed in to save items');
        }

        // First, add to server
        const response = await fetch('/api/watch-later', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            mediaId: item.id,
            mediaType: item.mediaType
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save item');
        }

        // Then update local store
        update(state => {
          // Check if item already exists
          if (state.items.some(i => i.id === item.id && i.mediaType === item.mediaType)) {
            return state;
          }

          // Add to local store
          return {
            ...state,
            items: [
              {
                ...item,
                addedAt: Date.now()
              },
              ...state.items
            ]
          };
        });

        return true;
      } catch (error) {
        console.error('Error adding to watch later:', error);
        return false;
      }
    },

    // Remove an item from watch later
    remove: async (id: string, mediaType: 'movie' | 'tv') => {
      try {
        // Only allow this for authenticated users
        let isAuthenticated = false;
        authStore.subscribe(state => {
          isAuthenticated = state.isAuthenticated;
        })();
        
        if (!isAuthenticated) {
          throw new Error('You must be signed in to remove items');
        }

        // First, remove from server
        const response = await fetch(`/api/watch-later?mediaId=${id}&mediaType=${mediaType}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to remove item');
        }

        // Then update local store
        update(state => ({
          ...state,
          items: state.items.filter(item => !(item.id === id && item.mediaType === mediaType))
        }));

        return true;
      } catch (error) {
        console.error('Error removing from watch later:', error);
        return false;
      }
    },

    // Sync with server (call on initialization)
    sync: async () => {
      try {
        // Only sync for authenticated users
        let isAuthenticated = false;
        authStore.subscribe(state => {
          isAuthenticated = state.isAuthenticated;
        })();
        
        if (!isAuthenticated || !browser) {
          return false;
        }

        const response = await fetch('/api/watch-later', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to sync watch later items');
        }

        const data = await response.json();
        
        // Process the data from server - our API returns mediaType:mediaId format
        const serverItems = data.items.map((item: string) => {
          const [mediaType, id] = item.split(':');
          
          // We'll need to fetch details later but for now just create the basic structure
          return {
            id,
            mediaType,
            title: '', // Will be populated later by fetching details
            addedAt: Date.now()
          };
        });

        // Update the store with server data
        update(state => ({
          items: serverItems,
          lastSync: Date.now()
        }));

        return true;
      } catch (error) {
        console.error('Error syncing watch later items:', error);
        return false;
      }
    },

    // Check if an item is in the watch later list
    isInWatchLater: (id: string, mediaType: 'movie' | 'tv') => {
      let result = false;
      subscribe(state => {
        result = state.items.some(item => item.id === id && item.mediaType === mediaType);
      })();
      return result;
    },

    // Clear all watch later items (used on logout)
    clear: () => {
      set(initialState);
    }
  };
}

// Create and export the store
export const watchLater = createWatchLaterStore();

// Create a derived store of just the items for easier access
export const watchLaterItems = derived(
  watchLater,
  $watchLater => $watchLater.items
);

// Create derived stores for movies and TV shows
export const watchLaterMovies = derived(
  watchLaterItems,
  $items => $items.filter(item => item.mediaType === 'movie')
);

export const watchLaterTVShows = derived(
  watchLaterItems,
  $items => $items.filter(item => item.mediaType === 'tv')
);

// Initialize the store when auth state changes
authStore.subscribe(state => {
  if (state.isAuthenticated) {
    watchLater.sync();
  } else {
    watchLater.clear();
  }
}); 