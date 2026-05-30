import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export default function Pagination({ currentPage, totalPages, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const getVisiblePages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50 text-sm">
      <div className="flex items-center gap-3 text-slate-400">
        <span>{startItem}-{endItem} / {total}</span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size} 条/页</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400"
        >
          <ChevronLeft size={14} />
        </button>
        {getVisiblePages().map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-slate-500">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[32px] h-8 rounded text-xs font-medium transition-colors ${
                currentPage === page
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'hover:bg-slate-700/50 text-slate-400'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
