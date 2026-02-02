import * as XLSX from 'xlsx';

console.log('XLSX object:', typeof XLSX);
console.log('XLSX keys:', Object.keys(XLSX).slice(0, 10));
console.log('XLSX.readFile:', typeof XLSX.readFile);
console.log('XLSX.default:', typeof XLSX.default);

if (XLSX.default) {
  console.log('Has default export');
  console.log('default.readFile:', typeof XLSX.default.readFile);
}

// Testar leitura
try {
  const xlsxModule = XLSX;
  console.log('xlsxModule.readFile:', typeof xlsxModule.readFile);
  
  if (typeof xlsxModule.readFile === 'function') {
    const workbook = xlsxModule.readFile('./relatorio_extracao_apontamento_de_producao.xlsx');
    console.log('✓ Arquivo lido com sucesso!');
    console.log('Sheets:', workbook.SheetNames.length);
  }
} catch (error) {
  console.error('✗ Erro:', error.message);
}
