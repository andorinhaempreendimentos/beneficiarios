import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity('categoria_turmas')
export class CategoriaTurma extends BaseEntity {
  @Column({ length: 50, unique: true })
  nome: string;

  @Column({ length: 10, unique: true })
  sigla: string;

  @Column({ name: 'idade_minima', type: 'smallint' })
  idadeMinima: number;

  @Column({ name: 'idade_maxima', type: 'smallint' })
  idadeMaxima: number;
}
