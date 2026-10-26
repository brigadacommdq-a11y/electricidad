/**
 * ELECTRA PLAN — Módulo de Informes Técnicos y Memoria Imprimible (PDF)
 * Informe ejecutivo con plano, leyenda, cuadro de cargas, memoria de cálculo y presupuesto.
 */
import React from 'react';
import {
  Printer,
  Download,
  FileText,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import { Project } from '../types/electra';
import { calculateProjectInstallation } from '../services/electricalCalculations';
import { generateBOM } from '../services/bomService';

interface ReportViewProps {
  project: Project;
}

export const ReportView: React.FC<ReportViewProps> = ({ project }) => {
  const calculations = calculateProjectInstallation(project, 0.8);
  const bom = generateBOM(project, 15);
  const totalBOM = bom.reduce((a, b) => a + b.subtotal, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900/60 p-4 md:p-8 flex justify-center text-slate-900">
      <div className="w-full max-w-4xl bg-white p-8 md:p-12 shadow-2xl rounded-lg space-y-8 font-sans print:p-0 print:shadow-none print:w-full">
        {/* Barra de Control de Impresión (oculta al imprimir) */}
        <div className="no-print bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-bold text-sm block">Vista Previa de Informe Ejecutivo</span>
              <span className="text-[11px] text-slate-400">
                Optimizado para exportar a PDF o imprimir en hoja A4 mediante el navegador.
              </span>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar como PDF</span>
          </button>
        </div>

        {/* Encabezado Formal del Informe */}
        <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-extrabold text-2xl tracking-wider">
              <Zap className="w-7 h-7 fill-amber-500" />
              <span>ELECTRA PLAN</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Software de Diseño, Cálculo y Simulación de Instalaciones Eléctricas
            </p>
            <h1 className="text-xl font-bold text-slate-900 mt-3">
              MEMORIA TÉCNICA Y CUADRO DE CARGAS
            </h1>
          </div>

          <div className="text-right text-xs text-slate-600 space-y-1 font-mono">
            <div><strong>Fecha:</strong> {project.metadata.date || new Date().toISOString().slice(0, 10)}</div>
            <div><strong>Norma Ref:</strong> {project.metadata.normative}</div>
            <div><strong>País:</strong> {project.metadata.country}</div>
          </div>
        </div>

        {/* Datos Generales del Proyecto */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Proyecto</span>
            <span className="font-bold text-slate-900 text-sm">{project.metadata.name}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Cliente</span>
            <span className="font-semibold text-slate-800">{project.metadata.client || 'Particular'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Ubicación / Domicilio</span>
            <span className="text-slate-800">{project.metadata.address || 'Sin especificar'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Responsable Técnico</span>
            <span className="text-slate-800">{project.metadata.author || 'Profesional Habilitado'}</span>
          </div>
        </div>

        {/* Resumen de Potencias y Demanda */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5 mb-3">
            1. Resumen de Cargas y Potencias
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 block">Potencia Instalada Total</span>
              <strong className="text-base text-slate-900">{calculations.totalInstalledWatts} W</strong>
              <span className="text-[10px] text-slate-400 block">{(calculations.totalInstalledWatts / 1000).toFixed(2)} kW</span>
            </div>
            <div className="p-3 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 block">Potencia Aparente Total</span>
              <strong className="text-base text-slate-900">{calculations.totalInstalledVA} VA</strong>
              <span className="text-[10px] text-slate-400 block">{(calculations.totalInstalledVA / 1000).toFixed(2)} kVA</span>
            </div>
            <div className="p-3 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 block">Demanda Máxima (DMPS)</span>
              <strong className="text-base text-amber-700">{calculations.maxDemandWatts} W</strong>
              <span className="text-[10px] text-slate-400 block">Factor sim.: 0.8</span>
            </div>
            <div className="p-3 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 block">Corriente de Acometida</span>
              <strong className="text-base text-emerald-700">{calculations.generalMainCurrentAmps} A</strong>
              <span className="text-[10px] text-slate-400 block">220 V Monofásica</span>
            </div>
          </div>
        </div>

        {/* Tabla Cuadro de Cargas y Circuitos */}
        <div className="break-inside-avoid">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5 mb-3">
            2. Cuadro de Distribución de Circuitos Derivados
          </h2>
          <div className="overflow-x-auto border border-slate-300 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Circ.</th>
                  <th className="py-2.5 px-3">Denominación</th>
                  <th className="py-2.5 px-2 text-center">Tipo</th>
                  <th className="py-2.5 px-2 text-center">Bocas</th>
                  <th className="py-2.5 px-3 text-right">Potencia (W)</th>
                  <th className="py-2.5 px-3 text-right">Ib (A)</th>
                  <th className="py-2.5 px-2 text-center">Sección</th>
                  <th className="py-2.5 px-2 text-center">Long.</th>
                  <th className="py-2.5 px-3 text-right">ΔV (%)</th>
                  <th className="py-2.5 px-2 text-center">Térmica</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {calculations.circuits.map((c) => (
                  <tr key={c.circuitId}>
                    <td className="py-2 px-3 font-bold text-slate-900">{c.circuitId}</td>
                    <td className="py-2 px-3 font-sans text-slate-800">{c.circuitName}</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-700">{c.circuitType}</td>
                    <td className="py-2 px-2 text-center">{c.loadCount}</td>
                    <td className="py-2 px-3 text-right">{c.activePowerWatts}</td>
                    <td className="py-2 px-3 text-right font-bold">{c.designCurrentAmps}</td>
                    <td className="py-2 px-2 text-center">{c.crossSectionMm2} mm²</td>
                    <td className="py-2 px-2 text-center">{c.lengthMeters} m</td>
                    <td className="py-2 px-3 text-right">
                      {c.voltageDropPercent}% (máx {c.maxAllowedVoltageDropPercent}%)
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-amber-800">{c.breakerRatingAmps} A</td>
                    <td className="py-2 px-3 text-center font-sans font-semibold text-[10px]">
                      {c.isVoltageDropCompliant && c.isProtectionCoordinated ? (
                        <span className="text-emerald-700">Conforme</span>
                      ) : (
                        <span className="text-amber-700">Verificar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen de Materiales y Presupuesto */}
        <div className="break-inside-avoid">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1.5 mb-3">
            3. Cómputo Métrico y Presupuesto Estimado
          </h2>
          <div className="overflow-x-auto border border-slate-300 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3">Categoría</th>
                  <th className="py-2 px-3">Ítem / Insumo</th>
                  <th className="py-2 px-2 text-center">Cant.</th>
                  <th className="py-2 px-2 text-center">Unidad</th>
                  <th className="py-2 px-3 text-right">Unitario</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {bom.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td className="py-1.5 px-3 font-sans text-slate-500">{item.category}</td>
                    <td className="py-1.5 px-3 font-sans text-slate-900 font-medium">{item.name}</td>
                    <td className="py-1.5 px-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-1.5 px-2 text-center text-slate-500 font-sans">{item.unit}</td>
                    <td className="py-1.5 px-3 text-right">$ {item.unitPrice.toLocaleString('es-AR')}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-800">
                      $ {item.subtotal.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-300 text-xs font-mono font-bold">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-right text-slate-700 uppercase font-sans">
                    Total Estimado de Insumos ({project.currency}):
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-emerald-800 text-sm">
                    $ {totalBOM.toLocaleString('es-AR')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Declaración de Responsabilidad y Normativa */}
        <div className="border border-amber-300 bg-amber-50/70 p-4 rounded-lg text-xs text-slate-700 space-y-1.5 break-inside-avoid">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>ADVERTENCIA TÉCNICA Y CONDICIONES DE APLICACIÓN</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            La presente memoria técnica y cuadro de cargas han sido elaborados como propuesta de diseño técnico asistido por computadora.
            No sustituye el proyecto ejecutivo definitivo ni el cálculo de corrientes de cortocircuito (Icc), resistencia de puesta a tierra medida en sitio (RPAT ≤ 40 Ω), ni los ensayos de aislamiento.
            La ejecución debe ser dirigida y certificada exclusivamente por un instalador electricista matriculado o profesional universitario con incumbencia reglamentaria según la Reglamentación AEA 90364 vigente en la República Argentina.
          </p>
        </div>

        {/* Bloque de Firmas para Entrega Profesional */}
        <div className="grid grid-cols-2 gap-12 pt-12 text-center text-xs text-slate-600 break-inside-avoid">
          <div>
            <div className="border-t border-slate-400 pt-2 font-semibold">
              Firma y Sello del Proyectista / Instalador
            </div>
            <div className="text-[10px] text-slate-400">Matrícula / Registro Profesional</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-semibold">
              Conformidad del Propietario / Comitente
            </div>
            <div className="text-[10px] text-slate-400">Aprobación de Proyecto Eléctrico</div>
          </div>
        </div>
      </div>
    </div>
  );
};
