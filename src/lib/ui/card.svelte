<script lang="ts">
	import { cn } from "../utils";
	export let className: string = "";
</script>

<div class={cn("rounded-xl bg-neutral-800/70 shadow-md backdrop-blur-gradient text-white", className)} {...$$restProps}>
	<slot />
</div> 