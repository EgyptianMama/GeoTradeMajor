/**
 * Indian financial-news RSS sources.
 *
 * These are the publishers' own feeds, so article links are real URLs and
 * there is no key, quota, or redirect decoding involved. Add or remove
 * entries freely — the poller treats this list as the source of truth.
 */

export interface FeedSource {
  id: string;
  /** Display name shown on the news row. */
  name: string;
  url: string;
  /** Editorial credibility 0-100, rendered as the CRED badge. */
  credibility: number;
  /** Default category when the tagger cannot infer a better one. */
  category: string;
}

export const FEEDS: FeedSource[] = [
  {
    id: 'mc-markets',
    name: 'Moneycontrol Markets',
    url: 'https://www.moneycontrol.com/rss/marketreports.xml',
    credibility: 82,
    category: 'Markets',
  },
  {
    id: 'mc-business',
    name: 'Moneycontrol Business',
    url: 'https://www.moneycontrol.com/rss/business.xml',
    credibility: 82,
    category: 'Business',
  },
  {
    id: 'mc-economy',
    name: 'Moneycontrol Economy',
    url: 'https://www.moneycontrol.com/rss/economy.xml',
    credibility: 82,
    category: 'Economy',
  },
  {
    id: 'et-markets',
    name: 'ET Markets',
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    credibility: 86,
    category: 'Markets',
  },
  {
    id: 'et-economy',
    name: 'ET Economy',
    url: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms',
    credibility: 86,
    category: 'Economy',
  },
  {
    id: 'mint-markets',
    name: 'Mint Markets',
    url: 'https://www.livemint.com/rss/markets',
    credibility: 88,
    category: 'Markets',
  },
  {
    id: 'mint-companies',
    name: 'Mint Companies',
    url: 'https://www.livemint.com/rss/companies',
    credibility: 88,
    category: 'Corporate',
  },
  {
    id: 'bs-markets',
    name: 'Business Standard Markets',
    url: 'https://www.business-standard.com/rss/markets-106.rss',
    credibility: 87,
    category: 'Markets',
  },
  {
    id: 'bs-economy',
    name: 'Business Standard Economy',
    url: 'https://www.business-standard.com/rss/economy-102.rss',
    credibility: 87,
    category: 'Economy',
  },
  {
    id: 'bl-markets',
    name: 'Hindu BusinessLine',
    url: 'https://www.thehindubusinessline.com/markets/feeder/default.rss',
    credibility: 85,
    category: 'Markets',
  },
  {
    id: 'ndtv-profit',
    name: 'NDTV Profit',
    url: 'https://www.ndtvprofit.com/stories.rss',
    credibility: 84,
    category: 'Markets',
  },
  {
    id: 'fe-markets',
    name: 'Financial Express Markets',
    url: 'https://www.financialexpress.com/market/feed/',
    credibility: 80,
    category: 'Markets',
  },
];
