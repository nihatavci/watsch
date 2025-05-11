import { getReelById } from './src/lib/utils/instagram';

async function test() {
	try {
		const reel = await getReelById('368393670');
		console.log('Reel data:', reel);
	} catch (error) {
		console.error('Error:', error);
	}
}

test();
