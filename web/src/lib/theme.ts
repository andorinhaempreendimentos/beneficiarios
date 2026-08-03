export type TemaId = "andorinha" | "oceano" | "esmeralda";

export interface Tema {
  id: TemaId;
  nome: string;
  descricao: string;
  // valores CSS sobrescrevem --color-sky-* em runtime
  cores: {
    "50": string;
    "100": string;
    "200": string;
    "400": string;
    "500": string;
    "600": string;
    "700": string;
  };
}

export const temas: Tema[] = [
  {
    id: "andorinha",
    nome: "Andorinha",
    descricao: "Azul royal — identidade da organização",
    cores: {
      "50":  "#eeeef9",
      "100": "#d5d5f0",
      "200": "#ababdf",
      "400": "#5555cb",
      "500": "#3535bc",
      "600": "#1b1db8",
      "700": "#1515a0",
    },
  },
  {
    id: "oceano",
    nome: "Oceano",
    descricao: "Azul céu — paleta padrão do Tailwind",
    cores: {
      "50":  "#f0f9ff",
      "100": "#e0f2fe",
      "200": "#bae6fd",
      "400": "#38bdf8",
      "500": "#0ea5e9",
      "600": "#0284c7",
      "700": "#0369a1",
    },
  },
  {
    id: "esmeralda",
    nome: "Esmeralda",
    descricao: "Verde esmeralda",
    cores: {
      "50":  "#ecfdf5",
      "100": "#d1fae5",
      "200": "#a7f3d0",
      "400": "#34d399",
      "500": "#10b981",
      "600": "#059669",
      "700": "#047857",
    },
  },
];

export function getTema(id: TemaId): Tema {
  return temas.find((t) => t.id === id) ?? temas[0];
}
