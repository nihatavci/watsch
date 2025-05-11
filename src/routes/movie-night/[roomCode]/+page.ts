import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const { roomCode } = params;

	// We'll handle actual data loading in the component
	// But this ensures the route is properly registered

	return {
		roomCode
	};
};
