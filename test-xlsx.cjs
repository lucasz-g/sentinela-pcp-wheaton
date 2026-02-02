const XLSX = require('xlsx');

console.log('Testando biblioteca XLSX...');
console.log('XLSX.readFile existe?', typeof XLSX.readFile);

try {
  const workbook = XLSX.readFile('./relatorio_extracao_apontamento_de_producao.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('✓ Arquivo lido com sucesso!');
  console.log('Total de linhas:', data.length);
  console.log('Primeiras colunas:', Object.keys(data[0]).slice(0, 5));
  console.log('Primeira linha:', JSON.stringify(data[0], null, 2).substring(0, 200));
} catch (error) {
  console.error('✗ Erro ao ler arquivo:', error.message);
}
