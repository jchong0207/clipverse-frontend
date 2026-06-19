// Supported deposit fiat currencies. rate = value of 1 unit in USDT (≈ USD).
// cc = circular-flag asset code in /public/assets/flags/<cc>.svg
export const FIAT = [
  { code: 'USD', cc: 'us', rate: 1 },
  { code: 'EUR', cc: 'eu', rate: 1.08 },
  { code: 'GBP', cc: 'gb', rate: 1.27 },
  { code: 'AUD', cc: 'au', rate: 0.66 },
  { code: 'CAD', cc: 'ca', rate: 0.73 },
  { code: 'SGD', cc: 'sg', rate: 0.74 },
  { code: 'NZD', cc: 'nz', rate: 0.61 },
  { code: 'HKD', cc: 'hk', rate: 0.128 },
  { code: 'JPY', cc: 'jp', rate: 0.0064 },
  { code: 'KRW', cc: 'kr', rate: 0.00073 },
  { code: 'THB', cc: 'th', rate: 0.028 },
  { code: 'MYR', cc: 'my', rate: 0.21 },
  { code: 'PHP', cc: 'ph', rate: 0.017 },
  { code: 'TWD', cc: 'tw', rate: 0.031 },
  { code: 'IDR', cc: 'id', rate: 0.000062 },
  { code: 'VND', cc: 'vn', rate: 0.000039 },
]

export const flagSrc = (cc) => `/assets/flags/${cc}.svg`
