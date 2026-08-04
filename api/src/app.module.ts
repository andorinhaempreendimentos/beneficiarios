import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ObjetosModule } from './modules/objetos/objetos.module';
import { OrganizacoesModule } from './modules/organizacoes/organizacoes.module';
import { NucleosModule } from './modules/nucleos/nucleos.module';
import { AtividadesModule } from './modules/atividades/atividades.module';
import { TurmasModule } from './modules/turmas/turmas.module';
import { BeneficiariosModule } from './modules/beneficiarios/beneficiarios.module';
import { FuncionariosModule } from './modules/funcionarios/funcionarios.module';
import { EquipamentosModule } from './modules/equipamentos/equipamentos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { PerfisModule } from './modules/usuarios/perfis.module';
import { InscricoesModule } from './modules/inscricoes/inscricoes.module';
import { PresencaModule } from './modules/presenca/presenca.module';
import { PontoModule } from './modules/ponto/ponto.module';
import { ComprovacoesModule } from './modules/comprovacoes/comprovacoes.module';
import { StorageModule } from './storage/storage.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { ConfiguracoesModule } from './modules/configuracoes/configuracoes.module';
import { IbgeModule } from './modules/ibge/ibge.module';
import { PermissaoGuard } from './common/guards/permissao.guard';
import { configuration } from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { dataSourceOptions } from './database/data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entidades
import { Objeto } from './modules/objetos/objeto.entity';
import { Organizacao } from './modules/organizacoes/organizacao.entity';
import { Nucleo } from './modules/nucleos/nucleo.entity';
import { Atividade } from './modules/atividades/atividade.entity';
import { AtividadePergunta } from './modules/atividades/atividade-pergunta.entity';
import { AtividadeTurno } from './modules/atividades/atividade-turno.entity';
import { Turma } from './modules/turmas/turma.entity';
import { TurmaHorario } from './modules/turmas/turma-horario.entity';
import { TurmaResponsavel } from './modules/turmas/turma-responsavel.entity';
import { Beneficiario } from './modules/beneficiarios/beneficiario.entity';
import { BeneficiarioTurma } from './modules/beneficiarios/beneficiario-turma.entity';
import { BeneficiarioAnexo } from './modules/beneficiarios/beneficiario-anexo.entity';
import { BeneficiarioParq } from './modules/beneficiarios/beneficiario-parq.entity';
import { Funcionario } from './modules/funcionarios/funcionario.entity';
import { FuncionarioJornada } from './modules/funcionarios/funcionario-jornada.entity';
import { Equipamento } from './modules/equipamentos/equipamento.entity';
import { Inscricao } from './modules/inscricoes/inscricao.entity';
import { RegistroPresenca } from './modules/presenca/registro-presenca.entity';
import { RegistroPonto } from './modules/ponto/registro-ponto.entity';
import { ConfirmacaoAtividade } from './modules/comprovacoes/confirmacao-atividade.entity';
import { Usuario } from './modules/usuarios/usuario.entity';
import { Perfil } from './modules/usuarios/perfil.entity';
import { PerfilPermissao } from './modules/usuarios/perfil-permissao.entity';
import { RefreshToken } from './modules/usuarios/refresh-token.entity';
import { Configuracao } from './modules/configuracoes/configuracao.entity';
import { AuditLog } from './modules/audit/audit-log.entity';
import { SeedService } from './database/seed/seed.service';

const ENTITIES = [
  Objeto, Organizacao, Nucleo,
  Atividade, AtividadePergunta, AtividadeTurno,
  Turma, TurmaHorario, TurmaResponsavel,
  Beneficiario, BeneficiarioTurma, BeneficiarioAnexo, BeneficiarioParq,
  Funcionario, FuncionarioJornada,
  Equipamento,
  Inscricao,
  RegistroPresenca,
  RegistroPonto,
  ConfirmacaoAtividade,
  Usuario, Perfil, PerfilPermissao, RefreshToken,
  Configuracao,
  AuditLog,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),

    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dataSourceOptions,
        retryAttempts: 3,
        retryDelay: 2000,
        verboseRetryLog: false,
        toRetry: (erro: Error & { code?: string }) =>
          erro.code !== 'ER_ACCESS_DENIED_ERROR' &&
          erro.code !== 'ER_BAD_DB_ERROR' &&
          erro.code !== 'ER_DBACCESS_DENIED_ERROR',
      }),
    }),

    TypeOrmModule.forFeature(ENTITIES),
    AuthModule,
    ObjetosModule,
    OrganizacoesModule,
    NucleosModule,
    AtividadesModule,
    TurmasModule,
    BeneficiariosModule,
    FuncionariosModule,
    EquipamentosModule,
    UsuariosModule,
    PerfisModule,
    InscricoesModule,
    PresencaModule,
    PontoModule,
    ComprovacoesModule,
    StorageModule,
    RelatoriosModule,
    ConfiguracoesModule,
    IbgeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SeedService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissaoGuard },
  ],
})
export class AppModule {}
