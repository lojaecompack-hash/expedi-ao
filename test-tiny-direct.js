// Teste direto da API Tiny sem framework
const https = require('https');

const token = '429599f5e4eae058ca9e29b4065946aeccd4d71cd63fe82ddc01fc2df8156987';

// Estoque como objeto JSON (a API parece querer JSON, não XML)
const estoqueObj = {
  estoque: {
    idProduto: 340135501,
    tipo: 'E',
    quantidade: 1,
    observacoes: 'Teste direto'
  }
};

const postData = `token=${token}&formato=json&estoque=${encodeURIComponent(JSON.stringify(estoqueObj))}`;

const options = {
  hostname: 'api.tiny.com.br',
  port: 443,
  path: '/api2/produto.atualizar.estoque.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('=== TESTE DIRETO API TINY ===');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Body:', postData);
console.log('');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('');
    console.log('Resposta:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Erro:', e.message);
});

req.write(postData);
req.end();
