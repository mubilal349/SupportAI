const Stats = () => {
  const stats = [
    {
      value: "24/7",
      label: "AI availability",
    },
    {
      value: "<1s",
      label: "Typical AI response",
    },
    {
      value: "80%",
      label: "Requests automated",
    },
    {
      value: "100%",
      label: "Human escalation",
    },
  ];

  return (
    <section className="border-y border-white/10 bg-slate-900/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 px-6 py-12 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border-white/10 px-6 py-5 text-center first:border-l-0 lg:border-l"
          >
            <p className="text-3xl font-bold text-white">{stat.value}</p>

            <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
