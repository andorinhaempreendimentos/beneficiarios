import { Column, Entity, Index, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Turma } from '../turmas/turma.entity';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';

@Entity('registros_presenca')
@Unique(['turmaId', 'data', 'beneficiarioId'])
export class RegistroPresenca extends BaseEntity {
  @Index()
  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @Index()
  @Column({ type: 'date' })
  data: string;

  @Column({ name: 'beneficiario_id', type: 'varchar', length: 36 })
  beneficiarioId: string;

  @Column({ type: 'boolean', default: true })
  presente: boolean;

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @ManyToOne(() => Turma, (t) => t.registrosPresenca, { onDelete: 'RESTRICT' })
  turma: Turma;

  @ManyToOne(() => Beneficiario, (b) => b.registrosPresenca, { onDelete: 'RESTRICT' })
  beneficiario: Beneficiario;
}
