import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

/**
 * Log de auditoria imutável — registros de projeto de fomento público
 * não devem desaparecer do histórico. Sem soft-delete e sem cascade.
 */
@Entity('audit_log')
@Index(['entidade', 'entidadeId'])
export class AuditLog extends BaseEntity {
  @Index()
  @Column({ name: 'usuario_id', type: 'varchar', length: 36, nullable: true })
  usuarioId: string | null;

  @Column({ length: 100 })
  acao: string;

  @Column({ length: 100 })
  entidade: string;

  @Index()
  @Column({ name: 'entidade_id', type: 'varchar', length: 36, nullable: true })
  entidadeId: string | null;

  /** Estado anterior (pode ser null em criações) */
  @Column({ name: 'valor_antes', type: 'json', nullable: true })
  valorAntes: unknown;

  /** Estado posterior (pode ser null em exclusões) */
  @Column({ name: 'valor_depois', type: 'json', nullable: true })
  valorDepois: unknown;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;
}
