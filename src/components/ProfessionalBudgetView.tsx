/**
 * ELECTRA PLAN — Presupuestador Profesional y Cotizaciones (Fase 6)
 * Genera cotizaciones formales completas para clientes y empresas:
 * 1. Cómputo métrico de materiales detallado (cañerías, conductores, cajas, protecciones).
 * 2. Cómputo de mano de obra profesional por boca (IUG, TUG, TUE, tableros DIN, jabalina PAT).
 * 3. Hoja de Cotización Formal imprimible con membrete, condiciones comerciales, plazos y garantía.
 * 4. Exportación a CSV y modo de impresión técnica.
 */
import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Printer,
  Download,
  ShoppingBag,
  Wrench,
  FileCheck,
  Building,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Project, BOMItem } from '../types/electra';
import { generateBOM } from '../services/bomService';

interface ProfessionalBudgetViewProps {
  project: Project;
  onUpdateProject?: (updater: (prev: Project) => Project) => void;
}

export const ProfessionalBudgetView: React.FC<ProfessionalBudgetViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [activeTab, setActiveTab] = useState<'materiales' | 'mano_de_obra' | 'cotizacion_formal'>('cotizacion_formal');
  const [marginPercent, setMarginPercent] = useState<number>(15);

  // Tarifas de Mano de Obra configurables (en moneda seleccionada)
  const [laborRates, setLaborRates] = useState({
    bocaLuz: 8500, // Por boca IUG (cañería + cableado + artefacto)
    bocaToma: 9200, // Por boca TUG (cañería + cableado + módulo)
    bocaEspecial: 14500, // Por boca TUE (aire, termotanque, bomba)
    tableroPorPolo: 6500, // Montaje y cableado de riel DIN por polo
    jabalinaPAT: 22000, // Hincado de jabalina, cámara de inspección y medición de resistencia
    tramiteCertificacion: 35000, // Confección de memoria técnica y protocolo de medición
  });

  // Datos Comerciales para el Presupuesto Formal
  const [clientInfo, setClientInfo] = useState({
    clientName: project.metadata.client || 'Propietario / Comitente',
    clientPhone: '11-4567-8900',
    clientEmail: 'contacto@cliente.com',
    electricianName: project.metadata.author || 'Téc. Electricista Matriculado',
    electricianLicense: 'COPIME Mat. Nº 14.892',
    electricianPhone: '11-9876-5432',
    executionDays: 14,
    validityDays: 15,
    advancePercent: 40,
    warrantyMonths: 12,
  });

  // Materiales automáticos derivados del proyecto
  const bomItems = useMemo(() => generateBOM(project, marginPercent), [project, marginPercent]);
  const materialsSubtotal = useMemo(() => bomItems.reduce((acc, it) => acc + it.subtotal, 0), [bomItems]);

  // Recuento de Bocas y Tareas para Mano de Obra
  const countLights = project.symbols.filter((s) => s.type === 'luminaria').length;
  const countSockets = project.symbols.filter((s) => s.type === 'tomacorriente').length;
  const countSpecialSockets = project.symbols.filter((s) => s.type === 'toma_especial' || s.category === 'utilizacion').length;
  const countPoles = project.circuits.length * 2 + 4; // 2 polos por PIA + 4 polos cabecera (IGA + ID)
  const countGrounds = project.symbols.filter((s) => s.type === 'puesta_tierra').length || 1;

  // Cómputo de Mano de Obra
  const laborItems = useMemo(() => [
    {
      id: 'labor_iug',
      task: 'Bocas de Iluminación General (IUG)',
      description: 'Canalización en losa/pared, tendido de cables y conexión de portalámparas/teclas.',
      quantity: countLights,
      unit: 'Boca',
      rate: laborRates.bocaLuz,
      subtotal: countLights * laborRates.bocaLuz,
    },
    {
      id: 'labor_tug',
      task: 'Bocas de Tomacorrientes Generales (TUG)',
      description: 'Canalización, amurado de cajas 10x5, tendido 3x2.5mm² y armado de módulos.',
      quantity: countSockets,
      unit: 'Boca',
      rate: laborRates.bocaToma,
      subtotal: countSockets * laborRates.bocaToma,
    },
    {
      id: 'labor_tue',
      task: 'Bocas de Tomacorrientes de Uso Especial (TUE)',
      description: 'Línea exclusiva 4mm² para aire acondicionado, bomba o máquinas de taller.',
      quantity: countSpecialSockets,
      unit: 'Boca',
      rate: laborRates.bocaEspecial,
      subtotal: countSpecialSockets * laborRates.bocaEspecial,
    },
    {
      id: 'labor_tablero',
      task: 'Montaje y Cableado de Tablero Seccional DIN',
      description: 'Fijación de gabinete, peines bipolares, conexión de IGA, Disyuntor y PIAs.',
      quantity: countPoles,
      unit: 'Polo DIN',
      rate: laborRates.tableroPorPolo,
      subtotal: countPoles * laborRates.tableroPorPolo,
    },
    {
      id: 'labor_pat',
      task: 'Puesta a Tierra y Medición con Telurímetro',
      description: 'Hincado de jabalina 3/4" x 1.50m, cámara de inspección y certificado de PAT.',
      quantity: countGrounds,
      unit: 'Punto',
      rate: laborRates.jabalinaPAT,
      subtotal: countGrounds * laborRates.jabalinaPAT,
    },
    {
      id: 'labor_certif',
      task: 'Certificación Normativa y Protocolo AEA 90364',
      description: 'Medición de aislación con megóhmetro, cálculo de caída de tensión y protocolo de entrega.',
      quantity: 1,
      unit: 'Informe',
      rate: laborRates.tramiteCertificacion,
      subtotal: laborRates.tramiteCertificacion,
    },
  ], [countLights, countSockets, countSpecialSockets, countPoles, countGrounds, laborRates]);

  const laborSubtotal = useMemo(() => laborItems.reduce((acc, it) => acc + it.subtotal, 0), [laborItems]);
  const grandTotal = materialsSubtotal + laborSubtotal;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = 'Rubro;Concepto;Detalle;Cantidad;Unidad;Precio Unitario;Subtotal\n';
    csv += '# MATERIALES DE INSTALACIÓN\n';
    bomItems.forEach((it) => {
      csv += `"Materiales";"${it.name}";"${it.description}";${it.quantity};"${it.unit}";${it.unitPrice};${it.subtotal}\n`;
    });
    csv += '# MANO DE OBRA PROFESIONAL\n';
    laborItems.forEach((it) => {
      csv += `"Mano de Obra";"${it.task}";"${it.description}";${it.quantity};"${it.unit}";${it.rate};${it.subtotal}\n`;
    });
    csv += `;;;;;"SUBTOTAL MATERIALES";${materialsSubtotal}\n`;
    csv += `;;;;;"SUBTOTAL MANO DE OBRA";${laborSubtotal}\n`;
    csv += `;;;;;"TOTAL GENERAL PRESUPUESTO";${grandTotal}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Presupuesto_Electrico_${project.metadata.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F6F8] dark:bg-[#0D161C] text-[#18313B] dark:text-[#F1F5F9] transition-colors">
      {/* Cabecera del Presupuestador */}
      <div className="no-print bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#18313B] dark:text-white flex items-center gap-2">
              <span>Presupuestador Profesional & Cotizaciones</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                Mano de Obra + Materiales
              </span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Cómputo métrico riguroso, costos por boca y generador de cotizaciones formales para clientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1B2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#167D78] hover:bg-[#0F5E5A] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cotización</span>
          </button>
        </div>
      </div>

      {/* Selector de Pestañas del Presupuestador */}
      <div className="no-print bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('cotizacion_formal')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeTab === 'cotizacion_formal'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Hoja de Cotización Formal (Cliente)</span>
        </button>

        <button
          onClick={() => setActiveTab('mano_de_obra')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeTab === 'mano_de_obra'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Tarifas de Mano de Obra</span>
        </button>

        <button
          onClick={() => setActiveTab('materiales')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeTab === 'materiales'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Cómputo de Materiales ({bomItems.length})</span>
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* =========================================================================
            TAB 1: COTIZACIÓN FORMAL IMPRIMIBLE PARA EL CLIENTE
            ========================================================================= */}
        {activeTab === 'cotizacion_formal' && (
          <div className="max-w-4xl mx-auto bg-white text-slate-900 border-2 border-slate-300 rounded-sm p-6 sm:p-10 shadow-2xl space-y-6">
            {/* Membrete Formal de Presupuesto */}
            <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#167D78] block">
                  PRESUPUESTO DE INSTALACIÓN ELÉCTRICA
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {project.metadata.name || 'Vivienda Unifamiliar'}
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Ubicación: <strong>{project.metadata.address || 'Domicilio en plano'}</strong>
                </p>
                <p className="text-xs text-slate-600">
                  Norma de aplicación: <strong>AEA 90364-771</strong> · Tensión: <strong>220 V / 50 Hz</strong>
                </p>
              </div>

              <div className="sm:text-right space-y-1 text-xs">
                <div className="text-sm font-extrabold text-slate-900">{clientInfo.electricianName}</div>
                <div className="font-mono text-slate-600 text-[11px]">{clientInfo.electricianLicense}</div>
                <div className="text-slate-600">Tel: {clientInfo.electricianPhone}</div>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Fecha: {new Date().toLocaleDateString('es-AR')} · Validez: {clientInfo.validityDays} días
                </div>
              </div>
            </div>

            {/* Datos del Cliente y Plazo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Comitente / Cliente</span>
                <div className="font-bold text-sm text-slate-900 mt-0.5">{clientInfo.clientName}</div>
                <div className="text-slate-600 mt-0.5">Tel: {clientInfo.clientPhone} · {clientInfo.clientEmail}</div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Plazo y Condiciones</span>
                <div className="font-bold text-slate-900 mt-0.5">Plazo de obra estimado: {clientInfo.executionDays} días hábiles</div>
                <div className="text-slate-600 mt-0.5">Garantía por vicios ocultos: {clientInfo.warrantyMonths} meses</div>
              </div>
            </div>

            {/* Resumen Económico General */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex justify-between">
                <span>Resumen Consolidado del Presupuesto</span>
                <span>Moneda: {project.currency || 'ARS'}</span>
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                <div className="p-3.5 flex justify-between items-center bg-white hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 block">1. Materiales Normalizados (Cómputo Métrico Completo)</span>
                    <span className="text-slate-500 text-[11px]">
                      Conductores IRAM 2183, cañerías corrugadas ignífugas, aparamenta DIN e insumos ({bomItems.length} rubros).
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    $ {materialsSubtotal.toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="p-3.5 flex justify-between items-center bg-white hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 block">2. Mano de Obra Profesional Habilitada</span>
                    <span className="text-slate-500 text-[11px]">
                      Canalización, amurado, cableado, montaje de tablero, hincado de PAT y ensayo de aislación.
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    $ {laborSubtotal.toLocaleString('es-AR')}
                  </span>
                </div>

                {/* Total Final Destacado */}
                <div className="p-4 bg-emerald-50 flex justify-between items-center border-t-2 border-emerald-600">
                  <div>
                    <span className="font-extrabold text-base text-emerald-950 block">PRESUPUESTO TOTAL LLAVE EN MANO</span>
                    <span className="text-emerald-800 text-[11px]">
                      Incluye materiales, mano de obra, ensayos con instrumental y protocolo de entrega.
                    </span>
                  </div>
                  <span className="font-mono font-black text-xl sm:text-2xl text-emerald-700">
                    $ {grandTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Desglose de Mano de Obra */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Desglose de Mano de Obra por Tareas
              </h3>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                  <tr>
                    <th className="p-2">Tarea / Concepto</th>
                    <th className="p-2 text-center">Cantidad</th>
                    <th className="p-2 text-right">Precio Unit.</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {laborItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2 font-medium">{item.task}</td>
                      <td className="p-2 text-center font-mono">{item.quantity} {item.unit}</td>
                      <td className="p-2 text-right font-mono">$ {item.rate.toLocaleString('es-AR')}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">$ {item.subtotal.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Condiciones Comerciales y Forma de Pago */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-xs text-slate-700 space-y-2">
              <span className="font-bold text-slate-900 uppercase block text-[11px]">Condiciones de Pago y Ejecución:</span>
              <ul className="space-y-1 list-disc pl-4 text-[11px] leading-relaxed">
                <li><strong>Anticipo {clientInfo.advancePercent}%:</strong> A la firma de la orden de trabajo para acopio de materiales en corralón/distribuidor.</li>
                <li><strong>Avance 30%:</strong> Al finalizar la canalización y tendido integral de conductores en cañerías.</li>
                <li><strong>Saldo 30%:</strong> Contra prueba de funcionamiento, medición de resistencia de puesta a tierra y entrega de informe técnico.</li>
                <li>Todo trabajo adicional no contemplado en este presupuesto será cotizado previamente por escrito.</li>
              </ul>
            </div>

            {/* Firmas Formales */}
            <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs text-slate-600">
              <div className="border border-slate-300 p-4 rounded text-center">
                <span className="text-[10px] uppercase font-bold block mb-10 text-slate-400">Firma y Sello del Instalador</span>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">{clientInfo.electricianName}</div>
                <div className="text-[11px] font-mono">{clientInfo.electricianLicense}</div>
              </div>

              <div className="border border-slate-300 p-4 rounded text-center">
                <span className="text-[10px] uppercase font-bold block mb-10 text-slate-400">Conformidad y Aceptación del Cliente</span>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">{clientInfo.clientName}</div>
                <div className="text-[11px]">D.N.I. / C.U.I.T.</div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CONFIGURACIÓN DE TARIFAS DE MANO DE OBRA
            ========================================================================= */}
        {activeTab === 'mano_de_obra' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#18313B] dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
              <span>Configuración de Tarifas de Mano de Obra por Boca</span>
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Ajusta los valores sugeridos según los valores de referencia del Colegio de Técnicos o tus honorarios habituales.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Valor por Boca de Iluminación (IUG):</label>
                <input
                  type="number"
                  value={laborRates.bocaLuz}
                  onChange={(e) => setLaborRates((r) => ({ ...r, bocaLuz: Number(e.target.value) }))}
                  className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Valor por Boca de Tomacorrientes (TUG):</label>
                <input
                  type="number"
                  value={laborRates.bocaToma}
                  onChange={(e) => setLaborRates((r) => ({ ...r, bocaToma: Number(e.target.value) }))}
                  className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Valor por Boca Especial (TUE):</label>
                <input
                  type="number"
                  value={laborRates.bocaEspecial}
                  onChange={(e) => setLaborRates((r) => ({ ...r, bocaEspecial: Number(e.target.value) }))}
                  className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Armado de Tablero DIN (por polo):</label>
                <input
                  type="number"
                  value={laborRates.tableroPorPolo}
                  onChange={(e) => setLaborRates((r) => ({ ...r, tableroPorPolo: Number(e.target.value) }))}
                  className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Hincado de Jabalina y Ensayo PAT:</label>
                <input
                  type="number"
                  value={laborRates.jabalinaPAT}
                  onChange={(e) => setLaborRates((r) => ({ ...r, jabalinaPAT: Number(e.target.value) }))}
                  className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Certificación y Protocolo AEA:</label>
                <input
                  type="number"
                  value={laborRates.tramiteCertificacion}
                  onChange={(e) => setLaborRates((r) => ({ ...r, tramiteCertificacion: Number(e.target.value) }))}
                  className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: CÓMPUTO DE MATERIALES
            ========================================================================= */}
        {activeTab === 'materiales' && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#18313B] dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Listado de Materiales e Insumos de Instalación</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Cómputo generado automáticamente a partir de los metros de cable y bocas del plano.
                </p>
              </div>
              <span className="font-mono font-bold text-sm text-[#167D78] dark:text-[#2DD4BF]">
                Subtotal: $ {materialsSubtotal.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] dark:bg-[#182631] text-[10px] font-bold uppercase text-[#64748B] dark:text-slate-400">
                  <tr>
                    <th className="p-2.5">Ítem</th>
                    <th className="p-2.5">Descripción</th>
                    <th className="p-2.5 text-center">Cantidad</th>
                    <th className="p-2.5 text-right">Precio Unitario</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                  {bomItems.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="p-2.5 font-bold text-[#18313B] dark:text-white">{it.name}</td>
                      <td className="p-2.5 text-[#64748B] dark:text-slate-400">{it.description}</td>
                      <td className="p-2.5 text-center font-mono">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right font-mono">$ {it.unitPrice.toLocaleString('es-AR')}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        $ {it.subtotal.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
