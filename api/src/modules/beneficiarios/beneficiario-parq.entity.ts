import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Beneficiario } from './beneficiario.entity';

/** Questionário PAR-Q (Physical Activity Readiness) do beneficiário */
@Entity('beneficiario_parq')
export class BeneficiarioParq extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'beneficiario_id', type: 'varchar', length: 36 })
  beneficiarioId: string;

  /** Respostas armazenadas como JSON: { [perguntaId: string]: string } */
  @Column({ type: 'json' })
  respostas: Record<string, string>;

  @Column({ name: 'data_resposta', type: 'date' })
  dataResposta: string;

  @OneToOne(() => Beneficiario, (b) => b.parq, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'beneficiario_id' })
  beneficiario: Beneficiario;
}
