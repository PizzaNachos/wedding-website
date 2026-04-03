<script lang="ts">
	import { COUPLE, WEDDING_DATE } from '$lib/config';
</script>

<footer class="border-t border-burgundy-light bg-ivory px-4 py-8 text-center">
	<p class="font-script text-2xl leading-none text-burgundy-dark sm:text-[2rem]">
		{COUPLE.partner1} & {COUPLE.partner2}
	</p>
	<p class="mt-2 text-xs font-light tracking-[0.18em] text-brown-light sm:text-sm sm:tracking-wide">
		{WEDDING_DATE.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		})}
	</p>
</footer>
