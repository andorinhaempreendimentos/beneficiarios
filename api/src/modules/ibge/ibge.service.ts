import { Injectable, InternalServerErrorException } from '@nestjs/common';

export interface IbgeUF { id: number; sigla: string; nome: string; }
export interface IbgeMunicipio { id: number; nome: string; }

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

@Injectable()
export class IbgeService {
  private ufsCache: { data: IbgeUF[]; at: number } | null = null;
  private munCache = new Map<string, { data: IbgeMunicipio[]; at: number }>();

  private expired(at: number) {
    return Date.now() - at > TTL_MS;
  }

  async ufs(): Promise<IbgeUF[]> {
    if (this.ufsCache && !this.expired(this.ufsCache.at)) {
      return this.ufsCache.data;
    }
    const res = await fetch(`${IBGE_BASE}/estados?orderBy=nome`);
    if (!res.ok) throw new InternalServerErrorException('Falha ao consultar IBGE');
    const data = (await res.json()) as IbgeUF[];
    this.ufsCache = { data, at: Date.now() };
    return data;
  }

  async municipios(uf: string): Promise<IbgeMunicipio[]> {
    const key = uf.toUpperCase();
    const cached = this.munCache.get(key);
    if (cached && !this.expired(cached.at)) return cached.data;

    const res = await fetch(`${IBGE_BASE}/estados/${key}/municipios?orderBy=nome`);
    if (!res.ok) throw new InternalServerErrorException('Falha ao consultar IBGE');
    const data = (await res.json()) as IbgeMunicipio[];
    this.munCache.set(key, { data, at: Date.now() });
    return data;
  }
}
