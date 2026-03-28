import { createHmac, timingSafeEqual } from 'crypto';

export const COOKIE_NAME = 'site_access';

const HMAC_MESSAGE = 'wedding-gate-access';

export function createGateToken(password: string): string {
	return createHmac('sha256', password).update(HMAC_MESSAGE).digest('hex');
}

export function validateGateToken(token: string, password: string): boolean {
	const expected = createGateToken(password);
	if (token.length !== expected.length) return false;
	return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
