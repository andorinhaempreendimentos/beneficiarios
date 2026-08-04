import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

/**
 * Chave/valor JSON para configurações do sistema.
 * Exemplos de chaves: 'aparencia', 'dicionario', 'documentos_exigidos',
 * 'tipo_aprovacao_global', 'storage'.
 */
@Entity('configuracoes')
export class Configuracao extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  chave: string;

  /** Valor serializado como JSON */
  @Column({ type: 'json' })
  valor: unknown;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;
}
