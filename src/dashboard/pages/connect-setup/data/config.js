// The five Connect configuration dimensions Stripe infers from the business
// description, grouped as they appear in step 2.
//
// Provenance: every group label, setting label, option label, and option
// description below is verbatim from the Figma design — the per-dimension frames
// `1533:313311` (onboarding method), `1533:317344` (charge type), `1533:319027`
// (fee collection), `1533:320941` (negative balance liability), and the
// `.tradit_box` component sheet `867:97579` (dashboard access).

// The IA gives funds flow (charge type) special treatment: it leads the step as
// its own "How payments move" group, rendered as an illustrated funds-flow
// diagram over a hover-to-edit selector rather than a plain SettingCard. The
// `variant: 'fundsFlow'` flag tells StepReview to render FundsFlowCard for it.
export const GROUPS = [
  {
    id: 'fundsFlow',
    label: 'How payments move',
    icon: 'withdrawal',
    variant: 'fundsFlow',
    settings: ['chargeType'],
  },
  {
    id: 'experience',
    label: 'What your users experience',
    icon: 'customers',
    settings: ['onboardingMethod', 'dashboardAccess'],
  },
  {
    id: 'risk',
    label: 'Who is on liable',
    icon: 'shield',
    settings: ['negativeBalanceLiability'],
  },
  {
    id: 'payments',
    label: 'Who pays Stripe fees',
    icon: 'payment',
    settings: ['feeCollection'],
  },
];

export const SETTINGS = {
  onboardingMethod: {
    id: 'onboardingMethod',
    label: 'Onboarding method',
    // The component sheet carries superseded copy for this dimension ("A web form
    // hosted by Stripe." etc). The frame instance overrides it — these are the
    // frame strings.
    options: [
      {
        value: 'stripe-hosted',
        label: 'Stripe-hosted',
        description: 'Stripe hosts the signup page and verifies identity for you.',
      },
      {
        value: 'embedded',
        label: 'Embedded',
        description: 'Signup is in your product and uses components styled to match it.',
      },
      {
        value: 'api',
        label: 'API',
        description: 'You build signup yourself using the Accounts API from Stripe.',
      },
    ],
  },

  dashboardAccess: {
    id: 'dashboardAccess',
    label: 'Dashboard access',
    // The only dimension with four options. These exist solely in the component
    // sheet — the frame that should show this row expanded (`1533:315378`)
    // renders the wrong variant, so design wrote the copy but never laid it out.
    options: [
      {
        value: 'full',
        label: 'Full',
        description: 'Connected accounts get the full Stripe Dashboard with their own login.',
      },
      {
        value: 'express',
        label: 'Express',
        description: 'Express covers the basics with lightweight controls and reporting.',
      },
      {
        value: 'embedded',
        label: 'Embedded',
        description: 'Customizable components put Stripe features inside your product.',
      },
      {
        value: 'none',
        label: 'None',
        description: 'You don’t offer a Stripe dashboard and build your own account experience.',
      },
    ],
  },

  chargeType: {
    id: 'chargeType',
    label: 'Charge type',
    options: [
      {
        value: 'direct',
        label: 'Direct charges',
        description:
          'Connected accounts collect payments directly. Funds land in their balance, minus your fee.',
      },
      {
        value: 'destination',
        label: 'Destination charges',
        description: 'You collect payments. Funds are forwarded to connected accounts automatically.',
      },
      {
        value: 'separate',
        label: 'Separate charges and transfers',
        description: 'You collect payments and distribute the funds to connected accounts.',
      },
    ],
  },

  feeCollection: {
    id: 'feeCollection',
    label: 'Fee collection',
    options: [
      {
        value: 'platform',
        label: 'Your platform',
        description: 'You pay fees to Stripe and set what your connected accounts pay.',
      },
      {
        value: 'connected-accounts',
        label: 'Connected accounts',
        description: 'Each connected account pays fees to Stripe. You can earn a share.',
      },
    ],
  },

  negativeBalanceLiability: {
    id: 'negativeBalanceLiability',
    label: 'Negative balance liability',
    options: [
      {
        value: 'stripe',
        label: 'Stripe',
        description: 'Stripe covers eligible unpaid negative balances from your accounts.',
      },
      {
        value: 'platform',
        label: 'Your platform',
        description: 'Your platform covers unpaid negative balances from your accounts.',
      },
    ],
  },
};

// The recommendation Stripe returns for the Sofa Stadium business.
//
// TODO(design): `dashboardAccess` is inconsistent in the file — the review frames
// (`1529:297366`, `1529:299514`) show Express, while every row-7/row-8 frame shows
// Full. Express is used here because it is what the scenario walkthroughs display.
export const RECOMMENDED = {
  onboardingMethod: 'stripe-hosted',
  dashboardAccess: 'express',
  chargeType: 'direct',
  feeCollection: 'connected-accounts',
  negativeBalanceLiability: 'stripe',
};

// Per-charge-type funds-flow illustration, ported from the Figma frames
// `2081:443139` (direct) and `2081:433661` (destination). Each diagram is three
// 80×64 nodes joined by two dashed connectors carrying a small pill label; the
// node that keeps the money (`highlight`) gets a pink→purple glow. The copy
// (heading + description) is not stored here — FundsFlowCard reads it from
// `SETTINGS.chargeType` so the collapsed row and the editing options stay in
// sync. Destination and separate charges share the same funds-flow topology
// (you are the merchant of record, so funds route through you to recipients);
// only the transfer mechanics differ, which the option copy captures.
// `summary` drives the funds-flow card on the Connected account configurations
// settings page — a plain icon + title + one-liner reflecting the chosen flow.
export const FUNDS_FLOW = {
  direct: {
    summary: {
      icon: 'business',
      title: 'Your merchants collect payments directly',
      description: 'Customers pay your merchants, and your merchants pay fees to you.',
    },
    diagram: {
      nodes: [
        { icon: 'customers', label: 'Customer' },
        { icon: 'business', label: 'Merchant' },
        { icon: 'person', label: 'You', highlight: true },
      ],
      connectors: [
        { label: 'Payment', tone: 'success' },
        { label: 'Fee', tone: 'info' },
      ],
    },
  },
  destination: {
    summary: {
      icon: 'person',
      title: 'You collect payments for your accounts',
      description: 'Customers pay you, and you route funds to your connected accounts automatically.',
    },
    diagram: {
      nodes: [
        { icon: 'customers', label: 'Customer' },
        { icon: 'person', label: 'You', highlight: true },
        { icon: 'withdrawal', label: 'Recipient' },
      ],
      connectors: [
        { label: 'Payment', tone: 'success' },
        { label: 'Transfer', tone: 'info' },
      ],
    },
  },
  separate: {
    summary: {
      icon: 'transfer',
      title: 'You collect and split payments',
      description: 'You collect payments, then transfer funds to your connected accounts on your own schedule.',
    },
    diagram: {
      nodes: [
        { icon: 'customers', label: 'Customer' },
        { icon: 'person', label: 'You', highlight: true },
        { icon: 'withdrawal', label: 'Recipient' },
      ],
      connectors: [
        { label: 'Payment', tone: 'success' },
        { label: 'Transfer', tone: 'info' },
      ],
    },
  },
};

export function labelFor(settingId, value) {
  const setting = SETTINGS[settingId];
  if (!setting) return value;
  const option = setting.options.find((candidate) => candidate.value === value);
  return option ? option.label : value;
}
