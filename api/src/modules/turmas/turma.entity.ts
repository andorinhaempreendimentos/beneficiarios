import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';
import { Atividade } from '../atividades/atividade.entity';
import { TurmaHorario } from './turma-horario.entity';
import { TurmaResponsavel } from './turma-responsavel.entity';
import { Inscricao } from '../inscricoes/inscricao.entity';
import { BeneficiarioTurma } from '../beneficiarios/beneficiario-turma.entity';
import { RegistroPresenca } from '../presenca/registro-presenca.entity';
import { ConfirmacaoAtividade } from '../comprovacoes/confirmacao-atividade.entity';

@Entity('turmas')
@Index(['nucleoId', 'atividadeId'])
export class Turma extends SoftDeleteEntity {
  @Column({ length: 200 })
  nome: string;

  /** Vinculado ao nucleo via atividade — desnormalizado para facilitar queries */
  @Index()
  @Column({ name: 'nucleo_id', type: 'varchar', length: 36 })
  nucleoId: string;

  @Index()
  @Column({ name: 'atividade_id', type: 'varchar', length: 36 })
  atividadeId: string;

  @ManyToOne(() => Atividade, (a) => a.turmas, { onDelete: 'RESTRICT' })
  atividade: Atividade;

  @Column({ name: 'vagas_totais', type: 'smallint', unsigned: true, default: 30 })
  vagasTotais: number;

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio: string | null;

  @Column({ name: 'data_fim', type: 'date', nullable: true })
  dataFim: string | null;

  @OneToMany(() => TurmaHorario, (h) => h.turma, { cascade: true })
  horarios: TurmaHorario[];

  @OneToMany(() => TurmaResponsavel, (r) => r.turma, { cascade: true })
  responsaveis: TurmaResponsavel[];

  @OneToMany(() => Inscricao, (i) => i.turma)
  inscricoes: Inscricao[];

  @OneToMany(() => BeneficiarioTurma, (bt) => bt.turma)
  beneficiarioTurmas: BeneficiarioTurma[];

  @OneToMany(() => RegistroPresenca, (r) => r.turma)
  registrosPresenca: RegistroPresenca[];

  @OneToMany(() => ConfirmacaoAtividade, (c) => c.turma)
  confirmacoes: ConfirmacaoAtividade[];
}
