import { MigrationInterface, QueryRunner } from 'typeorm';

export class AtividadesSchema1722727680002 implements MigrationInterface {
  name = 'AtividadesSchema1722727680002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE atividades (
        id               CHAR(36)      NOT NULL DEFAULT (UUID()),
        nome             VARCHAR(200)  NOT NULL,
        descricao        TEXT,
        idade_minima     TINYINT UNSIGNED,
        idade_maxima     TINYINT UNSIGNED,
        tipo_aprovacao   ENUM('automatica','manual') NOT NULL DEFAULT 'automatica',
        nucleo_id        CHAR(36)      NOT NULL,
        created_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at       DATETIME(6),
        CONSTRAINT PK_atividades PRIMARY KEY (id),
        CONSTRAINT FK_atividades_nucleo FOREIGN KEY (nucleo_id) REFERENCES nucleos(id) ON DELETE RESTRICT,
        INDEX IDX_atividades_nucleo (nucleo_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE atividade_perguntas (
        id           CHAR(36)    NOT NULL DEFAULT (UUID()),
        atividade_id CHAR(36)    NOT NULL,
        enunciado    TEXT        NOT NULL,
        tipo         ENUM('texto','sim_nao','numero','opcoes') NOT NULL DEFAULT 'texto',
        opcoes       TEXT,
        obrigatoria  TINYINT(1)  NOT NULL DEFAULT 0,
        ordem        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
        created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_atividade_perguntas PRIMARY KEY (id),
        CONSTRAINT FK_atividade_perguntas_atividade FOREIGN KEY (atividade_id) REFERENCES atividades(id) ON DELETE CASCADE,
        INDEX IDX_atividade_perguntas_atividade (atividade_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE atividade_turnos (
        id           CHAR(36)    NOT NULL DEFAULT (UUID()),
        atividade_id CHAR(36)    NOT NULL,
        nome         VARCHAR(100) NOT NULL,
        hora_inicio  TIME        NOT NULL,
        hora_fim     TIME        NOT NULL,
        created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_atividade_turnos PRIMARY KEY (id),
        CONSTRAINT FK_atividade_turnos_atividade FOREIGN KEY (atividade_id) REFERENCES atividades(id) ON DELETE CASCADE,
        INDEX IDX_atividade_turnos_atividade (atividade_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS atividade_turnos`);
    await queryRunner.query(`DROP TABLE IF EXISTS atividade_perguntas`);
    await queryRunner.query(`DROP TABLE IF EXISTS atividades`);
  }
}
