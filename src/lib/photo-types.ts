export const PAGE_SIZE = 24;

export type TabId = 'engagement' | 'ceremony' | 'reception' | 'guest';

export interface Photo {
	id: string;
	url: string;
	fullUrl: string;
	originalUrl: string;
	name: string;
	custom_tags: string[];
	uploader_name?: string | null;
}
