export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-48 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="h-12 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
