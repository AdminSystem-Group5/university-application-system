export default function AdminFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  courseFilter,
  setCourseFilter,
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <input
        type="text"
        placeholder="Search by student name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 md:w-80"
      />

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg border px-4 py-2"
      >
        <option value="">All Statuses</option>
        <option value="Submitted">Submitted</option>
        <option value="Under Review">Under Review</option>
        <option value="More Info Required">More Info Required</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      </select>

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
  );
}