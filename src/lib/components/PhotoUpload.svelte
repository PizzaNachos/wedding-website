<script lang="ts">
	import { guestSession } from '$lib/guest-session.svelte';

	interface Props {
		onUploadComplete: () => void;
	}

	let { onUploadComplete }: Props = $props();

	// Multi-step state (2 steps: lookup → upload+tag)
	let step = $state<'lookup' | 'upload'>('lookup');
	let autoFilled = $state(false);

	// Auto-fill from stored session
	$effect(() => {
		if (guestSession.current && step === 'lookup' && !guestId) {
			guestId = guestSession.current.guest_id;
			guestName = `${guestSession.current.first_name} ${guestSession.current.last_name}`;
			autoFilled = true;
			step = 'upload';
		}
	});

	// Step 1: Name lookup
	let nameInput = $state('');
	let lookupLoading = $state(false);
	let lookupError = $state('');
	let lookupMessage = $state('');
	let guestId = $state('');
	let guestName = $state('');

	// Step 2: Upload + Tags (combined)
	let tagInput = $state('');
	let customTags = $state<string[]>([]);
	let dragOver = $state(false);

	const MAX_SIZE = 10 * 1024 * 1024; // 10MB

	// Per-file state tracking
	type FileEntry = {
		id: string;
		file: File;
		thumbnailUrl: string;
		status: 'pending' | 'uploading' | 'uploaded' | 'failed';
		retryCount: number;
		error?: string;
	};

	let fileQueue = $state<FileEntry[]>([]);
	let fileIdCounter = 0;

	let pendingCount = $derived(fileQueue.filter((f) => f.status === 'pending').length);
	let uploadedCount = $derived(fileQueue.filter((f) => f.status === 'uploaded').length);
	let failedCount = $derived(fileQueue.filter((f) => f.status === 'failed').length);
	let uploadingCount = $derived(fileQueue.filter((f) => f.status === 'uploading').length);
	let allDone = $derived(fileQueue.length > 0 && pendingCount === 0 && uploadingCount === 0);

	// Clean up object URLs when component is destroyed
	$effect(() => {
		return () => {
			for (const entry of fileQueue) {
				URL.revokeObjectURL(entry.thumbnailUrl);
			}
		};
	});

	async function lookupGuest() {
		if (!nameInput.trim()) return;

		lookupLoading = true;
		lookupError = '';
		lookupMessage = '';

		try {
			const res = await fetch('/api/photos/lookup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: nameInput.trim() })
			});

			const data = await res.json();

			if (data.guests?.length === 1) {
				const guest = data.guests[0];
				guestId = guest.id;
				guestName = `${guest.first_name} ${guest.last_name}`;
				guestSession.set({
					guest_id: guest.id,
					first_name: guest.first_name,
					last_name: guest.last_name,
					household_name: guest.household_name,
					household_code: guest.household_code
				});
				step = 'upload';
			} else if (data.guests?.length > 1) {
				lookupMessage = data.message || 'Multiple matches found. Please enter your full name.';
			} else {
				lookupError = data.message || 'No results found. Please check the spelling and try again.';
			}
		} catch {
			lookupError = 'Something went wrong. Please try again.';
		} finally {
			lookupLoading = false;
		}
	}

	function addTag() {
		const tag = tagInput.trim();
		if (tag && !customTags.includes(tag)) {
			customTags = [...customTags, tag];
		}
		tagInput = '';
	}

	function removeTag(tag: string) {
		customTags = customTags.filter((t) => t !== tag);
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addTag();
		}
	}

	function addFiles(files: FileList | File[]) {
		const fileArray = Array.from(files);
		for (const file of fileArray) {
			if (!file.type.startsWith('image/')) continue;
			if (file.size > MAX_SIZE) continue;

			// Deduplicate by name + size + lastModified
			const isDuplicate = fileQueue.some(
				(f) =>
					f.file.name === file.name &&
					f.file.size === file.size &&
					f.file.lastModified === file.lastModified
			);
			if (isDuplicate) continue;

			fileQueue.push({
				id: `file-${fileIdCounter++}`,
				file,
				thumbnailUrl: URL.createObjectURL(file),
				status: 'pending',
				retryCount: 0
			});
		}
	}

	function removeFile(entry: FileEntry) {
		URL.revokeObjectURL(entry.thumbnailUrl);
		fileQueue = fileQueue.filter((f) => f.id !== entry.id);
	}

	async function uploadFile(entry: FileEntry) {
		entry.status = 'uploading';
		entry.error = undefined;

		const formData = new FormData();
		formData.append('file', entry.file);
		formData.append('guest_id', guestId);
		formData.append('custom_tags', JSON.stringify(customTags));

		try {
			const res = await fetch('/api/photos/upload', {
				method: 'POST',
				body: formData
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			entry.status = 'uploaded';
			// Check if all done after this upload
			if (fileQueue.every((f) => f.status === 'uploaded')) {
				onUploadComplete();
			}
		} catch (err) {
			// Auto-retry once
			if (entry.retryCount < 1) {
				entry.retryCount++;
				await uploadFile(entry);
			} else {
				entry.status = 'failed';
				entry.error = err instanceof Error ? err.message : 'Upload failed';
			}
		}
	}

	async function uploadAll() {
		const pending = fileQueue.filter((f) => f.status === 'pending');
		await Promise.all(pending.map((entry) => uploadFile(entry)));
	}

	async function retryFailed() {
		const failed = fileQueue.filter((f) => f.status === 'failed');
		for (const entry of failed) {
			entry.retryCount = 0;
		}
		await Promise.all(failed.map((entry) => uploadFile(entry)));
	}

	function downloadFile(entry: FileEntry) {
		const a = document.createElement('a');
		a.href = entry.thumbnailUrl;
		a.download = entry.file.name;
		a.click();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		if (e.dataTransfer?.files) {
			addFiles(e.dataTransfer.files);
		}
	}

	function handleFileInput(e: Event & { currentTarget: HTMLInputElement }) {
		if (e.currentTarget.files) {
			addFiles(e.currentTarget.files);
			e.currentTarget.value = '';
		}
	}

	function startOver() {
		for (const entry of fileQueue) {
			URL.revokeObjectURL(entry.thumbnailUrl);
		}
		step = 'lookup';
		nameInput = '';
		guestId = '';
		guestName = '';
		customTags = [];
		tagInput = '';
		fileQueue = [];
	}
</script>

<div class="rounded-2xl border-2 border-dashed border-burgundy-light bg-white p-5 sm:p-8">
	<!-- Step indicator -->
	<div class="mb-6 flex flex-wrap items-center justify-center gap-2 text-xs text-brown-light">
		<span
			class="inline-flex min-h-8 items-center rounded-full px-3 py-1 {step === 'lookup'
				? 'bg-burgundy text-white'
				: 'bg-burgundy/10 text-burgundy'}">1. Your Name</span
		>
		<span class="text-burgundy-light">&rarr;</span>
		<span
			class="inline-flex min-h-8 items-center rounded-full px-3 py-1 {step === 'upload'
				? 'bg-burgundy text-white'
				: 'bg-burgundy/10 text-burgundy'}">2. Upload &amp; Tag</span
		>
	</div>

	<!-- Step 1: Name Lookup -->
	{#if step === 'lookup'}
		<div class="text-center">
			<p class="mb-2 font-serif text-lg text-brown">Share your photos</p>
			<p class="mb-4 text-sm text-brown-light">First, let us know who you are</p>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					lookupGuest();
				}}
				class="action-stack mx-auto max-w-md"
			>
				<input
					type="text"
					bind:value={nameInput}
					placeholder="Enter your name"
					class="touch-target flex-1 rounded-lg border border-burgundy-light px-4 py-3 text-brown focus:border-burgundy focus:outline-none"
					disabled={lookupLoading}
				/>
				<button
					type="submit"
					disabled={lookupLoading || !nameInput.trim()}
					class="touch-target rounded-full border-2 border-burgundy px-5 py-3 text-sm font-semibold tracking-[0.22em] text-burgundy uppercase transition-colors hover:bg-burgundy hover:text-white disabled:opacity-50"
				>
					{lookupLoading ? 'Looking up...' : 'Next'}
				</button>
			</form>
			{#if lookupError}
				<p class="mt-3 text-sm text-burgundy-dark">{lookupError}</p>
			{/if}
			{#if lookupMessage}
				<p class="mt-3 text-sm text-brown-light">{lookupMessage}</p>
			{/if}
		</div>

		<!-- Step 2: Upload & Tag (combined) -->
	{:else if step === 'upload'}
		<div class="text-center">
			<p class="mb-1 font-serif text-lg text-brown">Welcome, {guestName}!</p>
			<p class="mb-4 text-sm text-brown-light">
				Upload photos and add tags
				{#if autoFilled}
					<span class="mx-1">&middot;</span>
					<button
						type="button"
						class="touch-target px-1 underline hover:text-brown"
						onclick={() => {
							guestSession.clear();
							autoFilled = false;
							startOver();
						}}
					>
						Not you?
					</button>
				{/if}
			</p>

			<!-- Drop zone (always visible) -->
			<div
				class="mb-6 rounded-xl border-2 border-dashed p-5 transition-colors sm:p-6 {dragOver
					? 'border-burgundy bg-burgundy/5'
					: 'border-burgundy-light'}"
				role="region"
				aria-label="Photo upload area"
				ondragover={(e) => {
					e.preventDefault();
					dragOver = true;
				}}
				ondragleave={() => (dragOver = false)}
				ondrop={handleDrop}
			>
				<p class="mb-2 text-sm text-brown-light">Drag and drop images here, or click to browse</p>
				<label
					class="touch-target inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-burgundy px-6 py-3 text-sm font-semibold tracking-[0.22em] text-burgundy uppercase transition-colors hover:bg-burgundy hover:text-white"
				>
					Choose Photos
					<input type="file" accept="image/*" multiple class="sr-only" onchange={handleFileInput} />
				</label>
				<p class="mt-2 text-xs text-brown-light/60">Max 10MB per image</p>
			</div>

			<!-- Tag controls -->
			<div class="mx-auto mb-6 max-w-md text-left">
				<label for="tag-input" class="mb-1 block text-sm font-medium text-brown"
					>Tags (optional)</label
				>
				<div class="flex flex-col gap-2 sm:flex-row">
					<input
						id="tag-input"
						type="text"
						bind:value={tagInput}
						placeholder="Add a tag and press Enter"
						class="touch-target flex-1 rounded-lg border border-burgundy-light px-4 py-3 text-brown focus:border-burgundy focus:outline-none"
						onkeydown={handleTagKeydown}
					/>
					<button
						type="button"
						onclick={addTag}
						disabled={!tagInput.trim()}
						class="touch-target rounded-lg border border-burgundy px-4 py-3 text-sm text-burgundy transition-colors hover:bg-burgundy hover:text-white disabled:opacity-50"
					>
						Add
					</button>
				</div>
				{#if customTags.length > 0}
					<div class="mt-2 flex flex-wrap gap-1">
						{#each customTags as tag}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-burgundy/10 px-2 py-0.5 text-xs text-burgundy"
							>
								{tag}
								<button
									type="button"
									onclick={() => removeTag(tag)}
									class="touch-target px-1 text-burgundy hover:text-burgundy-dark"
									aria-label="Remove tag {tag}">&times;</button
								>
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Action bar -->
			{#if fileQueue.length > 0}
				<div class="mb-4 flex flex-wrap items-center justify-center gap-3">
					{#if pendingCount > 0}
						<button
							type="button"
							onclick={uploadAll}
							class="touch-target rounded-full border-2 border-burgundy bg-burgundy px-6 py-3 text-sm font-semibold tracking-[0.22em] text-white uppercase transition-colors hover:bg-burgundy-dark"
						>
							Upload All ({pendingCount})
						</button>
					{/if}
					{#if failedCount > 0}
						<button
							type="button"
							onclick={retryFailed}
							class="touch-target rounded-full border-2 border-burgundy px-4 py-3 text-sm font-semibold tracking-[0.22em] text-burgundy uppercase transition-colors hover:bg-burgundy hover:text-white"
						>
							Retry Failed ({failedCount})
						</button>
					{/if}
					<span class="text-xs text-brown-light">
						{fileQueue.length} file{fileQueue.length !== 1 ? 's' : ''}
						{#if uploadedCount > 0}
							&middot; {uploadedCount} uploaded
						{/if}
						{#if uploadingCount > 0}
							&middot; {uploadingCount} uploading
						{/if}
					</span>
				</div>

				{#if allDone && uploadedCount > 0}
					<p class="mb-4 text-sm text-burgundy">
						{uploadedCount} photo{uploadedCount !== 1 ? 's' : ''} uploaded successfully! Photos will appear
						after admin approval.
					</p>
				{/if}

				<!-- Thumbnail grid -->
				<div class="grid grid-cols-2 gap-3 min-[520px]:grid-cols-3 lg:grid-cols-4">
					{#each fileQueue as entry (entry.id)}
						<div
							class="group relative overflow-hidden rounded-xl border border-burgundy-light bg-white"
						>
							<div class="relative aspect-square overflow-hidden">
								<img
									src={entry.thumbnailUrl}
									alt={entry.file.name}
									class="h-full w-full object-cover"
								/>

								<!-- Status overlay -->
								{#if entry.status === 'uploading'}
									<div class="absolute inset-0 flex items-center justify-center bg-white/70">
										<svg
											class="h-8 w-8 animate-spin text-burgundy"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
											></path>
										</svg>
									</div>
								{:else if entry.status === 'uploaded'}
									<div class="absolute inset-0 flex items-center justify-center bg-green-900/40">
										<svg
											class="h-10 w-10 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											></path>
										</svg>
									</div>
								{:else if entry.status === 'failed'}
									<div
										class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-900/40"
									>
										<svg
											class="h-6 w-6 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											></path>
										</svg>
										<button
											type="button"
											onclick={() => {
												entry.retryCount = 0;
												uploadFile(entry);
											}}
											class="touch-target rounded bg-white/90 px-3 py-2 text-xs font-medium text-red-700 hover:bg-white"
										>
											Retry
										</button>
									</div>
								{:else}
									<!-- Pending: upload button on hover -->
									<div
										class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 transition-opacity md:bg-black/0 md:opacity-0 md:group-hover:bg-black/20 md:group-hover:opacity-100"
									>
										<button
											type="button"
											onclick={() => uploadFile(entry)}
											class="touch-target rounded-full bg-white/90 p-2 text-burgundy shadow hover:bg-white"
											aria-label="Upload {entry.file.name}"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-8l-4-4m0 0L8 8m4-4v12"
												></path>
											</svg>
										</button>
									</div>
								{/if}

								<!-- Download button -->
								<button
									type="button"
									onclick={() => downloadFile(entry)}
									class="absolute bottom-2 left-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity hover:bg-black/70 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100"
									aria-label="Download {entry.file.name}"
								>
									<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V4"
										></path>
									</svg>
								</button>

								<!-- Remove button (pending/failed only) -->
								{#if entry.status === 'pending' || entry.status === 'failed'}
									<button
										type="button"
										onclick={() => removeFile(entry)}
										class="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-lg text-white opacity-100 transition-opacity hover:bg-black/70 md:h-8 md:w-8 md:text-xs md:opacity-0 md:group-hover:opacity-100"
										aria-label="Remove {entry.file.name}"
									>
										&times;
									</button>
								{/if}
							</div>
							<div
								class="border-t border-burgundy-light/60 px-2 py-2 text-left text-[0.7rem] text-brown-light"
							>
								<p class="truncate" title={entry.file.name}>{entry.file.name}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="mt-6 flex justify-center">
				<button
					type="button"
					onclick={startOver}
					class="touch-target px-1 text-sm text-brown-light underline hover:text-brown"
				>
					Start over
				</button>
			</div>
		</div>
	{/if}
</div>
