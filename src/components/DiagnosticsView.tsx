/**
 * ELECTRA PLAN — Módulo de Diagnóstico, Detección y Localización de Fallas Eléctricas
 * Reglamentación AEA 90364-7-771
 */
import React, { useState, useMemo } from 'react';
import { Project, FaultDetail, FaultCategory } from '../types/electra';
import { locateAllFaults } from '../services/faultLocalization';
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  ZapOff,
  CheckCircle2,
  Crosshair,
  Wrench,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';

interface DiagnosticsViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onLocateOnCAD: (fault: FaultDetail) => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  project,
  onUpdateProject,
  onLocateOnCAD,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);

  // Analizar fallas en tiempo real
  const faults = useMemo(() => {
    return locateAllFaults(project);
  }, [project]);

  const filteredFaults = useMemo(() => {
    if (selectedCategory === 'todos') return faults;
    return faults.filter((f) => f.category === selectedCategory);
  }, [faults, selectedCategory]);

  // Contadores por categoría
  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {
      todos: faults.length,
      cortocircuito_franco: 0,
      falla_tierra: 0,
      sobrecarga: 0,
      conexion_peligrosa: 0,
      caida_tension_excesiva: 0,
      circuito_abierto: 0,
    };
    faults.forEach((f) => {
      if (counts[f.category] !== undefined) {
        counts[f.category]++;
      }
    });
    return counts;
  }, [faults]);

  // Solución guiada virtual
  const handleVirtualRepair = (fault: FaultDetail) => {
    onUpdateProject((prev) => {
      let nextWires = [...prev.wires];
      let nextSymbols = [...prev.symbols];

      if (fault.category === 'cortocircuito_franco' || fault.category === 'falla_tierra') {
        // Remover el cable problemático que crea el lazo directo
        if (fault.involvedWireIds.length > 0) {
          const wireToRemove = fault.involvedWireIds[fault.involvedWireIds.length - 1];
          nextWires = nextWires.filter((w) => w.id !== wireToRemove);
        }
      } else if (fault.category === 'sobrecarga') {
        // Aumentar la sección del conductor al calibre seguro (mínimo 2.5 o 4.0 mm²)
        fault.involvedWireIds.forEach((wid) => {
          nextWires = nextWires.map((w) =>
            w.id === wid ? { ...w, crossSectionMm2: Math.max(2.5, w.crossSectionMm2 * 1.5) } : w
          );
        });
      } else if (fault.category === 'conexion_peligrosa') {
        // Restablecer polaridad correcta en interruptor
        fault.involvedWireIds.forEach((wid) => {
          nextWires = nextWires.map((w) => (w.id === wid ? { ...w, type: 'fase', color: '#854d0e' } : w));
        });
      }

      // Desactivar estado disparado de protecciones
      nextSymbols = nextSymbols.map((s) => ({
        ...s,
        state: { ...s.state, isTripped: false, hasFault: false },
      }));

      return {
        ...prev,
        wires: nextWires,
        symbols: nextSymbols,
      };
    });
  };

  // Inyectar desafío de falla intencional con fines de aprendizaje
  const handleInjectFaultChallenge = (challengeType: string) => {
    setActiveChallengeId(challengeType);
    onUpdateProject((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as Project;
      const qSym = next.symbols.find((s) => s.type === 'termica' || s.type === 'interruptor_general');
      const lightSym = next.symbols.find((s) => s.type === 'luminaria');

      if (challengeType === 'corto_cocina' && qSym) {
        // Crear un puente directo Fase -> Neutro
        const badWire = {
          id: `wire_fault_test_${Date.now()}`,
          floorId: prev.activeFloorId,
          type: 'fase' as const,
          circuitId: 'C1',
          fromComponentId: qSym.id,
          fromTerminalId: 'L_OUT',
          toComponentId: qSym.id,
          toTerminalId: 'N_OUT',
          color: '#ef4444',
          crossSectionMm2: 1.5,
          lengthMeters: 1.0,
        };
        next.wires.push(badWire);
      } else if (challengeType === 'fuga_tierra' && lightSym) {
        // Conectar fase a tierra
        const badWire = {
          id: `wire_fault_earth_${Date.now()}`,
          floorId: prev.activeFloorId,
          type: 'fase' as const,
          circuitId: 'C1',
          fromComponentId: lightSym.id,
          fromTerminalId: 'L',
          toComponentId: lightSym.id,
          toTerminalId: 'PE',
          color: '#eab308',
          crossSectionMm2: 1.5,
          lengthMeters: 1.0,
        };
        next.wires.push(badWire);
      } else if (challengeType === 'sobrecarga_calefon') {
        // Disminuir sección de cable a 1.0mm² para generar sobrecalentamiento
        if (next.wires.length > 0) {
          next.wires[0].crossSectionMm2 = 1.0;
        }
      }
      return next;
    });
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Encabezado y Resumen de Estado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                AUDITORÍA ACTIVA
              </span>
              <span className="text-xs text-slate-400 font-mono">Norma AEA 90364-7-771</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-amber-400" />
              <span>Diagnóstico Eléctrico & Localizador de Fallas</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Detección física de bucles anormales, corrientes de defecto, calentamiento de conductores y disparo de protecciones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Estado</span>
              <span
                className={`text-lg font-black ${
                  faults.length === 0 ? 'text-emerald-400' : 'text-red-400 animate-pulse'
                }`}
              >
                {faults.length === 0 ? 'SEGURO' : `${faults.length} FALLA(S)`}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex items-center overflow-x-auto gap-2 mt-5 pt-4 border-t border-slate-800 scrollbar-none">
          {[
            { id: 'todos', label: 'Todas las Fallas' },
            { id: 'cortocircuito_franco', label: 'Cortocircuitos' },
            { id: 'falla_tierra', label: 'Fallas a Tierra' },
            { id: 'sobrecarga', label: 'Sobrecargas' },
            { id: 'conexion_peligrosa', label: 'Conexión Peligrosa' },
            { id: 'caida_tension_excesiva', label: 'Caída de Tensión' },
            { id: 'circuito_abierto', label: 'Circuito Abierto' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === cat.id ? 'bg-slate-950 text-amber-300' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {countByCategory[cat.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Fallas Detectadas */}
      <div className="space-y-4">
        {filteredFaults.length === 0 ? (
          <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Instalación sin defectos en esta categoría</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No se detectaron lazos de cortocircuito directo, derivaciones de neutro ni sobrecalentamiento en los cables analizados.
            </p>
          </div>
        ) : (
          filteredFaults.map((fault) => {
            const isCritical = fault.severity === 'peligro_inmediato';
            return (
              <div
                key={fault.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all ${
                  isCritical ? 'border-red-500/60 bg-red-950/10' : 'border-amber-500/40 bg-amber-950/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isCritical ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {fault.severity.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Categoría: {fault.category.replace('_', ' ')}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                      <span>{fault.title}</span>
                    </h2>

                    <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                      {fault.faultLoopDescription}
                    </p>

                    {/* Explicación Física y Causa */}
                    <div className="text-xs text-slate-300 space-y-1">
                      <strong className="text-amber-300 block">Causa física del disparo:</strong>
                      <p>{fault.detectionReason}</p>
                    </div>

                    {/* Protección que actuaría */}
                    {fault.trippedProtection && (
                      <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <span>Respuesta de Protección Simulada:</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Dispositivo:</span>
                            <span className="font-bold text-white">{fault.trippedProtection.nominalRating}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Mecanismo:</span>
                            <span className="font-bold text-amber-400">
                              {fault.trippedProtection.tripMechanism.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Tiempo estimado:</span>
                            <span className="font-bold text-emerald-400">
                              {fault.trippedProtection.responseTimeMs} ms (Corte ultrarrápido)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pasos de Corrección Reglamentaria */}
                    {fault.remedySteps.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">
                          Pasos de Corrección Reglamentaria (AEA 90364):
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                          {fault.remedySteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onLocateOnCAD(fault)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Crosshair className="w-4 h-4 text-amber-400" />
                      <span>Localizar en Plano CAD</span>
                    </button>

                    <button
                      onClick={() => handleVirtualRepair(fault)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Wrench className="w-4 h-4 stroke-[2.5]" />
                      <span>Reparación Virtual</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desafíos Educativos con Fallas Intencionales */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>Laboratorio de Práctica: Localización de Fallas Intencionales</span>
          </h3>
          <p className="text-xs text-slate-400">
            Inyecta una falla controlada en el proyecto para poner a prueba tu capacidad de diagnóstico como electricista.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Desafío 1: Cortocircuito Franco</span>
              <span className="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded">L-N Directo</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Genera una unión directa entre fase y neutro en la salida del interruptor termomagnético.
            </p>
            <button
              onClick={() => handleInjectFaultChallenge('corto_cocina')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 rounded-lg text-xs font-bold border border-slate-700 transition-colors"
            >
              Simular Cortocircuito
            </button>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Desafío 2: Falla a Tierra</span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded">Fuga PE</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Conecta accidentalmente la fase a la bornera de protección PE simulando pérdida de aislación.
            </p>
            <button
              onClick={() => handleInjectFaultChallenge('fuga_tierra')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 rounded-lg text-xs font-bold border border-slate-700 transition-colors"
            >
              Simular Falla a Tierra
            </button>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Desafío 3: Sobrecarga Térmica</span>
              <span className="text-[10px] font-bold text-orange-400 bg-orange-950 px-2 py-0.5 rounded">Ib &gt; Iz</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Reduce la sección del cable a 1.0 mm² con una protección de 20A para verificar el calentamiento riesgoso.
            </p>
            <button
              onClick={() => handleInjectFaultChallenge('sobrecarga_calefon')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 rounded-lg text-xs font-bold border border-slate-700 transition-colors"
            >
              Simular Sobrecarga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
