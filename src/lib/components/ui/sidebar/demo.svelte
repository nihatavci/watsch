<script lang="ts">
	import { cn } from '$lib/utils';
	import { LayoutDashboard, UserCog, Settings, LogOut } from 'lucide-svelte';
	import { motion } from 'framer-motion';
	import Sidebar from './index.svelte';
	import SidebarBody from './body.svelte';
	import SidebarLink from './link.svelte';

	const links = [
		{
			label: 'Dashboard',
			href: '#',
			icon: LayoutDashboard
		},
		{
			label: 'Profile',
			href: '#',
			icon: UserCog
		},
		{
			label: 'Settings',
			href: '#',
			icon: Settings
		},
		{
			label: 'Logout',
			href: '#',
			icon: LogOut
		}
	];

	let open = false;
</script>

<div
	class={cn(
		'rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 max-w-7xl mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden',
		'h-screen'
	)}
>
	<Sidebar bind:open>
		<SidebarBody className="justify-between gap-10">
			<div class="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
				{#if open}
					<a
						href="#"
						class="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
					>
						<div
							class="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0"
						/>
						<span
							class="font-medium text-black dark:text-white whitespace-pre motion-safe:animate-fade-in"
						>
							Watsch
						</span>
					</a>
				{:else}
					<a
						href="#"
						class="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
					>
						<div
							class="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0"
						/>
					</a>
				{/if}
				<div class="mt-8 flex flex-col gap-2">
					{#each links as link}
						<SidebarLink {link} />
					{/each}
				</div>
			</div>
			<div>
				<SidebarLink
					link={{
						label: 'Your Name',
						href: '#',
						icon: UserCog
					}}
				/>
			</div>
		</SidebarBody>
	</Sidebar>

	<!-- Dashboard -->
	<div class="flex flex-1">
		<div
			class="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full"
		>
			<div class="flex gap-2">
				{#each Array(4) as _, i}
					<div class="h-20 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse" />
				{/each}
			</div>
			<div class="flex gap-2 flex-1">
				{#each Array(2) as _, i}
					<div class="h-full w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse" />
				{/each}
			</div>
		</div>
	</div>
</div>
