<script lang="ts">
	import { cn } from "../utils";

	export let variant: "default" | "outline" | "ghost" | "link" = "default";
	export let size: "default" | "sm" | "lg" | "icon" = "default";
	export let className: string = "";

	const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E50914] disabled:pointer-events-none disabled:opacity-50";

	const variants = {
		default: "bg-[#E50914] text-white hover:bg-[#B20710]",
		outline: "border border-[#E50914]/20 bg-[#221F1F] hover:bg-[#E50914]/10 hover:text-white",
		ghost: "hover:bg-[#E50914]/10 hover:text-white",
		link: "text-[#E50914] underline-offset-4 hover:underline"
	};

	const sizes = {
		default: "h-9 px-4 py-2",
		sm: "h-8 rounded-md px-3 text-xs",
		lg: "h-10 rounded-md px-8",
		icon: "h-9 w-9"
	};

	$: classes = cn(baseStyles, variants[variant], sizes[size], className);
</script>

<button type="button" class={classes} on:click {...$$restProps}>
	<slot />
</button> 