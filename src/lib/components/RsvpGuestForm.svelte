<script lang="ts">
	import { DIETARY_OPTIONS } from '$lib/types';
	import { i18n } from '$lib/i18n.svelte';
	import type { Guest, Rsvp, Event, GuestEvent } from '$lib/types';

	interface Props {
		guest: Guest;
		events: Event[];
		guestEvents: GuestEvent[];
		existingRsvps: Rsvp[];
	}

	let { guest, events, guestEvents, existingRsvps }: Props = $props();

	const invitedEventIds = $derived(
		new Set(guestEvents.filter((ge) => ge.guest_id === guest.id).map((ge) => ge.event_id))
	);

	const invitedEvents = $derived(events.filter((e) => invitedEventIds.has(e.id)));

	const receptionEvent = $derived(events.find((e) => e.name === 'Reception'));

	function getRsvpForEvent(eventId: string): Rsvp | undefined {
		return existingRsvps.find((r) => r.guest_id === guest.id && r.event_id === eventId);
	}

	// Track reception attendance reactively for conditional dietary display
	let receptionAttending = $state<boolean | null>(null);

	$effect(() => {
		if (receptionEvent) {
			const existing = getRsvpForEvent(receptionEvent.id);
			if (existing) receptionAttending = existing.attending;
		}
	});

	function handleReceptionChange(attending: boolean) {
		receptionAttending = attending;
	}

	function getGuestStatus() {
		if (!receptionEvent) {
			return {
				label: i18n.t.rsvpForm.statusPending,
				classes: 'border-gold/30 bg-gold/15 text-brown'
			};
		}
		const rsvp = getRsvpForEvent(receptionEvent.id);
		if (rsvp?.attending === true) {
			return {
				label: i18n.t.rsvpForm.statusAttending,
				classes: 'border-burgundy/20 bg-burgundy/10 text-burgundy-dark'
			};
		}
		if (rsvp?.attending === false) {
			return {
				label: i18n.t.rsvpForm.statusDeclined,
				classes: 'border-brown-light/20 bg-brown-light/10 text-brown'
			};
		}
		return {
			label: i18n.t.rsvpForm.statusPending,
			classes: 'border-gold/30 bg-gold/15 text-brown'
		};
	}

	const guestStatus = $derived.by(() => getGuestStatus());

	// Get existing dietary data from the reception RSVP
	const existingDietary = $derived.by(() => {
		if (!receptionEvent) return null;
		return getRsvpForEvent(receptionEvent.id)?.dietary_restrictions ?? null;
	});
</script>

<div class="rounded-[1.75rem] border border-burgundy-light bg-white p-4 shadow-sm sm:p-5">
	<div class="mb-4 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h3 class="font-serif text-xl text-brown">
				{guest.first_name}
				{guest.last_name}
			</h3>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#if guest.is_child}
				<span
					class="rounded-full border border-burgundy-light bg-ivory px-3 py-1 text-xs font-medium text-brown-light"
				>
					{i18n.t.rsvpForm.child}
				</span>
			{/if}
			<span
				class={`rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${guestStatus.classes}`}
			>
				{guestStatus.label}
			</span>
		</div>
	</div>

	<div class="space-y-3">
		{#each invitedEvents as event, idx}
			<div class="flex flex-row justify-between gap-4">
				<div>
					<p class="mb-1 text-sm font-semibold tracking-wide text-brown-light uppercase">
						{event.name}
					</p>
				</div>
				<div class="flex gap-2">
					<label
						class="touch-target flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border bg-white px-2 py-1 text-center text-sm transition-colors has-[:checked]:border-burgundy has-[:checked]:bg-burgundy/20"
					>
						<input
							type="radio"
							name="guests[{guest.id}].events[{event.id}].attending"
							value="yes"
							checked={getRsvpForEvent(event.id)?.attending === true}
							onchange={() => {
								if (receptionEvent && event.id === receptionEvent.id)
									handleReceptionChange(true);
							}}
							class="sr-only"
						/>
						<span>{i18n.t.rsvpForm.joyfullyAccepts}</span>
					</label>
					<label
						class="touch-target flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border bg-white px-2 py-1 text-center text-sm transition-colors has-[:checked]:border-burgundy/30 has-[:checked]:bg-burgundy/10"
					>
						<input
							type="radio"
							name="guests[{guest.id}].events[{event.id}].attending"
							value="no"
							checked={getRsvpForEvent(event.id)?.attending === false}
							onchange={() => {
								if (receptionEvent && event.id === receptionEvent.id)
									handleReceptionChange(false);
							}}
							class="sr-only"
						/>
						<span>{i18n.t.rsvpForm.regretfullyDeclines}</span>
					</label>
				</div>
			</div>
			{#if idx < invitedEvents.length - 1}
				<div class="my-4 h-px bg-linear-to-r from-transparent via-burgundy/40 to-transparent"></div>
			{/if}
		{/each}

		{#if receptionAttending === true}
			<div class="my-4 h-px bg-linear-to-r from-transparent via-burgundy/40 to-transparent"></div>
			<div>
				<p class="mb-2 text-sm font-semibold tracking-wide text-brown-light uppercase">
					{i18n.t.rsvpForm.dietaryRestrictions}
				</p>
				<div class="grid gap-2 min-[420px]:grid-cols-3">
					{#each DIETARY_OPTIONS as option}
						<label
							class="touch-target flex cursor-pointer items-center justify-center gap-2 rounded-2xl border bg-white px-4 py-3 text-center text-sm transition-colors has-[:checked]:border-brown-light has-[:checked]:bg-brown-light/20"
						>
							<input
								type="checkbox"
								name="guests[{guest.id}].dietary[{option}]"
								value="true"
								checked={existingDietary?.selections?.includes(option)}
								class="sr-only"
							/>
							<span>{i18n.t.rsvpForm.dietaryLabels[option] ?? option}</span>
						</label>
					{/each}
				</div>
				<input
					type="text"
					name="guests[{guest.id}].dietary[other]"
					value={existingDietary?.other ?? ''}
					placeholder={i18n.t.rsvpForm.dietaryOther}
					class="touch-target mt-3 w-full rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
				/>
			</div>
		{/if}
	</div>
</div>
