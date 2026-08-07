import { createClient } from '@supabase/supabase-js';

const url = 'https://qrzszjogxrrjqjkoowoi.supabase.co';
const key = 'sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY';
const sb = createClient(url, key);

async function qa() {
  console.log('=== INICIANDO QA DE BENEFICIÁRIOS ===\n');

  // 1. Obter a Turma de Teste QA - Futebol Manhã
  const { data: turmas, error: errT } = await sb
    .from('turmas')
    .select('*')
    .eq('nome', 'Turma QA - Futebol Manhã')
    .single();

  if (errT || !turmas) {
    console.error('Erro ao buscar turma de teste:', errT);
    return;
  }
  console.log('1. Turma de Teste QA Localizada:');
  console.log('   - Nome:', turmas.nome);
  console.log('   - ID:', turmas.id);
  console.log('   - Vagas Totais:', turmas.vagas_totais);

  // 2. Testar Teste 1: Cadastro Administrativo Direto
  console.log('\n2. Executando Teste 1: Cadastro Administrativo Direto...');
  const benAdminData = {
    matricula: 'QA-ADMIN-' + Math.floor(Math.random() * 8999 + 1000),
    nome_completo: 'Carlos Eduardo QA Admin',
    cpf: '111.222.333-44',
    data_nascimento: '2012-05-15',
    status: 'aprovado',
    origem: 'interna'
  };

  const { data: benAdmin, error: errBenAdmin } = await sb.from('beneficiarios').insert(benAdminData).select().single();
  if (errBenAdmin) {
    console.error('   ❌ FALHA no Cadastro Administrativo:', errBenAdmin.message);
  } else {
    console.log('   ✅ Cadastro Administrativo Realizado: ID', benAdmin.id, '| Nome:', benAdmin.nome_completo);

    const { error: errVincAdmin } = await sb.from('beneficiario_turmas').insert({
      beneficiario_id: benAdmin.id,
      turma_id: turmas.id,
      status: 'ativo'
    });

    if (errVincAdmin) {
      console.error('   ❌ FALHA ao vincular Beneficiário à Turma:', errVincAdmin.message);
    } else {
      console.log('   ✅ Vínculo à Turma Criado com Sucesso!');
    }
  }

  // 3. Testar Teste 2: Cadastro via Pré-Inscrição Pública (Futebol de Campo)
  console.log('\n3. Executando Teste 2: Cadastro via Pré-Inscrição Pública (Futebol de Campo)...');
  const benPublicoFutebol = {
    matricula: 'PRE-' + Math.floor(Math.random() * 8999 + 1000),
    nome_completo: 'Mariana Silva QA Pré-Inscrição Futebol',
    cpf: '999.888.777-66',
    data_nascimento: '2014-09-20',
    status: 'novo_cadastro',
    origem: 'online'
  };

  const { data: benPubFut, error: errPubFut } = await sb.from('beneficiarios').insert(benPublicoFutebol).select().single();
  if (errPubFut) {
    console.error('   ❌ FALHA na Pré-Inscrição Futebol:', errPubFut.message);
  } else {
    console.log('   ✅ Pré-Inscrição Futebol Realizada: ID', benPubFut.id, '| Status:', benPubFut.status);
    
    const { error: errVincFut } = await sb.from('beneficiario_turmas').insert({
      beneficiario_id: benPubFut.id,
      turma_id: turmas.id,
      status: 'ativo'
    });

    if (errVincFut) console.error('   ❌ FALHA no Vínculo:', errVincFut.message);
    else console.log('   ✅ Vínculo à Turma Criado com Sucesso!');
  }

  // 4. Testar Teste 3: Cadastro via Pré-Inscrição Pública (Futsal)
  console.log('\n4. Executando Teste 3: Cadastro via Pré-Inscrição Pública (Futsal)...');
  const { data: turmaFutsal } = await sb.from('turmas').select('*').eq('nome', 'Turma QA - Futsal Tarde').single();
  const benPublicoFutsal = {
    matricula: 'PRE-' + Math.floor(Math.random() * 8999 + 1000),
    nome_completo: 'Lucas Gabriel QA Pré-Inscrição Futsal',
    cpf: '555.444.333-22',
    data_nascimento: '2015-03-10',
    status: 'novo_cadastro',
    origem: 'online'
  };

  const { data: benPubFutsal, error: errPubFutsal } = await sb.from('beneficiarios').insert(benPublicoFutsal).select().single();
  if (errPubFutsal) {
    console.error('   ❌ FALHA na Pré-Inscrição Futsal:', errPubFutsal.message);
  } else {
    console.log('   ✅ Pré-Inscrição Futsal Realizada: ID', benPubFutsal.id, '| Status:', benPubFutsal.status);

    if (turmaFutsal) {
      const { error: errVincFutsal } = await sb.from('beneficiario_turmas').insert({
        beneficiario_id: benPubFutsal.id,
        turma_id: turmaFutsal.id,
        status: 'ativo'
      });

      if (errVincFutsal) console.error('   ❌ FALHA no Vínculo Futsal:', errVincFutsal.message);
      else console.log('   ✅ Vínculo Pendente de Futsal Criado com Sucesso!');
    }
  }

  // 5. Limpeza de beneficiários de QA gerados (preservando as turmas de teste)
  console.log('\n5. Limpeza pós-QA de Beneficiários...');
  const { error: errDelVinc } = await sb.from('beneficiario_turmas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: errDelBen } = await sb.from('beneficiarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (!errDelVinc && !errDelBen) {
    console.log('   ✅ Beneficiários de teste limpos! Turmas de QA mantidas prontas para uso.');
  } else {
    console.error('   ⚠️ Erro na limpeza:', errDelVinc || errDelBen);
  }

  console.log('\n=== QA CONCLUÍDO COM SUCESSO ===');
}

qa();
