export interface Stock {
  ticker: string;
  companyName: string;
  growthPotential: string;
  publicSentiment: string;
}

export interface Source {
  uri: string;
  title: string;
}

export interface GeminiStockResponse {
    stocks: Stock[];
    sources: Source[];
}
