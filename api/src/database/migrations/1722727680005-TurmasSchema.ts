import { MigrationInterface, QueryRunner } from 'typeorm';

export class TurmasSchema1722727680005 implements MigrationInterface {
  name = 'TurmasSchema1722727680005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE turmas (
        id           CHAR(36)        NOT NULL DEFAULT (UUID()),
        nome         VARCHAR(200)    NOT NULL,
        nucleo_id    CHAR(36)        NOT NULL,
        atividade_id CHAR(36)        NOT NULL,
        vagas_totais SMALLINT UNSIGNED NOT NULL DEFAULT 30,
        data_inicio  DATE,
        data_fim     DATE,
        created_at   DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at   DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at   DATETIME(6),
        CONSTRAINT PK_turmas PRIMARY KEY (id),
        CONSTRAINT FK_turmas_atividade FOREIGN KEY (atividade_id) REFERENCES atividades(id) ON DELETE RESTRICT,
        INDEX IDX_turmas_nucleo (nucleo_id),
        INDEX IDX_turmas_atividade (atividade_id),
        INDEX IDX_turmas_nucleo_atividade (nucleo_id, atividade_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE turma_horarios (
        id          CHAR(36)         NOT NULL DEFAULT (UUID()),
        turma_id    CHAR(36)         NOT NULL,
        dia_semana  TINYINT UNSIGNED NOT NULL,
        hora_inicio TIME             NOT NULL,
        hora_fim    TIME             NOT NULL,
        created_at  DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at  DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_turma_horarios PRIMARY KEY (id),
        CONSTRAINT FK_turma_horarios_turma FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
        INDEX IDX_turma_horarios_turma (turma_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE turma_responsaveis (
        id             CHAR(36)    NOT NULL DEFAULT (UUID()),
        turma_id       CHAR(36)    NOT NULL,
        funcionario_id CHAR(36)    NOT NULL,
        created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_turma_responsaveis PRIMARY KEY (id),
        CONSTRAINT UQ_turma_responsaveis UNIQUE (turma_id, funcionario_id),
        CONSTRAINT FK_turma_responsaveis_turma FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
        CONSTRAINT FK_turma_responsaveis_funcionario FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE beneficiario_turmas (
        id               CHAR(36)     NOT NULL DEFAULT (UUID()),
        beneficiario_id  CHAR(36)     NOT NULL,
        turma_id         CHAR(36)     NOT NULL,
        status           ENUM('ativo','evadido','transferido') NOT NULL DEFAULT 'ativo',
        data_matricula   DATE         NOT NULL,
        data_evasao      DATE,
        created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at       DATETIME(6),
        CONSTRAINT PK_beneficiario_turmas PRIMARY KEY (id),
        CONSTRAINT UQ_beneficiario_turmas UNIQUE (beneficiario_id, turma_id),
        CONSTRAINT FK_beneficiario_turmas_beneficiario FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id) ON DELETE RESTRICT,
        CONSTRAINT FK_beneficiario_turmas_turma FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS beneficiario_turmas`);
    await queryRunner.query(`DROP TABLE IF EXISTS turma_responsaveis`);
    await queryRunner.query(`DROP TABLE IF EXISTS turma_horarios`);
    await queryRunner.query(`DROP TABLE IF EXISTS turmas`);
  }
}
