import { Column, Entity, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';
import { Organizacao } from '../organizacoes/organizacao.entity';

@Entity('objetos')
export class Objeto extends SoftDeleteEntity {
  @Column({ length: 200 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @OneToMany(() => Organizacao, (o) => o.objeto)
  organizacoes: Organizacao[];
}
