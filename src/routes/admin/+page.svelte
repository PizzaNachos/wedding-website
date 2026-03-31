<script lang="ts">
	import StatCard from '$lib/components/admin/StatCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard</title>
</svelte:head>

<div class="space-y-8">
	<h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>

	<!-- Reception stats -->
	<section>
		<h2 class="mb-3 text-lg font-medium text-gray-700">Reception</h2>
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
			<StatCard label="Total Guests" value={data.receptionStats.invited} />
			<StatCard label="Attending" value={data.receptionStats.attending} sublabel="{data.receptionStats.adults} adults, {data.receptionStats.children} children" />
			<StatCard label="Declined" value={data.receptionStats.declined} />
			<StatCard label="Pending" value={data.receptionStats.pending} />
		</div>
	</section>

	<!-- Ceremony interest stats -->
	<section>
		<h2 class="mb-3 text-lg font-medium text-gray-700">Ceremony Interest</h2>
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
			<StatCard label="Yes" value={data.ceremonyStats.yes} />
			<StatCard label="Maybe" value={data.ceremonyStats.maybe} />
			<StatCard label="Not Likely" value={data.ceremonyStats.not_likely} />
			<StatCard label="Other" value={data.ceremonyStats.other} />
			<StatCard label="No Response" value={data.ceremonyStats.no_response} />
		</div>
	</section>

	<!-- Dietary restrictions -->
	{#if Object.keys(data.dietaryCounts).length > 0}
		<section>
			<h2 class="mb-3 text-lg font-medium text-gray-700">Dietary Restrictions</h2>
			<div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-100">
							<th class="px-4 py-3 text-left font-medium text-gray-500">Restriction</th>
							<th class="px-4 py-3 text-right font-medium text-gray-500">Count</th>
						</tr>
					</thead>
					<tbody>
						{#each Object.entries(data.dietaryCounts).sort((a, b) => b[1] - a[1]) as [restriction, count]}
							<tr class="border-b border-gray-50">
								<td class="px-4 py-2.5 text-gray-900">{restriction}</td>
								<td class="px-4 py-2.5 text-right text-gray-600">{count}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<!-- Song requests -->
	{#if data.songRequests.length > 0}
		<section>
			<h2 class="mb-3 text-lg font-medium text-gray-700">Song Requests</h2>
			<div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-100">
							<th class="px-4 py-3 text-left font-medium text-gray-500">Guest</th>
							<th class="px-4 py-3 text-left font-medium text-gray-500">Song</th>
						</tr>
					</thead>
					<tbody>
						{#each data.songRequests as req}
							<tr class="border-b border-gray-50">
								<td class="px-4 py-2.5 text-gray-900">{req.guest}</td>
								<td class="px-4 py-2.5 text-gray-600">{req.song}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>
