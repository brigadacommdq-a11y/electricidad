/**
 * ELECTRA PLAN — Módulo de Análisis de Fotos de Tableros y Componentes Eléctricos
 * Reconocimiento asistido de elementos reales, correspondencia con esquemas y advertencias de seguridad
 */
import React, { useState } from 'react';
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  Scan,
  ShieldAlert,
  Zap,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Project } from '../types/electra';

interface DetectedComponent {
  id: string;
  name: string;
  category: 'termica' | 'diferencial' | 'dps' | 'peine' | 'cable_fase' | 'cable_neutro' | 'cable_tierra';
  brand: string;
  rating: string;
  normativeSymbol: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number }; // Porcentaje
  safetyNotes: string[];
  recommendation: string;
}

interface PhotoAnalysisViewProps {
  project: Project;
  onImportToCAD?: (recognizedData: any) => void;
}

export const PhotoAnalysisView: React.FC<PhotoAnalysisViewProps> = ({ project, onImportToCAD }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80'
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisDone, setAnalysisDone] = useState<boolean>(true);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>('det_1');

  // Detecciones simuladas realistas basadas en tableros típicos
  const detectedComponents: DetectedComponent[] = [
    {
      id: 'det_1',
      name: 'Interruptor Termomagnético Bipolar (PIA)',
      category: 'termica',
      brand: 'Schneider / Sica Tipo Curva C',
      rating: 'C20 (20 Amperes / 4.5 kA)',
      normativeSymbol: 'Interruptor termomagnético bipolar según IEC 60898-1',
      confidence: 0.96,
      box: { x: 28, y: 35, width: 14, height: 28 },
      safetyNotes: [
        'Asegurarse de que el torque de apriete en bornes sea el especificado por el fabricante (2 a 2.5 N·m).',
        'Verificar que el cable conectado sea de al menos 2.5 mm² o 4 mm² para soportar los 20A de corte nominal.',
      ],
      recommendation: 'Calibre apto para circuitos de tomacorrientes de uso especial (TUE) o aire acondicionado.',
    },
    {
      id: 'det_2',
      name: 'Interruptor Diferencial Bipolar (Disyuntor)',
      category: 'diferencial',
      brand: 'Sica / Chint Clase AC',
      rating: '40A / Sensibilidad 30 mA (IΔn)',
      normativeSymbol: 'Disyuntor diferencial con botón de prueba periódica T según IRAM NM IEC 61008',
      confidence: 0.98,
      box: { x: 12, y: 35, width: 15, height: 28 },
      safetyNotes: [
        'La presencia del disyuntor es obligatoria por AEA 90364-771 para salvaguardar la vida humana.',
        'Pulsar el botón "T" mensual para verificar el mecanismo electromecánico.',
      ],
      recommendation: 'Debe instalarse inmediatamente aguas abajo del Interruptor General de Cabecera (IGA).',
    },
    {
      id: 'det_3',
      name: 'Descargador de Sobretensiones (DPS)',
      category: 'dps',
      brand: 'Clase II / Tipo 2',
      rating: 'In 20 kA / Up ≤ 1.5 kV',
      normativeSymbol: 'Varistor de óxido metálico con cartucho enchufable y visor de estado',
      confidence: 0.92,
      box: { x: 44, y: 35, width: 14, height: 28 },
      safetyNotes: [
        'Requiere conexión directa a la barra de equipotencialidad / jabalina con conductor verde-amarillo de al menos 6 mm².',
      ],
      recommendation: 'Excelente protección contra descargas atmosféricas inducidas por rayos en líneas aéreas.',
    },
    {
      id: 'det_4',
      name: 'Conductores de Neutro (Celeste)',
      category: 'cable_neutro',
      brand: 'IRAM 2183 / NM 247-3',
      rating: 'Aislación 450/750 V',
      normativeSymbol: 'Conductor celeste normalizado conectado a bornera aislada',
      confidence: 0.95,
      box: { x: 20, y: 65, width: 25, height: 18 },
      safetyNotes: [
        'El conductor celeste NUNCA debe cortarse de forma unipolar; debe pasar por protecciones con corte omnipolar.',
      ],
      recommendation: 'Identificación correcta de código de colores según AEA 771.',
    },
    {
      id: 'det_5',
      name: 'Barra Colectora de Tierra (PE)',
      category: 'cable_tierra',
      brand: 'Bronce / Latón con tornillería de acero cincado',
      rating: 'Sección colectora principal',
      normativeSymbol: 'Barra equipotencial principal (BEP) para conductores verde-amarillo',
      confidence: 0.91,
      box: { x: 60, y: 72, width: 30, height: 18 },
      safetyNotes: [
        'No intercalar ningún tipo de fusible ni interruptor en el circuito de tierra de protección.',
      ],
      recommendation: 'Garantiza la derivación de corrientes de falla a la jabalina.',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      setIsAnalyzing(true);
      setAnalysisDone(false);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisDone(true);
      }, 1200);
    }
  };

  const handleTriggerAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisDone(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisDone(true);
    }, 1200);
  };

  const selectedComp = detectedComponents.find((c) => c.id === selectedComponentId);

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Alerta Roja de Seguridad Crítica */}
      <div className="bg-red-950/70 border-2 border-red-500 rounded-2xl p-4 sm:p-5 shadow-2xl flex items-start gap-3.5 text-red-100">
        <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <strong className="text-red-300 font-extrabold uppercase tracking-wide block">
            ¡ADVERTENCIA CRÍTICA DE SEGURIDAD ELÉCTRICA!
          </strong>
          <p className="leading-relaxed">
            NUNCA toque, desconecte ni manipule bornes o cables en un tablero real bajo tensión. El reconocimiento de fotos
            es una herramienta exclusivamente educativa y de verificación visual. Para cualquier trabajo físico, baje la
            palanca del interruptor general de cabecera y use un detector de tensión homologado.
          </p>
        </div>
      </div>

      {/* Cabecera del Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                RECONOCIMIENTO VISUAL ASISTIDO
              </span>
              <span className="text-xs text-slate-400 font-mono">IA & Heurística de Tableros</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Scan className="w-6 h-6 text-cyan-400" />
              <span>Analizar Foto de Tablero Eléctrico</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Sube una fotografía de un tablero real para reconocer sus protecciones, verificar código de colores de cables y ver su correspondencia esquemática.
            </p>
          </div>

          {/* Botones de Carga */}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Subir Foto</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleTriggerAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? 'Analizando...' : 'Escanear'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Área Principal de Visualización de Foto e Información */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Visor con Bounding Boxes Interactivas */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Regiones Detectadas en la Fotografía</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {detectedComponents.length} componentes identificados
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-4/3 flex items-center justify-center">
            {photoUrl ? (
              <>
                <img
                  src={photoUrl}
                  alt="Tablero a analizar"
                  className="w-full h-full object-cover select-none"
                />

                {/* Marcadores de Región de Interés (ROI) */}
                {analysisDone &&
                  detectedComponents.map((comp) => {
                    const isSelected = selectedComponentId === comp.id;
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setSelectedComponentId(comp.id)}
                        style={{
                          left: `${comp.box.x}%`,
                          top: `${comp.box.y}%`,
                          width: `${comp.box.width}%`,
                          height: `${comp.box.height}%`,
                        }}
                        className={`absolute rounded transition-all flex items-start justify-start p-1 cursor-pointer ${
                          isSelected
                            ? 'border-2 border-amber-400 bg-amber-400/25 ring-2 ring-amber-400/50 shadow-lg'
                            : 'border border-cyan-400/70 bg-cyan-500/10 hover:border-cyan-300 hover:bg-cyan-500/20'
                        }`}
                      >
                        <span
                          className={`text-[9px] font-bold px-1 py-0.5 rounded shadow-xs truncate max-w-full font-mono ${
                            isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-900/90 text-cyan-300'
                          }`}
                        >
                          {comp.rating.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
              </>
            ) : (
              <div className="text-center p-8 text-slate-500 space-y-2">
                <Camera className="w-12 h-12 mx-auto opacity-50" />
                <p className="text-xs">Sube una foto o captura con la cámara de tu celular</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            💡 Toca cualquiera de las cajas delimitadoras resaltadas sobre la imagen para inspeccionar la ficha técnica del componente, su símbolo normalizado y recomendaciones.
          </div>
        </div>

        {/* Columna Derecha: Ficha Técnica del Componente Seleccionado */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          {selectedComp ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    DETECCIÓN {Math.round(selectedComp.confidence * 100)}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{selectedComp.brand}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">{selectedComp.name}</h3>
                <p className="text-xs text-amber-400 font-mono mt-0.5">{selectedComp.rating}</p>
              </div>

              {/* Símbolo Normalizado Asociado */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Símbolo Normalizado AEA / IEC:</span>
                </span>
                <p className="text-xs text-slate-300 font-mono bg-slate-900 p-2 rounded border border-slate-800">
                  {selectedComp.normativeSymbol}
                </p>
              </div>

              {/* Notas de Seguridad */}
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Seguridad en Bornera:</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  {selectedComp.safetyNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>

              {/* Recomendación Técnica */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Recomendación del Instalador:</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedComp.recommendation}</p>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-slate-500 space-y-2">
              <Info className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-xs">Selecciona un elemento delimitado en la fotografía</p>
            </div>
          )}

          {/* Lista rápida de todos los componentes detectados */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">Lista de Elementos Identificados:</span>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
              {detectedComponents.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedComponentId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs text-left flex items-center justify-between border transition-all ${
                    selectedComponentId === c.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-2">{c.rating.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
