// ─── Anthropic — Tax Rates tab row data ──────────────────────────────────────
// Tax rates applied to Anthropic's product catalog across US states, EU/UK VAT
// jurisdictions, and other international tax regions.

const d = (iso: string) => new Date(iso).getTime();

export interface TaxRateRow {
  [key: string]: unknown;
  id: string;
  type: string;
  region: string;
  description: string;
  rate: string;
  'rate-raw': number;
  calculation: string;
  status: string;
  created: string;
  'created-ts': number;
}

export const TAX_RATES_DATA: TaxRateRow[] = [
  // ─── United States ───────────────────────────────────────────────────────────
  { id: 'txr_0T0JX358908KAxCGRc0wd1LK', type: 'Sales tax', region: 'California, United States',      description: '',                         rate: '8.5%',    'rate-raw': 8.5,    calculation: 'Exclusive', status: 'Active',   created: 'Apr 20',        'created-ts': d('2026-04-20') },
  { id: 'txr_0T8mMv58908KAxCGLV1Hfp7N', type: 'Sales tax', region: 'New York, United States',         description: '',                         rate: '8.875%',  'rate-raw': 8.875,  calculation: 'Exclusive', status: 'Active',   created: 'Mar 8',         'created-ts': d('2026-03-08') },
  { id: 'txr_0T8mLd58908KAxCGkStv2btZ', type: 'Sales tax', region: 'Washington, United States',       description: '',                         rate: '10.1%',   'rate-raw': 10.1,   calculation: 'Inclusive', status: 'Active',   created: 'Mar 8',         'created-ts': d('2026-03-08') },
  { id: 'txr_05DUDw58908KAxCGYdFyow8B', type: 'Sales tax', region: 'Texas, United States',            description: '',                         rate: '8.25%',   'rate-raw': 8.25,   calculation: 'Exclusive', status: 'Active',   created: 'Oct 1, 2025',   'created-ts': d('2025-10-01') },
  { id: 'txr_0RuzDZ58908KAxCGS6sBqkAw', type: 'Sales tax', region: 'Massachusetts, United States',    description: '',                         rate: '6.25%',   'rate-raw': 6.25,   calculation: 'Exclusive', status: 'Active',   created: 'Aug 11, 2025',  'created-ts': d('2025-08-11') },
  { id: 'txr_0RojPz58908KAxCGxW40brd9', type: 'Sales tax', region: 'Illinois, United States',         description: '',                         rate: '10.25%',  'rate-raw': 10.25,  calculation: 'Exclusive', status: 'Active',   created: 'Jul 25, 2025',  'created-ts': d('2025-07-25') },
  { id: 'txr_0RefyP58908KAxCG2f1fN0Vi', type: 'Sales tax', region: 'Colorado, United States',         description: '',                         rate: '8.46%',   'rate-raw': 8.46,   calculation: 'Exclusive', status: 'Active',   created: 'Jun 27, 2025',  'created-ts': d('2025-06-27') },
  { id: 'txr_0RDo4J58908KAxCGw5t9clo0', type: 'Sales tax', region: 'Florida, United States',          description: '',                         rate: '7%',      'rate-raw': 7,      calculation: 'Exclusive', status: 'Active',   created: 'Apr 14, 2025',  'created-ts': d('2025-04-14') },
  { id: 'txr_0RDo3x58908KAxCGIpGhyZ2',  type: 'Sales tax', region: 'Virginia, United States',         description: '',                         rate: '6%',      'rate-raw': 6,      calculation: 'Exclusive', status: 'Active',   created: 'Apr 14, 2025',  'created-ts': d('2025-04-14') },
  { id: 'txr_0RDnze58908KAxCG70ssyMNP', type: 'Sales tax', region: 'Pennsylvania, United States',     description: '',                         rate: '6%',      'rate-raw': 6,      calculation: 'Exclusive', status: 'Active',   created: 'Apr 14, 2025',  'created-ts': d('2025-04-14') },
  { id: 'txr_0R4o1B58908KAxCG11TadrZG', type: 'Sales tax', region: 'Georgia, United States',          description: '',                         rate: '8%',      'rate-raw': 8,      calculation: 'Exclusive', status: 'Active',   created: 'Mar 20, 2025',  'created-ts': d('2025-03-20') },
  { id: 'txr_0QNcd358908KAxCGgVZ7zCJk', type: 'Sales tax', region: 'Ohio, United States',             description: '',                         rate: '7.25%',   'rate-raw': 7.25,   calculation: 'Exclusive', status: 'Active',   created: 'Nov 21, 2024',  'created-ts': d('2024-11-21') },
  // ─── European Union ──────────────────────────────────────────────────────────
  { id: 'txr_0Q0Koe58908KAxCGar0oDdyb', type: 'VAT',        region: 'Germany',                        description: '',                         rate: '19%',     'rate-raw': 19,     calculation: 'Inclusive', status: 'Active',   created: 'Sep 18, 2024',  'created-ts': d('2024-09-18') },
  { id: 'txr_0Q05ah58908KAxCGy0JAUtR0', type: 'VAT',        region: 'France',                         description: '',                         rate: '20%',     'rate-raw': 20,     calculation: 'Inclusive', status: 'Active',   created: 'Sep 17, 2024',  'created-ts': d('2024-09-17') },
  { id: 'txr_0PsZMf58908KAxCGbrWvv6ph', type: 'VAT',        region: 'Italy',                          description: '',                         rate: '22%',     'rate-raw': 22,     calculation: 'Inclusive', status: 'Active',   created: 'Aug 28, 2024',  'created-ts': d('2024-08-28') },
  { id: 'txr_0PVqyd58908KAxCGS12IHcTu', type: 'VAT',        region: 'Spain',                          description: '',                         rate: '21%',     'rate-raw': 21,     calculation: 'Inclusive', status: 'Active',   created: 'Jun 26, 2024',  'created-ts': d('2024-06-26') },
  { id: 'txr_0P0zWQ58908KAxCGYh2imRyp', type: 'VAT',        region: 'Netherlands',                    description: '',                         rate: '21%',     'rate-raw': 21,     calculation: 'Inclusive', status: 'Active',   created: 'Jun 7, 2024',   'created-ts': d('2024-06-07') },
  { id: 'txr_00MNku58908KAxCGaRanwgp0', type: 'VAT',        region: 'Ireland',                        description: '',                         rate: '23%',     'rate-raw': 23,     calculation: 'Inclusive', status: 'Active',   created: 'Dec 12, 2023',  'created-ts': d('2023-12-12') },
  { id: 'txr_0NnnzI58908KAxCGvmgkz1p2', type: 'VAT',        region: 'Sweden',                         description: '',                         rate: '25%',     'rate-raw': 25,     calculation: 'Inclusive', status: 'Active',   created: 'Sep 5, 2023',   'created-ts': d('2023-09-05') },
  { id: 'txr_0M4ecp58908KAxCGPn97r63g', type: 'VAT',        region: 'Poland',                         description: '',                         rate: '23%',     'rate-raw': 23,     calculation: 'Inclusive', status: 'Active',   created: 'Nov 16, 2022',  'created-ts': d('2022-11-16') },
  { id: 'txr_0M1bzK58908KAxCGQv8wFjYn', type: 'VAT',        region: 'Belgium',                        description: '',                         rate: '21%',     'rate-raw': 21,     calculation: 'Inclusive', status: 'Active',   created: 'Oct 3, 2022',   'created-ts': d('2022-10-03') },
  { id: 'txr_0LyaxR58908KAxCGRt5vHkWm', type: 'VAT',        region: 'Portugal',                       description: '',                         rate: '23%',     'rate-raw': 23,     calculation: 'Inclusive', status: 'Active',   created: 'Aug 19, 2022',  'created-ts': d('2022-08-19') },
  // ─── United Kingdom ──────────────────────────────────────────────────────────
  { id: 'txr_0LvwuT58908KAxCGSx2mJoXr', type: 'VAT',        region: 'United Kingdom',                 description: 'Standard rate',           rate: '20%',     'rate-raw': 20,     calculation: 'Inclusive', status: 'Active',   created: 'Jul 5, 2022',   'created-ts': d('2022-07-05') },
  { id: 'txr_0LsqbP58908KAxCGTy3nKpVs', type: 'VAT',        region: 'United Kingdom',                 description: 'Reduced rate (digital)',  rate: '5%',      'rate-raw': 5,      calculation: 'Inclusive', status: 'Archived', created: 'May 22, 2022',  'created-ts': d('2022-05-22') },
  // ─── Canada ───────────────────────────────────────────────────────────────────
  { id: 'txr_0LpnfQ58908KAxCGUz4oLqWt', type: 'GST',        region: 'Canada',                         description: 'Federal GST',              rate: '5%',      'rate-raw': 5,      calculation: 'Exclusive', status: 'Active',   created: 'Apr 10, 2022',  'created-ts': d('2022-04-10') },
  { id: 'txr_0LmkdN58908KAxCGVa5pMrXu', type: 'HST',        region: 'Ontario, Canada',                description: 'Harmonized Sales Tax',    rate: '13%',     'rate-raw': 13,     calculation: 'Exclusive', status: 'Active',   created: 'Feb 28, 2022',  'created-ts': d('2022-02-28') },
  { id: 'txr_0LjhcK58908KAxCGWb6qNsYv', type: 'HST',        region: 'Nova Scotia, Canada',            description: '',                         rate: '15%',     'rate-raw': 15,     calculation: 'Exclusive', status: 'Active',   created: 'Jan 15, 2022',  'created-ts': d('2022-01-15') },
  // ─── Asia Pacific ─────────────────────────────────────────────────────────────
  { id: 'txr_0LghbJ58908KAxCGXc7rOtZw', type: 'GST',        region: 'Australia',                      description: '',                         rate: '10%',     'rate-raw': 10,     calculation: 'Inclusive', status: 'Active',   created: 'Dec 2, 2021',   'created-ts': d('2021-12-02') },
  { id: 'txr_0LdgaH58908KAxCGYd8sUuAx', type: 'GST',        region: 'Singapore',                      description: '',                         rate: '9%',      'rate-raw': 9,      calculation: 'Exclusive', status: 'Active',   created: 'Oct 20, 2021',  'created-ts': d('2021-10-20') },
  { id: 'txr_0LahaG58908KAxCGZe9tVvBy', type: 'Consumption tax', region: 'Japan',                     description: '',                         rate: '10%',     'rate-raw': 10,     calculation: 'Inclusive', status: 'Active',   created: 'Sep 8, 2021',   'created-ts': d('2021-09-08') },
  { id: 'txr_0LXgzF58908KAxCGaf0uWwCz', type: 'GST',        region: 'India',                          description: 'SaaS / digital services',  rate: '18%',     'rate-raw': 18,     calculation: 'Exclusive', status: 'Active',   created: 'Jul 26, 2021',  'created-ts': d('2021-07-26') },
  { id: 'txr_0LUfyE58908KAxCGbg1vXxDA', type: 'VAT',        region: 'South Korea',                    description: '',                         rate: '10%',     'rate-raw': 10,     calculation: 'Inclusive', status: 'Active',   created: 'Jun 14, 2021',  'created-ts': d('2021-06-14') },
  // ─── Other ───────────────────────────────────────────────────────────────────
  { id: 'txr_0LRexD58908KAxCGch2wYyEB', type: 'VAT',        region: 'Switzerland',                    description: '',                         rate: '8.1%',    'rate-raw': 8.1,    calculation: 'Inclusive', status: 'Active',   created: 'May 3, 2021',   'created-ts': d('2021-05-03') },
  { id: 'txr_0LOdwC58908KAxCGdi3xZzFC', type: 'VAT',        region: 'Norway',                         description: '',                         rate: '25%',     'rate-raw': 25,     calculation: 'Inclusive', status: 'Active',   created: 'Mar 21, 2021',  'created-ts': d('2021-03-21') },
  { id: 'txr_0LLcvB58908KAxCGej4yAaGD', type: 'VAT',        region: 'United Arab Emirates',           description: '',                         rate: '5%',      'rate-raw': 5,      calculation: 'Exclusive', status: 'Active',   created: 'Feb 8, 2021',   'created-ts': d('2021-02-08') },
  { id: 'txr_0LIbuA58908KAxCGfk5zBbHE', type: 'Sales tax',  region: 'Brazil',                        description: 'ISS digital services',     rate: '2%',      'rate-raw': 2,      calculation: 'Exclusive', status: 'Archived', created: 'Dec 28, 2020',  'created-ts': d('2020-12-28') },
  { id: 'txr_0LFat958908KAxCGgl6aCcIF', type: 'VAT',        region: 'Mexico',                        description: '',                         rate: '16%',     'rate-raw': 16,     calculation: 'Exclusive', status: 'Archived', created: 'Nov 16, 2020',  'created-ts': d('2020-11-16') },
];
