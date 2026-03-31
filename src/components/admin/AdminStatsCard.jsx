"use client";

const STATUSES = [
  "Submitted",
  "Under Review",
  "More Info Required",
  "Approved",
  "Rejected",
];

export default function AdminStatsCards({ applications = [] }) {
  const counts = {
    Total: applications.length,
  };

  // ✅ single loop instead of multiple filters
  applications.forEach((app) => {
    const status = app.applicationStatus;

    if (STATUSES.includes(status)) {
      counts[status] = (counts[status] || 0) + 1;
    }
  });

  const stats = [
    { title: "Total", value: counts.Total || 0 },
    ...STATUSES.map((status) => ({
      title: status,
      value: counts[status] || 0,
    })),
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <h3 className="text-sm font-medium text-gray-500">
            {item.title}
          </h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}