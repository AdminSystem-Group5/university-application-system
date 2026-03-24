const STATUSES = [
  "Submitted",
  "Under Review",
  "More Info Required",
  "Approved",
  "Rejected",
];

export default function AdminFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  courseFilter,
  setCourseFilter,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search by student name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 md:max-w-xs"
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-4 py-2"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {/* Course Filter */}
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="rounded-lg border px-4 py-2"
        >
          <option value="">All Courses</option>
          <option value="BSc Computing Science">
            BSc Computing Science
          </option>
        </select>
      </div>
    </div>
  );
}