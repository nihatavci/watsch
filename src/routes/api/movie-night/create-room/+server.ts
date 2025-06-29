import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { kv } from '$lib/store/kv';
import { sanitizeInput } from '$lib/utils/sanitize';

// Security: Rate limiting for room creation
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function checkRateLimit(ip: string, maxRequests: number = 5, windowMs: number = 300000): boolean {
	const now = Date.now();
	const limit = rateLimitMap.get(ip);
	
	if (!limit || now - limit.lastReset > windowMs) {
		rateLimitMap.set(ip, { count: 1, lastReset: now });
		return true;
	}
	
	if (limit.count >= maxRequests) {
		return false;
	}
	
	limit.count++;
	return true;
}

export async function POST({ request, getClientAddress }) {
	try {
		// Security: Rate limiting - max 5 rooms per 5 minutes per IP
		const clientIP = getClientAddress();
		if (!checkRateLimit(clientIP, 5, 300000)) {
			return json({ 
				error: { message: 'Too many rooms created. Please wait before creating another room.' } 
			}, { status: 429 });
		}

		const body = await request.json();
		const { hostNickname } = body;

		// Security: Input validation
		if (!hostNickname || typeof hostNickname !== 'string') {
			return json({ error: { message: 'Nickname is required' } }, { status: 400 });
		}

		// Security: Check for malicious content before sanitization
		const originalLength = hostNickname.trim().length;
		const hasScript = /<script|javascript:|data:|vbscript:|on\w+\s*=/gi.test(hostNickname);
		
		if (hasScript) {
			console.warn(`[Security] Malicious input rejected from ${clientIP}: ${hostNickname.substring(0, 20)}...`);
			return json({ 
				error: { message: 'Invalid characters in nickname' } 
			}, { status: 400 });
		}

		// Security: Sanitize and validate nickname
		const sanitizedNickname = sanitizeInput(hostNickname.trim());
		
		// Security: Reject if sanitization removed significant content (indicates malicious input)
		if (sanitizedNickname.length < originalLength * 0.7) {
			console.warn(`[Security] Input rejected due to sanitization removing content from ${clientIP}`);
			return json({ 
				error: { message: 'Invalid characters in nickname' } 
			}, { status: 400 });
		}
		
		if (sanitizedNickname.length < 1 || sanitizedNickname.length > 20) {
			return json({ 
				error: { message: 'Nickname must be between 1 and 20 characters' } 
			}, { status: 400 });
		}

		// Security: Generate cryptographically secure room code
		const roomCode = nanoid(6).toLowerCase();
		const hostId = nanoid();

		const room = {
			code: roomCode,
			hostId: hostId,
			phase: 'waiting' as const,
			participants: [{
				id: hostId,
				nickname: sanitizedNickname,
				isHost: true,
				isReady: true, // Host is always ready
				hasNominated: false,
				hasVoted: false,
				joinedAt: Date.now()
			}],
			nominations: [],
			winner: null,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		await kv.set(`room:${roomCode}`, room, { ex: 7200 }); // Expires in 2 hours

		console.log(`[Security] Room created: ${roomCode} by IP ${clientIP}`);

		return json({
			roomCode,
			hostId
		});
	} catch (error) {
		console.error('Error creating room:', error);
		return json({ error: { message: 'Failed to create room' } }, { status: 500 });
	}
}
