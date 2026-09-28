/**
 * Displays only reviews passed in via props (sourced from the `reviews` table
 * where is_published = true). No placeholder reviews are fabricated — if
 * `reviews` is empty, the section renders nothing.
 */
interface Review {
  id: string;
  rating: number;
  comment: string | null;
  customerName?: string;
}

export function Testimonials({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  return (
    <section className="border-t border-pine-100 bg-pine-50 py-16">
      <div className="container-site">
        <h2 className="font-display text-3xl text-pine-950">What customers say</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <blockquote key={r.id} className="rounded-sm border border-pine-100 bg-white p-6">
              <p className="text-sm text-clay-600" aria-label={`${r.rating} out of 5 stars`}>
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </p>
              {r.comment && <p className="mt-3 text-ink/80">{r.comment}</p>}
              {r.customerName && <cite className="mt-3 block text-sm font-medium not-italic text-ink/60">{r.customerName}</cite>}
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
