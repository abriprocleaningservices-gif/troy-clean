const CITIES = ["Troy", "Royal Oak", "Birmingham", "Rochester Hills", "Sterling Heights", "Warren", "Clawson", "Madison Heights"];

export function ServiceAreaSection() {
  return (
    <section className="border-t border-pine-100 py-16">
      <div className="container-site">
        <h2 className="font-display text-3xl text-pine-950">Where we clean</h2>
        <p className="mt-2 max-w-xl text-ink/70">Based in Troy, MI and serving the surrounding Metro Detroit communities.</p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {CITIES.map((city) => (
            <li key={city} className="rounded-full border border-pine-200 px-4 py-1.5 text-sm text-pine-800">
              {city}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
