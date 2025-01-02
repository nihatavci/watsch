<script lang="ts">
	import { cn } from "../utils";

	export let variant: "default" | "secondary" | "destructive" | "outline" | "success" = "default";
	export let className = "";

	const baseStyles = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:ring-offset-2";

	const variants = {
		default: "border-transparent bg-[#E50914] text-white hover:bg-[#B20710]",
		secondary: "border-transparent bg-white/[0.05] text-white/70 hover:bg-white/10",
		destructive: "border-transparent bg-red-500/20 text-red-500",
		outline: "border-[#E50914]/20 text-[#E50914] hover:bg-[#E50914]/10",
		success: "border-transparent bg-green-500/20 text-green-500"
	};

	$: classes = cn(baseStyles, variants[variant], className);
</script>

<div class={classes} {...$$restProps}>
	<slot />
</div> 