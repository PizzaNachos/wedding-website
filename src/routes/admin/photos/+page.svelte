<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();
	let selectedIds = $state<Set<string>>(new Set());
	let expandedPhotoId = $state<string | null>(null);

	// Admin upload state
	const photoCategories = [
		{ value: 'engagement', label: 'Engagement' },
		{ value: 'ceremony', label: 'Ceremony' },
		{ value: 'reception', label: 'Reception' }
	];
	let showUploadForm = $state(false);
	let uploadCategory = $state('');
	let uploadTagInput = $state('');
	let uploadCustomTags = $state<string[]>([]);
	let uploadFiles = $state<File[]>([]);
	let uploading = $state(false);

	function addUploadTag() {
		const tag = uploadTagInput.trim();
		if (tag && !uploadCustomTags.includes(tag)) {
			uploadCustomTags = [...uploadCustomTags, tag];
		}
		uploadTagInput = '';
	}

	function removeUploadTag(tag: string) {
		uploadCustomTags = uploadCustomTags.filter((t) => t !== tag);
	}

	function handleUploadTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addUploadTag();
		}
	}

	function handleUploadFileInput(e: Event & { currentTarget: HTMLInputElement }) {
		if (e.currentTarget.files) {
			uploadFiles = Array.from(e.currentTarget.files);
			e.currentTarget.value = '';
		}
	}

	function removeUploadFile(index: number) {
		uploadFiles = uploadFiles.filter((_, i) => i !== index);
	}

	function resetUploadForm() {
		uploadFiles = [];
		uploadCustomTags = [];
		uploadTagInput = '';
		uploadCategory = '';
		showUploadForm = false;
	}

	// Per-photo editing state
	let editEventId = $state('');
	let editTagInput = $state('');
	let editCustomTags = $state<string[]>([]);
	let editPeopleTags = $state<{ guest_id?: string; name: string }[]>([]);
	let personSearchInput = $state('');

	function toggleSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	}

	function selectAll() {
		if (selectedIds.size === data.photos.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(data.photos.map((p: any) => p.id));
		}
	}

	function toggleExpand(photo: any) {
		if (expandedPhotoId === photo.id) {
			expandedPhotoId = null;
		} else {
			expandedPhotoId = photo.id;
			editEventId = photo.event_id ?? '';
			editCustomTags = [...(photo.custom_tags ?? [])];
			editPeopleTags = [...(photo.people_tags ?? [])];
			editTagInput = '';
			personSearchInput = '';
		}
	}

	function addEditTag() {
		const tag = editTagInput.trim();
		if (tag && !editCustomTags.includes(tag)) {
			editCustomTags = [...editCustomTags, tag];
		}
		editTagInput = '';
	}

	function removeEditTag(tag: string) {
		editCustomTags = editCustomTags.filter((t) => t !== tag);
	}

	function addPersonTag(guest?: { id: string; first_name: string; last_name: string }) {
		if (guest) {
			if (!editPeopleTags.find((t) => t.guest_id === guest.id)) {
				editPeopleTags = [
					...editPeopleTags,
					{ guest_id: guest.id, name: `${guest.first_name} ${guest.last_name}` }
				];
			}
		} else if (personSearchInput.trim()) {
			const name = personSearchInput.trim();
			if (!editPeopleTags.find((t) => t.name === name)) {
				editPeopleTags = [...editPeopleTags, { name }];
			}
		}
		personSearchInput = '';
	}

	function removePersonTag(index: number) {
		editPeopleTags = editPeopleTags.filter((_, i) => i !== index);
	}

	function handleEditTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addEditTag();
		}
	}

	let filteredGuests = $derived(
		personSearchInput.trim().length > 0
			? data.guests.filter(
					(g: any) =>
						`${g.first_name} ${g.last_name}`
							.toLowerCase()
							.includes(personSearchInput.toLowerCase()) &&
						!editPeopleTags.find((t) => t.guest_id === g.id)
				)
			: []
	);

	const tabs = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'approved', label: 'Approved' },
		{ value: 'rejected', label: 'Rejected' }
	] as const;
</script>

