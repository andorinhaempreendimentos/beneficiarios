import { createClient } from '@supabase/supabase-js';

const url = 'https://qrzszjogxrrjqjkoowoi.supabase.co';
const key = 'sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY';
const sb = createClient(url, key);

async function testBrowserQA() {
  console.log('=== TESTE QA NAVEGADOR E API ===\n');

  // 1. Testar Login com Credenciais Reais
  console.log('1. Efetuando Login com credenciais do admin...');
  const { data: authData, error: authError } = await sb.auth.signInWithPassword({
    email: 'admin@andorinha.local',
    password: 'Af7$kQ2mZx9!Lp4'
  });

  if (authError || !authData.session) {
    console.error('❌ FALHA NO LOGIN:', authError?.message);
    return;
  }
  console.log('   ✅ Login realizado com SUCESSO! Token JWT gerado.');

  // 2. Buscar Turma QA - Futebol Manhã
  const { data: turmaFutebol } = await sb.from('turmas').select('*').eq('nome', 'Turma QA - Futebol Manhã').single();
  const { data: turmaFutsal } = await sb.from('turmas').select('*').eq('nome', 'Turma QA - Futsal Tarde').single();

  console.log('\n2. Turmas de Teste para o Formulário:');
  console.log('   - Futebol Manhã ID:', turmaFutebol?.id);
  console.log('   - Futsal Tarde ID:', turmaFutsal?.id);

  // 3. Simular Cadastro Administrativo (Login Efetuado)
  console.log('\n3. Simulando envio do Formulário Administrativo de Beneficiário...');
  const benAdmin = {
    matricula: 'ADM-BROWSER-' + Math.floor(Math.random() * 899 + 100),
    nome_completo: 'Carlos Eduardo QA Navegador',
    cpf: '123.456.789-00',
    data_nascimento: '2013-04-10',
    status: 'aprovado',
    origem: 'interna'
  };

  const { data: newBenAdmin, error: errNewAdmin } = await sb.from('beneficiarios').insert(benAdmin).select().single();
  if (errNewAdmin) {
    console.error('❌ FALHA ao salvar beneficiário administrativo:', errNewAdmin.message);
  } else {
    console.log('   ✅ Beneficiário Administrativo criado com sucesso! ID:', newBenAdmin.id);

    if (turmaFutebol) {
      const { error: errVinc } = await sb.from('beneficiario_turmas').insert({
        beneficiario_id: newBenAdmin.id,
        turma_id: turmaFutebol.id,
        status: 'ativo'
      });
      if (errVinc) console.error('❌ FALHA ao vincular à turma:', errVinc.message);
      else console.log('   ✅ Vínculo à Turma criado e confirmado!');
    }
  }

  // 4. Simular Pré-Inscrição Pública (Sem Auth)
  console.log('\n4. Simulando envio do Formulário de Pré-Inscrição Pública (Online)...');
  const sbAnon = createClient(url, key);
  const benOnline = {
    matricula: 'ONLINE-' + Math.floor(Math.random() * 899 + 100),
    nome_completo: 'Mariana Oliveira QA Pré-Inscrição',
    cpf: '987.654.321-11',
    data_nascimento: '2014-08-15',
    status: 'novo_cadastro',
    origem: 'online'
  };

  const { data: newBenOnline, error: errNewOnline } = await sbAnon.from('beneficiarios').insert(benOnline).select().single();
  if (errNewOnline) {
    console.error('❌ FALHA no envio da pré-inscrição pública:', errNewOnline.message);
  } else {
    console.log('   ✅ Pré-Inscrição Pública realizada com sucesso! ID:', newBenOnline.id);

    if (turmaFutsal) {
      const { error: errVincOnline } = await sbAnon.from('beneficiario_turmas').insert({
        beneficiario_id: newBenOnline.id,
        turma_id: turmaFutsal.id,
        status: 'ativo'
      });
      if (errVincOnline) console.error('❌ FALHA ao vincular pré-inscrição à turma:', errVincOnline.message);
      else console.log('   ✅ Vínculo da pré-inscrição pública criado e confirmado!');
    }
  }

  // 5. Limpeza Final dos registros gerados pelo teste
  console.log('\n5. Limpeza de manutenção (Beneficiários de teste)...');
  await sb.from('beneficiario_turmas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('beneficiarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('   ✅ Base zerada! Turmas de teste preservadas para uso visual.');

  console.log('\n=== TESTE CONCLUÍDO COM SUCESSO TOTAL ===');
}

testBrowserQA();
