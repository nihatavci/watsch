// Simple script to check environment variables
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

console.log('Environment check results:');
console.log('NODE_ENV:', process.env.NODE_ENV);
// Security: Never log API keys or partial keys
console.log('TMDB_API_KEY:', process.env.TMDB_API_KEY ? 'CONFIGURED' : 'NOT FOUND');
console.log('PRIVATE_TMDB_API_KEY:', process.env.PRIVATE_TMDB_API_KEY ? 'CONFIGURED' : 'NOT FOUND');

if (!process.env.TMDB_API_KEY && !process.env.PRIVATE_TMDB_API_KEY) {
  console.error('\n❌ ERROR: Neither TMDB_API_KEY nor PRIVATE_TMDB_API_KEY found in environment variables!');
  console.error('Please add one of these to your .env file:');
  console.error('TMDB_API_KEY=your-tmdb-api-key-here');
  console.error('or');
  console.error('PRIVATE_TMDB_API_KEY=your-tmdb-api-key-here');
  console.error('\nGet your API key at: https://www.themoviedb.org/settings/api\n');
}

// Also read the .env file directly to see what's in it
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log('\nContent of .env file (showing only TMDB related lines):');
  const envLines = envContent.split('\n').filter(line => line.includes('TMDB'));
  envLines.forEach(line => console.log(line));
} catch (error) {
  console.error('Error reading .env file:', error.message);
}

console.log('\nTMDB-related environment variables (secure check):');
Object.keys(process.env)
	.filter(key => key.includes('TMDB') || key.includes('API_KEY'))
	.forEach(key => {
		const value = process.env[key];
		// Security: Never log actual key values
		console.log(`${key}: ${value ? 'SET' : 'NOT SET'}`);
	}); 