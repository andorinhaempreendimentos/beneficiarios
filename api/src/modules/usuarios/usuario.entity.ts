import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';
import { Perfil } from './perfil.entity';
import { RefreshToken } from './refresh-token.entity';

export enum TipoUsuario {
  ADMIN = 'admin',
  GESTOR = 'gestor',
  FUNCIONARIO = 'funcionario',
  BENEFICIARIO = 'beneficiario',
}

@Entity('usuarios')
export class Usuario extends SoftDeleteEntity {
  @Index({ unique: true })
  @Column({ length: 200 })
  email: string;

  /** Hash argon2id — nunca armazenar texto puro */
  @Column({ name: 'senha_hash', length: 255 })
  senhaHash: string;

  @Column({ name: 'nome_completo', length: 300 })
  nomeCompleto: string;

  @Column({ type: 'enum', enum: TipoUsuario, default: TipoUsuario.GESTOR })
  tipo: TipoUsuario;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  /**
   * FK opcional — funcionário e beneficiário têm registro próprio vinculado.
   * Admin e gestor não têm.
   */
  @Column({ name: 'entidade_id', type: 'varchar', length: 36, nullable: true })
  entidadeId: string | null;

  @Index()
  @Column({ name: 'perfil_id', type: 'varchar', length: 36 })
  perfilId: string;

  @ManyToOne(() => Perfil, (p) => p.usuarios, { onDelete: 'RESTRICT' })
  perfil: Perfil;

  @OneToMany(() => RefreshToken, (rt) => rt.usuario, { cascade: true })
  refreshTokens: RefreshToken[];
}
