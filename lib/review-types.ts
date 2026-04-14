/** Сколько карточек в карусели; при большем числе файлов — случайный поднабор при каждом запросе страницы. */
export const REVIEWS_CAROUSEL_MAX = 3;

export type ReviewRecord = {
  id: string;
  author: string;
  body: string;
};
