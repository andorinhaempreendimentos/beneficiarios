import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';
import { Nucleo } from '../nucleos/nucleo.entity';
import { Turma } from '../turmas/turma.entity';
import { AtividadePergunta } from './atividade-pergunta.entity';
import { AtividadeTurno } from './atividade-turno.entity';

export enum TipoAprovacaoInscricao {
  AUTOMATICA = 'automatica',
  MANUAL = 'manual',
}

@Entity('atividades')
export class Atividade extends SoftDeleteEntity {
  @Column({ length: 200 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  /** Idade mínima do beneficiário para se inscrever */
  @Column({ name: 'idade_minima', type: 'tinyint', unsigned: true, nullable: true })
  idadeMinima: number | null;

  /** Idade máxima do beneficiário para se inscrever */
  @Column({ name: 'idade_maxima', type: 'tinyint', unsigned: true, nullable: true })
  idadeMaxima: number | null;

  @Column({
    name: 'tipo_aprovacao',
    type: 'enum',
    enum: TipoAprovacaoInscricao,
    default: TipoAprovacaoInscricao.AUTOMATICA,
  })
  tipoAprovacao: TipoAprovacaoInscricao;

  @Index()
  @Column({ name: 'nucleo_id', type: 'varchar', length: 36 })
  nucleoId: string;

  @ManyToOne(() => Nucleo, (n) => n.atividades, { onDelete: 'RESTRICT' })
  nucleo: Nucleo;

  @OneToMany(() => Turma, (t) => t.atividade)
  turmas: Turma[];

  @OneToMany(() => AtividadePergunta, (p) => p.atividade, { cascade: true })
  perguntas: AtividadePergunta[];

  @OneToMany(() => AtividadeTurno, (t) => t.atividade, { cascade: true })
  turnos: AtividadeTurno[];
}
