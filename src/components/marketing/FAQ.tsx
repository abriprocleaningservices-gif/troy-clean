interface FAQItem {
  question: string;
  answer: string;
}

export function FAQ({ items, title = "Frequently asked questions" }: { items: FAQItem[]; title?: string }) {
  return (
    <section className="border-t border-pine-100 py-16">
      <div className="container-site max-w-3xl">
        <h2 className="font-display text-3xl text-pine-950">{title}</h2>
        <dl className="mt-8 divide-y divide-pine-100">
          {items.map((item) => (
            <div key={item.question} className="py-5">
              <dt className="font-medium text-pine-900">{item.question}</dt>
              <dd className="mt-2 text-sm text-ink/70">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
