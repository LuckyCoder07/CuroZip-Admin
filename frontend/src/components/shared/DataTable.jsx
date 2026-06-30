import React, { useState } from 'react';
import { Search, ArrowUp, ArrowDown, FileQuestion, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';

const DataTable = ({
  columns, data, loading, onRowClick,
  searchable, actions, checkboxes,
  emptyIcon, emptyTitle, emptyDescription, emptyActionLabel, emptyOnAction,
  csvFilename,
}) => {
  const [searchTerm, setSearchTerm]   = useState('');
  const [sortConfig, setSortConfig]   = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]         = useState(10);

  // ── Sorting ─────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const av = a[sortConfig.key]; const bv = b[sortConfig.key];
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return sortedData;
    return sortedData.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages    = Math.ceil(filteredData.length / perPage);
  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const showingFrom   = filteredData.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const showingTo     = Math.min(currentPage * perPage, filteredData.length);

  // Reset page when filter changes
  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, perPage]);

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = columns.map(c => c.label).join(',');
    const rows = filteredData.map(row =>
      columns.map(c => {
        const val = row[c.key];
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${csvFilename || 'export'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Page numbers (smart with ellipsis) ────────────────────────────────────
  const pageNumbers = React.useMemo(() => {
    if (totalPages <= 7) return [...Array(totalPages)].map((_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }, [currentPage, totalPages]);

  return (
    <div className="bg-cz-card-bg rounded-xl border border-cz-border overflow-hidden flex flex-col">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      {(searchable || actions) && (
        <div className="p-3 sm:p-4 border-b border-cz-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex-1 w-full sm:w-auto">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cz-text-secondary" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-cz-dark-bg text-cz-text-primary border border-cz-border rounded-lg pl-9 pr-4 py-2 text-sm focus:border-cz-accent-orange focus:ring-1 focus:ring-cz-accent-orange outline-none transition-all"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {csvFilename && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 text-xs px-3 py-2 border border-cz-border text-cz-text-secondary hover:text-white hover:border-white rounded-lg transition-colors"
                title="Export CSV"
              >
                <Download size={14} /> <span className="hidden sm:inline">Export</span>
              </button>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-cz-nav-bg border-b border-cz-border text-cz-text-secondary text-xs uppercase tracking-wide">
              {checkboxes && (
                <th className="p-3 sm:p-4 w-10 text-center">
                  <input type="checkbox" className="accent-cz-accent-orange rounded" />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`p-3 sm:p-4 font-semibold whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-white' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-cz-border animate-pulse">
                  {checkboxes && <td className="p-4"><div className="w-4 h-4 bg-cz-border rounded" /></td>}
                  {columns.map((_, j) => (
                    <td key={j} className="p-3 sm:p-4">
                      <div className="h-4 bg-cz-border rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (checkboxes ? 1 : 0)}>
                  <EmptyState
                    icon={emptyIcon || FileQuestion}
                    title={emptyTitle || "No data found"}
                    description={emptyDescription || (searchTerm ? "Try adjusting your search." : "No data available.")}
                    actionLabel={emptyActionLabel}
                    onAction={emptyOnAction}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr
                  key={row._id || row.id || i}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-cz-border hover:bg-cz-accent-orange/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${i % 2 === 0 ? 'bg-cz-card-bg' : 'bg-cz-dark-bg/50'}`}
                >
                  {checkboxes && (
                    <td className="p-3 sm:p-4 w-10 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="accent-cz-accent-orange rounded" />
                    </td>
                  )}
                  {columns.map((col, j) => (
                    <td key={j} className="p-3 sm:p-4 text-cz-text-primary text-sm">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer: Pagination + Per-page ───────────────────────────────────── */}
      {!loading && filteredData.length > 0 && (
        <div className="p-3 sm:p-4 border-t border-cz-border flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-cz-text-secondary bg-cz-card-bg">
          {/* Left: entry count + per-page */}
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap">
              {showingFrom}–{showingTo} of {filteredData.length}
            </span>
            <select
              value={perPage}
              onChange={e => setPerPage(Number(e.target.value))}
              className="bg-cz-dark-bg border border-cz-border rounded-lg px-2 py-1 text-xs text-cz-text-primary outline-none focus:border-cz-accent-orange"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>Show {n}</option>
              ))}
            </select>
          </div>

          {/* Right: page buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-cz-border disabled:opacity-30 hover:bg-cz-nav-bg transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers.map((p, i) => (
                <button
                  key={i}
                  onClick={() => typeof p === 'number' && setCurrentPage(p)}
                  disabled={p === '...'}
                  className={`min-w-[32px] h-8 px-2 rounded flex items-center justify-center border text-xs transition-colors
                    ${p === currentPage
                      ? 'bg-cz-accent-orange border-cz-accent-orange text-white font-bold'
                      : p === '...'
                      ? 'border-transparent cursor-default'
                      : 'border-cz-border hover:bg-cz-nav-bg'
                    }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-cz-border disabled:opacity-30 hover:bg-cz-nav-bg transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
