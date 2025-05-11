// Simple in-memory KV store for development
const store = new Map<string, any>();

export const kv = {
	get: async (key: string) => store.get(key),
	set: async (key: string, value: any, options?: { ex?: number }) => {
		store.set(key, value);
		if (options?.ex) {
			setTimeout(() => store.delete(key), options.ex * 1000);
		}
		return 'OK';
	},
	del: async (key: string) => store.delete(key),
	exists: async (key: string) => store.has(key)
};
