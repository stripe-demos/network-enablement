/**
 * Country metadata. Bank field labels live ONLY here — the original needed a
 * dedicated bug-fix commit ("Fix routing label for UK recipients to show Sort
 * code") precisely because they were inlined at the point of use.
 */
export const COUNTRIES = [
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    fields: [
      { key: 'routing', label: 'Routing number', placeholder: '110000000' },
      { key: 'account', label: 'Account number', placeholder: '000123456789' },
      {
        key: 'swift',
        label: 'SWIFT code',
        placeholder: 'BOFAUS3NXXX',
        optional: true,
      },
      {
        key: 'wire',
        label: 'Wire routing number',
        placeholder: '026009593',
        optional: true,
      },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    fields: [
      { key: 'routing', label: 'Sort code', placeholder: '10-88-00' },
      { key: 'account', label: 'Account number', placeholder: '00012345' },
      {
        key: 'swift',
        label: 'SWIFT code',
        placeholder: 'MONZGB2L',
        optional: true,
      },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    fields: [
      {
        key: 'account',
        label: 'IBAN',
        placeholder: 'FR14 2004 1010 0505 0001 3M02 606',
      },
      { key: 'swift', label: 'BIC', placeholder: 'BNPAFRPP', optional: true },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    fields: [
      {
        key: 'account',
        label: 'IBAN',
        placeholder: 'DE89 3704 0044 0532 0130 00',
      },
      { key: 'swift', label: 'BIC', placeholder: 'DEUTDEFF', optional: true },
    ],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    currency: 'CHF',
    fields: [
      {
        key: 'account',
        label: 'IBAN',
        placeholder: 'CH93 0076 2011 6238 5295 7',
      },
      {
        key: 'swift',
        label: 'BIC',
        placeholder: 'UBSWCHZH80A',
        optional: true,
      },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    currency: 'JPY',
    fields: [
      {
        key: 'routing',
        label: 'Bank and branch code',
        placeholder: '0001-001',
      },
      { key: 'account', label: 'Account number', placeholder: '1234567' },
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    currency: 'BRL',
    fields: [
      { key: 'routing', label: 'Branch code', placeholder: '0001' },
      { key: 'account', label: 'Account number', placeholder: '1234567-8' },
    ],
  },
  {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    fields: [
      { key: 'routing', label: 'IFSC code', placeholder: 'HDFC0000123' },
      { key: 'account', label: 'Account number', placeholder: '00012345678' },
    ],
  },
];

export function country(code) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** Fields the recipient must supply for a given country and method. */
export function bankFieldsFor(code, method = 'bank') {
  const c = country(code);
  if (method === 'card') {
    return [
      {
        key: 'account',
        label: 'Card number',
        placeholder: '4242 4242 4242 4242',
      },
      {
        key: 'routing',
        label: 'Expiration date',
        placeholder: 'MM / YY',
        autofill: '04 / 29',
      },
    ];
  }
  if (method === 'wallet') {
    // Token and Network are drawn by the step itself (one is read-only, the other
    // a picker); this is the only free-text field, and `network` is required too.
    return [
      { key: 'network', label: 'Network', hidden: true },
      {
        key: 'account',
        label: 'Wallet address',
        placeholder: 'Paste address here',
        // The zero address: well-known, unspendable, and unmistakably not
        // somebody's wallet. The previous placeholder was a plausible random
        // address, which is indistinguishable from a real one.
        autofill: '0x0000000000000000000000000000000000000000',
      },
    ];
  }
  return c.fields;
}
