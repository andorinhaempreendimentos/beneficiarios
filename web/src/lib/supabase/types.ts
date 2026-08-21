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
          nucleo_id: string
          tipo_aprovacao: Database["public"]["Enums"]["tipo_aprovacao"]
          updated_at: string
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
          nucleo_id: string
          tipo_aprovacao?: Database["public"]["Enums"]["tipo_aprovacao"]
          updated_at?: string
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
          nucleo_id?: string
          tipo_aprovacao?: Database["public"]["Enums"]["tipo_aprovacao"]
          updated_at?: string
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
          celular: string
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
          celular: string
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
          celular?: string
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
            foreignKeyName: "funcionarios_nucleo_id_fkey"
            columns: ["nucleo_id"]
            isOneToOne: false
            referencedRelation: "nucleos"
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
          disponivel_pre_inscricao: boolean
          em_funcionamento: boolean
          endereco: string | null
          id: string
          identificacao: string
          latitude: number | null
          longitude: number | null
          nome_local: string | null
          nome_responsavel: string | null
          numero: string | null
          organizacao_id: string
          regiao: string | null
          telefone_contato: string | null
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
          disponivel_pre_inscricao?: boolean
          em_funcionamento?: boolean
          endereco?: string | null
          id?: string
          identificacao: string
          latitude?: number | null
          longitude?: number | null
          nome_local?: string | null
          nome_responsavel?: string | null
          numero?: string | null
          organizacao_id: string
          regiao?: string | null
          telefone_contato?: string | null
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
          disponivel_pre_inscricao?: boolean
          em_funcionamento?: boolean
          endereco?: string | null
          id?: string
          identificacao?: string
          latitude?: number | null
          longitude?: number | null
          nome_local?: string | null
          nome_responsavel?: string | null
          numero?: string | null
          organizacao_id?: string
          regiao?: string | null
          telefone_contato?: string | null
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
      objetos: {
        Row: {
          codigo_objeto: string | null
          codigo_programa: string | null
          created_at: string
          data_evento: string | null
          data_inicio: string | null
          data_termino: string | null
          deleted_at: string | null
          descricao: string | null
          id: string
          nome: string
          nome_programa: string | null
          status: string
          termo_de_fomento: string | null
          tipo_duracao: Database["public"]["Enums"]["tipo_duracao_atividade"]
          updated_at: string
        }
        Insert: {
          codigo_objeto?: string | null
          codigo_programa?: string | null
          created_at?: string
          data_evento?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          nome_programa?: string | null
          status?: string
          termo_de_fomento?: string | null
          tipo_duracao?: Database["public"]["Enums"]["tipo_duracao_atividade"]
          updated_at?: string
        }
        Update: {
          codigo_objeto?: string | null
          codigo_programa?: string | null
          created_at?: string
          data_evento?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          nome_programa?: string | null
          status?: string
          termo_de_fomento?: string | null
          tipo_duracao?: Database["public"]["Enums"]["tipo_duracao_atividade"]
          updated_at?: string
        }
        Relationships: []
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
          idade_minima: number | null
          idade_maxima: number | null
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
          idade_minima?: number | null
          idade_maxima?: number | null
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
          idade_minima?: number | null
          idade_maxima?: number | null
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
      get_logo_url: { Args: never; Returns: string }
      has_permissao: {
        Args: { p_acao: string; p_modulo: string }
        Returns: boolean
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
    }
    Enums: {
      estado_equipamento: "otimo" | "bom" | "regular" | "ruim" | "inativo"
      sexo_beneficiario: "M" | "F" | "O" | "N"
      status_beneficiario_turma: "ativo" | "evadido" | "transferido"
      status_inscricao:
        | "pendente"
        | "reservada"
        | "aprovada"
        | "recusada"
        | "expirada"
        | "cancelada"
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
      status_beneficiario_turma: ["ativo", "evadido", "transferido"],
      status_inscricao: [
        "pendente",
        "reservada",
        "aprovada",
        "recusada",
        "expirada",
        "cancelada",
      ],
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
