<script lang="ts">
	import { Bookmark, X, Sparkles, Share2, Download, Instagram } from 'lucide-svelte';
	import { library } from '../../stores/library';
	import { fade, fly } from 'svelte/transition';

	$: savedMovies = $library.saved;
	let showShareCard = false;
	let selectedMovie: any = null;

	function removeMovie(movieId: string) {
		library.removeFromSaved(movieId);
	}

	async function downloadMovie(movie: any) {
		try {
			// Use our proxy endpoint to fetch the image
			const proxyUrl = `/api/proxy?url=${encodeURIComponent(movie.poster)}`;
			
			// Create a temporary img element to load the image
			const img = new Image();
			img.crossOrigin = "anonymous";
			
			// Create a promise to handle image loading
			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
				img.src = proxyUrl;
			});

			// Create canvas
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			
			if (!ctx) {
				throw new Error('Could not get canvas context');
			}
			
			// Set canvas size (1080x1920 for high quality)
			canvas.width = 1080;
			canvas.height = 1920;
			
			// Fill background
			ctx.fillStyle = '#0A0118';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			
			// Draw poster
			const posterHeight = canvas.height * 0.6;
			const posterY = 100;
			ctx.drawImage(img, 0, posterY, canvas.width, posterHeight);
			
			// Add gradient overlay
			const gradient = ctx.createLinearGradient(0, posterY + posterHeight - 200, 0, posterY + posterHeight);
			gradient.addColorStop(0, 'rgba(10, 1, 24, 0)');
			gradient.addColorStop(1, 'rgba(10, 1, 24, 1)');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, posterY, canvas.width, posterHeight);
			
			// Add movie title
			ctx.fillStyle = '#FFFFFF';
			ctx.font = 'bold 80px Inter, system-ui, sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(movie.title, canvas.width/2, posterY + posterHeight + 100);
			
			// Add year and rating
			ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
			ctx.font = '40px Inter, system-ui, sans-serif';
			ctx.fillText(`${movie.year} • Rating: ${movie.rating || 'N/A'}`, canvas.width/2, posterY + posterHeight + 180);
			
			// Add genres
			if (movie.genres && movie.genres.length > 0) {
				ctx.fillStyle = '#DC2626';
				ctx.font = '36px Inter, system-ui, sans-serif';
				ctx.fillText(movie.genres.join(' • '), canvas.width/2, posterY + posterHeight + 260);
			}
			
			// Add Watsch watermark
			ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
			ctx.font = 'bold 40px Inter, system-ui, sans-serif';
			ctx.fillText('watsch.tv', canvas.width/2, canvas.height - 60);
			
			// Convert to image and download
			const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
			const link = document.createElement('a');
			link.download = `${movie.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_card.jpg`;
			link.href = dataUrl;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

		} catch (error) {
			console.error('Error generating movie card:', error);
			alert('Failed to download movie card. Please try again.');
		}
	}

	function openShareCard(movie: any) {
		selectedMovie = movie;
		showShareCard = true;
	}

	function closeShareCard() {
		showShareCard = false;
		selectedMovie = null;
	}

	async function shareToInstagram(movie: any) {
		// Here you would implement the logic to generate and share the movie card image
		// For now, we'll just show what would be shared
		const shareData = {
			title: movie.title,
			text: `Check out ${movie.title} (${movie.year}) on Watsch!\n\nGenres: ${movie.genres?.join(', ') || 'N/A'}\nRating: ${movie.rating || 'N/A'}\n\n#Watsch #Movies #MovieRecommendations`,
			url: window.location.href
		};

		try {
			if (navigator.share) {
				await navigator.share(shareData);
			}
		} catch (err) {
			console.error('Error sharing:', err);
		}
	}
</script>

