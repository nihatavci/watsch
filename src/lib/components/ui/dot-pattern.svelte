<script lang="ts">
	import { cn } from '$lib/utils';
	import { nanoid } from 'nanoid';

	interface $$Props {
		width?: number;
		height?: number;
		x?: number;
		y?: number;
		cx?: number;
		cy?: number;
		cr?: number;
		class?: string;
	}

	export let width = 16;
	export let height = 16;
	export let x = 0;
	export let y = 0;
	export let cx = 1;
	export let cy = 1;
	export let cr = 1;
	export let className = '';

	const id = nanoid();
</script>

<svg
	aria-hidden="true"
	class={cn(
		"pointer-events-none fixed inset-0 h-full w-full",
		className
	)}
	{...$$restProps}
>
	<defs>
		<pattern
			id={id}
			width={width}
			height={height}
			patternUnits="userSpaceOnUse"
			patternContentUnits="userSpaceOnUse"
			x={x}
			y={y}
		>
			<circle id="pattern-circle" cx={cx} cy={cy} r={cr} class="fill-black/20 dark:fill-white/40" />
		</pattern>
	</defs>
	<rect width="100%" height="100%" stroke-width="0" fill={`url(#${id})`} />
</svg>
