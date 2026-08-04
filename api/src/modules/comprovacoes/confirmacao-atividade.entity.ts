import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Turma } from '../turmas/turma.entity';

/** Foto de comprovação de aula enviada pelo responsável */
@Entity('confirmacoes_atividade')
export class ConfirmacaoAtividade extends BaseEntity {
  @Index()
  @Column({ name: 'turma_id', type: 'varchar', length: 36 })
  turmaId: string;

  @Column({ type: 'date' })
  data: string;

  /** Chave no bucket R2 */
  @Column({ name: 'storage_key', type: 'text' })
  storageKey: string;

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  /** ID do usuário que enviou */
  @Column({ name: 'enviado_por', type: 'varchar', length: 36, nullable: true })
  enviadoPor: string | null;

  @ManyToOne(() => Turma, (t) => t.confirmacoes, { onDelete: 'RESTRICT' })
  turma: Turma;
}
