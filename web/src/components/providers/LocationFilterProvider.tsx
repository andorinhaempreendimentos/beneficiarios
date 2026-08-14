"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

interface LocationFilterContextValue {
  estado: string; // "Todos" ou UF (ex: "TO")
  cidade: string; // "Todas" ou nome da cidade (ex: "Palmas")
  organizacaoId: string; // "Todas" ou ID da organização
  nucleoId: string; // "Todos" ou ID do núcleo
  setEstado: (uf: string) => void;
  setCidade: (cidade: string) => void;
  setOrganizacaoId: (id: string) => void;
  setNucleoId: (id: string) => void;
  limparFiltros: () => void;
}

const STORAGE_ESTADO_KEY = "andorinha_filtro_estado";
const STORAGE_CIDADE_KEY = "andorinha_filtro_cidade";
const STORAGE_ORGANIZACAO_KEY = "andorinha_filtro_organizacao";
const STORAGE_NUCLEO_KEY = "andorinha_filtro_nucleo";

const LocationFilterContext = createContext<LocationFilterContextValue>({
  estado: "Todos",
  cidade: "Todas",
  organizacaoId: "Todas",
  nucleoId: "Todos",
  setEstado: () => {},
  setCidade: () => {},
  setOrganizacaoId: () => {},
  setNucleoId: () => {},
  limparFiltros: () => {},
});

export function LocationFilterProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstadoState] = useState<string>("Todos");
  const [cidade, setCidadeState] = useState<string>("Todas");
  const [organizacaoId, setOrganizacaoIdState] = useState<string>("Todas");
  const [nucleoId, setNucleoIdState] = useState<string>("Todos");

  useEffect(() => {
    try {
      const savedEstado = localStorage.getItem(STORAGE_ESTADO_KEY);
      const savedCidade = localStorage.getItem(STORAGE_CIDADE_KEY);
      const savedOrg = localStorage.getItem(STORAGE_ORGANIZACAO_KEY);
      const savedNucleo = localStorage.getItem(STORAGE_NUCLEO_KEY);

      if (savedEstado) setEstadoState(savedEstado);
      if (savedCidade) setCidadeState(savedCidade);
      if (savedOrg) setOrganizacaoIdState(savedOrg);
      if (savedNucleo) setNucleoIdState(savedNucleo);
    } catch {
      // fallback silencioso
    }
  }, []);

  // Setter encadeado de Estado: reseta cidade, organizacaoId e nucleoId
  const setEstado = useCallback((uf: string) => {
    setEstadoState(uf);
    setCidadeState("Todas");
    setOrganizacaoIdState("Todas");
    setNucleoIdState("Todos");
    try {
      localStorage.setItem(STORAGE_ESTADO_KEY, uf);
      localStorage.setItem(STORAGE_CIDADE_KEY, "Todas");
      localStorage.setItem(STORAGE_ORGANIZACAO_KEY, "Todas");
      localStorage.setItem(STORAGE_NUCLEO_KEY, "Todos");
    } catch {
      // fallback
    }
  }, []);

  // Setter encadeado de Cidade: reseta organizacaoId e nucleoId
  const setCidade = useCallback((c: string) => {
    setCidadeState(c);
    setOrganizacaoIdState("Todas");
    setNucleoIdState("Todos");
    try {
      localStorage.setItem(STORAGE_CIDADE_KEY, c);
      localStorage.setItem(STORAGE_ORGANIZACAO_KEY, "Todas");
      localStorage.setItem(STORAGE_NUCLEO_KEY, "Todos");
    } catch {
      // fallback
    }
  }, []);

  // Setter encadeado de Organização: reseta nucleoId
  const setOrganizacaoId = useCallback((id: string) => {
    setOrganizacaoIdState(id);
    setNucleoIdState("Todos");
    try {
      localStorage.setItem(STORAGE_ORGANIZACAO_KEY, id);
      localStorage.setItem(STORAGE_NUCLEO_KEY, "Todos");
    } catch {
      // fallback
    }
  }, []);

  // Setter de Núcleo (último nível da cadeia)
  const setNucleoId = useCallback((id: string) => {
    setNucleoIdState(id);
    try {
      localStorage.setItem(STORAGE_NUCLEO_KEY, id);
    } catch {
      // fallback
    }
  }, []);

  const limparFiltros = useCallback(() => {
    setEstadoState("Todos");
    setCidadeState("Todas");
    setOrganizacaoIdState("Todas");
    setNucleoIdState("Todos");
    try {
      localStorage.removeItem(STORAGE_ESTADO_KEY);
      localStorage.removeItem(STORAGE_CIDADE_KEY);
      localStorage.removeItem(STORAGE_ORGANIZACAO_KEY);
      localStorage.removeItem(STORAGE_NUCLEO_KEY);
    } catch {
      // fallback
    }
  }, []);

  const value = useMemo(
    () => ({
      estado,
      cidade,
      organizacaoId,
      nucleoId,
      setEstado,
      setCidade,
      setOrganizacaoId,
      setNucleoId,
      limparFiltros,
    }),
    [estado, cidade, organizacaoId, nucleoId, setEstado, setCidade, setOrganizacaoId, setNucleoId, limparFiltros]
  );

  return (
    <LocationFilterContext.Provider value={value}>
      {children}
    </LocationFilterContext.Provider>
  );
}

export function useLocationFilter() {
  return useContext(LocationFilterContext);
}
