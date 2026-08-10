# ⚡ Extensão do Chrome - Preenchedor Automático de Beneficiários

Extensão leve (Manifest V3) criada para preencher automaticamente os formulários de inscrição pública e cadastro de beneficiários do projeto **Escolinhas de Futebol e Futsal de Palmas** em **1 clique**, evitando a digitação manual repetitiva em testes.

---

## 🛠️ Como Instalar no Google Chrome (30 segundos)

1. Abra o navegador **Google Chrome**.
2. Acesse o endereço `chrome://extensions` na barra de navegação (ou vá em **Menu (3 pontos)** > **Extensões** > **Gerenciar extensões**).
3. No canto superior direito, **ative a chave "Modo do desenvolvedor"**.
4. No canto superior esquerdo, clique no botão **"Carregar sem compactação"** (*Load unpacked*).
5. Selecione a pasta do projeto:
   `c:\projetos\andorinha\cadastro de beneficiarios\chrome-extension`

Pronto! A extensão **"Preenchedor Automático - Escolinhas de Palmas"** estará instalada e visível no ícone de quebra-cabeça 🧩 da barra do Chrome.

---

## 🚀 Como Usar

1. Acesse qualquer página com formulário de pré-inscrição aberto no seu navegador (ex: `https://beneficiarios-andorinha.vercel.app/inscricao/turma/...`).
2. Clique no ícone da extensão ⚡ na barra do Chrome.
3. Escolha uma das duas opções:
   - **✨ Preencher Aluno Padrão (12 Anos)**: Preenche com dados válidos de um aluno de 12 anos ("Gabriel Santos Silva"), CPF válido gerado, data de nascimento compatível, endereço em Palmas/TO, escola e autorizações.
   - **🎲 Gerar e Preencher Aluno Aleatório**: Gera nomes, CPFs válidos, idades (10 a 15 anos) e dados aleatórios dinâmicos.

Todos os campos, máscaras e validações do formulário em React serão preenchidos e validados automaticamente!
