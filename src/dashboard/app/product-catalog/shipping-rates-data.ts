// ─── Anthropic — Shipping Rates tab row data ─────────────────────────────────
// Shipping rates used for physical goods in Anthropic's store: developer kits,
// hardware devices, branded merchandise, and printed research artifacts.

const d = (iso: string) => new Date(iso).getTime();

export interface ShippingRateRow {
  [key: string]: unknown;
  id: string;
  description: string;
  amount: string;
  'amount-raw': number;
  currency: string;
  status: string;
  created: string;
  'created-ts': number;
}

export const SHIPPING_RATES_DATA: ShippingRateRow[] = [
  { id: 'shr_059YDD58908KAxCGHvkj4dH6', description: 'Free shipping (orders $150+)',      amount: '$0.00',     'amount-raw': 0,     currency: 'USD', status: 'Active',   created: '9/20/25, 10:20 PM',  'created-ts': d('2025-09-20') },
  { id: 'shr_0Q0pJs58908KAxCGoo22Nycv', description: 'US Standard Ground (3–5 days)',     amount: '$6.99',     'amount-raw': 6.99,  currency: 'USD', status: 'Active',   created: '11/24/24, 11:34 PM', 'created-ts': d('2024-11-24') },
  { id: 'shr_00DVkN58908KAxCG57bf9NHZ', description: 'US Priority Mail (2–3 days)',       amount: '$12.99',    'amount-raw': 12.99, currency: 'USD', status: 'Active',   created: '11/17/23, 4:55 PM',  'created-ts': d('2023-11-17') },
  { id: 'shr_0Nmy3a58908KAxCGEFCZy44a', description: 'US Overnight Express',              amount: '$34.99',    'amount-raw': 34.99, currency: 'USD', status: 'Active',   created: '9/5/23, 1:08 PM',    'created-ts': d('2023-09-05') },
  { id: 'shr_0Naje458908KAxCGDpoPmehs', description: 'Canada Standard (5–8 days)',        amount: 'CA$14.99',  'amount-raw': 14.99, currency: 'CAD', status: 'Active',   created: '8/2/23, 7:19 PM',    'created-ts': d('2023-08-02') },
  { id: 'shr_0NLBP058908KAxCGZVzXvV6Y', description: 'Canada Expedited (3–5 days)',       amount: 'CA$24.99',  'amount-raw': 24.99, currency: 'CAD', status: 'Active',   created: '6/20/23, 9:44 PM',   'created-ts': d('2023-06-20') },
  { id: 'shr_0MWh1u58908KAxCGu0MFxZmr', description: 'EU Standard (6–10 days)',           amount: '€9.99',     'amount-raw': 9.99,  currency: 'EUR', status: 'Active',   created: '2/1/23, 2:11 PM',    'created-ts': d('2023-02-01') },
  { id: 'shr_0MTv0Y58908KAxCGHdn3QZTY', description: 'EU Express (3–5 days)',             amount: '€19.99',    'amount-raw': 19.99, currency: 'EUR', status: 'Active',   created: '1/24/23, 10:30 PM',  'created-ts': d('2023-01-24') },
  { id: 'shr_0MTqv458908KAxCG07jEep7u', description: 'UK Standard (5–7 days)',            amount: '£8.99',     'amount-raw': 8.99,  currency: 'GBP', status: 'Active',   created: '1/24/23, 6:08 PM',   'created-ts': d('2023-01-24') },
  { id: 'shr_0LjopJ58908KAxCGwohejHqx', description: 'UK Express (2–3 days)',             amount: '£17.99',    'amount-raw': 17.99, currency: 'GBP', status: 'Active',   created: '9/19/22, 7:36 PM',   'created-ts': d('2022-09-19') },
  { id: 'shr_0LPnNU58908KAxCGTPeQxjxs', description: 'Japan Standard (7–10 days)',        amount: '¥1,500',    'amount-raw': 1500,  currency: 'JPY', status: 'Active',   created: '7/26/22, 2:00 PM',   'created-ts': d('2022-07-26') },
  { id: 'shr_0LPFkg58908KAxCGl7LsVoM3', description: 'Japan Express (3–5 days)',          amount: '¥2,800',    'amount-raw': 2800,  currency: 'JPY', status: 'Active',   created: '7/25/22, 2:06 AM',   'created-ts': d('2022-07-25') },
  { id: 'shr_0LKqBG58908KAxCGyqwTT5MW', description: 'Australia Standard (8–12 days)',    amount: 'A$16.99',   'amount-raw': 16.99, currency: 'AUD', status: 'Active',   created: '7/12/22, 9:59 PM',   'created-ts': d('2022-07-12') },
  { id: 'shr_0LKqA058908KAxCG0njRvqzR', description: 'India Standard (7–12 days)',        amount: '₹799',      'amount-raw': 799,   currency: 'INR', status: 'Active',   created: '7/12/22, 9:58 PM',   'created-ts': d('2022-07-12') },
  { id: 'shr_0LKq5A58908KAxCG8qaXwKDU', description: 'Singapore & SEA (6–9 days)',        amount: '$14.99',    'amount-raw': 14.99, currency: 'USD', status: 'Active',   created: '7/12/22, 9:53 PM',   'created-ts': d('2022-07-12') },
  { id: 'shr_0LE5lp58908KAxCGUgHZaMuI', description: 'International Standard (10–15 days)', amount: '$19.99', 'amount-raw': 19.99, currency: 'USD', status: 'Active',   created: '6/24/22, 7:13 AM',   'created-ts': d('2022-06-24') },
  { id: 'shr_0Kutm658908KAxCGz9NrHIAn', description: 'International Express (4–7 days)',  amount: '$44.99',    'amount-raw': 44.99, currency: 'USD', status: 'Active',   created: '5/2/22, 8:34 AM',    'created-ts': d('2022-05-02') },
  { id: 'shr_0KqkCJ58908KAxCGEe3jPUvv', description: 'Enterprise White Glove Delivery',  amount: '$0.00',     'amount-raw': 0,     currency: 'USD', status: 'Active',   created: '4/20/22, 9:32 PM',   'created-ts': d('2022-04-20') },
  { id: 'shr_0Kqk7V58908KAxCGGtkkS6gmI', description: 'Developer Kit — US (tracked)',    amount: '$9.99',     'amount-raw': 9.99,  currency: 'USD', status: 'Active',   created: '4/20/22, 9:27 PM',   'created-ts': d('2022-04-20') },
  { id: 'shr_0Kg0Lp58908KAxCGu1DoVzLn', description: 'Developer Kit — International',    amount: '$24.99',    'amount-raw': 24.99, currency: 'USD', status: 'Active',   created: '3/23/22, 7:11 AM',   'created-ts': d('2022-03-23') },
  { id: 'shr_0KYmX258908KAxCGvA3pQeNr', description: 'Conference bundle shipping',        amount: '$0.00',     'amount-raw': 0,     currency: 'USD', status: 'Archived', created: '3/10/22, 11:45 AM',  'created-ts': d('2022-03-10') },
  { id: 'shr_0KUjB958908KAxCGmT7wRkLs', description: 'Research prints — US',             amount: '$4.99',     'amount-raw': 4.99,  currency: 'USD', status: 'Archived', created: '2/15/22, 3:22 PM',   'created-ts': d('2022-02-15') },
  { id: 'shr_0KQfV358908KAxCGnJ2xYpDq', description: 'Research prints — International',  amount: '$12.99',    'amount-raw': 12.99, currency: 'USD', status: 'Archived', created: '1/28/22, 9:10 AM',   'created-ts': d('2022-01-28') },
  { id: 'shr_0KMdZ758908KAxCGpK4uEcHw', description: 'Model Spec book — US',             amount: '$5.99',     'amount-raw': 5.99,  currency: 'USD', status: 'Archived', created: '1/12/22, 6:55 PM',   'created-ts': d('2022-01-12') },
  { id: 'shr_0KHaW158908KAxCGqL5tFbGv', description: 'Model Spec book — EU',             amount: '€8.99',     'amount-raw': 8.99,  currency: 'EUR', status: 'Archived', created: '12/3/21, 4:40 PM',   'created-ts': d('2021-12-03') },
  { id: 'shr_0KDxS558908KAxCGrM6sGaFu', description: 'Merch — US Standard',              amount: '$7.99',     'amount-raw': 7.99,  currency: 'USD', status: 'Archived', created: '11/18/21, 1:30 PM',  'created-ts': d('2021-11-18') },
  { id: 'shr_0K9tP958908KAxCGsN7rHdEt', description: 'Merch — International',            amount: '$18.99',    'amount-raw': 18.99, currency: 'USD', status: 'Archived', created: '10/5/21, 8:20 AM',   'created-ts': d('2021-10-05') },
];
