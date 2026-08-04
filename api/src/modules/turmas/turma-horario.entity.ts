import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Turma } from './turma.entity';

export enum DiaSemana {
  DOMINGO = 0,
  SEGUNDA = 1,
  TERCA = 2,
  QUARTA = 3,
  QUINTA = 4,
  SEXTA = 5,
  SABADO = 6,
}

@Entity('turma_horarios')
export class TurmaHorario extends BaseEntity {
  @Column({ name: 'dia_semana', type: 'tinyint', unsigned: true })
  diaSemana: DiaSemana;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_fim', type: 'time' })
  horaFim: string;

  @Index()
  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @ManyToOne(() => Turma, (t) => t.horarios, { onDelete: 'CASCADE' })
  turma: Turma;
}
