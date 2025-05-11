<script lang="ts">
	import { cn } from '../utils';
	export let className: string = '';
</script>

<div class={cn('p-4 pt-0', className)} {...$$restProps}>
	<slot />
</div>
