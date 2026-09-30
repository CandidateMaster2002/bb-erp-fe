export default function LeadsDashboard() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Leads Dashboard</h1>
      <p className="text-gray-500">Overview of today's leads and upcoming follow-ups.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow border border-gray-100 dark:border-zinc-700">
          <h2 className="text-lg font-semibold">Today's Follow-ups</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow border border-gray-100 dark:border-zinc-700">
          <h2 className="text-lg font-semibold">Total Leads</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
