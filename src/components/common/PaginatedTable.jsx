import Button from './Button';

export default function PaginatedTable({
  columns = [],
  rows = [],
  loading,
  emptyTitle = 'No records found',
  emptyMessage,
  pagination,
  onPageChange,
  onRowClick,
}) {
  const { page = 1, totalPages = 1, total = 0 } = pagination || {};

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
        <p className="font-medium text-gray-700">{emptyTitle}</p>
        {emptyMessage && <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => (
              <tr
                key={row.id}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50'}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm">
          <span className="text-gray-500">{total} total · Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" className="px-3 py-1 text-xs" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
            <Button variant="secondary" className="px-3 py-1 text-xs" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
