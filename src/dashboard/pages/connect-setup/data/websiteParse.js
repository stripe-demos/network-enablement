// Website parsing for step 1.
//
// No design exists for this yet, so the behaviour is our best reading of the flow:
// entering a recognised URL reads the site, writes a summary into the description,
// and lets the existing checks pass on that text — rather than special-casing
// validity the way a staged file has to.
//
// Only misprint.com is wired up. Producing this summary for any other host would
// be a lie, so other URLs are left alone.
const PARSEABLE_HOST = 'misprint.com';

// Written from the real site: a two-sided trading card marketplace, mostly
// Pokémon, that runs its own checkout and advertises platform fees "as low as
// 2.5%". Payout timing is not stated publicly, so "once the card ships" is the
// conventional marketplace pattern rather than something misprint.com claims.
// 249 characters, inside the 500 limit, and satisfies both checks on its own.
export const WEBSITE_SUMMARY =
  'A trading card marketplace, mostly Pokémon. Buyers purchase graded cards, raw singles and sealed products listed by individual sellers. We collect the payment at checkout, take a platform fee starting at 2.5%, and pay the seller once the card ships.';

// How long the read takes.
// Long enough to register as work being done.
export const PARSE_MS = 3000;

/** True when the typed value looks like a URL we have a summary for. */
export function isParseableWebsite(value) {
  const trimmed = (value || '').trim().toLowerCase();
  if (trimmed.length === 0) return false;
  // Tolerate what people actually type: bare hosts, `www.`, a scheme, a path.
  const withoutScheme = trimmed.replace(/^https?:\/\//, '');
  const host = withoutScheme.split('/')[0].replace(/^www\./, '');
  return host === PARSEABLE_HOST;
}
