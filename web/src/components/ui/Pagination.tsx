import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // Janela de páginas visíveis: max 5, centrada na página atual
  function pageNumbers(): number[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half = 2;
    let lo = Math.max(1, currentPage - half);
    let hi = lo + 4;
    if (hi > totalPages) { hi = totalPages; lo = Math.max(1, hi - 4); }
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-3">
      <p className="text-sm text-zinc-500">
        Exibindo <span className="font-medium text-zinc-700">{totalItems === 0 ? 0 : start}–{end}</span> de{" "}
        <span className="font-medium text-zinc-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 disabled:opacity-40 hover:bg-zinc-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageNumbers().map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-sm",
              page === currentPage
                ? "bg-sky-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            )}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 disabled:opacity-40 hover:bg-zinc-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
