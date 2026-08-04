import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Beneficiario } from './beneficiario.entity';

export enum TipoAnexo {
  ATESTADO_MEDICO = 'atestado_medico',
  RG = 'rg',
  CPF = 'cpf',
  COMPROVANTE_RESIDENCIA = 'comprovante_residencia',
  FOTO = 'foto',
  OUTRO = 'outro',
}

@Entity('beneficiario_anexos')
export class BeneficiarioAnexo extends BaseEntity {
  @Index()
  @Column({ name: 'beneficiario_id', type: 'varchar', length: 36 })
  beneficiarioId: string;

  @Column({ type: 'enum', enum: TipoAnexo, default: TipoAnexo.OUTRO })
  tipo: TipoAnexo;

  /** Chave no bucket R2 */
  @Column({ name: 'storage_key', type: 'text' })
  storageKey: string;

  @Column({ name: 'nome_original', length: 300, nullable: true })
  nomeOriginal: string | null;

  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType: string | null;

  @Column({ name: 'tamanho_bytes', type: 'int', unsigned: true, nullable: true })
  tamanhoBytes: number | null;

  @ManyToOne(() => Beneficiario, (b) => b.anexos, { onDelete: 'CASCADE' })
  beneficiario: Beneficiario;
}
