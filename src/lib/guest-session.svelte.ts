import { browser } from '$app/environment';

const STORAGE_KEY = 'guest_session';

export interface GuestSession {
	guest_id: string;
	first_name: string;
	last_name: string;
	household_name: string;
	household_code: string;
}

function loadFromStorage(): GuestSession | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

class GuestSessionStore {
	current = $state<GuestSession | null>(loadFromStorage());

	set(data: GuestSession) {
		this.current = data;
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	}

	clear() {
		this.current = null;
		if (browser) localStorage.removeItem(STORAGE_KEY);
	}
}

export const guestSession = new GuestSessionStore();
