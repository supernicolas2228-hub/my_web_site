import type { ReviewRecord } from "@/lib/review-types";
import { REVIEWS_CAROUSEL_MAX } from "@/lib/review-types";
import reviewsJson from "@/data/reviews.json";

export type { ReviewRecord } from "@/lib/review-types";
export { REVIEWS_CAROUSEL_MAX } from "@/lib/review-types";

function getAllReviews(): ReviewRecord[] {
  const raw = reviewsJson as ReviewRecord[];
  return raw.filter((r) => r.body && r.body.length > 0);
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** Отзывы из data/reviews.json (генерируется скриптом sync-reviews перед сборкой). */
export function getReviewsForHome(): { total: number; carousel: ReviewRecord[] } {
  const all = getAllReviews();
  const total = all.length;

  if (total === 0) {
    return { total: 0, carousel: [] };
  }

  if (total <= REVIEWS_CAROUSEL_MAX) {
    return { total, carousel: all };
  }

  const pool = [...all];
  shuffleInPlace(pool);
  return { total, carousel: pool.slice(0, REVIEWS_CAROUSEL_MAX) };
}
