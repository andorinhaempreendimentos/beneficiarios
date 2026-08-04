import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Turma } from './turma.entity';
import { Funcionario } from '../funcionarios/funcionario.entity';

@Entity('turma_responsaveis')
@Index(['turmaId', 'funcionarioId'], { unique: true })
export class TurmaResponsavel extends BaseEntity {
  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @Column({ name: 'funcionario_id', type: 'varchar', length: 36 })
  funcionarioId: string;

  @ManyToOne(() => Turma, (t) => t.responsaveis, { onDelete: 'CASCADE' })
  turma: Turma;

  @ManyToOne(() => Funcionario, (f) => f.turmasResponsavel, { onDelete: 'CASCADE' })
  funcionario: Funcionario;
}
