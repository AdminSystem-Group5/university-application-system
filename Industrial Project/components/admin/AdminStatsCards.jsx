export default function AdminStatsCards() {
  const stats = [
    { title: "Total", value: 1 },
    { title: "Submitted", value: 1 },
    { title: "Under Review", value: 0 },
    { title: "Approved", value: 0 },
    { title: "Rejected", value: 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <h3 className="text-sm font-medium text-gray-500">{item.title}</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}