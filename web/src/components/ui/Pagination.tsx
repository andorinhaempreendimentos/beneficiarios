import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage }: PaginationProps) {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-3">
      <p className="text-sm text-zinc-500">
        Exibindo <span className="font-medium text-zinc-700">{start}-{end}</span> de{" "}
        <span className="font-medium text-zinc-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 disabled:opacity-40 hover:bg-zinc-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .slice(0, 5)
          .map((page) => (
            <button
              key={page}
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
          disabled={currentPage >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 disabled:opacity-40 hover:bg-zinc-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
