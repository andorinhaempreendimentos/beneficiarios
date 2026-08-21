export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      atividade_perguntas: {
        Row: {
          atividade_id: string
          created_at: string
          disponivel_inscricao: boolean
          enunciado: string
          id: string
          obrigatoria: boolean
          opcoes: string | null
          ordem: number
          tipo: Database["public"]["Enums"]["tipo_pergunta"]
          updated_at: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          disponivel_inscricao?: boolean
          enunciado: string
          id?: string
          obrigatoria?: boolean
          opcoes?: string | null
          ordem?: number
          tipo?: Database["public"]["Enums"]["tipo_pergunta"]
          updated_at?: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          disponivel_inscricao?: boolean
          enunciado?: string
          id?: string
          obrigatoria?: boolean
          opcoes?: string | null
          ordem?: number
          tipo?: Database["public"]["Enums"]["tipo_pergunta"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividade_perguntas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      atividade_turnos: {
        Row: {
          atividade_id: string
          created_at: string
          hora_fim: string
          hora_inicio: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          hora_fim: string
          hora_inicio: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividade_turnos_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          created_at: string
          deleted_at: string | null
          descricao: string | null
          disponivel_pre_inscricao: boolean
          id: string
          idade_maxima: number | null
          idade_minima: number | null
          nome: string
          nucleo_id: string | null
          tipo_aprovacao: Database["public"]["Enums"]["tipo_aprovacao"]
          updated_at: string
          uso_interno: boolean | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          disponivel_pre_inscricao?: boolean
          id?: string
          idade_maxima?: number | null
          idade_minima?: number | null
          nome: string
          nucleo_id?: string | null
          tipo_aprovacao?: Database["public"]["Enums"]["tipo_aprovacao"]
          updated_at?: string
          uso_interno?: boolean | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          disponivel_pre_inscricao?: boolean
          id?: string
          idade_maxima?: number | null
          idade_minima?: number | null
          nome?: string
          nucleo_id?: string | null
          tipo_aprovacao?: Database["public"]["Enums"]["tipo_aprovacao"]
          updated_at?: string
          uso_interno?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_complementares: {
        Row: {
          created_at: string
          data: string
          deleted_at: string | null
          descricao: string | null
          fotos_urls: string[] | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          nucleo_id: string | null
          objeto_id: string
          quantidade_participantes: number
          responsavel_id: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          deleted_at?: string | null
          descricao?: string | null
          fotos_urls?: string[] | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          nucleo_id?: string | null
          objeto_id: string
          quantidade_participantes?: number
          responsavel_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          deleted_at?: string | null
          descricao?: string | null
          fotos_urls?: string[] | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          nucleo_id?: string | null
          objeto_id?: string
          quantidade_participantes?: number
          responsavel_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_complementares_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_complementares_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_complementares_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          acao: string
          created_at: string
          entidade: string
          entidade_id: string | null
          id: string
          ip_address: string | null
          usuario_id: string | null
          valor_antes: Json | null
          valor_depois: Json | null
        }
        Insert: {
          acao: string
          created_at?: string
          entidade: string
          entidade_id?: string | null
          id?: string
          ip_address?: string | null
          usuario_id?: string | null
          valor_antes?: Json | null
          valor_depois?: Json | null
        }
        Update: {
          acao?: string
          created_at?: string
          entidade?: string
          entidade_id?: string | null
          id?: string
          ip_address?: string | null
          usuario_id?: string | null
          valor_antes?: Json | null
          valor_depois?: Json | null
        }
        Relationships: []
      }
      beneficiario_anexos: {
        Row: {
          beneficiario_id: string
          created_at: string
          id: string
          mime_type: string | null
          nome_original: string | null
          storage_key: string
          tamanho_bytes: number | null
          tipo: Database["public"]["Enums"]["tipo_anexo"]
          updated_at: string
        }
        Insert: {
          beneficiario_id: string
          created_at?: string
          id?: string
          mime_type?: string | null
          nome_original?: string | null
          storage_key: string
          tamanho_bytes?: number | null
          tipo?: Database["public"]["Enums"]["tipo_anexo"]
          updated_at?: string
        }
        Update: {
          beneficiario_id?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          nome_original?: string | null
          storage_key?: string
          tamanho_bytes?: number | null
          tipo?: Database["public"]["Enums"]["tipo_anexo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiario_anexos_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiario_parq: {
        Row: {
          beneficiario_id: string
          created_at: string
          data_resposta: string
          id: string
          respostas: Json
          updated_at: string
        }
        Insert: {
          beneficiario_id: string
          created_at?: string
          data_resposta?: string
          id?: string
          respostas: Json
          updated_at?: string
        }
        Update: {
          beneficiario_id?: string
          created_at?: string
          data_resposta?: string
          id?: string
          respostas?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiario_parq_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: true
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiario_presencas: {
        Row: {
          beneficiario_id: string
          criado_em: string
          execucao_aula_id: string
          id: string
          observacao: string | null
          status: Database["public"]["Enums"]["status_presenca"]
        }
        Insert: {
          beneficiario_id: string
          criado_em?: string
          execucao_aula_id: string
          id?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_presenca"]
        }
        Update: {
          beneficiario_id?: string
          criado_em?: string
          execucao_aula_id?: string
          id?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_presenca"]
        }
        Relationships: [
          {
            foreignKeyName: "beneficiario_presencas_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiario_presencas_execucao_aula_id_fkey"
            columns: ["execucao_aula_id"]
            isOneToOne: false
            referencedRelation: "execucoes_aula"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiario_turmas: {
        Row: {
          beneficiario_id: string
          created_at: string
          data_evasao: string | null
          data_matricula: string
          deleted_at: string | null
          id: string
          status: Database["public"]["Enums"]["status_beneficiario_turma"]
          turma_id: string
          updated_at: string
        }
        Insert: {
          beneficiario_id: string
          created_at?: string
          data_evasao?: string | null
          data_matricula?: string
          deleted_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_beneficiario_turma"]
          turma_id: string
          updated_at?: string
        }
        Update: {
          beneficiario_id?: string
          created_at?: string
          data_evasao?: string | null
          data_matricula?: string
          deleted_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_beneficiario_turma"]
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiario_turmas_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiario_turmas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiarios: {
        Row: {
          bairro: string | null
          beneficio_socioassistencial: string | null
          celular: string | null
          celular_responsavel: string | null
          cep: string | null
          cidade: string | null
          codigo_atleta: string | null
          comorbidades: string | null
          complemento: string | null
          cpf: string | null
          cpf_responsavel: string | null
          created_at: string
          data_cadastro: string
          data_nascimento: string
          deleted_at: string | null
          email: string | null
          email_responsavel: string | null
          estado: string | null
          foto_url: string | null
          id: string
          logradouro: string | null
          matricula: string
          mora_com: string | null
          nivel_escolaridade: string | null
          nome_completo: string
          nome_escola: string | null
          nome_mae: string | null
          nome_pai: string | null
          nome_responsavel: string | null
          nome_social: string | null
          nucleo_id: string | null
          numero: string | null
          numero_nis: string | null
          observacoes: string | null
          ocupacao_atual: string | null
          orgao_expedidor: string | null
          origem: string | null
          pcd: boolean
          pessoas_em_casa: string | null
          raca: string | null
          razoes_inscricao: string | null
          rede_ensino: string | null
          rg: string | null
          rg_responsavel: string | null
          segmento_escolar: string | null
          serie: string | null
          sexo: Database["public"]["Enums"]["sexo_beneficiario"]
          situacao_moradia: string | null
          status: string
          tamanho_uniforme: string | null
          telefone_residencial: string | null
          tipo_matricula: string
          tipo_pcd: string | null
          turma_escolar: string | null
          turno_escolar: string | null
          uf_expedidor: string | null
          uniforme_entregue: boolean
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          beneficio_socioassistencial?: string | null
          celular?: string | null
          celular_responsavel?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_atleta?: string | null
          comorbidades?: string | null
          complemento?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          data_cadastro?: string
          data_nascimento: string
          deleted_at?: string | null
          email?: string | null
          email_responsavel?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          logradouro?: string | null
          matricula: string
          mora_com?: string | null
          nivel_escolaridade?: string | null
          nome_completo: string
          nome_escola?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          nome_responsavel?: string | null
          nome_social?: string | null
          nucleo_id?: string | null
          numero?: string | null
          numero_nis?: string | null
          observacoes?: string | null
          ocupacao_atual?: string | null
          orgao_expedidor?: string | null
          origem?: string | null
          pcd?: boolean
          pessoas_em_casa?: string | null
          raca?: string | null
          razoes_inscricao?: string | null
          rede_ensino?: string | null
          rg?: string | null
          rg_responsavel?: string | null
          segmento_escolar?: string | null
          serie?: string | null
          sexo?: Database["public"]["Enums"]["sexo_beneficiario"]
          situacao_moradia?: string | null
          status?: string
          tamanho_uniforme?: string | null
          telefone_residencial?: string | null
          tipo_matricula?: string
          tipo_pcd?: string | null
          turma_escolar?: string | null
          turno_escolar?: string | null
          uf_expedidor?: string | null
          uniforme_entregue?: boolean
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          beneficio_socioassistencial?: string | null
          celular?: string | null
          celular_responsavel?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_atleta?: string | null
          comorbidades?: string | null
          complemento?: string | null
          cpf?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          data_cadastro?: string
          data_nascimento?: string
          deleted_at?: string | null
          email?: string | null
          email_responsavel?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          logradouro?: string | null
          matricula?: string
          mora_com?: string | null
          nivel_escolaridade?: string | null
          nome_completo?: string
          nome_escola?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          nome_responsavel?: string | null
          nome_social?: string | null
          nucleo_id?: string | null
          numero?: string | null
          numero_nis?: string | null
          observacoes?: string | null
          ocupacao_atual?: string | null
          orgao_expedidor?: string | null
          origem?: string | null
          pcd?: boolean
          pessoas_em_casa?: string | null
          raca?: string | null
          razoes_inscricao?: string | null
          rede_ensino?: string | null
          rg?: string | null
          rg_responsavel?: string | null
          segmento_escolar?: string | null
          serie?: string | null
          sexo?: Database["public"]["Enums"]["sexo_beneficiario"]
          situacao_moradia?: string | null
          status?: string
          tamanho_uniforme?: string | null
          telefone_residencial?: string | null
          tipo_matricula?: string
          tipo_pcd?: string | null
          turma_escolar?: string | null
          turno_escolar?: string | null
          uf_expedidor?: string | null
          uniforme_entregue?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiarios_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      concedentes: {
        Row: {
          cidade: string | null
          cnpj: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          esfera: string
          estado: string | null
          id: string
          nome: string
          responsavel_cargo: string | null
          responsavel_nome: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          esfera?: string
          estado?: string | null
          id?: string
          nome: string
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          esfera?: string
          estado?: string | null
          id?: string
          nome?: string
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          id: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      confirmacoes_atividade: {
        Row: {
          created_at: string
          data: string
          enviado_por: string | null
          id: string
          observacao: string | null
          storage_key: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          enviado_por?: string | null
          id?: string
          observacao?: string | null
          storage_key: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          enviado_por?: string | null
          id?: string
          observacao?: string | null
          storage_key?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmacoes_atividade_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmacoes_atividade_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      coordenador_nucleos: {
        Row: {
          ativo: boolean
          coordenador_id: string
          created_at: string
          nucleo_id: string
        }
        Insert: {
          ativo?: boolean
          coordenador_id: string
          created_at?: string
          nucleo_id: string
        }
        Update: {
          ativo?: boolean
          coordenador_id?: string
          created_at?: string
          nucleo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordenador_nucleos_coordenador_id_fkey"
            columns: ["coordenador_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordenador_nucleos_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          categoria: string | null
          conservacao: Database["public"]["Enums"]["estado_equipamento"]
          created_at: string
          data_aquisicao: string | null
          deleted_at: string | null
          fotos_keys: string | null
          id: string
          marca: string | null
          modelo: string | null
          nome: string
          nota_fiscal: string | null
          nucleo_id: string | null
          numero_serie: string | null
          objeto_id: string | null
          observacao: string | null
          quantidade: number
          updated_at: string
          valor_unitario: number | null
        }
        Insert: {
          categoria?: string | null
          conservacao?: Database["public"]["Enums"]["estado_equipamento"]
          created_at?: string
          data_aquisicao?: string | null
          deleted_at?: string | null
          fotos_keys?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome: string
          nota_fiscal?: string | null
          nucleo_id?: string | null
          numero_serie?: string | null
          objeto_id?: string | null
          observacao?: string | null
          quantidade?: number
          updated_at?: string
          valor_unitario?: number | null
        }
        Update: {
          categoria?: string | null
          conservacao?: Database["public"]["Enums"]["estado_equipamento"]
          created_at?: string
          data_aquisicao?: string | null
          deleted_at?: string | null
          fotos_keys?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          nota_fiscal?: string | null
          nucleo_id?: string | null
          numero_serie?: string | null
          objeto_id?: string | null
          observacao?: string | null
          quantidade?: number
          updated_at?: string
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamentos_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_nucleos: {
        Row: {
          localizacao: string | null
          material_id: string
          nucleo_id: string
          quantidade_atual: number
          updated_at: string
        }
        Insert: {
          localizacao?: string | null
          material_id: string
          nucleo_id: string
          quantidade_atual?: number
          updated_at?: string
        }
        Update: {
          localizacao?: string | null
          material_id?: string
          nucleo_id?: string
          quantidade_atual?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_nucleos_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_nucleos_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      execucoes_aula: {
        Row: {
          aprovado_em: string | null
          aprovado_por_user_id: string | null
          atualizado_em: string
          criado_em: string
          data: string
          foto_comprovante_url: string | null
          hora_fim_prevista: string
          hora_fim_real: string | null
          hora_inicio_prevista: string
          hora_inicio_real: string | null
          id: string
          justificativa_retroativa: string | null
          observacoes: string | null
          professor_id: string
          status: Database["public"]["Enums"]["status_execucao_aula"]
          status_aprovacao: Database["public"]["Enums"]["status_aprovacao_aula"]
          turma_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por_user_id?: string | null
          atualizado_em?: string
          criado_em?: string
          data: string
          foto_comprovante_url?: string | null
          hora_fim_prevista: string
          hora_fim_real?: string | null
          hora_inicio_prevista: string
          hora_inicio_real?: string | null
          id?: string
          justificativa_retroativa?: string | null
          observacoes?: string | null
          professor_id: string
          status?: Database["public"]["Enums"]["status_execucao_aula"]
          status_aprovacao?: Database["public"]["Enums"]["status_aprovacao_aula"]
          turma_id: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por_user_id?: string | null
          atualizado_em?: string
          criado_em?: string
          data?: string
          foto_comprovante_url?: string | null
          hora_fim_prevista?: string
          hora_fim_real?: string | null
          hora_inicio_prevista?: string
          hora_inicio_real?: string | null
          id?: string
          justificativa_retroativa?: string | null
          observacoes?: string | null
          professor_id?: string
          status?: Database["public"]["Enums"]["status_execucao_aula"]
          status_aprovacao?: Database["public"]["Enums"]["status_aprovacao_aula"]
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_aula_aprovado_por_user_id_fkey"
            columns: ["aprovado_por_user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_aula_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_aula_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionario_jornada: {
        Row: {
          ativo: boolean
          created_at: string
          dia_semana: number
          funcionario_id: string
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dia_semana: number
          funcionario_id: string
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dia_semana?: number
          funcionario_id?: string
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionario_jornada_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          alocado_em: string | null
          celular: string | null
          conselho: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_demissao: string | null
          data_nascimento: string | null
          deleted_at: string | null
          email: string | null
          foto_url: string | null
          funcao: string | null
          funcao_id: string | null
          id: string
          matricula: string
          nome_completo: string
          nucleo_id: string | null
          professor_responsavel: boolean
          registro_conselho: string | null
          remuneracao: number | null
          status: string
          updated_at: string
        }
        Insert: {
          alocado_em?: string | null
          celular?: string | null
          conselho?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          deleted_at?: string | null
          email?: string | null
          foto_url?: string | null
          funcao?: string | null
          funcao_id?: string | null
          id?: string
          matricula: string
          nome_completo: string
          nucleo_id?: string | null
          professor_responsavel?: boolean
          registro_conselho?: string | null
          remuneracao?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          alocado_em?: string | null
          celular?: string | null
          conselho?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          deleted_at?: string | null
          email?: string | null
          foto_url?: string | null
          funcao?: string | null
          funcao_id?: string | null
          id?: string
          matricula?: string
          nome_completo?: string
          nucleo_id?: string | null
          professor_responsavel?: boolean
          registro_conselho?: string | null
          remuneracao?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      funcoes: {
        Row: {
          created_at: string
          deleted_at: string | null
          descricao: string | null
          exige_conselho: boolean | null
          id: string
          nome: string
          perfil_id: string
          permite_login: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          exige_conselho?: boolean | null
          id?: string
          nome: string
          perfil_id: string
          permite_login?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          exige_conselho?: boolean | null
          id?: string
          nome?: string
          perfil_id?: string
          permite_login?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      inscricoes: {
        Row: {
          beneficiario_id: string
          created_at: string
          expira_em: string | null
          id: string
          observacoes: string | null
          origem: string
          respostas_formulario: Json | null
          status: Database["public"]["Enums"]["status_inscricao"]
          turma_id: string
          updated_at: string
        }
        Insert: {
          beneficiario_id: string
          created_at?: string
          expira_em?: string | null
          id?: string
          observacoes?: string | null
          origem?: string
          respostas_formulario?: Json | null
          status?: Database["public"]["Enums"]["status_inscricao"]
          turma_id: string
          updated_at?: string
        }
        Update: {
          beneficiario_id?: string
          created_at?: string
          expira_em?: string | null
          id?: string
          observacoes?: string | null
          origem?: string
          respostas_formulario?: Json | null
          status?: Database["public"]["Enums"]["status_inscricao"]
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscricoes_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricoes_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          deleted_at: string | null
          descricao: string | null
          estoque_minimo: number
          foto_url: string | null
          id: string
          nome: string
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          estoque_minimo?: number
          foto_url?: string | null
          id?: string
          nome: string
          unidade_medida: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          estoque_minimo?: number
          foto_url?: string | null
          id?: string
          nome?: string
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          beneficiario_id: string | null
          created_at: string
          data_movimentacao: string
          destino_nucleo_id: string | null
          foto_comprovante_url: string | null
          id: string
          material_id: string
          motivo: string | null
          nucleo_id: string
          observacoes: string | null
          quantidade: number
          quantidade_anterior: number
          quantidade_posterior: number
          responsavel_id: string
          termo_assinado: boolean
          tipo: string
        }
        Insert: {
          beneficiario_id?: string | null
          created_at?: string
          data_movimentacao?: string
          destino_nucleo_id?: string | null
          foto_comprovante_url?: string | null
          id?: string
          material_id: string
          motivo?: string | null
          nucleo_id: string
          observacoes?: string | null
          quantidade: number
          quantidade_anterior?: number
          quantidade_posterior?: number
          responsavel_id: string
          termo_assinado?: boolean
          tipo: string
        }
        Update: {
          beneficiario_id?: string | null
          created_at?: string
          data_movimentacao?: string
          destino_nucleo_id?: string | null
          foto_comprovante_url?: string | null
          id?: string
          material_id?: string
          motivo?: string | null
          nucleo_id?: string
          observacoes?: string | null
          quantidade?: number
          quantidade_anterior?: number
          quantidade_posterior?: number
          responsavel_id?: string
          termo_assinado?: boolean
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_destino_nucleo_id_fkey"
            columns: ["destino_nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      nucleo_atividades: {
        Row: {
          atividade_id: string
          created_at: string
          nucleo_id: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          nucleo_id: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          nucleo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nucleo_atividades_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nucleo_atividades_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      nucleos: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          data_fechamento: string | null
          data_inicio: string
          deleted_at: string | null
          dias_limite_retroativo: number | null
          disponivel_pre_inscricao: boolean
          em_funcionamento: boolean
          endereco: string | null
          estado: string | null
          id: string
          identificacao: string
          latitude: number | null
          longitude: number | null
          nome_local: string | null
          nome_responsavel: string | null
          numero: string | null
          organizacao_id: string
          permitir_chamada_retroativa: boolean | null
          regiao: string | null
          telefone_contato: string | null
          tipo_restricao_chamada: string | null
          tolerancia_fim_minutos: number | null
          tolerancia_inicio_minutos: number | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          data_fechamento?: string | null
          data_inicio: string
          deleted_at?: string | null
          dias_limite_retroativo?: number | null
          disponivel_pre_inscricao?: boolean
          em_funcionamento?: boolean
          endereco?: string | null
          estado?: string | null
          id?: string
          identificacao: string
          latitude?: number | null
          longitude?: number | null
          nome_local?: string | null
          nome_responsavel?: string | null
          numero?: string | null
          organizacao_id: string
          permitir_chamada_retroativa?: boolean | null
          regiao?: string | null
          telefone_contato?: string | null
          tipo_restricao_chamada?: string | null
          tolerancia_fim_minutos?: number | null
          tolerancia_inicio_minutos?: number | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          data_fechamento?: string | null
          data_inicio?: string
          deleted_at?: string | null
          dias_limite_retroativo?: number | null
          disponivel_pre_inscricao?: boolean
          em_funcionamento?: boolean
          endereco?: string | null
          estado?: string | null
          id?: string
          identificacao?: string
          latitude?: number | null
          longitude?: number | null
          nome_local?: string | null
          nome_responsavel?: string | null
          numero?: string | null
          organizacao_id?: string
          permitir_chamada_retroativa?: boolean | null
          regiao?: string | null
          telefone_contato?: string | null
          tipo_restricao_chamada?: string | null
          tolerancia_fim_minutos?: number | null
          tolerancia_inicio_minutos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nucleos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      objeto_cargos_previstos: {
        Row: {
          carga_horaria_semanal: string | null
          cargo_nome: string
          created_at: string
          id: string
          objeto_id: string
          quantidade_prevista: number
          remuneracao_mensal: number | null
          updated_at: string
        }
        Insert: {
          carga_horaria_semanal?: string | null
          cargo_nome: string
          created_at?: string
          id?: string
          objeto_id: string
          quantidade_prevista?: number
          remuneracao_mensal?: number | null
          updated_at?: string
        }
        Update: {
          carga_horaria_semanal?: string | null
          cargo_nome?: string
          created_at?: string
          id?: string
          objeto_id?: string
          quantidade_prevista?: number
          remuneracao_mensal?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objeto_cargos_previstos_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      objetos: {
        Row: {
          codigo_objeto: string | null
          codigo_programa: string | null
          concedente_id: string | null
          conta_bancaria_agencia: string | null
          conta_bancaria_banco: string | null
          conta_bancaria_conta: string | null
          created_at: string
          data_evento: string | null
          data_inicio: string | null
          data_termino: string | null
          deleted_at: string | null
          descricao: string | null
          edital_numero: string | null
          id: string
          meta_aulas_ano: number | null
          meta_beneficiarios: number | null
          meta_eventos_ano: number | null
          meta_frequencia_minima: number | null
          meta_nucleos: number | null
          meta_reunioes_ano: number | null
          meta_vulnerabilidade_minima: number | null
          modalidade_parceria: string | null
          nome: string
          nome_programa: string | null
          numero_processo_adm: string | null
          status: string
          termo_de_fomento: string | null
          tipo_duracao: Database["public"]["Enums"]["tipo_duracao_atividade"]
          updated_at: string
        }
        Insert: {
          codigo_objeto?: string | null
          codigo_programa?: string | null
          concedente_id?: string | null
          conta_bancaria_agencia?: string | null
          conta_bancaria_banco?: string | null
          conta_bancaria_conta?: string | null
          created_at?: string
          data_evento?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          deleted_at?: string | null
          descricao?: string | null
          edital_numero?: string | null
          id?: string
          meta_aulas_ano?: number | null
          meta_beneficiarios?: number | null
          meta_eventos_ano?: number | null
          meta_frequencia_minima?: number | null
          meta_nucleos?: number | null
          meta_reunioes_ano?: number | null
          meta_vulnerabilidade_minima?: number | null
          modalidade_parceria?: string | null
          nome: string
          nome_programa?: string | null
          numero_processo_adm?: string | null
          status?: string
          termo_de_fomento?: string | null
          tipo_duracao?: Database["public"]["Enums"]["tipo_duracao_atividade"]
          updated_at?: string
        }
        Update: {
          codigo_objeto?: string | null
          codigo_programa?: string | null
          concedente_id?: string | null
          conta_bancaria_agencia?: string | null
          conta_bancaria_banco?: string | null
          conta_bancaria_conta?: string | null
          created_at?: string
          data_evento?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          deleted_at?: string | null
          descricao?: string | null
          edital_numero?: string | null
          id?: string
          meta_aulas_ano?: number | null
          meta_beneficiarios?: number | null
          meta_eventos_ano?: number | null
          meta_frequencia_minima?: number | null
          meta_nucleos?: number | null
          meta_reunioes_ano?: number | null
          meta_vulnerabilidade_minima?: number | null
          modalidade_parceria?: string | null
          nome?: string
          nome_programa?: string | null
          numero_processo_adm?: string | null
          status?: string
          termo_de_fomento?: string | null
          tipo_duracao?: Database["public"]["Enums"]["tipo_duracao_atividade"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objetos_concedente_id_fkey"
            columns: ["concedente_id"]
            isOneToOne: false
            referencedRelation: "concedentes"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          nome_responsavel: string | null
          objeto_id: string
          status: string
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          nome_responsavel?: string | null
          objeto_id: string
          status?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          nome_responsavel?: string | null
          objeto_id?: string
          status?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizacoes_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      pendencias_gerais: {
        Row: {
          created_at: string
          created_by_id: string
          data_resolucao: string | null
          deleted_at: string | null
          descricao: string
          gravidade: string
          id: string
          nucleo_id: string
          observacoes_resolucao: string | null
          prazo: string | null
          providencias: string | null
          resolvido_por_id: string | null
          responsavel_id: string | null
          status: string
          supervisao_id: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_id: string
          data_resolucao?: string | null
          deleted_at?: string | null
          descricao: string
          gravidade: string
          id?: string
          nucleo_id: string
          observacoes_resolucao?: string | null
          prazo?: string | null
          providencias?: string | null
          resolvido_por_id?: string | null
          responsavel_id?: string | null
          status?: string
          supervisao_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_id?: string
          data_resolucao?: string | null
          deleted_at?: string | null
          descricao?: string
          gravidade?: string
          id?: string
          nucleo_id?: string
          observacoes_resolucao?: string | null
          prazo?: string | null
          providencias?: string | null
          resolvido_por_id?: string | null
          responsavel_id?: string | null
          status?: string
          supervisao_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendencias_gerais_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendencias_gerais_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendencias_gerais_resolvido_por_id_fkey"
            columns: ["resolvido_por_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendencias_gerais_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendencias_gerais_supervisao_id_fkey"
            columns: ["supervisao_id"]
            isOneToOne: false
            referencedRelation: "supervisoes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_permissoes: {
        Row: {
          acao: string
          created_at: string
          id: string
          modulo: string
          perfil_id: string
          permitido: boolean
          updated_at: string
        }
        Insert: {
          acao: string
          created_at?: string
          id?: string
          modulo: string
          perfil_id: string
          permitido?: boolean
          updated_at?: string
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          modulo?: string
          perfil_id?: string
          permitido?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_permissoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          is_sistema: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_sistema?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_sistema?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      refresh_tokens: {
        Row: {
          created_at: string
          expira_em: string
          hash: string
          id: string
          ip_address: string | null
          revogado: boolean
          updated_at: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string
          expira_em: string
          hash: string
          id?: string
          ip_address?: string | null
          revogado?: boolean
          updated_at?: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string
          expira_em?: string
          hash?: string
          id?: string
          ip_address?: string | null
          revogado?: boolean
          updated_at?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_ponto: {
        Row: {
          created_at: string
          data: string
          funcionario_id: string
          hora: string
          id: string
          observacao: string | null
          status: string
          tipo: Database["public"]["Enums"]["tipo_registro_ponto"]
          token_qr_hash: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          funcionario_id: string
          hora: string
          id?: string
          observacao?: string | null
          status?: string
          tipo: Database["public"]["Enums"]["tipo_registro_ponto"]
          token_qr_hash?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          funcionario_id?: string
          hora?: string
          id?: string
          observacao?: string | null
          status?: string
          tipo?: Database["public"]["Enums"]["tipo_registro_ponto"]
          token_qr_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_ponto_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_presenca: {
        Row: {
          beneficiario_id: string
          created_at: string
          data: string
          id: string
          observacao: string | null
          presente: boolean
          status: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          beneficiario_id: string
          created_at?: string
          data: string
          id?: string
          observacao?: string | null
          presente?: boolean
          status?: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          beneficiario_id?: string
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          presente?: boolean
          status?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_presenca_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "beneficiarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_presenca_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_prestacao_contas: {
        Row: {
          created_at: string
          dados_snapshot: Json
          data_fim: string
          data_inicio: string
          emitido_por_id: string | null
          id: string
          objeto_id: string
          pareceres: Json
          signatarios: Json
          status: string
          tipo_periodo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dados_snapshot?: Json
          data_fim: string
          data_inicio: string
          emitido_por_id?: string | null
          id?: string
          objeto_id: string
          pareceres?: Json
          signatarios?: Json
          status?: string
          tipo_periodo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dados_snapshot?: Json
          data_fim?: string
          data_inicio?: string
          emitido_por_id?: string | null
          id?: string
          objeto_id?: string
          pareceres?: Json
          signatarios?: Json
          status?: string
          tipo_periodo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_prestacao_contas_emitido_por_id_fkey"
            columns: ["emitido_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorios_prestacao_contas_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisoes: {
        Row: {
          beneficiarios_esperados: number | null
          beneficiarios_presentes: number | null
          coordenador_id: string
          created_at: string
          data_supervisao: string
          deleted_at: string | null
          estrutura_avaliacao: string | null
          estrutura_observacoes: string | null
          grade_cumprida: boolean | null
          grade_observacoes: string | null
          hora_entrada: string
          hora_saida: string | null
          id: string
          materiais_avaliacao: string | null
          materiais_observacoes: string | null
          nucleo_id: string
          observacoes_gerais: string | null
          professor_presente: boolean | null
          professores_ids: string[] | null
          status: string
          uniformes_avaliacao: string | null
          uniformes_observacoes: string | null
          updated_at: string
        }
        Insert: {
          beneficiarios_esperados?: number | null
          beneficiarios_presentes?: number | null
          coordenador_id: string
          created_at?: string
          data_supervisao: string
          deleted_at?: string | null
          estrutura_avaliacao?: string | null
          estrutura_observacoes?: string | null
          grade_cumprida?: boolean | null
          grade_observacoes?: string | null
          hora_entrada: string
          hora_saida?: string | null
          id?: string
          materiais_avaliacao?: string | null
          materiais_observacoes?: string | null
          nucleo_id: string
          observacoes_gerais?: string | null
          professor_presente?: boolean | null
          professores_ids?: string[] | null
          status?: string
          uniformes_avaliacao?: string | null
          uniformes_observacoes?: string | null
          updated_at?: string
        }
        Update: {
          beneficiarios_esperados?: number | null
          beneficiarios_presentes?: number | null
          coordenador_id?: string
          created_at?: string
          data_supervisao?: string
          deleted_at?: string | null
          estrutura_avaliacao?: string | null
          estrutura_observacoes?: string | null
          grade_cumprida?: boolean | null
          grade_observacoes?: string | null
          hora_entrada?: string
          hora_saida?: string | null
          id?: string
          materiais_avaliacao?: string | null
          materiais_observacoes?: string | null
          nucleo_id?: string
          observacoes_gerais?: string | null
          professor_presente?: boolean | null
          professores_ids?: string[] | null
          status?: string
          uniformes_avaliacao?: string | null
          uniformes_observacoes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisoes_coordenador_id_fkey"
            columns: ["coordenador_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisoes_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisoes_fotos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          legenda: string | null
          ordem: number
          supervisao_id: string
          url: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          legenda?: string | null
          ordem?: number
          supervisao_id: string
          url: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          legenda?: string | null
          ordem?: number
          supervisao_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisoes_fotos_supervisao_id_fkey"
            columns: ["supervisao_id"]
            isOneToOne: false
            referencedRelation: "supervisoes"
            referencedColumns: ["id"]
          },
        ]
      }
      termos_entrega: {
        Row: {
          assinatura_url: string | null
          created_at: string
          data_devolucao_prev: string | null
          data_devolucao_real: string | null
          data_entrega: string
          entregador_id: string
          id: string
          movimentacao_id: string
          observacoes: string | null
          recebedor_id: string
          recebedor_tipo: string
          status: string
          updated_at: string
        }
        Insert: {
          assinatura_url?: string | null
          created_at?: string
          data_devolucao_prev?: string | null
          data_devolucao_real?: string | null
          data_entrega?: string
          entregador_id: string
          id?: string
          movimentacao_id: string
          observacoes?: string | null
          recebedor_id: string
          recebedor_tipo: string
          status?: string
          updated_at?: string
        }
        Update: {
          assinatura_url?: string | null
          created_at?: string
          data_devolucao_prev?: string | null
          data_devolucao_real?: string | null
          data_entrega?: string
          entregador_id?: string
          id?: string
          movimentacao_id?: string
          observacoes?: string | null
          recebedor_id?: string
          recebedor_tipo?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "termos_entrega_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termos_entrega_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      turma_horarios: {
        Row: {
          created_at: string
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_horarios_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      turma_responsaveis: {
        Row: {
          created_at: string
          funcionario_id: string
          id: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          funcionario_id: string
          id?: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          funcionario_id?: string
          id?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_responsaveis_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turma_responsaveis_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          atividade_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          deleted_at: string | null
          exclusiva: boolean
          id: string
          idade_maxima: number | null
          idade_minima: number | null
          nome: string
          nucleo_id: string
          permitir_fila_espera: boolean
          status_inicial: Database["public"]["Enums"]["status_inscricao"]
          updated_at: string
          vagas_totais: number
        }
        Insert: {
          atividade_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          exclusiva?: boolean
          id?: string
          idade_maxima?: number | null
          idade_minima?: number | null
          nome: string
          nucleo_id: string
          permitir_fila_espera?: boolean
          status_inicial?: Database["public"]["Enums"]["status_inscricao"]
          updated_at?: string
          vagas_totais?: number
        }
        Update: {
          atividade_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          exclusiva?: boolean
          id?: string
          idade_maxima?: number | null
          idade_minima?: number | null
          nome?: string
          nucleo_id?: string
          permitir_fila_espera?: boolean
          status_inicial?: Database["public"]["Enums"]["status_inscricao"]
          updated_at?: string
          vagas_totais?: number
        }
        Relationships: [
          {
            foreignKeyName: "turmas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          email: string
          entidade_id: string | null
          id: string
          is_professor: boolean | null
          nome_completo: string
          perfil_id: string
          tipo: Database["public"]["Enums"]["tipo_usuario"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          email: string
          entidade_id?: string | null
          id: string
          is_professor?: boolean | null
          nome_completo: string
          perfil_id: string
          tipo?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          email?: string
          entidade_id?: string | null
          id?: string
          is_professor?: boolean | null
          nome_completo?: string
          perfil_id?: string
          tipo?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aprovar_inscricao: {
        Args: { p_id: string }
        Returns: {
          beneficiario_id: string
          created_at: string
          expira_em: string | null
          id: string
          observacoes: string | null
          origem: string
          respostas_formulario: Json | null
          status: Database["public"]["Enums"]["status_inscricao"]
          turma_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inscricoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auto_encerrar_aulas: { Args: never; Returns: undefined }
      cancelar_inscricao: {
        Args: { p_id: string }
        Returns: {
          beneficiario_id: string
          created_at: string
          expira_em: string | null
          id: string
          observacoes: string | null
          origem: string
          respostas_formulario: Json | null
          status: Database["public"]["Enums"]["status_inscricao"]
          turma_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inscricoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      criar_inscricao: {
        Args: {
          p_beneficiario_id: string
          p_observacoes?: string
          p_respostas?: Json
          p_turma_id: string
        }
        Returns: {
          beneficiario_id: string
          created_at: string
          expira_em: string | null
          id: string
          observacoes: string | null
          origem: string
          respostas_formulario: Json | null
          status: Database["public"]["Enums"]["status_inscricao"]
          turma_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inscricoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_entidade_id: { Args: never; Returns: string }
      current_tipo_usuario: { Args: never; Returns: string }
      desmatricular_beneficiario: {
        Args: { p_beneficiario_id: string; p_turma_id: string }
        Returns: undefined
      }
      get_logo_url: { Args: never; Returns: string }
      has_permissao: {
        Args: { p_acao: string; p_modulo: string }
        Returns: boolean
      }
      lembrete_supervisoes_rascunho: { Args: never; Returns: undefined }
      matricular_beneficiario: {
        Args: { p_beneficiario_id: string; p_turma_id: string }
        Returns: undefined
      }
      migrar_beneficiario_turma: {
        Args: {
          p_beneficiario_id: string
          p_turma_destino: string
          p_turma_origem: string
        }
        Returns: undefined
      }
      recusar_inscricao: {
        Args: { p_id: string; p_observacoes?: string }
        Returns: {
          beneficiario_id: string
          created_at: string
          expira_em: string | null
          id: string
          observacoes: string | null
          origem: string
          respostas_formulario: Json | null
          status: Database["public"]["Enums"]["status_inscricao"]
          turma_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inscricoes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unaccent: { Args: { "": string }; Returns: string }
      verificar_estoques_baixos: { Args: never; Returns: undefined }
      verificar_termos_atrasados: { Args: never; Returns: undefined }
    }
    Enums: {
      estado_equipamento: "otimo" | "bom" | "regular" | "ruim" | "inativo"
      sexo_beneficiario: "M" | "F" | "O" | "N"
      status_aprovacao_aula: "aprovado" | "pendente_aprovacao" | "rejeitado"
      status_beneficiario_turma: "ativo" | "evadido" | "transferido"
      status_execucao_aula:
        | "em_andamento"
        | "concluida"
        | "pendente_aprovacao"
        | "rejeitada"
        | "encerrada_automaticamente"
      status_inscricao:
        | "pendente"
        | "reservada"
        | "aprovada"
        | "recusada"
        | "expirada"
        | "cancelada"
      status_presenca: "presente" | "falta" | "falta_justificada"
      tipo_anexo:
        | "atestado_medico"
        | "rg"
        | "cpf"
        | "comprovante_residencia"
        | "foto"
        | "outro"
      tipo_aprovacao: "automatica" | "manual"
      tipo_duracao_atividade: "pontual" | "periodo"
      tipo_pergunta: "texto" | "sim_nao" | "numero" | "opcoes"
      tipo_registro_ponto:
        | "entrada"
        | "saida"
        | "entrada_intervalo"
        | "saida_intervalo"
      tipo_usuario: "admin" | "gestor" | "funcionario" | "beneficiario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_equipamento: ["otimo", "bom", "regular", "ruim", "inativo"],
      sexo_beneficiario: ["M", "F", "O", "N"],
      status_aprovacao_aula: ["aprovado", "pendente_aprovacao", "rejeitado"],
      status_beneficiario_turma: ["ativo", "evadido", "transferido"],
      status_execucao_aula: [
        "em_andamento",
        "concluida",
        "pendente_aprovacao",
        "rejeitada",
        "encerrada_automaticamente",
      ],
      status_inscricao: [
        "pendente",
        "reservada",
        "aprovada",
        "recusada",
        "expirada",
        "cancelada",
      ],
      status_presenca: ["presente", "falta", "falta_justificada"],
      tipo_anexo: [
        "atestado_medico",
        "rg",
        "cpf",
        "comprovante_residencia",
        "foto",
        "outro",
      ],
      tipo_aprovacao: ["automatica", "manual"],
      tipo_duracao_atividade: ["pontual", "periodo"],
      tipo_pergunta: ["texto", "sim_nao", "numero", "opcoes"],
      tipo_registro_ponto: [
        "entrada",
        "saida",
        "entrada_intervalo",
        "saida_intervalo",
      ],
      tipo_usuario: ["admin", "gestor", "funcionario", "beneficiario"],
    },
  },
} as const
