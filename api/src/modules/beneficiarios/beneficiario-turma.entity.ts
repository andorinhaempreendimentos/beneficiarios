import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';
import { Beneficiario } from './beneficiario.entity';
import { Turma } from '../turmas/turma.entity';

export enum StatusMatricula {
  ATIVO = 'ativo',
  EVADIDO = 'evadido',
  TRANSFERIDO = 'transferido',
}

@Entity('beneficiario_turmas')
@Index(['beneficiarioId', 'turmaId'], { unique: true })
export class BeneficiarioTurma extends SoftDeleteEntity {
  @Column({ name: 'beneficiario_id', type: 'varchar', length: 36 })
  beneficiarioId: string;

  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @Column({ type: 'enum', enum: StatusMatricula, default: StatusMatricula.ATIVO })
  status: StatusMatricula;

  @Column({ name: 'data_matricula', type: 'date' })
  dataMatricula: string;

  @Column({ name: 'data_evasao', type: 'date', nullable: true })
  dataEvasao: string | null;

  @ManyToOne(() => Beneficiario, (b) => b.turmas, { onDelete: 'RESTRICT' })
  beneficiario: Beneficiario;

  @ManyToOne(() => Turma, (t) => t.beneficiarioTurmas, { onDelete: 'RESTRICT' })
  turma: Turma;
}
