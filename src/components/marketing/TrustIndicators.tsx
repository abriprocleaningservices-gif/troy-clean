interface TrustIndicatorsProps {
  items?: string[];
}

const DEFAULT_ITEMS = [
  "Locally operated in Troy, MI",
  "Eco-conscious cleaning products",
  "Consistent checklist on every visit",
  "Online booking with upfront pricing",
];

export function TrustIndicators({ items = DEFAULT_ITEMS }: TrustIndicatorsProps) {
  return (
    <section className="border-b border-pine-100 py-10">
      <div className="container-site grid grid-cols-2 gap-6 md:grid-cols-4">
        {items.map((item) => (
          <p key={item} className="text-center text-sm font-medium text-pine-800 md:text-left">
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}
