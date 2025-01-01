<div class="min-h-[calc(100vh-5rem)] w-full flex flex-col justify-center px-4">
	<div
		class="relative z-10 text-left md:text-left font-bold text-slate-200 text-4xl md:text-5xl mb-8 md:mb-16 w-full"
	>
		Find your perfect movie  <br class="hidden md:block" /> <span class="text-[#E50914]">in seconds</span>, not minutes
		<br class="hidden md:block" />
	</div>
	<div class="flex flex-wrap items-center mr-auto">
		<button
			on:click
			class="w-full md:w-auto text-center bg-[#E50914] hover:bg-[#B20710] mb-4 flex-none rounded-full text-white font-medium py-3 px-6 mr-8 transition-colors duration-300"
		>
			Get recommendations
		</button>
	</div>
</div>

<style>
	/* Ensure the home content doesn't block the background */
	div {
		position: relative;
		z-index: 10;
	}
</style>
