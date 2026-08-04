import { MigrationInterface, QueryRunner } from 'typeorm';

export class HierarchySchema1722727680001 implements MigrationInterface {
  name = 'HierarchySchema1722727680001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE objetos (
        id          CHAR(36)      NOT NULL DEFAULT (UUID()),
        nome        VARCHAR(200)  NOT NULL,
        descricao   TEXT,
        created_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at  DATETIME(6),
        CONSTRAINT PK_objetos PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE organizacoes (
        id          CHAR(36)      NOT NULL DEFAULT (UUID()),
        nome        VARCHAR(200)  NOT NULL,
        cnpj        VARCHAR(18),
        endereco    TEXT,
        telefone    VARCHAR(20),
        email       VARCHAR(200),
        objeto_id   CHAR(36)      NOT NULL,
        created_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at  DATETIME(6),
        CONSTRAINT PK_organizacoes PRIMARY KEY (id),
        CONSTRAINT FK_organizacoes_objeto FOREIGN KEY (objeto_id) REFERENCES objetos(id) ON DELETE RESTRICT,
        INDEX IDX_organizacoes_objeto (objeto_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE nucleos (
        id              CHAR(36)      NOT NULL DEFAULT (UUID()),
        nome            VARCHAR(200)  NOT NULL,
        endereco        TEXT,
        telefone        VARCHAR(20),
        organizacao_id  CHAR(36)      NOT NULL,
        created_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at      DATETIME(6),
        CONSTRAINT PK_nucleos PRIMARY KEY (id),
        CONSTRAINT FK_nucleos_organizacao FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE RESTRICT,
        INDEX IDX_nucleos_organizacao (organizacao_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS nucleos`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizacoes`);
    await queryRunner.query(`DROP TABLE IF EXISTS objetos`);
  }
}