<svelte:head>
	<title>Photos - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-gray-900">Photo Moderation</h1>
		<button
			onclick={() => (showUploadForm = !showUploadForm)}
			class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			{showUploadForm ? 'Cancel' : 'Upload Photos'}
		</button>
	</div>

	<!-- Admin Upload Form -->
	{#if showUploadForm}
		<form
			method="POST"
			action="?/upload"
			enctype="multipart/form-data"
			use:enhance={({ formData }) => {
				formData.delete('files');
				for (const file of uploadFiles) {
					formData.append('files', file);
				}
				uploading = true;
				return async ({ result, update }) => {
					uploading = false;
					if (result.type === 'success') {
						resetUploadForm();
						goto('/admin/photos?status=approved', { invalidateAll: true });
					} else {
						await update();
					}
				};
			}}
			class="rounded-lg bg-blue-50 p-6 ring-1 ring-blue-200"
		>
			<h2 class="mb-4 text-sm font-semibold text-gray-900">Upload Professional Photos</h2>

			<div class="space-y-4">
				<!-- Category selection (required) -->
				<div>
					<label for="upload-category" class="mb-1 block text-xs font-medium text-gray-700"
						>Category (required)</label
					>
					<select
						id="upload-category"
						name="category"
						bind:value={uploadCategory}
						class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
					>
						<option value="">Select a category...</option>
						{#each photoCategories as cat}
							<option value={cat.value}>{cat.label}</option>
						{/each}
					</select>
				</div>

				<!-- File input -->
				<div>
					<label for="upload-files" class="mb-1 block text-xs font-medium text-gray-700"
						>Photos</label
					>
					<input
						id="upload-files"
						name="files"
						type="file"
						accept="image/*"
						multiple
						onchange={handleUploadFileInput}
						class="w-full text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-blue-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-200"
					/>
					{#if uploadFiles.length > 0}
						<div class="mt-2 flex flex-wrap gap-2">
							{#each uploadFiles as file, i}
								<span
									class="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200"
								>
									{file.name}
									<button
										type="button"
										onclick={() => removeUploadFile(i)}
										class="text-gray-400 hover:text-red-500">&times;</button
									>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Tags (optional) -->
				<div>
					<label for="upload-tags" class="mb-1 block text-xs font-medium text-gray-700"
						>Tags (optional)</label
					>
					<div class="flex gap-1">
						<input
							id="upload-tags"
							type="text"
							bind:value={uploadTagInput}
							placeholder="Add tag..."
							class="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
							onkeydown={handleUploadTagKeydown}
						/>
						<button
							type="button"
							onclick={addUploadTag}
							disabled={!uploadTagInput.trim()}
							class="rounded bg-gray-200 px-3 py-2 text-xs hover:bg-gray-300 disabled:opacity-50"
							>Add</button
						>
					</div>
					{#if uploadCustomTags.length > 0}
						<div class="mt-1 flex flex-wrap gap-1">
							{#each uploadCustomTags as tag}
								<span
									class="inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-0.5 text-xs text-gray-700 ring-1 ring-gray-200"
								>
									{tag}
									<button
										type="button"
										onclick={() => removeUploadTag(tag)}
										class="text-gray-400 hover:text-red-500">&times;</button
									>
								</span>
							{/each}
						</div>
					{/if}
					<input type="hidden" name="custom_tags" value={JSON.stringify(uploadCustomTags)} />
				</div>

				<!-- Submit -->
				<button
					type="submit"
					disabled={uploading || !uploadFiles.length || !uploadCategory}
					class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{uploading
						? 'Uploading...'
						: `Upload ${uploadFiles.length} Photo${uploadFiles.length !== 1 ? 's' : ''}`}
				</button>
			</div>
		</form>
	{/if}

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	<!-- Status tabs -->
	<div class="flex gap-1 rounded-lg bg-gray-100 p-1">
		{#each tabs as tab}
			<button
				onclick={() => goto(`/admin/photos?status=${tab.value}`, { invalidateAll: true })}
				class="rounded-md px-4 py-2 text-sm font-medium transition-colors {data.statusFilter ===
				tab.value
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-600 hover:text-gray-900'}"
			>
				{tab.label}
				<span
					class="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs {data.statusFilter ===
					tab.value
						? 'bg-gray-900 text-white'
						: ''}"
				>
					{data.counts[tab.value]}
				</span>
			</button>
		{/each}
	</div>

	<!-- Bulk actions -->
	{#if data.photos.length > 0}
		<div class="flex items-center gap-3">
			<label class="flex items-center gap-2 text-sm text-gray-600">
				<input
					type="checkbox"
					checked={selectedIds.size === data.photos.length && data.photos.length > 0}
					onchange={selectAll}
					class="rounded border-gray-300"
				/>
				Select all
			</label>
			{#if selectedIds.size > 0}
				<span class="text-sm text-gray-500">{selectedIds.size} selected</span>
				{#if data.statusFilter !== 'approved'}
					<form method="POST" action="?/approve" use:enhance>
						{#each [...selectedIds] as id}
							<input type="hidden" name="ids" value={id} />
						{/each}
						<button
							type="submit"
							class="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
						>
							Approve Selected
						</button>
					</form>
				{/if}
				{#if data.statusFilter !== 'rejected'}
					<form method="POST" action="?/reject" use:enhance>
						{#each [...selectedIds] as id}
							<input type="hidden" name="ids" value={id} />
						{/each}
						<button
							type="submit"
							class="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
						>
							Reject Selected
						</button>
					</form>
				{/if}
			{/if}
		</div>
	{/if}

	<!-- Photo grid -->
	{#if data.photos.length > 0}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
			{#each data.photos as photo}
				<div
					class="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 {expandedPhotoId ===
					photo.id
						? 'col-span-2 row-span-2 sm:col-span-2 lg:col-span-2'
						: ''}"
				>
					<div class="relative">
						{#if photo.url}
							<img
								src={expandedPhotoId === photo.id ? (photo.fullUrl ?? photo.url) : photo.url}
								alt={photo.original_filename ?? 'Guest photo'}
								class="w-full object-cover {expandedPhotoId === photo.id
									? 'max-h-96'
									: 'aspect-square'}"
							/>
						{:else}
							<div
								class="flex aspect-square items-center justify-center bg-gray-100 text-sm text-gray-400"
							>
								No preview
							</div>
						{/if}
						<button
							onclick={() => toggleSelect(photo.id)}
							class="absolute top-2 left-2 rounded border-2 {selectedIds.has(photo.id)
								? 'border-blue-500 bg-blue-500'
								: 'border-white bg-white/80'} p-0.5"
						>
							{#if selectedIds.has(photo.id)}
								<svg
									class="h-4 w-4 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{:else}
								<div class="h-4 w-4"></div>
							{/if}
						</button>
					</div>
					<div class="p-3">
						<p class="truncate text-xs text-gray-500">{photo.original_filename ?? 'Photo'}</p>
						<p class="text-xs text-gray-400">{new Date(photo.uploaded_at).toLocaleDateString()}</p>

						<!-- Metadata summary -->
						{#if photo.uploader_name}
							<p class="mt-1 text-xs text-gray-500">By: {photo.uploader_name}</p>
						{/if}
						{#if photo.event_name}
							<p class="text-xs text-blue-600">{photo.event_name}</p>
						{/if}
						{#if photo.custom_tags?.length > 0}
							<div class="mt-1 flex flex-wrap gap-1">
								{#each photo.custom_tags as tag}
									<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
										>{tag}</span
									>
								{/each}
							</div>
						{/if}
						{#if photo.people_tags?.length > 0}
							<div class="mt-1 flex flex-wrap gap-1">
								{#each photo.people_tags as person}
									<span class="rounded-full bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700"
										>{person.name}</span
									>
								{/each}
							</div>
						{/if}

						<!-- Actions -->
						<div class="mt-2 flex flex-wrap gap-2">
							{#if photo.status !== 'approved'}
								<form method="POST" action="?/approve" use:enhance class="inline">
									<input type="hidden" name="ids" value={photo.id} />
									<button type="submit" class="text-xs text-green-600 hover:text-green-800"
										>Approve</button
									>
								</form>
							{/if}
							{#if photo.status !== 'rejected'}
								<form method="POST" action="?/reject" use:enhance class="inline">
									<input type="hidden" name="ids" value={photo.id} />
									<button type="submit" class="text-xs text-orange-600 hover:text-orange-800"
										>Reject</button
									>
								</form>
							{/if}
							<button
								type="button"
								onclick={() => toggleExpand(photo)}
								class="text-xs text-blue-600 hover:text-blue-800"
							>
								{expandedPhotoId === photo.id ? 'Close' : 'Edit'}
							</button>
							<form method="POST" action="?/delete" use:enhance class="inline">
								<input type="hidden" name="id" value={photo.id} />
								<button
									type="submit"
									class="text-xs text-red-600 hover:text-red-800"
									onclick={(e) => {
										if (!confirm('Permanently delete this photo?')) e.preventDefault();
									}}>Delete</button
								>
							</form>
						</div>

						<!-- Expanded metadata editing -->
						{#if expandedPhotoId === photo.id}
							<form
								method="POST"
								action="?/updateMetadata"
								use:enhance
								class="mt-4 space-y-3 border-t pt-3"
							>
								<input type="hidden" name="id" value={photo.id} />

								<!-- Event -->
								<div>
									<label for="edit-event" class="mb-1 block text-xs font-medium text-gray-700"
										>Event</label
									>
									<select
										id="edit-event"
										name="event_id"
										bind:value={editEventId}
										class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
									>
										<option value="">None</option>
										{#each data.events as event}
											<option value={event.id}>{event.name}</option>
										{/each}
									</select>
								</div>

								<!-- Custom Tags -->
								<div>
									<label for="edit-tags" class="mb-1 block text-xs font-medium text-gray-700"
										>Tags</label
									>
									<div class="flex gap-1">
										<input
											id="edit-tags"
											type="text"
											bind:value={editTagInput}
											placeholder="Add tag..."
											class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
											onkeydown={handleEditTagKeydown}
										/>
										<button
											type="button"
											onclick={addEditTag}
											disabled={!editTagInput.trim()}
											class="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300 disabled:opacity-50"
											>Add</button
										>
									</div>
									{#if editCustomTags.length > 0}
										<div class="mt-1 flex flex-wrap gap-1">
											{#each editCustomTags as tag}
												<span
													class="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
												>
													{tag}
													<button
														type="button"
														onclick={() => removeEditTag(tag)}
														class="text-gray-400 hover:text-red-500">&times;</button
													>
												</span>
											{/each}
										</div>
									{/if}
									<input type="hidden" name="custom_tags" value={JSON.stringify(editCustomTags)} />
								</div>

								<!-- People Tags -->
								<div>
									<label for="edit-people" class="mb-1 block text-xs font-medium text-gray-700"
										>People</label
									>
									<div class="relative">
										<input
											id="edit-people"
											type="text"
											bind:value={personSearchInput}
											placeholder="Search guest or type name..."
											class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
											onkeydown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addPersonTag();
												}
											}}
										/>
										{#if filteredGuests.length > 0}
											<div
												class="absolute z-10 mt-1 max-h-32 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-lg"
											>
												{#each filteredGuests.slice(0, 5) as guest}
													<button
														type="button"
														class="block w-full px-2 py-1 text-left text-sm hover:bg-blue-50"
														onclick={() => addPersonTag(guest)}
													>
														{guest.first_name}
														{guest.last_name}
													</button>
												{/each}
											</div>
										{/if}
									</div>
									{#if personSearchInput.trim() && filteredGuests.length === 0}
										<button
											type="button"
											class="mt-1 text-xs text-blue-600 hover:underline"
											onclick={() => addPersonTag()}
										>
											Add "{personSearchInput.trim()}" as free-text
										</button>
									{/if}
									{#if editPeopleTags.length > 0}
										<div class="mt-1 flex flex-wrap gap-1">
											{#each editPeopleTags as person, i}
												<span
													class="inline-flex items-center gap-0.5 rounded-full {person.guest_id
														? 'bg-blue-50 text-blue-700'
														: 'bg-gray-100 text-gray-700'} px-2 py-0.5 text-xs"
												>
													{person.name}
													<button
														type="button"
														onclick={() => removePersonTag(i)}
														class="text-gray-400 hover:text-red-500">&times;</button
													>
												</span>
											{/each}
										</div>
									{/if}
									<input type="hidden" name="people_tags" value={JSON.stringify(editPeopleTags)} />
								</div>

								<button
									type="submit"
									class="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
								>
									Save Metadata
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="py-12 text-center text-gray-400">No {data.statusFilter} photos.</p>
	{/if}
</div>
