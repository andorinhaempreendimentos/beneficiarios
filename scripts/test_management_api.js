const fs = require('fs');

async function main() {
  const content = fs.readFileSync('C:/Users/livia/.gemini/antigravity/mcp_oauth_tokens.json', 'utf8');
  const data = JSON.parse(content);
  const token = data['https://mcp.supabase.com/mcp'].token.access_token;
  const projectRef = 'qrzszjogxrrjqjkoowoi';

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'SELECT count(*) FROM beneficiarios WHERE deleted_at IS NULL;' })
  });

  console.log('Status HTTP:', res.status);
  const json = await res.json();
  console.log('Resultado:', json);
}

main().catch(err => console.error('Erro:', err));
