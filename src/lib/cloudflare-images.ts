import {
	CLOUDFLARE_ACCOUNT_ID,
	CLOUDFLARE_API_TOKEN,
	CLOUDFLARE_ACCOUNT_HASH
} from '$env/static/private';

const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`;

export type ImageVariant = 'thumbnail' | 'medium' | 'full' | "original";

export async function uploadImage(
	file: File,
	metadata?: Record<string, string>
): Promise<{ id: string }> {
	const formData = new FormData();
	formData.append('file', file);

	if (metadata) {
		formData.append('metadata', JSON.stringify(metadata));
	}

	const response = await fetch(BASE_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`
		},
		body: formData
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(
			`Cloudflare Images upload failed: ${(error as any)?.errors?.[0]?.message || response.statusText}`
		);
	}

	const result = await response.json();
	return { id: (result as any).result.id };
}

export async function deleteImage(imageId: string): Promise<void> {
	const response = await fetch(`${BASE_URL}/${imageId}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`
		}
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(
			`Cloudflare Images delete failed: ${(error as any)?.errors?.[0]?.message || response.statusText}`
		);
	}
}

export function getImageUrl(imageId: string, variant: ImageVariant = 'medium'): string {
	if (variant == "original") {
		return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/gamma=0`;
	}
	return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/${variant}`;
}
