import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';
import { Objeto } from '../objetos/objeto.entity';
import { Nucleo } from '../nucleos/nucleo.entity';

@Entity('organizacoes')
export class Organizacao extends SoftDeleteEntity {
  @Column({ length: 200 })
  nome: string;

  @Column({ name: 'cnpj', length: 18, nullable: true })
  cnpj: string | null;

  @Column({ type: 'text', nullable: true })
  endereco: string | null;

  @Column({ length: 20, nullable: true })
  telefone: string | null;

  @Column({ length: 200, nullable: true })
  email: string | null;

  @Index()
  @Column({ name: 'objeto_id', type: 'varchar', length: 36 })
  objetoId: string;

  @ManyToOne(() => Objeto, (o) => o.organizacoes, { onDelete: 'RESTRICT' })
  objeto: Objeto;

  @OneToMany(() => Nucleo, (n) => n.organizacao)
  nucleos: Nucleo[];
}
