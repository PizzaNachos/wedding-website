<script lang="ts">
	import { DIETARY_OPTIONS, US_STATES } from '$lib/types';
	import type { Guest, Rsvp, DietaryRestrictions, GuestContactInfo } from '$lib/types';

	interface Props {
		guest: Guest;
		existingRsvps: Rsvp[];
		existingContactInfo: GuestContactInfo | null;
	}

	let { guest, existingRsvps, existingContactInfo }: Props = $props();

	function getRsvpForEvent(eventId: string): Rsvp | undefined {
		return existingRsvps.find((r) => r.guest_id === guest.id && r.event_id === eventId);
	}

	function getDietarySelections(eventId: string): string[] {
		const rsvp = getRsvpForEvent(eventId);
		return rsvp?.dietary_restrictions?.selections ?? [];
	}

	function getDietaryOther(): string {
		// Use dietary from any existing RSVP (shared across events for the guest)
		const rsvp = existingRsvps.find((r) => r.guest_id === guest.id);
		return rsvp?.dietary_restrictions?.other ?? '';
	}

	function getSongRequest(): string {
		const rsvp = existingRsvps.find((r) => r.guest_id === guest.id);
		return rsvp?.song_request ?? '';
	}
</script>

<div class="rounded-lg border border-burgundy-light bg-white p-6 shadow-sm">
	<h3 class="mb-4 font-serif text-xl text-brown">
		{guest.first_name}
		{guest.last_name}
		{#if guest.is_child}<span class="ml-2 text-sm font-light text-brown-light">(Child)</span
			>{/if}
	</h3>

	<!-- Contact information (adults only) -->
	{#if !guest.is_child}
		<div class="mb-6">
			<p class="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-light">
				Contact Information
			</p>
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block text-xs text-brown-light">Email <span class="text-burgundy">*</span></span>
					<input
						type="email"
						name="guests[{guest.id}].email"
						value={existingContactInfo?.email ?? ''}
						required
						placeholder="email@example.com"
						class="w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
					/>
				</label>
				<label class="block">
					<span class="mb-1 block text-xs text-brown-light">Phone</span>
					<input
						type="tel"
						name="guests[{guest.id}].phone"
						value={existingContactInfo?.phone ?? ''}
						placeholder="(555) 123-4567"
						class="w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
					/>
				</label>
			</div>
			<div class="mt-3">
				<span class="mb-1 block text-xs text-brown-light">Mailing Address</span>
				<div class="grid gap-3">
					<div class="grid gap-3 sm:grid-cols-3">
						<input
							type="text"
							name="guests[{guest.id}].address_street"
							value={existingContactInfo?.address_street ?? ''}
							placeholder="Street address"
							class="rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy sm:col-span-2"
						/>
						<input
							type="text"
							name="guests[{guest.id}].address_unit"
							value={existingContactInfo?.address_unit ?? ''}
							placeholder="Apt / Unit"
							class="rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
						/>
					</div>
					<div class="grid gap-3 sm:grid-cols-6">
						<input
							type="text"
							name="guests[{guest.id}].address_city"
							value={existingContactInfo?.address_city ?? ''}
							placeholder="City"
							class="rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy sm:col-span-3"
						/>
						<select
							name="guests[{guest.id}].address_state"
							class="rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown focus:border-burgundy focus:ring-burgundy sm:col-span-2"
						>
							<option value="">State</option>
							{#each US_STATES as state}
								<option value={state.value} selected={existingContactInfo?.address_state === state.value}>{state.label}</option>
							{/each}
						</select>
						<input
							type="text"
							name="guests[{guest.id}].address_zip"
							value={existingContactInfo?.address_zip ?? ''}
							placeholder="ZIP"
							inputmode="numeric"
							pattern="[0-9]{5}(-[0-9]{4})?"
							class="rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
						/>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Event attendance -->
	{#each guest.guest_events as ge}
		{@const rsvp = getRsvpForEvent(ge.event_id)}
		<div class="mb-4">
			<p class="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-light">
				{ge.events.name} — {ge.events.time}
				{#if ge.events.location}
					<span class="font-normal">at {ge.events.location}</span>
				{/if}
			</p>
			<div class="flex gap-3">
				<label
					class="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-burgundy has-[:checked]:bg-burgundy/20"
				>
					<input
						type="radio"
						name="guests[{guest.id}].events[{ge.event_id}].attending"
						value="yes"
						checked={rsvp?.attending === true}
						class="sr-only"
					/>
					<span>Joyfully Accepts</span>
				</label>
				<label
					class="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-burgundy/30 has-[:checked]:bg-burgundy/10"
				>
					<input
						type="radio"
						name="guests[{guest.id}].events[{ge.event_id}].attending"
						value="no"
						checked={rsvp?.attending === false}
						class="sr-only"
					/>
					<span>Regretfully Declines</span>
				</label>
			</div>
		</div>
	{/each}

	<!-- Dietary restrictions -->
	<div class="mb-4">
		<p class="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-light">
			Dietary Restrictions
		</p>
		<div class="flex flex-wrap gap-2">
			{#each DIETARY_OPTIONS as option}
				{@const firstEventRsvp = existingRsvps.find((r) => r.guest_id === guest.id)}
				<label
					class="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-brown-light has-[:checked]:bg-brown-light/20"
				>
					<input
						type="checkbox"
						name="guests[{guest.id}].dietary[{option}]"
						value="true"
						checked={firstEventRsvp?.dietary_restrictions?.selections?.includes(option)}
						class="sr-only"
					/>
					<span>{option}</span>
				</label>
			{/each}
		</div>
		<input
			type="text"
			name="guests[{guest.id}].dietary[other]"
			value={getDietaryOther()}
			placeholder="Other dietary needs..."
			class="mt-3 w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
		/>
	</div>

	<!-- Song request -->
	<div>
		<p class="mb-2 text-sm font-semibold uppercase tracking-wide text-brown-light">
			Song Request
		</p>
		<input
			type="text"
			name="guests[{guest.id}].song_request"
			value={getSongRequest()}
			placeholder="What song gets you on the dance floor?"
			class="w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
		/>
	</div>
</div>
