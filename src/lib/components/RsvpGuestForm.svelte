<script lang="ts">
	import { DIETARY_OPTIONS } from '$lib/types';
	import { i18n } from '$lib/i18n.svelte';
	import type { Guest, Rsvp, CeremonyInterest } from '$lib/types';

	interface Props {
		guest: Guest;
		existingRsvp: Rsvp | null;
		existingCeremonyInterest: CeremonyInterest | null;
	}

	let { guest, existingRsvp, existingCeremonyInterest }: Props = $props();

	let ceremonySelection = $state<string>(existingCeremonyInterest?.interest_level ?? '');
	let childCeremonyOptIn = $state<boolean>(
		guest.is_child && existingCeremonyInterest != null
	);
</script>

<div class="rounded-lg border border-burgundy-light bg-white p-6 shadow-sm">
	<h3 class="mb-4 font-serif text-xl text-brown">
		{guest.first_name}
		{guest.last_name}
		{#if guest.is_child}<span class="ml-2 text-sm font-light text-brown-light">{i18n.t.rsvpForm.child}</span
			>{/if}
	</h3>

	<!-- Reception Attendance -->
	<div class="mb-4">
		<p class="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-light">
			{i18n.t.rsvpForm.receptionTitle}
		</p>
		<p class="mb-3 text-sm text-brown-light">{i18n.t.rsvpForm.receptionSubtitle}</p>
		<div class="flex gap-3">
			<label
				class="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-burgundy has-[:checked]:bg-burgundy/20"
			>
				<input
					type="radio"
					name="guests[{guest.id}].attending"
					value="yes"
					checked={existingRsvp?.attending === true}
					class="sr-only"
				/>
				<span>{i18n.t.rsvpForm.joyfullyAccepts}</span>
			</label>
			<label
				class="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-burgundy/30 has-[:checked]:bg-burgundy/10"
			>
				<input
					type="radio"
					name="guests[{guest.id}].attending"
					value="no"
					checked={existingRsvp?.attending === false}
					class="sr-only"
				/>
				<span>{i18n.t.rsvpForm.regretfullyDeclines}</span>
			</label>
		</div>
	</div>

	<!-- Ceremony Interest -->
	{#if !guest.is_child}
		<!-- Adults: graduated interest scale -->
		<div class="mb-4">
			<p class="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-light">
				{i18n.t.rsvpForm.ceremonyTitle}
			</p>
			<p class="mb-3 text-xs text-brown-light">
				{i18n.t.rsvpForm.ceremonyDescription}
			</p>
			<div class="flex flex-wrap gap-2">
				<label
					class="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-burgundy has-[:checked]:bg-burgundy/20"
				>
					<input
						type="radio"
						name="guests[{guest.id}].ceremony"
						value="yes"
						checked={ceremonySelection === 'yes'}
						onchange={() => (ceremonySelection = 'yes')}
						class="sr-only"
					/>
					<span>{i18n.t.rsvpForm.ceremonyYes}</span>
				</label>
				<label
					class="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/20"
				>
					<input
						type="radio"
						name="guests[{guest.id}].ceremony"
						value="maybe"
						checked={ceremonySelection === 'maybe'}
						onchange={() => (ceremonySelection = 'maybe')}
						class="sr-only"
					/>
					<span>{i18n.t.rsvpForm.ceremonyMaybe}</span>
				</label>
				<label
					class="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-burgundy/30 has-[:checked]:bg-burgundy/10"
				>
					<input
						type="radio"
						name="guests[{guest.id}].ceremony"
						value="not_likely"
						checked={ceremonySelection === 'not_likely'}
						onchange={() => (ceremonySelection = 'not_likely')}
						class="sr-only"
					/>
					<span>{i18n.t.rsvpForm.ceremonyNotLikely}</span>
				</label>
				<label
					class="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-brown-light has-[:checked]:bg-brown-light/20"
				>
					<input
						type="radio"
						name="guests[{guest.id}].ceremony"
						value="other"
						checked={ceremonySelection === 'other'}
						onchange={() => (ceremonySelection = 'other')}
						class="sr-only"
					/>
					<span>{i18n.t.rsvpForm.ceremonyOther}</span>
				</label>
			</div>
			{#if ceremonySelection === 'other'}
				<input
					type="text"
					name="guests[{guest.id}].ceremony_other_text"
					value={existingCeremonyInterest?.interest_level === 'other'
						? (existingCeremonyInterest.other_text ?? '')
						: ''}
					placeholder={i18n.t.rsvpForm.ceremonyOtherPlaceholder}
					class="mt-3 w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
				/>
			{/if}
		</div>
	{:else}
		<!-- Children: opt-in checkbox -->
		<div class="mb-4">
			<label class="flex cursor-pointer items-center gap-2 text-sm text-brown">
				<input
					type="checkbox"
					name="guests[{guest.id}].ceremony_child_optin"
					value="true"
					bind:checked={childCeremonyOptIn}
					class="rounded border-burgundy-light text-burgundy focus:ring-burgundy"
				/>
				<span>{i18n.t.rsvpForm.ceremonyChildOptIn.replace('{name}', guest.first_name)}</span>
			</label>
		</div>
	{/if}

	<!-- Dietary restrictions -->
	<div class="mb-4">
		<p class="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-light">
			{i18n.t.rsvpForm.dietaryRestrictions}
		</p>
		<div class="flex flex-wrap gap-2">
			{#each DIETARY_OPTIONS as option}
				<label
					class="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-brown-light has-[:checked]:bg-brown-light/20"
				>
					<input
						type="checkbox"
						name="guests[{guest.id}].dietary[{option}]"
						value="true"
						checked={existingRsvp?.dietary_restrictions?.selections?.includes(option)}
						class="sr-only"
					/>
					<span>{i18n.t.rsvpForm.dietaryLabels[option] ?? option}</span>
				</label>
			{/each}
		</div>
		<input
			type="text"
			name="guests[{guest.id}].dietary[other]"
			value={existingRsvp?.dietary_restrictions?.other ?? ''}
			placeholder={i18n.t.rsvpForm.dietaryOther}
			class="mt-3 w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
		/>
	</div>

	<!-- Song request -->
	<div>
		<p class="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-light">
			{i18n.t.rsvpForm.songRequest}
		</p>
		<input
			type="text"
			name="guests[{guest.id}].song_request"
			value={existingRsvp?.song_request ?? ''}
			placeholder={i18n.t.rsvpForm.songPlaceholder}
			class="w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
		/>
	</div>
</div>
