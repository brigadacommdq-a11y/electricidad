/**
 * ELECTRA PLAN — Módulo de Cómputo Métrico de Materiales y Presupuesto
 * Genera el listado exhaustivo de materiales y aparamenta con precios editables y exportación CSV.
 */
import React, { useState } from 'react';
import {
  ShoppingBag,
  Download,
  DollarSign,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Layers,
} from 'lucide-react';
import { Project, BOMItem } from '../types/electra';
import { generateBOM } from '../services/bomService';

interface BOMViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const BOMView: React.FC<BOMViewProps> = ({ project, onUpdateProject }) => {
  const [marginPercent, setMarginPercent] = useState<number>(15);
  const [customItems, setCustomItems] = useState<BOMItem[]>([]);

  // Generar lista de materiales base a partir del proyecto
  const autoBOM = generateBOM(project, marginPercent);
  const allItems = [...autoBOM, ...customItems];

  const totalBudget = allItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Actualizar precio unitario de un ítem
  const handleUpdatePrice = (key: string, newPrice: number) => {
    onUpdateProject((prev) => ({
      ...prev,
      bomPriceOverrides: {
        ...(prev.bomPriceOverrides || {}),
        [key.replace('bom_', '')]: newPrice,
      },
    }));
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    let csv = 'Categoría;Ítem;Descripción;Cantidad;Unidad;Precio Unitario;Subtotal\n';
    for (const item of allItems) {
      csv += `"${item.category}";"${item.name}";"${item.description}";${item.quantity};"${item.unit}";${item.unitPrice};${item.subtotal}\n`;
    }
    csv += `;;;;;"TOTAL ESTIMADO";${totalBudget}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ELECTRA_PLAN_Presupuesto_${project.metadata.name.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 text-slate-100 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <ShoppingBag className="w-5 h-5" />
            <h2>Cómputo Métrico de Materiales y Presupuesto</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Estimación automática a partir de los elementos del plano CAD, circuitos y canalizaciones.
            Puedes editar precios unitarios y ajustar el margen de desperdicio y curvas de cañería.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Ajuste de Margen de Desperdicio */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">Margen Obra:</span>
            <select
              value={marginPercent}
              onChange={(e) => setMarginPercent(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-amber-400 font-mono font-bold focus:outline-hidden"
            >
              <option value={10}>+10%</option>
              <option value={15}>+15% (Recomendado)</option>
              <option value={20}>+20%</option>
              <option value={25}>+25%</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 hover:text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Resumen del Presupuesto */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Estimado de Materiales
          </span>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
            {project.currency} $ {totalBudget.toLocaleString('es-AR')}
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {allItems.length} renglones de cómputo métrico contabilizados
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Moneda:</span>
          {(['ARS', 'USD', 'EUR'] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => onUpdateProject((prev) => ({ ...prev, currency: curr }))}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                project.currency === curr
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Materiales */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Listado Detallado de Insumos y Aparamenta</h3>
          <span className="text-[11px] text-slate-400">Haz clic en el precio unitario para modificarlo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Descripción del Material</th>
                <th className="py-3 px-3 text-center">Cant.</th>
                <th className="py-3 px-2 text-center">Unidad</th>
                <th className="py-3 px-3 text-right">Precio Unit. ({project.currency})</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {allItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850 transition-colors">
                  <td className="py-3 px-4 font-sans text-slate-400 font-medium">{item.category}</td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-slate-200">{item.name}</div>
                    <div className="text-[11px] text-slate-400">{item.description}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-white">{item.quantity}</td>
                  <td className="py-3 px-2 text-center text-slate-400 font-sans">{item.unit}</td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdatePrice(item.id, Number(e.target.value) || 0)}
                      className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-amber-300 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    $ {item.subtotal.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-950 border-t-2 border-slate-700 text-xs font-mono font-bold">
              <tr>
                <td colSpan={5} className="py-4 px-4 text-right text-slate-300 uppercase font-sans">
                  Total Estimado de la Instalación:
                </td>
                <td className="py-4 px-4 text-right text-base text-emerald-400 font-extrabold">
                  {project.currency} $ {totalBudget.toLocaleString('es-AR')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Nota técnica sobre tolerancias de cableado */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Aclaración sobre longitudes de conductores:</span>
          <p className="mt-0.5">
            Las longitudes de cable se calculan a partir de la distancia euclídea entre bocas en el plano horizontal sumando las subidas y bajadas de pared (hacia cajas de llave a 1.20 m y tomas a 0.30 m).
            Se incluye un margen configurable del {marginPercent}% por curvas, cruces y desperdicios de pelado en bocas y tableros.
          </p>
        </div>
      </div>
    </div>
  );
};
