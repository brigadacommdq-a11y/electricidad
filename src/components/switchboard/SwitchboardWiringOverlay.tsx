/**
 * ELECTRA PLAN — Capa de Cableado Realista de Tablero Eléctrico
 * Trazado ortogonal a 90 grados, paso por canaletas ranuradas, puentes visuales en cruces
 * y colores normalizados según AEA 90364 (Fase marrón, Neutro celeste, Tierra verde-amarilla).
 */
import React from 'react';
import {
  RealisticSwitchboardWire,
  RealisticDINDevice,
} from '../../types/switchboardWorkshop';
import { SWITCHBOARD_WIRE_COLORS } from '../../services/switchboardCatalog';

interface SwitchboardWiringOverlayProps {
  wires: RealisticSwitchboardWire[];
  devices: RealisticDINDevice[];
  wiringStart: {
    deviceId: string;
    terminalId: string;
    absX: number;
    absY: number;
  } | null;
  cursorPos: { x: number; y: number };
  activeWireType: 'fase' | 'neutro' | 'tierra' | 'control' | 'retorno';
  selectedWireId?: string | null;
  onSelectWire?: (wireId: string) => void;
  onDeleteWire?: (wireId: string) => void;
  energizedWires?: Set<string>;
  zoom: number;
  pan: { x: number; y: number };
}

export const SwitchboardWiringOverlay: React.FC<SwitchboardWiringOverlayProps> = ({
  wires,
  devices,
  wiringStart,
  cursorPos,
  activeWireType,
  selectedWireId,
  onSelectWire,
  onDeleteWire,
  energizedWires = new Set(),
  zoom,
  pan,
}) => {
  // Función para obtener las coordenadas absolutas de un terminal
  const getTerminalAbsoluteCoords = (deviceId: string, terminalId: string) => {
    const dev = devices.find((d) => d.id === deviceId);
    if (!dev) return null;

    const term = dev.terminals.find((t) => t.id === terminalId);
    if (!term) return null;

    // Calcular la posición absoluta en el canvas
    const railStartX = 65;
    const rowHeightPx = 175;
    const railY = 60 + (dev.railId - 1) * rowHeightPx + 45;
    const devX = railStartX + dev.slotIndex * 36;
    const devY = railY - 42;

    return {
      x: devX + term.relX,
      y: devY + term.relY,
      position: term.position,
    };
  };

  /**
   * Genera el recorrido ortogonal con curvas suaves a 90 grados
   */
  const generateOrthogonalPath = (
    from: { x: number; y: number; position?: string },
    to: { x: number; y: number; position?: string },
    routing: 'canaleta' | 'directo' | 'peine' = 'canaleta'
  ) => {
    if (routing === 'directo') {
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }

    // Si los dos bornes están en la misma fila y adyacentes (tipo peine)
    if (Math.abs(from.y - to.y) < 15) {
      const midY = from.y + (from.position === 'top' ? -18 : 18);
      return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
    }

    // Enrutamiento estándar ortogonal pasando por canaleta
    const exitY = from.position === 'top' ? from.y - 20 : from.y + 20;
    const enterY = to.position === 'top' ? to.y - 20 : to.y + 20;

    // Camino: desde -> salida vertical -> codo hacia canaleta -> tramo horizontal -> entrada vertical -> hacia
    const midX = (from.x + to.x) / 2;

    return `M ${from.x} ${from.y} L ${from.x} ${exitY} Q ${from.x} ${exitY + 6} ${from.x + (midX > from.x ? 6 : -6)} ${exitY + 6} L ${midX} ${exitY + 6} L ${midX} ${enterY - 6} Q ${midX} ${enterY} ${to.x} ${enterY} L ${to.x} ${to.y}`;
  };

  return (
    <g
      transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
      className="pointer-events-auto"
    >
      <defs>
        {/* Resplandor para conductores energizados */}
        <filter id="wire-energized-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Trazado de todos los conductores existentes en el tablero */}
      {wires.map((wire) => {
        const fromCoord = getTerminalAbsoluteCoords(wire.fromDeviceId, wire.fromTerminalId);
        const toCoord = getTerminalAbsoluteCoords(wire.toDeviceId, wire.toTerminalId);

        if (!fromCoord || !toCoord) return null;

        const isSelected = selectedWireId === wire.id;
        const isEnergized = energizedWires.has(wire.id);
        const wireColorConfig = SWITCHBOARD_WIRE_COLORS[wire.conductorType] || SWITCHBOARD_WIRE_COLORS.fase;
        const pathData = generateOrthogonalPath(fromCoord, toCoord, wire.routing);

        return (
          <g
            key={wire.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectWire?.(wire.id);
            }}
            className="cursor-pointer group"
          >
            {/* Zona ampliada de detección de clic */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth={14}
              className="cursor-pointer"
            />

            {/* Sombra de relieve del cable sobre el fondo */}
            <path
              d={pathData}
              fill="none"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={wire.crossSectionMm2 >= 4 ? 4.5 : 3.5}
              strokeLinecap="round"
              transform="translate(1, 2)"
            />

            {/* Conductor principal con aislación normalizada */}
            <path
              d={pathData}
              fill="none"
              stroke={isSelected ? '#f59e0b' : wireColorConfig.stroke}
              strokeWidth={wire.crossSectionMm2 >= 6 ? 4 : wire.crossSectionMm2 >= 4 ? 3.2 : 2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={isEnergized ? 'url(#wire-energized-glow)' : undefined}
              className="transition-all"
            />

            {/* Rayado bi-color característico para cable de Tierra (Verde con franja Amarilla) */}
            {wire.conductorType === 'tierra' && (
              <path
                d={pathData}
                fill="none"
                stroke="#eab308"
                strokeWidth={1.5}
                strokeDasharray="8,8"
                strokeLinecap="round"
              />
            )}

            {/* Terminales en los extremos del cable (ojal de cobre / puntera hueca) */}
            <circle cx={fromCoord.x} cy={fromCoord.y} r={3} fill="#e2e8f0" stroke="#0f172a" strokeWidth={1} />
            <circle cx={toCoord.x} cy={toCoord.y} r={3} fill="#e2e8f0" stroke="#0f172a" strokeWidth={1} />

            {/* Etiqueta flotante al pasar el mouse */}
            <title>{`${wireColorConfig.label} · Sección: ${wire.crossSectionMm2} mm²`}</title>
          </g>
        );
      })}

      {/* 2. Cable dinámico en proceso de conexión (mientras el usuario arrastra hacia el destino) */}
      {wiringStart && (
        <g className="pointer-events-none">
          {/* Línea elástica hacia la posición del cursor */}
          <line
            x1={wiringStart.absX}
            y1={wiringStart.absY}
            x2={cursorPos.x}
            y2={cursorPos.y}
            stroke={SWITCHBOARD_WIRE_COLORS[activeWireType]?.stroke || '#f59e0b'}
            strokeWidth={3}
            strokeDasharray="4,4"
            className="animate-pulse"
          />
          {/* Círculo en borne origen */}
          <circle
            cx={wiringStart.absX}
            cy={wiringStart.absY}
            r={6}
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth={2}
          />
        </g>
      )}
    </g>
  );
};
