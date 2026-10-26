/**
 * ELECTRA PLAN — Módulo de Solicitud de Instalación para Clientes
 * Registro de cliente, ambientes, cargas especiales, dictado/audio o texto libre,
 * generación de croquis preliminar AEA 90364 y carga directa en el Plano CAD.
 */

import React, { useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  FileText,
  Upload,
  Play,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Home,
  Plus,
  Trash2,
  Cpu,
  Layers,
  ArrowRight,
  Download,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Project } from '../types/electra';
import {
  ClientInstallationRequest,
  ClientRoomRequest,
  GeneratedProposal,
  parseClientRequirementsText,
  generateProjectProposal,
} from '../services/clientRequestParser';

interface ClientRequestViewProps {
  onLoadProjectToCAD: (newProject: Project) => void;
}

const PRESET_SCRIPTS = [
  {
    title: 'Depto 2 Ambientes (Caballito)',
    text: 'Hola, necesito hacer la instalación completa de un departamento de 2 ambientes a estrenar de unos 50 metros cuadrados. Tiene un living comedor de 5 por 4 metros donde quiero 2 bocas de luz con teclas independientes, 4 tomas dobles y un aire acondicionado split de 3000 frigorías. La cocina tiene 3 por 2.5 metros con horno eléctrico empotrable, anafe y termotanque de 80 litros. Un dormitorio de 3.5 por 3 metros con 1 luz central y 3 tomas. Y un baño con extractor y toma con tapa.',
  },
  {
    title: 'Vivienda Familiar 3 Ambientes',
    text: 'Quiero renovar el cableado de una casa de 90 metros cuadrados. Tiene living comedor amplio de 6 por 4.5 metros, cocina separada de 4 por 3 metros con circuito para microondas y pava eléctrica, dos dormitorios de 4 por 3.5 metros y baño completo. Queremos disyuntor diferencial de 40A, térmicas independientes para luces y tomas, y verificar la jabalina de puesta a tierra.',
  },
  {
    title: 'Local Comercial (Vidriera + Taller)',
    text: 'Requerimos presupuesto para un local a la calle de 40 m2 con vidriera, iluminación LED tipo riel, 6 tomas para computadoras y exhibidores, y circuito reforzado para aire acondicionado inverter de 4500 frigorías. La cañería va a ser a la vista con caño rígido metálico.',
  },
];

