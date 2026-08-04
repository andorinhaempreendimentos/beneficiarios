import { MigrationInterface, QueryRunner } from 'typeorm';

export class BeneficiarioExtrasSchema1722727680004 implements MigrationInterface {
  name = 'BeneficiarioExtrasSchema1722727680004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE beneficiario_parq (
        id               CHAR(36)    NOT NULL DEFAULT (UUID()),
        beneficiario_id  CHAR(36)    NOT NULL,
        respostas        JSON        NOT NULL,
        data_resposta    DATE        NOT NULL,
        created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_beneficiario_parq PRIMARY KEY (id),
        CONSTRAINT UQ_beneficiario_parq_beneficiario UNIQUE (beneficiario_id),
        CONSTRAINT FK_beneficiario_parq_beneficiario FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE beneficiario_anexos (
        id               CHAR(36)     NOT NULL DEFAULT (UUID()),
        beneficiario_id  CHAR(36)     NOT NULL,
        tipo             ENUM('atestado_medico','rg','cpf','comprovante_residencia','foto','outro') NOT NULL DEFAULT 'outro',
        storage_key      TEXT         NOT NULL,
        nome_original    VARCHAR(300),
        mime_type        VARCHAR(100),
        tamanho_bytes    INT UNSIGNED,
        created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_beneficiario_anexos PRIMARY KEY (id),
        CONSTRAINT FK_beneficiario_anexos_beneficiario FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id) ON DELETE CASCADE,
        INDEX IDX_beneficiario_anexos_beneficiario (beneficiario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE equipamentos (
        id               CHAR(36)         NOT NULL DEFAULT (UUID()),
        nome             VARCHAR(300)     NOT NULL,
        categoria        VARCHAR(100),
        marca            VARCHAR(100),
        modelo           VARCHAR(100),
        numero_serie     VARCHAR(100),
        estado           ENUM('otimo','bom','regular','ruim','inativo') NOT NULL DEFAULT 'bom',
        data_aquisicao   DATE,
        valor_aquisicao  DECIMAL(12,2),
        observacoes      TEXT,
        fotos_keys       TEXT,
        nucleo_id        CHAR(36),
        created_at       DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at       DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at       DATETIME(6),
        CONSTRAINT PK_equipamentos PRIMARY KEY (id),
        INDEX IDX_equipamentos_nucleo (nucleo_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipamentos`);
    await queryRunner.query(`DROP TABLE IF EXISTS beneficiario_anexos`);
    await queryRunner.query(`DROP TABLE IF EXISTS beneficiario_parq`);
  }
}
