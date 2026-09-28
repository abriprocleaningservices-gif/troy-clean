/**
 * Before/after slots. Wire real photo URLs from Supabase Storage
 * (before_after_photos table) — no photos are invented here.
 */
interface GalleryItem {
  beforeUrl?: string;
  afterUrl?: string;
  caption: string;
}

export function BeforeAfterGallery({ items }: { items?: GalleryItem[] }) {
  const placeholders: GalleryItem[] = items ?? [
    { caption: "Kitchen deep clean" },
    { caption: "Bathroom detail work" },
    { caption: "Move-out turnover" },
  ];

  return (
    <section className="border-t border-pine-100 py-16">
      <div className="container-site">
        <h2 className="font-display text-3xl text-pine-950">Before &amp; after</h2>
        <p className="mt-2 max-w-xl text-ink/70">Real jobs from around Troy — uploaded by our cleaning crew after every visit.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {placeholders.map((item) => (
            <figure key={item.caption} className="overflow-hidden rounded-sm border border-pine-100">
              <div className="grid aspect-square grid-cols-2">
                <div className="flex items-center justify-center bg-pine-100 text-xs text-pine-600">Before</div>
                <div className="flex items-center justify-center bg-pine-50 text-xs text-pine-600">After</div>
              </div>
              <figcaption className="p-3 text-sm text-ink/70">{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
