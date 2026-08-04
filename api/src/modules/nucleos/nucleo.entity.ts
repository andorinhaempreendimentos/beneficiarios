import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';
import { Organizacao } from '../organizacoes/organizacao.entity';
import { Atividade } from '../atividades/atividade.entity';

@Entity('nucleos')
export class Nucleo extends SoftDeleteEntity {
  @Column({ length: 200 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  endereco: string | null;

  @Column({ length: 20, nullable: true })
  telefone: string | null;

  @Index()
  @Column({ name: 'organizacao_id', type: 'varchar', length: 36 })
  organizacaoId: string;

  @ManyToOne(() => Organizacao, (o) => o.nucleos, { onDelete: 'RESTRICT' })
  organizacao: Organizacao;

  @OneToMany(() => Atividade, (a) => a.nucleo)
  atividades: Atividade[];
}
