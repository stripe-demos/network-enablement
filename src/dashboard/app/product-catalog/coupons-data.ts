export interface CouponRow {
  [key: string]: unknown;
  id: string;
  coupon: string;
  terms: string;
  redemptions: string;
  expires: string;
  /** Backing field for the Duration single-select filter */
  duration: string;
  /** Backing field for the Percent off value filter */
  'percent-off-raw': number | null;
  /** Backing field for the Maximum redemptions value filter */
  'max-redemptions-raw': number | null;
  /** Coupon lifecycle for the Status column */
  status: 'Active' | 'Expired';
}

// Anthropic promotional and partner discount coupons.
export const COUPONS_DATA: CouponRow[] = [
  { id: 'cpn_01', coupon: 'DEVELOPER_TRIAL',       terms: '100% off for 3 months',  redemptions: '1,204', expires: 'Dec 31, 2025', duration: 'Repeating', 'percent-off-raw': 100, 'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_02', coupon: 'CLAUDE_PRO_LAUNCH',     terms: '50% off once',           redemptions: '8,471', expires: '—',            duration: 'Once',      'percent-off-raw': 50,  'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_03', coupon: 'ACADEMIC50',             terms: '50% off forever',        redemptions: '392',   expires: '—',            duration: 'Forever',   'percent-off-raw': 50,  'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_04', coupon: 'STARTUP_CREDITS',       terms: '$500.00 off once',       redemptions: '67',    expires: '—',            duration: 'Once',      'percent-off-raw': null,'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_05', coupon: 'PARTNER20',             terms: '20% off forever',        redemptions: '143',   expires: '—',            duration: 'Forever',   'percent-off-raw': 20,  'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_06', coupon: 'ANTHROPIC_TEAM',        terms: '30% off once',           redemptions: '0/500', expires: 'Jun 30, 2026', duration: 'Once',      'percent-off-raw': 30,  'max-redemptions-raw': 500,    status: 'Active' },
  { id: 'cpn_07', coupon: 'BUILD2025',             terms: '20% off once',           redemptions: '2,189', expires: 'Mar 31, 2026', duration: 'Once',      'percent-off-raw': 20,  'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_08', coupon: 'RESEARCH30',            terms: '30% off forever',        redemptions: '58',    expires: '—',            duration: 'Forever',   'percent-off-raw': 30,  'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_09', coupon: 'EARLYACCESS25',         terms: '25% off for 6 months',   redemptions: '4,832', expires: '—',            duration: 'Repeating', 'percent-off-raw': 25,  'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_10', coupon: 'ENTERPRISE_PILOT',      terms: '100% off for 1 month',   redemptions: '12/50', expires: 'Dec 31, 2026', duration: 'Repeating', 'percent-off-raw': 100, 'max-redemptions-raw': 50,     status: 'Active' },
  { id: 'cpn_11', coupon: 'ANNUAL_UPGRADE',        terms: '2 months free once',     redemptions: '3,017', expires: '—',            duration: 'Once',      'percent-off-raw': null,'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_12', coupon: 'NONPROFT40',            terms: '40% off forever',        redemptions: '29',    expires: '—',            duration: 'Forever',   'percent-off-raw': 40,  'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_13', coupon: 'API_LAUNCH_CREDIT',     terms: '$100.00 off once',       redemptions: '612',   expires: 'Jan 31, 2024', duration: 'Once',      'percent-off-raw': null,'max-redemptions-raw': null,   status: 'Expired' },
  { id: 'cpn_14', coupon: 'CLAUDE3_INTRO',         terms: '15% off for 3 months',   redemptions: '9,340', expires: '—',            duration: 'Repeating', 'percent-off-raw': 15,  'max-redemptions-raw': null,   status: 'Active' },
  { id: 'cpn_15', coupon: 'DEVDAY2024',            terms: '20% off once',           redemptions: '1,088', expires: 'Dec 31, 2024', duration: 'Once',      'percent-off-raw': 20,  'max-redemptions-raw': null,   status: 'Expired' },
  { id: 'cpn_16', coupon: 'HACKATHON_SPONSOR',     terms: '$250.00 off once',       redemptions: '48/100', expires: '—',            duration: 'Once',      'percent-off-raw': null, 'max-redemptions-raw': 100,   status: 'Active' },
  { id: 'cpn_17', coupon: 'RETENTION_OFFER',       terms: '50% off for 2 months',   redemptions: '730',   expires: '—',            duration: 'Repeating', 'percent-off-raw': 50,  'max-redemptions-raw': null,   status: 'Active' },
];
