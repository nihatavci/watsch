<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { onMount } from 'svelte';
	import Header from '$lib/Header.svelte';
	import Sidebar from '$lib/Sidebar.svelte';
	import PWAInstallBanner from '$lib/PWAInstallBanner.svelte';

	let isSidebarOpen = false;

	function handleToggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	let resetApp: () => void;

	function handleResetApp() {
		if (resetApp) resetApp();
	}

	inject({ mode: dev ? 'development' : 'production' });

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let particles: any[] = [];
	let mouse = { x: 0, y: 0, radius: 100 };

	function createParticles() {
		for(let i = 0; i < 100; i++) {
			particles.push({
				x: Math.random() * window.innerWidth,
				y: Math.random() * window.innerHeight,
				radius: Math.random() * 2 + 1,
				baseX: Math.random() * window.innerWidth,
				baseY: Math.random() * window.innerHeight,
				density: (Math.random() * 30) + 1,
				color: `rgba(229, 9, 20, ${Math.random() * 0.3 + 0.2})`
			});
		}
	}

	function animate() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		for(let i = 0; i < particles.length; i++) {
			let dx = mouse.x - particles[i].x;
			let dy = mouse.y - particles[i].y;
			let distance = Math.sqrt(dx * dx + dy * dy);
			let forceDirectionX = dx / distance;
			let forceDirectionY = dy / distance;

			const maxDistance = 100;
			let force = (maxDistance - distance) / maxDistance;
			if(force < 0) force = 0;

			let directionX = (forceDirectionX * force * particles[i].density) * 0.6;
			let directionY = (forceDirectionY * force * particles[i].density) * 0.6;

			if(distance < mouse.radius + particles[i].radius) {
				particles[i].x -= directionX;
				particles[i].y -= directionY;
			} else {
				if(particles[i].x !== particles[i].baseX) {
					let dx = particles[i].x - particles[i].baseX;
					particles[i].x -= dx/20;
				}
				if(particles[i].y !== particles[i].baseY) {
					let dy = particles[i].y - particles[i].baseY;
					particles[i].y -= dy/20;
				}
			}

			// Draw particles
			ctx.beginPath();
			ctx.fillStyle = particles[i].color;
			ctx.arc(particles[i].x, particles[i].y, particles[i].radius, 0, Math.PI * 2);
			ctx.fill();

			// Connect particles
			for(let j = i; j < particles.length; j++) {
				let dx = particles[i].x - particles[j].x;
				let dy = particles[i].y - particles[j].y;
				let distance = Math.sqrt(dx * dx + dy * dy);

				if(distance < 120) {
					ctx.beginPath();
					ctx.strokeStyle = `rgba(229, 9, 20, ${0.1 * (120 - distance) / 120})`;
					ctx.lineWidth = 0.5;
					ctx.moveTo(particles[i].x, particles[i].y);
					ctx.lineTo(particles[j].x, particles[j].y);
					ctx.stroke();
				}
			}
		}
		requestAnimationFrame(animate);
	}

	onMount(() => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		createParticles();
		animate();

		window.addEventListener('mousemove', (e) => {
			mouse.x = e.x;
			mouse.y = e.y;
		});

		window.addEventListener('resize', () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			createParticles();
		});
	});
</script>

<main class="min-h-screen w-full bg-[#141414] relative overflow-hidden">
	<canvas
		bind:this={canvas}
		class="fixed inset-0 w-full h-full"
		style="z-index: 0;"
	></canvas>

	<Header on:toggleSidebar={handleToggleSidebar} />
	<Sidebar bind:isOpen={isSidebarOpen} />

	<!-- Content -->
	<div class="relative" style="z-index: 1;">
		<slot {resetApp} />
	</div>

	<PWAInstallBanner />
</main>

<style>
	:global(.glassmorphism) {
		backdrop-filter: blur(16px);
		background: rgba(20, 20, 20, 0.7) !important;
		border: 1px solid rgba(255, 255, 255, 0.05);
		box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
	}
</style>

<svelte:head>
	<link rel="manifest" href="/manifest.json" />
	<meta name="theme-color" content="#E50914" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
	<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
</svelte:head>
  