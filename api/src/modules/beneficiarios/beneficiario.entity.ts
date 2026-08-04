import { Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import { SoftDeleteEntity } from '../../common/base.entity';
import { BeneficiarioTurma } from './beneficiario-turma.entity';
import { BeneficiarioAnexo } from './beneficiario-anexo.entity';
import { BeneficiarioParq } from './beneficiario-parq.entity';
import { Inscricao } from '../inscricoes/inscricao.entity';
import { RegistroPresenca } from '../presenca/registro-presenca.entity';

export enum Sexo {
  MASCULINO = 'M',
  FEMININO = 'F',
  OUTRO = 'O',
  NAO_INFORMADO = 'N',
}

@Entity('beneficiarios')
export class Beneficiario extends SoftDeleteEntity {
  @Index({ unique: true })
  @Column({ length: 20 })
  matricula: string;

  @Column({ name: 'nome_completo', length: 300 })
  nomeCompleto: string;

  @Column({ name: 'data_nascimento', type: 'date' })
  dataNascimento: string;

  @Column({ type: 'enum', enum: Sexo, default: Sexo.NAO_INFORMADO })
  sexo: Sexo;

  /** CPF opcional — beneficiários podem ser menores sem CPF próprio */
  @Index({ unique: true, sparse: true })
  @Column({ length: 14, nullable: true })
  cpf: string | null;

  @Column({ length: 20, nullable: true })
  celular: string | null;

  @Column({ length: 200, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  endereco: string | null;

  @Column({ length: 10, nullable: true })
  cep: string | null;

  @Column({ length: 200, nullable: true })
  municipio: string | null;

  @Column({ length: 2, nullable: true })
  uf: string | null;

  /** Nome do responsável legal (obrigatório se menor de 18 anos) */
  @Column({ name: 'nome_responsavel', length: 300, nullable: true })
  nomeResponsavel: string | null;

  @Column({ name: 'celular_responsavel', length: 20, nullable: true })
  celularResponsavel: string | null;

  @Column({ name: 'cpf_responsavel', length: 14, nullable: true })
  cpfResponsavel: string | null;

  /** URL relativa no R2 */
  @Column({ name: 'foto_url', type: 'text', nullable: true })
  fotoUrl: string | null;

  @OneToMany(() => BeneficiarioTurma, (bt) => bt.beneficiario)
  turmas: BeneficiarioTurma[];

  @OneToMany(() => BeneficiarioAnexo, (a) => a.beneficiario, { cascade: true })
  anexos: BeneficiarioAnexo[];

  @OneToOne(() => BeneficiarioParq, (p) => p.beneficiario, { cascade: true })
  parq: BeneficiarioParq;

  @OneToMany(() => Inscricao, (i) => i.beneficiario)
  inscricoes: Inscricao[];

  @OneToMany(() => RegistroPresenca, (r) => r.beneficiario)
  registrosPresenca: RegistroPresenca[];
}
