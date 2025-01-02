<script lang="ts">
	import { cn } from "../utils";

	export let variant: "default" | "outline" | "ghost" | "link" = "default";
	export let size: "default" | "sm" | "lg" | "icon" = "default";
	export let className: string = "";

	const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2";

	const variants = {
		default: "bg-[#E50914] text-white hover:bg-[#B20710] focus:ring-[#E50914]",
		outline: "border border-[#E50914]/20 bg-[#1A1A1A] text-white hover:bg-[#E50914]/10 focus:ring-[#E50914]",
		ghost: "bg-transparent text-white hover:bg-[#E50914]/10 focus:ring-[#E50914]",
		link: "text-[#E50914] underline-offset-4 hover:underline"
	};

	const sizes = {
		default: "h-10 px-4 py-2",
		sm: "h-8 rounded-md px-3 text-xs",
		lg: "h-12 rounded-xl px-6 text-base",
		icon: "h-10 w-10 p-0"
	};

	$: classes = cn(baseStyles, variants[variant], sizes[size], className);
</script>

<button type="button" class={classes} on:click {...$$restProps}>
	<slot />
</button> 