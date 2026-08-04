import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Atividade } from './atividade.entity';

export enum TipoPergunta {
  TEXTO = 'texto',
  SIM_NAO = 'sim_nao',
  NUMERO = 'numero',
  OPCOES = 'opcoes',
}

@Entity('atividade_perguntas')
export class AtividadePergunta extends BaseEntity {
  @Column({ type: 'text' })
  enunciado: string;

  @Column({ type: 'enum', enum: TipoPergunta, default: TipoPergunta.TEXTO })
  tipo: TipoPergunta;

  /** Opções separadas por "|" quando tipo = OPCOES */
  @Column({ type: 'text', nullable: true })
  opcoes: string | null;

  @Column({ type: 'boolean', default: false })
  obrigatoria: boolean;

  @Column({ type: 'smallint', unsigned: true, default: 0 })
  ordem: number;

  @Index()
  @Column({ name: 'atividade_id', type: 'varchar', length: 36 })
  atividadeId: string;

  @ManyToOne(() => Atividade, (a) => a.perguntas, { onDelete: 'CASCADE' })
  atividade: Atividade;
}
