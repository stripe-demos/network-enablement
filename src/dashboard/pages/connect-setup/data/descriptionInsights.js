// Shared by the server's evidence classifier and the inline explanation UI.
// These describe evidence, not finalized Connect configuration values. Keep the
// keys and labels in step with the settings step 2 shows (`config.js`), so a
// tooltip only ever names something the user will see on the next step.
//
// `readings` power the tooltip: the first pattern that matches the highlighted
// clause becomes what we tell the user we understood, optionally with the
// option it points to. They're a prototype heuristic layered on top of the
// classifier's yes/no, authored to be tuned by hand. `fallback` is used when the
// classifier found evidence but no reading names a concrete value.
const SELLER_NOUN = /\b(sellers?|vendors?|merchants?|hosts?|teachers?|tutors?|instructors?|coaches|coach|creators?|freelancers?|contractors?|drivers?|salons?|restaurants?|shops?|stores?|providers?|artists?|landlords?|gyms?|studios?|clinics?|practitioners?)\b/i;
const WE = '(?:we|our platform|the platform|our app|our site)';

export const DESCRIPTION_TRAITS = {
  chargeType: {
    label: 'Charge type',
    evidence: 'Explicit information about who collects customer payments, whose checkout is used, or how funds are split, held or transferred to sellers. Merely offering a paid product is not enough.',
    readings: [
      { test: new RegExp(`directly from (their|the) customers|their own checkout|${SELLER_NOUN.source}\\s+(collect|charge|accept|take)`, 'i'), text: 'Sellers charge their customers directly', option: 'Direct charges' },
      { test: /\b(split|splits|multiple|holds?|held|later|once|distribute)\b/i, text: 'You take payment, then split or hold funds', option: 'Separate charges and transfers' },
      { test: /\b(transfers?|transferred|forwards?|pays? out|payouts?|sends?)\b/i, text: 'You take payment, then pay sellers out', option: 'Destination charges' },
      { test: new RegExp(`\\b${WE}\\b.*\\b(collects?|charges?|accepts?|process(es)?|takes?)\\b`, 'i'), text: 'Your platform takes the payment', option: 'Destination charges' },
    ],
    fallback: 'How money moves from customers to sellers',
  },
  onboardingMethod: {
    label: 'Onboarding method',
    evidence: 'A stated preference or requirement about seller signup, account onboarding, identity verification or where those experiences live. Simply mentioning sellers is not enough.',
    readings: [
      { test: /\b(embedded|inside our|in our (app|product|platform|site)|within our|without leaving)\b/i, text: 'Sellers sign up without leaving your product', option: 'Embedded' },
      { test: /\b(stripe[- ]hosted|hosted by stripe|redirect(ed)?)\b/i, text: 'Stripe runs signup and verification', option: 'Stripe-hosted' },
      { test: /\b(api|our own|custom|build (it|signup|onboarding))\b/i, text: 'You’ll build signup yourself', option: 'API' },
      { test: /\b(fast|quick|quickly|simple|easy)\b/i, text: 'Signup should be quick to launch', option: 'Stripe-hosted' },
    ],
    fallback: 'How sellers sign up and verify their identity',
  },
  dashboardAccess: {
    label: 'Dashboard access',
    evidence: 'A stated requirement about sellers managing their payments, payouts, reports or account through a dashboard or inside the platform. A payout alone is not evidence of dashboard needs.',
    readings: [
      { test: /\bexpress\b/i, text: 'Sellers need just the basics', option: 'Express' },
      { test: /\b(no dashboard|don[’']?t need|do not need|our own dashboard)\b/i, text: 'You’ll build the seller experience yourself', option: 'None' },
      { test: /\b(embedded|inside our|in our (app|product|platform|site)|within our)\b/i, text: 'Sellers manage money inside your product', option: 'Embedded' },
      { test: /\b(stripe dashboard|full dashboard|own (stripe )?(login|dashboard|account))\b/i, text: 'Sellers get their own Stripe login', option: 'Full' },
    ],
    fallback: 'Where sellers track payments and payouts',
  },
  feeCollection: {
    label: 'Fee collection',
    evidence: 'Explicitly states who pays or absorbs Stripe/payment processing fees. A platform commission, subscription or take rate alone is NOT evidence about who pays processing fees.',
    readings: [
      { test: new RegExp(`\\b${WE}\\s+(will\\s+)?(cover|pay|absorb|eat|handle)s?\\b.*\\bfees?\\b`, 'i'), text: 'Your platform covers Stripe’s fees', option: 'Your platform' },
      { test: new RegExp(`${SELLER_NOUN.source}\\s+(will\\s+)?(cover|pay|absorb)s?\\b|\\bpass(ed)?\\b.*\\bfees?\\b`, 'i'), text: 'Sellers pay their own Stripe fees', option: 'Connected accounts' },
    ],
    fallback: 'Who pays Stripe’s processing fees',
  },
  negativeBalanceLiability: {
    label: 'Negative balance liability',
    evidence: 'Explicit responsibility for losses, unpaid negative balances, unrecoverable refunds, disputes or chargebacks. Generic payments or fees are not enough.',
    readings: [
      { test: /\bstripe\s+(will\s+)?(covers?|handles?|takes?|absorbs?|is responsible)\b/i, text: 'Stripe absorbs losses sellers can’t repay', option: 'Stripe' },
      { test: new RegExp(`\\b${WE}\\b.*\\b(cover|absorb|eat|take on|handle|responsible|liable)s?\\b.*\\b(loss(es)?|negative|balances?|refunds?|disputes?|chargebacks?)\\b`, 'i'), text: 'Your platform covers losses sellers can’t repay', option: 'Your platform' },
    ],
    fallback: 'Who covers refunds and disputes sellers can’t repay',
  },
};

// The tooltip meter: five segments, three levels. The level is spelled out in
// the text beside the segments ("Medium signal for …"), so it's never color-only.
export const STRENGTH_SEGMENTS = 5;
export const STRENGTH_LEVELS = {
  weak: { filled: 1, text: 'Weak' },
  moderate: { filled: 3, text: 'Medium' },
  strong: { filled: 5, text: 'Strong' },
};

// Strength = how far past the highlight cutoff the classifier landed, so a
// clause that barely qualified reads weak even though it's highlighted. A clause
// we couldn't map to a concrete value is capped at moderate. Without a
// probability (older cached results), explicitness alone decides.
export function traitStrength(confidence, explicit) {
  if (!Number.isFinite(confidence)) return explicit ? 'moderate' : 'weak';
  const margin = (confidence - EVIDENCE_THRESHOLD) / (1 - EVIDENCE_THRESHOLD);
  const level = margin >= 0.6 ? 'strong' : margin >= 0.25 ? 'moderate' : 'weak';
  return level === 'strong' && !explicit ? 'moderate' : level;
}

export function describeTrait(id, clause, confidence) {
  const trait = DESCRIPTION_TRAITS[id];
  const reading = trait.readings.find(({ test }) => test.test(clause));
  const text = typeof reading?.text === 'function' ? reading.text(clause) : reading?.text;
  return {
    label: trait.label,
    text: text ?? trait.fallback,
    option: reading?.option ?? null,
    strength: traitStrength(confidence, Boolean(reading)),
  };
}

// Provisional highlighting is a low-stakes hint, not an automated setup decision.
// These are prototype thresholds, not calibrated
// accuracy guarantees; scripts/check-jev.js exercises representative examples.
export const EVIDENCE_THRESHOLD = 0.6;
export const CHECK_THRESHOLD = 0.7;
export const MAX_SEGMENTS = 32;

// Keep offsets in JavaScript UTF-16 units, exactly like textarea.selectionStart.
// Jev selects from these supplied clauses; it never invents quotes or offsets.
export function segmentDescription(text) {
  const parts = [];
  const boundaries = /[.!?;\n]+(?:\s+|$)|,\s+|\s+(?:and|but|while|where|whereas)\s+/gi;
  let start = 0;
  const add = (end) => {
    const raw = text.slice(start, end);
    const leading = raw.length - raw.trimStart().length;
    const trimmed = raw.trim();
    if (trimmed) parts.push({ start: start + leading, end: start + leading + trimmed.length, text: trimmed });
  };
  for (const match of text.matchAll(boundaries)) {
    add(match.index);
    start = match.index + match[0].length;
  }
  add(text.length);

  // Bound inference work even for a long, punctuation-heavy pasted description.
  // Merge neighboring clauses instead of silently dropping the end of the text.
  const groupSize = Math.ceil(parts.length / MAX_SEGMENTS) || 1;
  const groups = [];
  for (let i = 0; i < parts.length; i += groupSize) {
    const first = parts[i];
    const last = parts[Math.min(i + groupSize - 1, parts.length - 1)];
    groups.push({ start: first.start, end: last.end, text: text.slice(first.start, last.end) });
  }
  return groups;
}

// Previously confirmed clauses can stay visible while a later clause is typed.
// Any edited clause loses its highlight immediately, including appended negation.
export function currentHighlights(result, text) {
  if (!result) return [];
  if (result.description === text) return result.highlights;
  const clauses = segmentDescription(text);
  return result.highlights.filter((highlight) => clauses.some((clause) =>
    clause.start === highlight.start && clause.end === highlight.end &&
    clause.text === result.description.slice(highlight.start, highlight.end)
  ));
}
