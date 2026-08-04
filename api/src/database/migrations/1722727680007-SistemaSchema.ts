import { MigrationInterface, QueryRunner } from 'typeorm';

export class SistemaSchema1722727680007 implements MigrationInterface {
  name = 'SistemaSchema1722727680007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE confirmacoes_atividade (
        id           CHAR(36)    NOT NULL DEFAULT (UUID()),
        turma_id     CHAR(36)    NOT NULL,
        data         DATE        NOT NULL,
        storage_key  TEXT        NOT NULL,
        observacao   TEXT,
        enviado_por  CHAR(36),
        created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_confirmacoes_atividade PRIMARY KEY (id),
        CONSTRAINT FK_confirmacoes_atividade_turma FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE RESTRICT,
        INDEX IDX_confirmacoes_atividade_turma (turma_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE configuracoes (
        id          CHAR(36)    NOT NULL DEFAULT (UUID()),
        chave       VARCHAR(100) NOT NULL,
        valor       JSON        NOT NULL,
        descricao   TEXT,
        created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_configuracoes PRIMARY KEY (id),
        CONSTRAINT UQ_configuracoes_chave UNIQUE (chave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE audit_log (
        id           CHAR(36)    NOT NULL DEFAULT (UUID()),
        usuario_id   CHAR(36),
        acao         VARCHAR(100) NOT NULL,
        entidade     VARCHAR(100) NOT NULL,
        entidade_id  CHAR(36),
        valor_antes  JSON,
        valor_depois JSON,
        ip_address   VARCHAR(45),
        created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_audit_log PRIMARY KEY (id),
        INDEX IDX_audit_log_usuario (usuario_id),
        INDEX IDX_audit_log_entidade (entidade, entidade_id),
        INDEX IDX_audit_log_entidade_id (entidade_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_log`);
    await queryRunner.query(`DROP TABLE IF EXISTS configuracoes`);
    await queryRunner.query(`DROP TABLE IF EXISTS confirmacoes_atividade`);
  }
}
