import { Column, Entity, Index, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';
import { FuncionarioJornada } from './funcionario-jornada.entity';
import { TurmaResponsavel } from '../turmas/turma-responsavel.entity';
import { RegistroPonto } from '../ponto/registro-ponto.entity';

export enum CargoFuncionario {
  PROFESSOR = 'professor',
  COORDENADOR = 'coordenador',
  ADMINISTRATIVO = 'administrativo',
  OUTRO = 'outro',
}

@Entity('funcionarios')
export class Funcionario extends SoftDeleteEntity {
  @Index({ unique: true })
  @Column({ length: 20 })
  matricula: string;

  @Column({ name: 'nome_completo', length: 300 })
  nomeCompleto: string;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento: string | null;

  @Column({ length: 14, nullable: true })
  cpf: string | null;

  @Column({ length: 20, nullable: true })
  celular: string | null;

  @Column({ length: 200, nullable: true })
  email: string | null;

  @Column({ type: 'enum', enum: CargoFuncionario, default: CargoFuncionario.PROFESSOR })
  cargo: CargoFuncionario;

  /** URL relativa no R2 */
  @Column({ name: 'foto_url', type: 'text', nullable: true })
  fotoUrl: string | null;

  @OneToMany(() => FuncionarioJornada, (j) => j.funcionario, { cascade: true })
  jornada: FuncionarioJornada[];

  @OneToMany(() => TurmaResponsavel, (tr) => tr.funcionario)
  turmasResponsavel: TurmaResponsavel[];

  @OneToMany(() => RegistroPonto, (r) => r.funcionario)
  registrosPonto: RegistroPonto[];
}
