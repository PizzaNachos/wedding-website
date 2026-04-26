<script lang="ts">
	import { enhance } from '$app/forms';
	import RsvpGuestForm from '$lib/components/RsvpGuestForm.svelte';
	import { COUPLE } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
	import { guestSession } from '$lib/guest-session.svelte';
	import type { Guest } from '$lib/types';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const hasAdults = $derived(data.household.guests.some((g: { is_child: boolean }) => !g.is_child));
	const hasExistingRsvp = $derived(data.existingRsvps.length > 0);

	// Plus-one derived state
	const allGuests = $derived(data.household.guests as Guest[]);

	const primaryGuests = $derived(allGuests.filter((g) => !g.is_plus_one));

	const totalReservedSeats = $derived(
		primaryGuests.length + primaryGuests.filter((g: Guest) => g.allows_plus_one).length
	);

	const plusOneByHostId = $derived(
		new Map(
			allGuests
				.filter((g) => g.is_plus_one && g.plus_one_of)
				.map((g) => [g.plus_one_of!, g] as [string, Guest])
		)
	);

	// Track per-guest attendance reactively
	let guestAttendance = $state(new Map<string, Map<string, boolean | null>>());

	$effect(() => {
		const map = new Map<string, Map<string, boolean | null>>();
		for (const guest of data.household.guests) {
			const eventMap = new Map<string, boolean | null>();
			for (const rsvp of data.existingRsvps) {
				if (rsvp.guest_id === guest.id) {
					eventMap.set(rsvp.event_id, rsvp.attending);
				}
			}
			map.set(guest.id, eventMap);
		}
		guestAttendance = map;
	});

	function handleAttendanceChange(guestId: string, eventId: string, attending: boolean) {
		const eventMap = guestAttendance.get(guestId) ?? new Map();
		eventMap.set(eventId, attending);
		guestAttendance.set(guestId, eventMap);
		guestAttendance = new Map(guestAttendance);
	}

	function hostAcceptsAnyEvent(guestId: string): boolean {
		const eventMap = guestAttendance.get(guestId);
		if (!eventMap) return false;
		return [...eventMap.values()].some((v) => v === true);
	}

	// Events visible to this household (any guest in household is invited)
	function formatTime(time: string): string {
		const [hourStr, minStr] = time.split(':');
		let hour = parseInt(hourStr, 10);
		const min = parseInt(minStr, 10);
		const suffix = hour >= 12 ? 'pm' : 'am';
		hour = hour % 12 || 12;
		return min === 0 ? `${hour}${suffix}` : `${hour}:${minStr} ${suffix}`;
	}

	const householdEventIds = $derived(
		new Set(data.guestEvents.map((ge: { event_id: string }) => ge.event_id))
	);
	const visibleEvents = $derived(data.events);

	const receptionEvent = $derived(
		data.events.find((e: { name: string }) => e.name === 'Reception')
	);

	$effect(() => {
		if (form?.success && data.household) {
			const guest = data.household.guests[0];
			guestSession.set({
				guest_id: guest.id,
				first_name: guest.first_name,
				last_name: guest.last_name,
				household_name: data.household.name,
				household_code: data.household.unique_code
			});
		}
	});
</script>

