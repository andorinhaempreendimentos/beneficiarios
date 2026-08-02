# Formulário: Cadastro de Beneficiário

Documentação dos campos e seções do formulário de cadastro de Beneficiários (Alunos/Atletas).

## Campos do Formulário

### 1. Identificação do Beneficiário
| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Foto** | Arquivo (`file`) | Opcional | Upload da foto de perfil do beneficiário |
| **Nome completo** | Texto (`text`) | **Obrigatório** | Nome completo |
| **Nome social** | Texto (`text`) | Opcional | Nome social se houver |
| **Data de Nasc.** | Data (`date`) | **Obrigatório** | Data de nascimento (Cálculo automático de idade na tela) |
| **Raça** | Seleção (`select2`) | Opcional | Opções: Preta, Parda, Branca, Amarela, Indígena, Outras |
| **Sexo** | Botões de opção (`radio`) | **Obrigatório** | Opções: Masculino, Feminino, Não Informar |
| **Data de cadastro** | Data (`date`) | **Obrigatório** | Data em que a ficha é cadastrada |
| **PCD** | Botões de opção (`radio`) | **Obrigatório** | Indica se é Pessoa com Deficiência (`Sim`/`Não`) |
| **Tipo de PCD** | Seleção (`select2`) | Opcional | Opções: Deficiência Visual, Auditiva, Física, Mental/Intelectual, Múltipla, Surdocegueira, Autismo (Leve, Moderado, Severo), Síndrome de Down, Outros |
| **Núcleo** | Seleção (`select2`) | Opcional | Núcleo/Polo de atendimento |
| **Status** | Seleção (`select2`) | Opcional | Opções: Novo cadastro, Comparecer a sede, Aguardando seletiva, Fila de espera, Desistente, Aprovado |
| **Comorbidades** | Seleção (`select`) | Opcional | Opções: Hipertensão, Diabete, Doença cardíaca, Doença renal crônica, Doença pulmonar crônica, Obesidade mórbida, Nenhuma das anteriores |
| **Nível de escolaridade** | Seleção (`select`) | Opcional | Opções: Sem educação formal, Pré-escola, Ensino Fundamental, Ensino Médio, EJA, Ensino Técnico, Ensino Superior, Pós-graduação |
| **Ocupação atual** | Seleção (`select`) | Opcional | Opções: Aposentado/pensionista, Autônomo, Desempregado, Empregado, Estudante, Trabalho doméstico não remunerado, Outro |
| **Informe sua ocupação atual** | Texto (`text`) | Opcional | Detalhamento se ocupação for "Outro" |
| **Situação da moradia** | Seleção (`select`) | Opcional | Opções: Própria quitada, Própria financiada, Alugada, Cedida por parentes/amigos, Outra |
| **Qual situação da moradia** | Texto (`text`) | Opcional | Detalhamento se moradia for "Outra" |
| **Benefício socioassistencial** | Seleção (`select`) | Opcional | Opções: Não, Bolsa Família, Aluguel social, Auxílio-reclusão, BPC, Minha casa minha vida, Benefício incapacidade temporária, Auxílio-acidente, Salário-família, Outro |
| **Qual benefício socioassistencial** | Texto (`text`) | Opcional | Detalhamento do benefício |
| **Telefone residencial** | Telefone (`text`) | Opcional | Telefone fixo com DDD |
| **Celular** | Telefone (`text`) | **Obrigatório** | Celular com DDD |
| **Celular com Whatsapp?** | Seleção (`select2`) | Opcional | Opções: Não informado, Sim, Não |
| **Autoriza Whatsapp como canal?** | Seleção (`select`) | Opcional | Opções: Não informado, Sim, Não |
| **Email** | Email (`text`) | Opcional | Email para contato |
| **Motivo da inscrição** | Seleção (`select2`) | Opcional | Opções: Fazer novos amigos, Melhorar a saúde, Melhorar o comportamento, Ocupar o tempo ocioso, Outros |
| **Participa de outro projeto?** | Botões de opção (`radio`) | Opcional | Opções: `Sim` / `Não` |
| **Qual outro projeto?** | Texto (`text`) | Opcional | Nome do outro projeto caso participe |
| **Nº de pessoas em casa** | Seleção (`select`) | Opcional | Opções: 2 pessoas, 3 pessoas, 4 pessoas, 4 pessoas ou mais, Sozinho |
| **Recebe Bolsa Auxílio?** | Botões de opção (`radio`) | Opcional | Opções: `Sim` / `Não` |
| **Qual Bolsa Auxílio?** | Texto (`text`) | Opcional | Especificação das bolsas recebidas |
| **Razões para inscrição** | Área de texto (`textarea`) | Opcional | Texto descritivo dos motivos |
| **Observações** | Área de texto (`textarea`) | Opcional | Observações gerais |

