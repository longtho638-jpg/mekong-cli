'use client';

interface Facet {
  name: string;
  values: { label: string; value: string; count: number }[];
}

interface Props {
  facets: Facet[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (facet: string, value: string, checked: boolean) => void;
}

export function SearchFilters({ facets, selectedFilters, onFilterChange }: Props) {
  if (!facets || facets.length === 0) return null;

  return (
    <div className="w-64 p-4 bg-white border rounded-lg h-fit sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {Object.keys(selectedFilters).length > 0 && (
            <button
                onClick={() => { /* Ideally we need a clear all handler */ }}
                className="text-xs text-blue-600 hover:text-blue-800"
            >
                Clear all
            </button>
        )}
      </div>

      {facets.map((facet) => (
        <div key={facet.name} className="mb-6 last:mb-0">
          <h4 className="font-medium text-sm mb-3 capitalize text-gray-800 border-b pb-1">
            {facet.name.replace('_', ' ')}
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {facet.values.map((value) => (
              <label key={value.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedFilters[facet.name]?.includes(value.value) || false}
                  onChange={(e) => onFilterChange(facet.name, value.value, e.target.checked)}
                />
                <span className="flex-1 truncate text-gray-700">{value.label}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 rounded-full">{value.count}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
