import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { Turma } from '../turmas/turma.entity';

export enum StatusInscricao {
  PENDENTE = 'pendente',       // aguardando aprovação manual
  RESERVADA = 'reservada',     // aprovação automática, aguardando documentação
  APROVADA = 'aprovada',       // matriculada
  RECUSADA = 'recusada',
  EXPIRADA = 'expirada',       // TTL da reserva venceu sem confirmação
  CANCELADA = 'cancelada',
}

@Entity('inscricoes')
@Index(['turmaId', 'status'])
export class Inscricao extends BaseEntity {
  @Index()
  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @Index()
  @Column({ name: 'beneficiario_id', type: 'varchar', length: 36 })
  beneficiarioId: string;

  @Column({ type: 'enum', enum: StatusInscricao, default: StatusInscricao.PENDENTE })
  status: StatusInscricao;

  /** Prazo para confirmar a reserva — nulo se status != RESERVADA */
  @Column({ name: 'expira_em', type: 'datetime', nullable: true })
  expiraEm: Date | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  /** Respostas ao formulário de inscrição: { [perguntaId: string]: string } */
  @Column({ name: 'respostas_formulario', type: 'json', nullable: true })
  respostasFormulario: Record<string, string> | null;

  @ManyToOne(() => Turma, (t) => t.inscricoes, { onDelete: 'RESTRICT' })
  turma: Turma;

  @ManyToOne(() => Beneficiario, (b) => b.inscricoes, { onDelete: 'RESTRICT' })
  beneficiario: Beneficiario;
}
