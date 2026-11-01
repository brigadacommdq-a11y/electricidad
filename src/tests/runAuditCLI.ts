/**
 * ELECTRA PLAN — Script de Ejecución de Auditoría CLI
 */
import { createDemoProject } from '../services/demoProject';
import { runAllSystemAuditTests, exportAuditReportAsText } from '../services/systemAuditService';

async function main() {
  console.log('⚡ Iniciando Auditoría General de ELECTRA PLAN...');
  const project = createDemoProject();
  const { summary, tests } = await runAllSystemAuditTests(project);

  console.log(`\n✅ Resumen de Auditoría:`);
  console.log(`- Pruebas Totales: ${summary.totalTests}`);
  console.log(`- Aprobadas: ${summary.passed}`);
  console.log(`- Fallidas: ${summary.failed}`);
  console.log(`- Dependencia de API/Red: ${summary.requiringExternalAPI}`);

  if (summary.failed > 0) {
    console.error('\n❌ Pruebas con fallos detectados:');
    for (const t of tests.filter(t => t.status === 'failed')) {
      console.error(`- [${t.moduleName}] ${t.name}: ${t.detail}`);
    }
    process.exit(1);
  } else {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS APROBADAS EXITOSAMENTE!');
  }
}

main().catch(err => {
  console.error('Error fatal durante la auditoría:', err);
  process.exit(1);
});
