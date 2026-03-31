import type { RequestHandler } from './$types';

const TEMPLATE_CSV = `household_name,first_name,last_name,is_child,email,phone,address_street,address_city,address_state,address_country,address_postal_code
Smith Family,John,Smith,false,john@example.com,555-123-4567,123 Main St,Springfield,IL,USA,62701
Smith Family,Jane,Smith,false,,,,,,,,
Jones Family,Billy,Jones,true,,,,,,,,
`;

export const GET: RequestHandler = async () => {
	return new Response(TEMPLATE_CSV, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': 'attachment; filename="guest-import-template.csv"'
		}
	});
};
