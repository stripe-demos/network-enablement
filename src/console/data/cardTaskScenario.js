// Short card-expiration example from designer/perceived-loadout (17e3e9e).
export const TASK_INTRO = 'The user is asking which customer payment cards will expire in the near future—a business question about identifying cards approaching their expiration dates. I will establish the data source for card expiration information to answer this question.';
export const FIRST_FINDING = 'Found 1 customer card with a January 2026 expiration date. Consider reaching out to update payment details.';
export const LAST_FINDING = 'Found 12 Visa cards expiring within the next 6 months, all ending in 5012 and expiring January 2027, across multiple customer accounts.';

// Illustrative SQL: the capture only shows the opening lines, not the full query.
export const QUERY_SQL = `SELECT
  pm.id AS payment_method_id,
  pm.customer_id,
  pm.card_brand,
  pm.card_last4,
  pm.card_exp_month,
  pm.card_exp_year
FROM payment_methods pm
WHERE pm.card_exp_year = 2026
  AND pm.card_exp_month = 1;`;
export const UPCOMING_SQL = QUERY_SQL.replace('= 2026', '= 2027');
