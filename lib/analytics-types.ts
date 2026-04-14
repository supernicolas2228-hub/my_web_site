/** Только для UI/клиента — не импортировать сюда Node/SQLite. */
export type AnalyticsSummary = {
  totals: {
    visits: number;
    uniqueVisitors: number;
    withCart: number;
    contactsInDb: number;
    last24h: number;
    last7d: number;
    last30d: number;
  };
  byPeriod: {
    day: { label: string; count: number }[];
    hour: { label: string; count: number }[];
    week: { label: string; count: number }[];
    month: { label: string; count: number }[];
    year: { label: string; count: number }[];
  };
  depth: { key: string; label: string; count: number }[];
  cartLines: { title: string; count: number }[];
};