<svelte:head>
	<title>{i18n.t.rsvpCode.title} | {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="page-shell page-shell--xl page-section">
	<div class="mb-10 text-center">
		<h1 class="page-title font-script text-brown">{i18n.t.rsvpCode.title}</h1>
		<div class="section-rule"></div>
		<p class="mt-4 font-serif text-lg leading-snug text-brown-light sm:text-xl">
			{data.household.name}
		</p>
	</div>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] xl:gap-8">
		<aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
			<div class="overflow-hidden rounded-[2rem] border border-burgundy-light bg-white shadow-sm">
				<div class="rounded-[2rem] border border-burgundy-light bg-white p-5 shadow-sm sm:p-6">
					<p class="text-[0.72rem] font-semibold tracking-[0.24em] text-burgundy-dark uppercase">
						{i18n.t.rsvpCode.eventsTitle}
					</p>
					<p class="mt-2 max-w-sm text-sm leading-relaxed text-brown-light">
						{i18n.t.rsvpCode.eventsNote}
					</p>

					<div class="mt-5 space-y-3">
						{#each visibleEvents as event}
							<div
								class="relative overflow-hidden rounded-[1.5rem] border border-burgundy-light/80 bg-cover bg-center p-4"
								style="background-image: url('{event.image_path}'); background-size: cover; background-position: center;"
							>
								<div
									class="absolute inset-0 rounded-[1.5rem] bg-linear-to-r from-white/85 to-white/60"
								></div>
								<div class="gap-3; relative z-10 flex items-start justify-between pb-8">
									<div>
										<p class="font-serif text-xl text-brown">{event.name}</p>
										{#if householdEventIds.has(event.id)}
											<p class="mt-1 mr-4 text-sm leading-relaxed text-brown-light">
												{event.location}
											</p>
											<p class="mt-1 mr-4 text-sm leading-relaxed text-brown-light">
												{event.address}
											</p>
										{/if}
										<pre
											class="mt-4 mr-4 font-serif text-xs leading-relaxed whitespace-pre-wrap text-brown-light">{i18n.locale ===
												'es' && event.description_es
												? event.description_es
												: event.description}</pre>
									</div>
									{#if householdEventIds.has(event.id)}
										<span
											class="rounded-full border-2 bg-burgundy/20 px-3 py-1 text-sm font-semibold tracking-[0.18em] whitespace-nowrap text-burgundy-dark uppercase"
										>
											{formatTime(event.time)}
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</aside>

		<div class="rounded-[2rem] border border-burgundy p-4 shadow-sm sm:p-6 lg:p-7">
			{#if form?.success && !('action' in (form ?? {}))}
				<div class="rounded-[1.75rem] border border-burgundy bg-burgundy/10 p-6 text-center sm:p-8">
					<p class="font-script text-3xl text-burgundy-dark">{i18n.t.rsvpCode.thankYou}</p>
					<p class="mt-3 text-brown-light">
						{i18n.t.rsvpCode.submitted}
					</p>
				</div>
			{:else}
				<div class="mb-5">
					<h2 class="font-serif text-2xl text-brown sm:text-3xl">
						{i18n.t.rsvpCode.manageTitle}
					</h2>
					<p class="mt-2 max-w-2xl text-sm leading-relaxed text-brown-light">
						{i18n.t.rsvpCode.manageSubtitle}
					</p>
				</div>

				{#if form?.success === false}
					<div
						class="mb-4 rounded-2xl border border-burgundy-dark bg-burgundy-dark/10 p-4 text-center text-sm text-burgundy-dark"
					>
						{form.message}
					</div>
				{/if}

				<form method="POST" use:enhance class="space-y-4">
					{#if receptionEvent}
						<input type="hidden" name="reception_event_id" value={receptionEvent.id} />
					{/if}

					{#if !hasExistingRsvp}
						<div class="rounded-[1.5rem] border border-burgundy-light/80 bg-ivory/50 p-4">
							<p class="mb-1 text-sm font-semibold tracking-wide text-brown-light uppercase">
								{i18n.t.rsvpForm.householdContactTitle}
							</p>
							<p class="mb-4 text-xs text-brown-light">
								{i18n.t.rsvpForm.householdContactSubtitle}
							</p>

							<div class="grid gap-3 sm:grid-cols-2">
								<label class="block">
									<span class="mb-1 block text-xs text-brown-light"
										>{i18n.t.rsvpForm.email}
										{#if hasAdults}<span class="text-burgundy">*</span>{/if}</span
									>
									<input
										type="email"
										name="household.email"
										value=""
										required={hasAdults}
										placeholder="email@example.com"
										class="touch-target w-full rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
									/>
								</label>
								<label class="block">
									<span class="mb-1 block text-xs text-brown-light">{i18n.t.rsvpForm.phone}</span>
									<input
										type="tel"
										name="household.phone"
										value=""
										placeholder="(555) 123-4567"
										class="touch-target w-full rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
									/>
								</label>
							</div>

							<div class="mt-3">
								<span class="mb-1 block text-xs text-brown-light"
									>{i18n.t.rsvpForm.mailingAddress}</span
								>
								<div class="grid gap-3">
									<input
										type="text"
										name="household.address_street"
										value=""
										placeholder={i18n.t.rsvpForm.streetAddress}
										class="touch-target w-full rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
									/>
									<div class="grid gap-3 sm:grid-cols-2">
										<input
											type="text"
											name="household.address_city"
											value=""
											placeholder={i18n.t.rsvpForm.city}
											class="touch-target rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
										/>
										<input
											type="text"
											name="household.address_state"
											value=""
											placeholder={i18n.t.rsvpForm.stateProvince}
											class="touch-target rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
										/>
									</div>
									<div class="grid gap-3 sm:grid-cols-2">
										<input
											type="text"
											name="household.address_country"
											value=""
											placeholder={i18n.t.rsvpForm.country}
											class="touch-target rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
										/>
										<input
											type="text"
											name="household.address_postal_code"
											value=""
											placeholder={i18n.t.rsvpForm.postalCode}
											class="touch-target rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
										/>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<p class="mb-4 text-sm text-gray-600">
						{(totalReservedSeats === 1
							? i18n.t.rsvpCode.receptionSeatsSingular
							: i18n.t.rsvpCode.receptionSeatsPlural
						).replace('{n}', String(totalReservedSeats))}
					</p>

					<div class="space-y-4">
						{#each primaryGuests as guest}
							<RsvpGuestForm
								{guest}
								events={data.events}
								guestEvents={data.guestEvents}
								existingRsvps={data.existingRsvps}
								onAttendanceChange={handleAttendanceChange}
							/>

							{#if guest.allows_plus_one}
								{@const plusOne = plusOneByHostId.get(guest.id)}

								{#if plusOne}
									<!-- Existing plus-one: show their RSVP form + edit/remove controls -->
									<div class="mb-3 flex items-center justify-between">
										<p class="text-sm font-medium text-brown">
											{i18n.t.rsvpForm.plusOneOf}
											{guest.first_name}
										</p>
										<button
											type="submit"
											formaction="?/removePlusOne"
											class="text-xs text-burgundy hover:underline"
											onclick={(e) => {
												if (!confirm('Remove plus one?')) e.preventDefault();
											}}
										>
											<input type="hidden" name="plus_one_id" value={plusOne.id} />
											{i18n.t.rsvpForm.removePlusOne}
										</button>
									</div>

									<!-- Inline name edit -->
									<div class="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
										<input
											type="text"
											name="plus_one_first_name"
											value={plusOne.first_name}
											placeholder={i18n.t.rsvpForm.plusOneFirstName}
											class="touch-target w-full rounded-xl border-burgundy-light bg-white px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
										/>
										<input
											type="text"
											name="plus_one_last_name"
											value={plusOne.last_name}
											placeholder={i18n.t.rsvpForm.plusOneLastName}
											class="touch-target w-full rounded-xl border-burgundy-light bg-white px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
										/>
										<input type="hidden" name="plus_one_id" value={plusOne.id} />
										<button
											type="submit"
											formaction="?/updatePlusOneName"
											class="rounded-xl border border-burgundy-light bg-ivory px-3 py-2 text-xs font-medium text-brown-light transition-colors hover:bg-burgundy/10"
										>
											Save
										</button>
									</div>

									<RsvpGuestForm
										guest={plusOne}
										events={data.events}
										guestEvents={data.guestEvents}
										existingRsvps={data.existingRsvps}
										onAttendanceChange={handleAttendanceChange}
										isPlusOne={true}
									/>
								{:else if hostAcceptsAnyEvent(guest.id)}
									<!-- No plus-one yet, host accepts at least one event -->
									<div
										class="rounded-[1.75rem] border border-dashed border-burgundy-light p-4 text-center"
									>
										<p class="mb-3 text-sm text-brown-light">
											{i18n.t.rsvpForm.plusOneInvite}
										</p>
										<div class="mx-auto mb-3 grid max-w-sm gap-2 sm:grid-cols-2">
											<input
												type="text"
												name="plus_one_first_name"
												required
												placeholder={i18n.t.rsvpForm.plusOneFirstName}
												class="touch-target w-full rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
											/>
											<input
												type="text"
												name="plus_one_last_name"
												required
												placeholder={i18n.t.rsvpForm.plusOneLastName}
												class="touch-target w-full rounded-xl border-burgundy-light bg-white px-3 py-3 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
											/>
										</div>
										<input type="hidden" name="host_guest_id" value={guest.id} />
										<button
											type="submit"
											formaction="?/addPlusOne"
											class="inline-flex items-center justify-center rounded-full border border-burgundy bg-burgundy/10 px-6 py-2 text-sm font-semibold tracking-wide text-burgundy transition-colors hover:bg-burgundy/20"
										>
											{i18n.t.rsvpForm.addPlusOne}
										</button>
									</div>
								{/if}
							{/if}
						{/each}
					</div>

					<div class="pt-2 text-center sm:text-left">
						<button
							type="submit"
							formaction="?/submitRsvp"
							class="touch-target inline-flex w-full items-center justify-center rounded-full border-2 border-burgundy bg-burgundy px-10 py-3 text-sm font-semibold tracking-[0.22em] text-white uppercase transition-colors hover:border-burgundy-dark hover:bg-burgundy-dark focus:ring-2 focus:ring-burgundy focus:ring-offset-2 focus:outline-none sm:w-auto"
						>
							{i18n.t.rsvpCode.submit}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</section>
