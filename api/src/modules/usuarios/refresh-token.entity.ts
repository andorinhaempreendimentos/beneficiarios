import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Usuario } from './usuario.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Index()
  @Column({ name: 'usuario_id', type: 'varchar', length: 36 })
  usuarioId: string;

  /** SHA-256 do token JWT — nunca armazenar o token em texto puro */
  @Index({ unique: true })
  @Column({ length: 64 })
  hash: string;

  @Column({ name: 'expira_em', type: 'datetime' })
  expiraEm: Date;

  /** Revogado antes do vencimento (logout explícito) */
  @Column({ type: 'boolean', default: false })
  revogado: boolean;

  /** User-agent para auditoria de sessões ativas */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @ManyToOne(() => Usuario, (u) => u.refreshTokens, { onDelete: 'CASCADE' })
  usuario: Usuario;
}
