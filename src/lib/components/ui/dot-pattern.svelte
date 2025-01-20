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
	export let cr = 0.5;
	export let className = '';

	const id = nanoid();
</script>

<svg
	aria-hidden="true"
	class={cn('pointer-events-none fixed inset-0 h-full w-full fill-white/[0.15]', className)}
	{...$$restProps}
>
	<defs>
		<pattern
			{id}
			{width}
			{height}
			patternUnits="userSpaceOnUse"
			patternContentUnits="userSpaceOnUse"
			{x}
			{y}
		>
			<circle id="pattern-circle" {cx} {cy} r={cr} />
		</pattern>
	</defs>
	<rect width="100%" height="100%" stroke-width="0" fill={`url(#${id})`} />
</svg> 