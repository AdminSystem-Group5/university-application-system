export default function AdminStatsCards({ applications = [] }) {
  const total = applications.length;

  const submitted = applications.filter(
    (app) => app.applicationStatus === "Submitted"
  ).length;

  const underReview = applications.filter(
    (app) => app.applicationStatus === "Under Review"
  ).length;

  const moreInfoRequired = applications.filter(
    (app) => app.applicationStatus === "More Info Required"
  ).length;

  const approved = applications.filter(
    (app) => app.applicationStatus === "Approved"
  ).length;

  const rejected = applications.filter(
    (app) => app.applicationStatus === "Rejected"
  ).length;

  const stats = [
    { title: "Total", value: total },
    { title: "Submitted", value: submitted },
    { title: "Under Review", value: underReview },
    { title: "More Info Required", value: moreInfoRequired },
    { title: "Approved", value: approved },
    { title: "Rejected", value: rejected },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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