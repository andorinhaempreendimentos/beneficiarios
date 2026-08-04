import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { PerfilPermissao } from './perfil-permissao.entity';
import { Usuario } from './usuario.entity';

@Entity('perfis')
export class Perfil extends BaseEntity {
  @Column({ length: 100, unique: true })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  /** Perfil de sistema não pode ser excluído pela UI */
  @Column({ name: 'is_sistema', type: 'boolean', default: false })
  isSistema: boolean;

  @OneToMany(() => PerfilPermissao, (pp) => pp.perfil, { cascade: true })
  permissoes: PerfilPermissao[];

  @OneToMany(() => Usuario, (u) => u.perfil)
  usuarios: Usuario[];
}
