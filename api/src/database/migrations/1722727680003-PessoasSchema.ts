import { MigrationInterface, QueryRunner } from 'typeorm';

export class PessoasSchema1722727680003 implements MigrationInterface {
  name = 'PessoasSchema1722727680003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE funcionarios (
        id             CHAR(36)     NOT NULL DEFAULT (UUID()),
        matricula      VARCHAR(20)  NOT NULL,
        nome_completo  VARCHAR(300) NOT NULL,
        data_nascimento DATE,
        cpf            VARCHAR(14),
        celular        VARCHAR(20),
        email          VARCHAR(200),
        cargo          ENUM('professor','coordenador','administrativo','outro') NOT NULL DEFAULT 'professor',
        foto_url       TEXT,
        created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at     DATETIME(6),
        CONSTRAINT PK_funcionarios PRIMARY KEY (id),
        CONSTRAINT UQ_funcionarios_matricula UNIQUE (matricula)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE funcionario_jornada (
        id             CHAR(36)       NOT NULL DEFAULT (UUID()),
        funcionario_id CHAR(36)       NOT NULL,
        dia_semana     TINYINT UNSIGNED NOT NULL,
        hora_entrada   TIME,
        hora_saida     TIME,
        ativo          TINYINT(1)     NOT NULL DEFAULT 1,
        created_at     DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at     DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_funcionario_jornada PRIMARY KEY (id),
        CONSTRAINT UQ_funcionario_jornada UNIQUE (funcionario_id, dia_semana),
        CONSTRAINT FK_funcionario_jornada_funcionario FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE beneficiarios (
        id                  CHAR(36)     NOT NULL DEFAULT (UUID()),
        matricula           VARCHAR(20)  NOT NULL,
        nome_completo       VARCHAR(300) NOT NULL,
        data_nascimento     DATE         NOT NULL,
        sexo                ENUM('M','F','O','N') NOT NULL DEFAULT 'N',
        cpf                 VARCHAR(14),
        celular             VARCHAR(20),
        email               VARCHAR(200),
        endereco            TEXT,
        cep                 VARCHAR(10),
        municipio           VARCHAR(200),
        uf                  CHAR(2),
        nome_responsavel    VARCHAR(300),
        celular_responsavel VARCHAR(20),
        cpf_responsavel     VARCHAR(14),
        foto_url            TEXT,
        created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at          DATETIME(6),
        CONSTRAINT PK_beneficiarios PRIMARY KEY (id),
        CONSTRAINT UQ_beneficiarios_matricula UNIQUE (matricula)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS beneficiarios`);
    await queryRunner.query(`DROP TABLE IF EXISTS funcionario_jornada`);
    await queryRunner.query(`DROP TABLE IF EXISTS funcionarios`);
  }
}
