import { en } from './translations/en';
import { es } from './translations/es';

export type Locale = 'en' | 'es';

class I18n {
	locale = $state<Locale>('en');

	get t() {
		return this.locale === 'es' ? es : en;
	}

	toggle() {
		this.setLocale(this.locale === 'en' ? 'es' : 'en');
	}

	setLocale(l: Locale) {
		this.locale = l;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('locale', l);
		}
	}

	init() {
		if (typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem('locale') as Locale | null;
			if (saved === 'es') this.locale = 'es';
		}
	}
}

export const i18n = new I18n();
