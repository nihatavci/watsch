<script lang="ts">
	import { cn } from '../utils';
	export let className: string = '';
</script>

<div
	class={cn(
		'rounded-xl bg-[#1A1A1A] shadow-lg backdrop-blur-lg text-white',
		'transition-all duration-300 ease-in-out',
		'hover:shadow-xl hover:scale-[1.01]',
		className
	)}
	{...$$restProps}
>
	<slot />
</div>
