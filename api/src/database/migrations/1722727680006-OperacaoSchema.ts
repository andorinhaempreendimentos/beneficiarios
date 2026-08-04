import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperacaoSchema1722727680006 implements MigrationInterface {
  name = 'OperacaoSchema1722727680006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE inscricoes (
        id                   CHAR(36)    NOT NULL DEFAULT (UUID()),
        turma_id             CHAR(36)    NOT NULL,
        beneficiario_id      CHAR(36)    NOT NULL,
        status               ENUM('pendente','reservada','aprovada','recusada','expirada','cancelada') NOT NULL DEFAULT 'pendente',
        expira_em            DATETIME,
        observacoes          TEXT,
        respostas_formulario JSON,
        created_at           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_inscricoes PRIMARY KEY (id),
        CONSTRAINT FK_inscricoes_turma FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE RESTRICT,
        CONSTRAINT FK_inscricoes_beneficiario FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id) ON DELETE RESTRICT,
        INDEX IDX_inscricoes_turma (turma_id),
        INDEX IDX_inscricoes_beneficiario (beneficiario_id),
        INDEX IDX_inscricoes_turma_status (turma_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE registros_presenca (
        id               CHAR(36)    NOT NULL DEFAULT (UUID()),
        turma_id         CHAR(36)    NOT NULL,
        data             DATE        NOT NULL,
        beneficiario_id  CHAR(36)    NOT NULL,
        presente         TINYINT(1)  NOT NULL DEFAULT 1,
        observacao       TEXT,
        created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_registros_presenca PRIMARY KEY (id),
        CONSTRAINT UQ_registros_presenca UNIQUE (turma_id, data, beneficiario_id),
        CONSTRAINT FK_registros_presenca_turma FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE RESTRICT,
        CONSTRAINT FK_registros_presenca_beneficiario FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id) ON DELETE RESTRICT,
        INDEX IDX_registros_presenca_turma (turma_id),
        INDEX IDX_registros_presenca_data (data)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE registros_ponto (
        id              CHAR(36)    NOT NULL DEFAULT (UUID()),
        funcionario_id  CHAR(36)    NOT NULL,
        data            DATE        NOT NULL,
        tipo            ENUM('entrada','saida','entrada_intervalo','saida_intervalo') NOT NULL,
        hora            TIME        NOT NULL,
        token_qr_hash   CHAR(64),
        observacao      TEXT,
        created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_registros_ponto PRIMARY KEY (id),
        CONSTRAINT UQ_registros_ponto UNIQUE (funcionario_id, data, tipo),
        CONSTRAINT FK_registros_ponto_funcionario FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE RESTRICT,
        INDEX IDX_registros_ponto_funcionario (funcionario_id),
        INDEX IDX_registros_ponto_data (data)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS registros_ponto`);
    await queryRunner.query(`DROP TABLE IF EXISTS registros_presenca`);
    await queryRunner.query(`DROP TABLE IF EXISTS inscricoes`);
  }
}
