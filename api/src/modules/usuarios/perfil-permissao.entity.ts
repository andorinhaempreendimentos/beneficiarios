import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Perfil } from './perfil.entity';

/**
 * Granularidade: módulo + ação.
 * Formato compatível com o mock do frontend: { modulo: { acao: boolean } }
 */
@Entity('perfil_permissoes')
@Index(['perfilId', 'modulo', 'acao'], { unique: true })
export class PerfilPermissao extends BaseEntity {
  @Column({ name: 'perfil_id', type: 'varchar', length: 36 })
  perfilId: string;

  @Column({ length: 100 })
  modulo: string;

  @Column({ length: 100 })
  acao: string;

  @Column({ type: 'boolean', default: false })
  permitido: boolean;

  @ManyToOne(() => Perfil, (p) => p.permissoes, { onDelete: 'CASCADE' })
  perfil: Perfil;
}
