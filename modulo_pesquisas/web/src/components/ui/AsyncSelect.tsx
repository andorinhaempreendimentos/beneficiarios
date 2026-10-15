"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AsyncSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface AsyncSelectProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string, option?: AsyncSelectOption) => void;
  onSearch: (term: string) => Promise<AsyncSelectOption[]>;
  initialOptions?: AsyncSelectOption[];
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

export function AsyncSelect({
  placeholder = "Pesquisar...",
  value,
  onChange,
  onSearch,
  initialOptions = [],
  debounceMs = 300,
  className,
  disabled = false,
}: AsyncSelectProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [options, setOptions] = useState<AsyncSelectOption[]>(initialOptions);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AsyncSelectOption | null>(
    value ? initialOptions.find((o) => o.value === value) ?? null : null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Buscar quando o termo muda
  const doSearch = useCallback(
    (searchTerm: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await onSearch(searchTerm);
          setOptions(results);
        } catch {
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTerm(val);
    setOpen(true);
    if (val.length >= 2) {
      doSearch(val);
    } else if (val.length === 0) {
      setOptions(initialOptions);
    }
  }

  function handleSelect(opt: AsyncSelectOption) {
    setSelected(opt);
    setTerm("");
    setOpen(false);
    onChange(opt.value, opt);
  }

  function handleClear() {
    setSelected(null);
    setTerm("");
    setOptions(initialOptions);
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900">
          <div className="flex flex-col">
            <span className="font-medium">{selected.label}</span>
            {selected.sublabel && (
              <span className="text-[10px] text-zinc-500">{selected.sublabel}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="ml-2 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={handleInputChange}
            onFocus={() => { setOpen(true); if (term.length === 0) setOptions(initialOptions); }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:opacity-50"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />
          )}
        </div>
      )}

      {open && !selected && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 && !loading && (
            <div className="px-3 py-3 text-xs text-zinc-400 text-center">
              {term.length < 2 ? "Digite pelo menos 2 caracteres..." : "Nenhum resultado encontrado."}
            </div>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-sky-50 transition-colors cursor-pointer flex flex-col border-b border-zinc-50 last:border-0"
            >
              <span className="font-medium text-zinc-900">{opt.label}</span>
              {opt.sublabel && (
                <span className="text-[10px] text-zinc-500">{opt.sublabel}</span>
              )}
            </button>
          ))}
          {loading && (
            <div className="px-3 py-3 text-xs text-zinc-400 text-center flex items-center justify-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