### 2. Endereço do Beneficiário
| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **CEP** | CEP com Máscara (`text`) | **Obrigatório** | Código postal |
| **Logradouro** | Texto (`text`) | **Obrigatório** | Nome da rua/avenida |
| **Número** | Texto (`text`) | **Obrigatório** | Número da residência |
| **Complemento** | Texto (`text`) | Opcional | Complemento do endereço |
| **Bairro** | Texto (`text`) | **Obrigatório** | Bairro |
| **Cidade** | Texto (`text`) | **Obrigatório** | Cidade |
| **Estado** | Texto (`text`) | **Obrigatório** | Estado (UF) |

### 3. Documentação do Beneficiário
| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **RG** | Texto (`text`) | Opcional | Número da identidade |
| **Órgão Expedidor** | Seleção (`select`) | Opcional | Opções: DETRAN, DIC, IFP, MM, PMERJ, MA, ME, CBM, *IPF, MT, CREA, CRM, SSP, CRA, OAB, OUTROS |
| **UF** | Texto (`text`) | Opcional | Estado expedidor do RG |
| **Nome do Pai** | Texto (`text`) | Opcional | Nome completo do pai |
| **Nome da Mãe** | Texto (`text`) | Opcional | Nome completo da mãe |
| **CPF** | CPF com Máscara (`text`) | Opcional | Número do CPF |
| **Número do NIS** | Texto (`text`) | Opcional | Número do NIS / PIS / PASEP |
| **Mora com** | Botões de opção (`radio`) | Opcional | Opções: Pais, Pai, Mãe, Avós, Parentes, Outros |
| **Tamanho do uniforme** | Botões de opção (`radio`) | Opcional | Opções: PP, P, M, G, GG, XG |
| **Uniforme Entregue?** | Botões de opção (`radio`) | Opcional | Opções: `Sim` / `Não` |

### 4. Documentação do Responsável
| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Nome do responsável** | Texto (`text`) | Opcional | Nome do responsável legal |
| **Email do responsável** | Email (`text`) | Opcional | Email de contato do responsável |
| **RG do responsável** | Texto (`text`) | Opcional | RG do responsável |
| **CPF do responsável** | CPF com Máscara (`text`) | Opcional | CPF do responsável |

### 5. Atividades e Turmas
| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Turma** *(Dinâmico)* | Seleção (`select2`) | Opcional | Seleção de turma/núcleo específica |
| **Status da Turma** *(Dinâmico)* | Seleção (`select`) | Opcional | Opções: `Ativo` ou `Evadido` |
| **Data de registro da turma** *(Dinâmico)* | Data (`date`) | Opcional | Data de inclusão na turma |

### 6. PAR-Q (Questionário de Prontidão para Atividade Física)
| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Perguntas PAR-Q 1 a 10** | Tabela com Rádios (`Sim`/`Não`) | Opcional | Respostas sobre saúde e aptidão física |
| **Atestado Médico** | Arquivo (`file`) | Condicional | Habilitado para upload se resposta for `Sim` na pergunta correspondente |

### 7. Rede de Ensino
| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Rede de ensino** | Seleção (`select2`) | Opcional | Opções: Estadual, Particular, Municipal, Filantrópica, Federal, Militar, Não estuda |
| **Nome da escola** | Seleção (`select2`) | Opcional | Seleção da escola cadastrada no sistema |
| **Turno** | Seleção (`select`) | Opcional | Opções: Manhã, Tarde, Noite, Integral |
| **Segmento** | Seleção (`select`) | Opcional | Opções: Educação Infantil, Fundamental I/II, Ensino Médio, Ensino Superior, Projeto Estratégico, Autonomia, Realfa, NSN, PCD |
| **Série** | Texto (`text`) | Opcional | Série escolar |
| **Turma** | Texto (`text`) | Opcional | Turma escolar |
| **Código do Atleta** | Texto (`text`) | Opcional | Código do atleta |

### 8. Gerenciar Anexos
| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **Descrição do Anexo** *(Dinâmico)* | Texto (`text`) | Opcional | Descrição/título do documento anexado |
| **Documento** *(Dinâmico)* | Arquivo (`file`) | **Obrigatório** (se adicionado) | Upload do arquivo |

---

## Botões e Ações
- **Colapsar/Expandir Seções**: Botões em cada header de card para alternar a exibição da seção.
- **Adicionar turma**: Adiciona novo vínculo de turma/atividade ao beneficiário.
- **Remover da turma**: Remove vínculo de turma do beneficiário.
- **Novo anexo**: Adiciona novo campo de upload de documento.
- **Remover anexo**: Remove o documento anexado.
- **Cadastrar Aluno**: Submete todo o formulário de cadastro.