<div class="relative min-h-screen bg-[#0A0118]">
	<!-- Gradient background -->
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))]" />

	<!-- RetroGrid -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden [perspective:200px]">
		<div class="absolute inset-0 [transform:rotateX(65deg)]">
			<div class="animate-grid [background-image:linear-gradient(to_right,rgba(220,38,38,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(220,38,38,0.1)_1px,transparent_0)] [background-repeat:repeat] [background-size:50px_50px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]" />
		</div>
		<div class="absolute inset-0 bg-gradient-to-t from-[#0A0118] to-transparent to-90%" />
	</div>

	<!-- Content -->
	<div class="relative z-10 max-w-4xl mx-auto px-4 py-6">
		<!-- Mobile-optimized header -->
		<div class="space-y-3 sm:space-y-4">
			<div class="flex items-center gap-2 text-red-500">
				<Bookmark class="w-5 h-5" />
				<span class="text-sm font-medium">Your Collection</span>
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-white to-red-500 animate-gradient">
				Saved Movies & Shows
			</h1>
		</div>

		{#if savedMovies.length === 0}
			<div class="mt-6 p-6 rounded-xl bg-black/40 border border-red-500/20 backdrop-blur-sm text-center">
				<Sparkles class="w-6 h-6 text-red-500 mx-auto mb-2" />
				<p class="text-white/60">Start saving movies and shows you want to watch later!</p>
				<p class="text-xs text-white/40 mt-2">Tap the bookmark icon on any movie to save it here</p>
			</div>
		{:else}
			<div class="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
				{#each savedMovies as movie}
					<div
						in:fade
						class="group relative aspect-[2/3] rounded-xl overflow-hidden border border-red-500/20 bg-black/40 backdrop-blur-sm"
					>
						<img
							src={movie.poster ? movie.poster : '/placeholder.png'}
							alt={movie.title}
							class="w-full h-full object-cover"
						/>
						<!-- Action Buttons -->
						<div class="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
							<button
								on:click={() => openShareCard(movie)}
								class="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-red-500/20 text-white/60 hover:text-white hover:bg-black/60 transition-colors"
							>
								<Share2 class="w-4 h-4" />
							</button>
							<button
								on:click={() => downloadMovie(movie)}
								class="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-red-500/20 text-white/60 hover:text-white hover:bg-black/60 transition-colors"
							>
								<Download class="w-4 h-4" />
							</button>
							<button
								on:click={() => removeMovie(movie.id)}
								class="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-red-500/20 text-white/60 hover:text-white hover:bg-black/60 transition-colors"
							>
								<X class="w-4 h-4" />
							</button>
						</div>
						<!-- Movie Info -->
						<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
							<div class="absolute inset-x-0 bottom-0 p-4">
								<h3 class="text-sm sm:text-base font-medium text-white mb-1 line-clamp-2">{movie.title}</h3>
								<p class="text-xs sm:text-sm text-white/60">{movie.year}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<!-- Mobile helper text -->
			<p class="text-xs text-white/40 text-center mt-4 sm:hidden">
				Tap and hold to see movie details
			</p>
		{/if}
	</div>
</div>

<!-- Share Card -->
{#if showShareCard && selectedMovie}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		on:click={closeShareCard}
		transition:fade
	>
		<div
			class="w-full max-w-md bg-black/80 border border-red-500/20 rounded-xl overflow-hidden backdrop-blur-xl"
			on:click|stopPropagation
			transition:fly={{ y: 20 }}
		>
			<!-- Movie Card Preview -->
			<div class="relative aspect-[4/5] w-full">
				<img
					src={selectedMovie.poster}
					alt={selectedMovie.title}
					class="w-full h-full object-cover"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent">
					<div class="absolute bottom-0 left-0 right-0 p-6">
						<h3 class="text-2xl font-bold text-white mb-2">{selectedMovie.title}</h3>
						<div class="flex flex-wrap gap-2 mb-3">
							{#each selectedMovie.genres || [] as genre}
								<span class="px-2 py-1 rounded-md bg-red-500/20 text-red-500 text-sm">{genre}</span>
							{/each}
						</div>
						<p class="text-white/60">
							{selectedMovie.year} • Rating: {selectedMovie.rating || 'N/A'}
						</p>
					</div>
				</div>
			</div>

			<!-- Share Options -->
			<div class="p-4 space-y-4">
				<button
					on:click={() => shareToInstagram(selectedMovie)}
					class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
				>
					<Instagram class="w-5 h-5" />
					<span>Share to Instagram</span>
				</button>
				<button
					on:click={closeShareCard}
					class="w-full px-4 py-3 rounded-xl border border-red-500/20 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	.animate-gradient {
		background-size: 200% auto;
		animation: gradient 8s linear infinite;
	}
</style> 