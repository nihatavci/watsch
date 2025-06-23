import { json } from '@sveltejs/kit';
import { kv } from '$lib/store/kv';

export async function POST({ request }) {
	try {
		const { roomCode, forceWinner } = await request.json();

		if (!roomCode) {
			return json({ error: { message: 'Room code is required' } }, { status: 400 });
		}

		const room = await kv.get(`room:${roomCode.toLowerCase()}`);

		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		if (room.phase !== 'voting' && room.phase !== 'vote' && room.phase !== 'nominating' && room.phase !== 'nominate') {
			return json(
				{ error: { message: 'Room is not in a phase where voting can be completed' } },
				{ status: 400 }
			);
		}

		let winner = null;

		// If host forces a winner (draw winner directly)
		if (forceWinner) {
			winner = forceWinner;
			console.log(`Host drew winner directly for room ${roomCode}: ${winner.title}`);
		} else {
			// Calculate winner from votes
			if (room.votes && Object.keys(room.votes).length > 0) {
				// Count votes for each movie
				const voteCounts: Record<string, number> = {};
				const movieDetails: Record<string, any> = {};

				// Collect votes and movie details
				Object.values(room.votes).forEach((voteArray: any[]) => {
					if (Array.isArray(voteArray)) {
						voteArray.forEach(vote => {
							const movieId = vote.movieId;
							voteCounts[movieId] = (voteCounts[movieId] || 0) + 1;

							// Find movie details from nominations
							if (!movieDetails[movieId] && room.nominations) {
								const nomination = room.nominations.find(n => n.movie?.id?.toString() === movieId);
								if (nomination) {
									movieDetails[movieId] = {
										...nomination.movie,
										nominatedByNickname: nomination.participant?.nickname || 'Unknown'
									};
								}
							}
						});
					}
				});

				// Find movie with most votes
				let maxVotes = 0;
				let winningMovieId = null;

				Object.entries(voteCounts).forEach(([movieId, count]) => {
					if (count > maxVotes) {
						maxVotes = count;
						winningMovieId = movieId;
					}
				});

				if (winningMovieId && movieDetails[winningMovieId]) {
					winner = {
						...movieDetails[winningMovieId],
						voteCount: maxVotes
					};
				}
			}

			// If no votes, pick first nomination as winner
			if (!winner && room.nominations && room.nominations.length > 0) {
				const firstNomination = room.nominations[0];
				winner = {
					...firstNomination.movie,
					nominatedByNickname: firstNomination.participant?.nickname || 'Unknown',
					voteCount: 0
				};
			}
		}

		// Update room phase to complete and set winner
		room.phase = 'complete';
		room.winner = winner;
		room.updatedAt = Date.now();

		await kv.set(`room:${roomCode.toLowerCase()}`, room);

		const actionType = forceWinner ? 'drawn randomly' : 'calculated from votes';
		console.log(`Voting completed for room ${roomCode}. Winner ${actionType}: ${winner?.title || 'None'}`);

		return json({
			success: true,
			phase: room.phase,
			winner: room.winner,
			votes: room.votes,
			actionType: actionType
		});
	} catch (error) {
		console.error('Error finishing voting:', error);
		return json({ error: { message: 'Failed to finish voting' } }, { status: 500 });
	}
}
