import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Atividade } from './atividade.entity';

@Entity('atividade_turnos')
export class AtividadeTurno extends BaseEntity {
  @Column({ length: 100 })
  nome: string;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_fim', type: 'time' })
  horaFim: string;

  @Index()
  @Column({ name: 'atividade_id', type: 'varchar', length: 36 })
  atividadeId: string;

  @ManyToOne(() => Atividade, (a) => a.turnos, { onDelete: 'CASCADE' })
  atividade: Atividade;
}
