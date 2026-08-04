import { Column, Entity, Index, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Funcionario } from '../funcionarios/funcionario.entity';

export enum TipoPonto {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
  ENTRADA_INTERVALO = 'entrada_intervalo',
  SAIDA_INTERVALO = 'saida_intervalo',
}

@Entity('registros_ponto')
@Unique(['funcionarioId', 'data', 'tipo'])
export class RegistroPonto extends BaseEntity {
  @Index()
  @Column({ name: 'funcionario_id', type: 'varchar', length: 36 })
  funcionarioId: string;

  @Index()
  @Column({ type: 'date' })
  data: string;

  @Column({ type: 'enum', enum: TipoPonto })
  tipo: TipoPonto;

  @Column({ type: 'time' })
  hora: string;

  /** Hash do token de curta duração embutido no QR Code */
  @Column({ name: 'token_qr_hash', length: 64, nullable: true })
  tokenQrHash: string | null;

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @ManyToOne(() => Funcionario, (f) => f.registrosPonto, { onDelete: 'RESTRICT' })
  funcionario: Funcionario;
}
