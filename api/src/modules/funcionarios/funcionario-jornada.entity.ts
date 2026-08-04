import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Funcionario } from './funcionario.entity';
import { DiaSemana } from '../turmas/turma-horario.entity';

/** Uma linha por dia da semana — 7 linhas por funcionário */
@Entity('funcionario_jornada')
@Index(['funcionarioId', 'diaSemana'], { unique: true })
export class FuncionarioJornada extends BaseEntity {
  @Column({ name: 'funcionario_id', type: 'varchar', length: 36 })
  funcionarioId: string;

  @Column({ name: 'dia_semana', type: 'tinyint', unsigned: true })
  diaSemana: DiaSemana;

  @Column({ name: 'hora_entrada', type: 'time', nullable: true })
  horaEntrada: string | null;

  @Column({ name: 'hora_saida', type: 'time', nullable: true })
  horaSaida: string | null;

  /** Se null, o funcionário não trabalha neste dia */
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @ManyToOne(() => Funcionario, (f) => f.jornada, { onDelete: 'CASCADE' })
  funcionario: Funcionario;
}
