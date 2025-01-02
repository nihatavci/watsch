<script lang="ts">
	import { cn } from "../utils";

	export let variant: "default" | "secondary" | "destructive" | "outline" | "success" = "default";
	export let className = "";

	const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 ease-in-out transform hover:scale-[1.05]";

	const variants = {
		default: "border-transparent bg-[#E50914] text-white hover:bg-[#B20710]",
		secondary: "border-transparent bg-[#2C2C2C] text-white/70 hover:bg-[#3E3E3E]",
		destructive: "border-transparent bg-red-500/20 text-red-500 hover:bg-red-500/30",
		outline: "border-[#E50914]/20 text-[#E50914] hover:bg-[#E50914]/10",
		success: "border-transparent bg-green-500/20 text-green-500 hover:bg-green-500/30"
	};

	$: classes = cn(baseStyles, variants[variant], className);
</script>

<div class={classes} {...$$restProps}>
	<slot />
</div> 