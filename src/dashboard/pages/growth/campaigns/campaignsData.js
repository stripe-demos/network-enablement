// Simulated Growth campaigns, newest first. Dates are this year, so they omit
// it. Only live or finished campaigns have adoption, volume and margin.

export const CAMPAIGN_STATUSES = ['Draft', 'Scheduled', 'Active', 'Completed']
export const PRODUCT_TYPES = ['Instant Payouts', 'Payments']

export const CAMPAIGN_STATUS_TONES = {
  Draft: 'default',
  Scheduled: 'info',
  Active: 'success',
  Completed: 'success',
}

export const CAMPAIGNS_PAGE_SIZE = 20

const campaign = (id, name, status, productType, start, end, timezone, results = {}) => ({
  id, name, status, productType, start, end, timezone, ...results,
})

export const CAMPAIGNS = [
  campaign('cmp_holiday_ip', 'Holiday payouts boost', 'Scheduled', 'Instant Payouts', 'Nov 2, 9:00 AM', 'Nov 30, 11:30 PM', 'PT', { adopted: '0/48' }),
  campaign('cmp_fall_ip', 'Fall Instant Payouts promo', 'Active', 'Instant Payouts', 'Oct 1, 9:00 AM', 'Oct 31, 11:30 PM', 'CT', { adopted: '18/42', volume: '$1,284,310', margin: '$9,620' }),
  campaign('cmp_card_rate', 'New seller card rate offer', 'Active', 'Payments', 'Oct 6, 8:00 AM', 'Nov 6, 11:30 PM', 'ET', { adopted: '7/25', volume: '$412,860', margin: '$3,140' }),
  campaign('cmp_ip_launch', 'Instant Payouts launch promo', 'Draft', 'Instant Payouts', 'Sep 18, 6:00 PM', 'Sep 25, 11:30 PM', 'CT'),
  campaign('cmp_ip_fee_waiver', 'Instant Payouts fee waiver', 'Draft', 'Instant Payouts', 'Sep 17, 2:00 PM', 'Sep 24, 11:30 PM', 'CT'),
  campaign('cmp_ip_marketplace', 'Marketplace payouts promo', 'Draft', 'Instant Payouts', 'Sep 22, 9:00 PM', 'Sep 30, 11:30 PM', 'CT'),
  campaign('cmp_pay_starter', 'Starter pricing offer', 'Draft', 'Payments', 'Sep 15, 8:00 PM', 'Sep 22, 11:30 PM', 'CT'),
  campaign('cmp_ip_weekend', 'Weekend Instant Payouts', 'Draft', 'Instant Payouts', 'Sep 15, 8:00 PM', 'Sep 22, 11:30 PM', 'CT'),
  campaign('cmp_ip_winback', 'Instant Payouts win-back', 'Draft', 'Instant Payouts', 'Sep 15, 8:00 PM', 'Sep 22, 11:30 PM', 'CT'),
  campaign('cmp_ip_high_volume', 'High-volume seller payouts', 'Draft', 'Instant Payouts', 'Sep 15, 6:00 PM', 'Sep 22, 11:30 PM', 'PT'),
  campaign('cmp_ip_cpa', 'Instant Payouts CPA pilot', 'Draft', 'Instant Payouts', 'Sep 17, 6:00 PM', 'Sep 22, 11:30 PM', 'PT'),
  campaign('cmp_cad_cohort', 'CAD cohort', 'Completed', 'Payments', 'Sep 15, 6:00 PM', 'Sep 22, 11:30 PM', 'PT', { adopted: '0/2' }),
  campaign('cmp_cad_upload', 'CAD account upload', 'Draft', 'Payments', 'Sep 15, 6:00 PM', 'Sep 22, 11:30 PM', 'PT'),
  campaign('cmp_ip_early_access', 'Early access payouts', 'Draft', 'Instant Payouts', 'Sep 15, 8:00 PM', 'Sep 22, 11:30 PM', 'CT'),
  campaign('cmp_cpa_upload', 'CPA account upload', 'Draft', 'Payments', 'Sep 17, 5:00 PM', 'Sep 22, 11:30 PM', 'PT'),
  campaign('cmp_pay_flash', 'Payments flash offer', 'Draft', 'Payments', 'Sep 15, 5:00 PM', 'Sep 16, 11:30 PM', 'PT'),
  campaign('cmp_ip_sellers', 'Seller payouts campaign', 'Draft', 'Instant Payouts', 'Sep 15, 6:00 PM', 'Sep 16, 11:30 PM', 'PT'),
  campaign('cmp_pay_east', 'East Coast payments promo', 'Draft', 'Payments', 'Sep 15, 5:00 PM', 'Sep 22, 11:30 PM', 'ET'),
  campaign('cmp_pay_cpa', 'Payments CPA offer', 'Draft', 'Payments', 'Sep 24, 7:00 PM', 'Sep 29, 11:30 PM', 'PT'),
  campaign('cmp_pay_back_to_school', 'Back-to-school payments', 'Draft', 'Payments', 'Sep 9, 8:00 PM', 'Sep 16, 11:30 PM', 'PT'),
  campaign('cmp_klarna', 'Klarna pricing campaign', 'Completed', 'Payments', 'Aug 21, 5:00 PM', 'Aug 28, 11:30 PM', 'PT', { adopted: '0/2' }),
  campaign('cmp_pay_summer', 'Summer payments promo', 'Draft', 'Payments', 'Jul 24, 4:00 PM', 'Jul 31, 11:30 PM', 'PT'),
]