export const ClientRequestView: React.FC<ClientRequestViewProps> = ({ onLoadProjectToCAD }) => {
  // Estado del formulario del cliente
  const [clientName, setClientName] = useState('Mariano Rossi');
  const [clientPhone, setClientPhone] = useState('+54 11 4589-2231');
  const [clientEmail, setClientEmail] = useState('mrossi@gmail.com');
  const [address, setAddress] = useState('Av. Rivadavia 5420, CABA');
  const [propertyType, setPropertyType] = useState<'vivienda_unifamiliar' | 'departamento' | 'local_comercial' | 'oficina'>('departamento');
  const [installationType, setInstallationType] = useState<'embutido' | 'a_la_vista' | 'subterraneo'>('embutido');

  // Ambientes
  const [rooms, setRooms] = useState<ClientRoomRequest[]>([
    {
      id: 'r1',
      name: 'Living Comedor',
      widthM: 5.0,
      lengthM: 4.0,
      areaM2: 20.0,
      lightsCount: 2,
      switchesCount: 2,
      outletsGeneralCount: 4,
      outletsSpecialCount: 1,
      appliances: ['Aire Acondicionado 3000 frig'],
    },
    {
      id: 'r2',
      name: 'Cocina',
      widthM: 3.5,
      lengthM: 2.5,
      areaM2: 8.75,
      lightsCount: 2,
      switchesCount: 1,
      outletsGeneralCount: 3,
      outletsSpecialCount: 2,
      appliances: ['Horno Eléctrico', 'Termotanque 80L'],
    },
    {
      id: 'r3',
      name: 'Dormitorio Principal',
      widthM: 3.8,
      lengthM: 3.2,
      areaM2: 12.16,
      lightsCount: 1,
      switchesCount: 1,
      outletsGeneralCount: 3,
      outletsSpecialCount: 0,
      appliances: [],
    },
    {
      id: 'r4',
      name: 'Baño Completo',
      widthM: 2.2,
      lengthM: 1.8,
      areaM2: 3.96,
      lightsCount: 1,
      switchesCount: 1,
      outletsGeneralCount: 1,
      outletsSpecialCount: 0,
      appliances: [],
    },
  ]);

  // Transcripción de audio o notas
  const [transcriptText, setTranscriptText] = useState(PRESET_SCRIPTS[0].text);
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecordingTime, setAudioRecordingTime] = useState(0);
  const timerRef = useRef<any>(null);

  // Propuesta generada
  const [proposal, setProposal] = useState<GeneratedProposal | null>(() => {
    const initialReq: ClientInstallationRequest = {
      id: 'req_init',
      createdAt: new Date().toISOString(),
      clientName: 'Mariano Rossi',
      clientPhone: '+54 11 4589-2231',
      clientEmail: 'mrossi@gmail.com',
      address: 'Av. Rivadavia 5420, CABA',
      propertyType: 'departamento',
      rooms,
      highPowerAppliances: [
        { name: 'Aire Acondicionado 3000 frig', powerWatts: 1450, dedicatedCircuitRequired: true, roomName: 'Living Comedor' },
        { name: 'Horno Eléctrico', powerWatts: 2400, dedicatedCircuitRequired: true, roomName: 'Cocina' },
        { name: 'Termotanque 80L', powerWatts: 2000, dedicatedCircuitRequired: true, roomName: 'Cocina' },
      ],
      notes: PRESET_SCRIPTS[0].text,
      installationType: 'embutido',
    };
    return generateProjectProposal(initialReq);
  });

  // Grabación de voz simulada o nativa
  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      clearInterval(timerRef.current);
    } else {
      setIsRecording(true);
      setAudioRecordingTime(0);
      timerRef.current = setInterval(() => {
        setAudioRecordingTime((t) => t + 1);
      }, 1000);
    }
  };

  // Procesar texto libre de cliente
  const handleProcessText = (text: string) => {
    setTranscriptText(text);
    const parsed = parseClientRequirementsText(text);
    if (parsed.propertyType) setPropertyType(parsed.propertyType);
    if (parsed.rooms && parsed.rooms.length > 0) setRooms(parsed.rooms);
    if (parsed.installationType) setInstallationType(parsed.installationType);

    const fullReq: ClientInstallationRequest = {
      id: `req_${Date.now()}`,
      createdAt: new Date().toISOString(),
      clientName,
      clientPhone,
      clientEmail,
      address,
      propertyType: parsed.propertyType || propertyType,
      rooms: parsed.rooms || rooms,
      highPowerAppliances: parsed.highPowerAppliances || [],
      notes: text,
      installationType: parsed.installationType || installationType,
    };

    const newProp = generateProjectProposal(fullReq);
    setProposal(newProp);
  };

  const handleGenerateProposal = () => {
    const fullReq: ClientInstallationRequest = {
      id: `req_${Date.now()}`,
      createdAt: new Date().toISOString(),
      clientName,
      clientPhone,
      clientEmail,
      address,
      propertyType,
      rooms,
      highPowerAppliances: [
        { name: 'Aire Acondicionado', powerWatts: 1450, dedicatedCircuitRequired: true, roomName: 'Living Comedor' },
        { name: 'Horno Eléctrico', powerWatts: 2400, dedicatedCircuitRequired: true, roomName: 'Cocina' },
      ],
      notes: transcriptText,
      installationType,
    };
    const prop = generateProjectProposal(fullReq);
    setProposal(prop);
  };

  const handleAddRoom = () => {
    const newRoom: ClientRoomRequest = {
      id: `room_${Date.now()}`,
      name: `Nuevo Ambiente ${rooms.length + 1}`,
      widthM: 4.0,
      lengthM: 3.0,
      areaM2: 12.0,
      lightsCount: 1,
      switchesCount: 1,
      outletsGeneralCount: 2,
      outletsSpecialCount: 0,
      appliances: [],
    };
    setRooms([...rooms, newRoom]);
  };

  const handleRemoveRoom = (id: string) => {
    setRooms(rooms.filter((r) => r.id !== id));
  };

  const handleLoadToCAD = () => {
    if (!proposal) return;
    onLoadProjectToCAD(proposal.project);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Barra de título del módulo */}
      <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Módulo Comercial & Técnico
            </span>
            <span className="text-xs text-slate-400">Normativa AEA 90364-7-771</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Solicitud de Instalación para Clientes
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Registra los datos del cliente, dicta requerimientos por voz o texto, calcula el grado de electrificación y sintetiza una propuesta con croquis preliminar editable.
          </p>
        </div>

        {proposal && (
          <button
            onClick={handleLoadToCAD}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Cargar Propuesta en Plano CAD</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Contenido en dos columnas */}
      <div className="flex-1 p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl mx-auto w-full">
        {/* Columna Izquierda (7 cols): Formulario de Entrada, Grabadora y Ambientes */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Datos del Cliente e Inmueble */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Home className="w-4 h-4 text-amber-400" />
              1. Datos del Cliente e Inmueble
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nombre y Apellido / Razón Social:</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Teléfono / WhatsApp:</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Dirección de la Obra / Inmueble:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tipo de Inmueble:</label>
                <select
                  value={propertyType}
                  onChange={(e: any) => setPropertyType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-hidden"
                >
                  <option value="departamento">Departamento en Propiedad Horizontal</option>
                  <option value="vivienda_unifamiliar">Vivienda Unifamiliar (Casa / Chalet)</option>
                  <option value="local_comercial">Local Comercial / Vidriera</option>
                  <option value="oficina">Oficina Comercial</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Dictado por Voz / Transcripción de Audio y Notas */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-400" />
                2. Dictado de Requerimientos o Transcripción
              </h2>
              <button
                onClick={handleToggleRecording}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-slate-800 text-slate-200 hover:text-white border border-slate-700'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Grabando ({audioRecordingTime}s)...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span>Iniciar Dictado por Voz</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Puedes redactar o editar libremente las necesidades del cliente. El motor reconocerá ambientes, artefactos de potencia y dimensiones:
            </p>

            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 leading-relaxed font-mono focus:border-amber-400 focus:outline-hidden resize-y"
              placeholder="Ejemplo: Necesito instalar 2 ambientes de 50m2, con 1 split en living, horno eléctrico y termotanque..."
            />

            {/* Ejemplos predefinidos para prueba rápida */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-slate-400">Ejemplos típicos:</span>
              {PRESET_SCRIPTS.map((ps, idx) => (
                <button
                  key={idx}
                  onClick={() => handleProcessText(ps.text)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 transition-colors"
                >
                  {ps.title}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleProcessText(transcriptText)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Analizar Requerimientos con Inteligencia de Proyecto</span>
            </button>
          </div>

          {/* 3. Ambientes y Dimensiones (Editables) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                3. Ambientes del Inmueble ({rooms.length})
              </h2>
              <button
                onClick={handleAddRoom}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Ambiente</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {rooms.map((room, idx) => (
                <div
                  key={room.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{room.name}</span>
                      <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-700/40">
                        {room.areaM2} m² ({room.widthM}m × {room.lengthM}m)
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-3">
                      <span>💡 {room.lightsCount} Luces</span>
                      <span>🔌 {room.outletsGeneralCount} Tomas TUG</span>
                      {room.outletsSpecialCount > 0 && <span className="text-pink-400">⚡ {room.outletsSpecialCount} Tomas TUE</span>}
                      {room.appliances.length > 0 && (
                        <span className="text-slate-300 italic truncate">({room.appliances.join(', ')})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRemoveRoom(room.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                      title="Eliminar ambiente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerateProposal}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md mt-2"
            >
              Actualizar Propuesta Técnica
            </button>
          </div>
        </div>

        {/* Columna Derecha (5 cols): Síntesis de la Propuesta & Preguntas al Cliente */}
        <div className="lg:col-span-5 space-y-5">
          {proposal && (
            <>
              {/* Tarjeta de Grado de Electrificación */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Evaluación Reglamentaria AEA
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-500 text-slate-950">
                    Grado {proposal.electrificationGrade}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs py-1 border-b border-slate-800">
                    <span className="text-slate-400">Superficie Total Estimada:</span>
                    <span className="font-bold text-white">{proposal.totalAreaM2} m²</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-800">
                    <span className="text-slate-400">Circuitos Mínimos Reglamentarios:</span>
                    <span className="font-bold text-amber-400">{proposal.minCircuitsCount} circuitos</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-800">
                    <span className="text-slate-400">Circuitos Propuestos:</span>
                    <span className="font-bold text-emerald-400">{proposal.recommendedCircuitsCount} (IUG, TUG, TUE)</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-400">Bocas Totales Proyectadas:</span>
                    <span className="font-bold text-white">
                      {proposal.summaryPoints.totalLights} luces • {proposal.summaryPoints.totalOutletsTUG + proposal.summaryPoints.totalOutletsTUE} tomas
                    </span>
                  </div>
                </div>

                {/* Botón de Carga Inmediata */}
                <button
                  onClick={handleLoadToCAD}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>Cargar Croquis en Plano CAD</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Preguntas de Aclaración para el Cliente */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  Consultas Técnicas Pendientes al Cliente ({proposal.clarifications.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Puntos que el instalador debe corroborar en visita preliminar antes de congelar el presupuesto:
                </p>

                <div className="space-y-2.5">
                  {proposal.clarifications.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                        <span className="font-bold text-slate-200">{q.question}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-3.5">{q.context}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalle de Circuitos del Anteproyecto */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Estructura del Tablero Seccional Propuesto
                </h3>

                <div className="space-y-2 text-xs">
                  {proposal.project.circuits.map((circ) => (
                    <div
                      key={circ.id}
                      className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-white block">{circ.name}</span>
                        <span className="text-[11px] text-slate-400">
                          Cable {circ.crossSectionMm2} mm² Cu • Térmica {circ.breakerAmps}A
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {circ.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
