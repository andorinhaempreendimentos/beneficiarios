import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1722727680000 implements MigrationInterface {
  name = 'InitialSchema1722727680000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Acesso ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE perfis (
        id          CHAR(36)      NOT NULL DEFAULT (UUID()),
        nome        VARCHAR(100)  NOT NULL,
        descricao   TEXT,
        is_sistema  TINYINT(1)    NOT NULL DEFAULT 0,
        created_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_perfis PRIMARY KEY (id),
        CONSTRAINT UQ_perfis_nome UNIQUE (nome)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE perfil_permissoes (
        id          CHAR(36)      NOT NULL DEFAULT (UUID()),
        perfil_id   CHAR(36)      NOT NULL,
        modulo      VARCHAR(100)  NOT NULL,
        acao        VARCHAR(100)  NOT NULL,
        permitido   TINYINT(1)    NOT NULL DEFAULT 0,
        created_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_perfil_permissoes PRIMARY KEY (id),
        CONSTRAINT UQ_perfil_permissoes UNIQUE (perfil_id, modulo, acao),
        CONSTRAINT FK_perfil_permissoes_perfil FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE usuarios (
        id            CHAR(36)      NOT NULL DEFAULT (UUID()),
        email         VARCHAR(200)  NOT NULL,
        senha_hash    VARCHAR(255)  NOT NULL,
        nome_completo VARCHAR(300)  NOT NULL,
        tipo          ENUM('admin','gestor','funcionario','beneficiario') NOT NULL DEFAULT 'gestor',
        ativo         TINYINT(1)    NOT NULL DEFAULT 1,
        entidade_id   CHAR(36),
        perfil_id     CHAR(36)      NOT NULL,
        created_at    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at    DATETIME(6),
        CONSTRAINT PK_usuarios PRIMARY KEY (id),
        CONSTRAINT UQ_usuarios_email UNIQUE (email),
        CONSTRAINT FK_usuarios_perfil FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id          CHAR(36)    NOT NULL DEFAULT (UUID()),
        usuario_id  CHAR(36)    NOT NULL,
        hash        CHAR(64)    NOT NULL,
        expira_em   DATETIME    NOT NULL,
        revogado    TINYINT(1)  NOT NULL DEFAULT 0,
        user_agent  TEXT,
        ip_address  VARCHAR(45),
        created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT PK_refresh_tokens PRIMARY KEY (id),
        CONSTRAINT UQ_refresh_tokens_hash UNIQUE (hash),
        CONSTRAINT FK_refresh_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS usuarios`);
    await queryRunner.query(`DROP TABLE IF EXISTS perfil_permissoes`);
    await queryRunner.query(`DROP TABLE IF EXISTS perfis`);
  }
}
