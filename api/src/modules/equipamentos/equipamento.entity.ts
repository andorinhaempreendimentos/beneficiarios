import { Column, Entity, Index } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';

export enum EstadoEquipamento {
  OTIMO = 'otimo',
  BOM = 'bom',
  REGULAR = 'regular',
  RUIM = 'ruim',
  INATIVO = 'inativo',
}

@Entity('equipamentos')
export class Equipamento extends SoftDeleteEntity {
  @Column({ length: 300 })
  nome: string;

  @Column({ length: 100, nullable: true })
  categoria: string | null;

  @Column({ length: 100, nullable: true })
  marca: string | null;

  @Column({ length: 100, nullable: true })
  modelo: string | null;

  @Column({ name: 'numero_serie', length: 100, nullable: true })
  numeroSerie: string | null;

  @Column({
    type: 'enum',
    enum: EstadoEquipamento,
    default: EstadoEquipamento.BOM,
  })
  estado: EstadoEquipamento;

  @Column({ name: 'data_aquisicao', type: 'date', nullable: true })
  dataAquisicao: string | null;

  @Column({ name: 'valor_aquisicao', type: 'decimal', precision: 12, scale: 2, nullable: true })
  valorAquisicao: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  /** Chaves no R2, separadas por "|" */
  @Column({ name: 'fotos_keys', type: 'text', nullable: true })
  fotosKeys: string | null;

  /** Índice para buscas por núcleo */
  @Index()
  @Column({ name: 'nucleo_id', type: 'varchar', length: 36, nullable: true })
  nucleoId: string | null;
}
