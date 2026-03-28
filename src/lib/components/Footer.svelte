<script lang="ts">
	import { COUPLE, WEDDING_DATE } from '$lib/config';
</script>

<footer class="border-t border-burgundy-light bg-ivory py-8 text-center">
	<p class="font-script text-2xl text-burgundy-dark">
		{COUPLE.partner1} & {COUPLE.partner2}
	</p>
	<p class="mt-2 text-sm font-light tracking-wide text-brown-light">
		{WEDDING_DATE.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		})}
	</p>
</footer>
