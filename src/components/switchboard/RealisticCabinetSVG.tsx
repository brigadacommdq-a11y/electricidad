/**
 * ELECTRA PLAN — Renderizador del Gabinete Eléctrico Realista
 * Chasis IP40/IP65, placa de fondo, rieles DIN de acero zincado de 35 mm, canaletas ranuradas y puerta abatible.
 */
import React from 'react';
import { DINRailConfig, RealisticDINDevice } from '../../types/switchboardWorkshop';
import { RealisticDeviceSVG } from './RealisticDeviceSVG';

interface RealisticCabinetSVGProps {
  rowsCount: number;
  modulesPerRow: number;
  doorOpen: boolean;
  doorType: 'fume' | 'opaca' | 'transparente';
  hasCableDucts: boolean;
  rails: DINRailConfig[];
  devices: RealisticDINDevice[];
  selectedDeviceId: string | null;
  selectedTerminalId: string | null;
  onSelectDevice: (deviceId: string) => void;
  onToggleDeviceState: (deviceId: string) => void;
  onTestDifferential: (deviceId: string) => void;
  onTerminalClick: (deviceId: string, terminal: any, absX: number, absY: number) => void;
  viewMode: 'realista' | 'esquema' | 'conexiones';
  energizedTerminals?: Set<string>;
  zoom: number;
  pan: { x: number; y: number };
}

export const RealisticCabinetSVG: React.FC<RealisticCabinetSVGProps> = ({
  rowsCount = 2,
  modulesPerRow = 14,
  doorOpen = true,
  doorType = 'fume',
  hasCableDucts = true,
  rails,
  devices,
  selectedDeviceId,
  selectedTerminalId,
  onSelectDevice,
  onToggleDeviceState,
  onTestDifferential,
  onTerminalClick,
  viewMode,
  energizedTerminals = new Set(),
  zoom,
  pan,
}) => {
  // Dimensiones del gabinete en píxeles
  const railWidthPx = modulesPerRow * 36; // ej. 14 módulos * 36 = 504 px
  const cabinetWidth = railWidthPx + 140; // márgenes laterales para canaletas y fijación
  const rowHeightPx = 175; // altura por cada riel con espacio para bornes y canaleta
  const cabinetHeight = rowsCount * rowHeightPx + 110;

  return (
    <svg
      className="w-full h-full select-none"
      style={{
        transformOrigin: '0 0',
      }}
    >
      <defs>
        {/* Patrón de acero zincado para riel DIN */}
        <linearGradient id="din-rail-metal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="25%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="75%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        {/* Patrón de canaleta ranurada */}
        <pattern id="cable-duct-slots" width="12" height="18" patternUnits="userSpaceOnUse">
          <rect width="12" height="18" fill="#1e293b" />
          <rect x="2" y="2" width="8" height="14" rx="2" fill="#090d16" />
        </pattern>

        {/* Sombra de relieve interior de gabinete */}
        <filter id="cabinet-inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feComponentTransfer in="SourceAlpha">
            <feFuncA type="linear" slope="0.7" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feOffset dx="0" dy="4" />
          <feComposite operator="out" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* Contenedor con Pan y Zoom */}
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* 1. CHASIS EXTERIOR DEL GABINETE */}
        <rect
          x={0}
          y={0}
          width={cabinetWidth}
          height={cabinetHeight}
          rx={16}
          fill="#131a26"
          stroke="#334155"
          strokeWidth={4}
          className="shadow-2xl"
        />

        {/* Tornillos de esquina del gabinete */}
        {[
          { cx: 16, cy: 16 },
          { cx: cabinetWidth - 16, cy: 16 },
          { cx: 16, cy: cabinetHeight - 16 },
          { cx: cabinetWidth - 16, cy: cabinetHeight - 16 },
        ].map((screw, idx) => (
          <g key={idx} transform={`translate(${screw.cx}, ${screw.cy})`}>
            <circle cx={0} cy={0} r={6} fill="#475569" stroke="#64748b" strokeWidth={1} />
            <line x1={-3} y1={0} x2={3} y2={0} stroke="#cbd5e1" strokeWidth={1} />
            <line x1={0} y1={-3} x2={0} y2={3} stroke="#cbd5e1" strokeWidth={1} />
          </g>
        ))}

        {/* 2. PLACA DE FONDO / BANDEJA DE MONTAJE (Fondo texturado) */}
        <rect
          x={18}
          y={18}
          width={cabinetWidth - 36}
          height={cabinetHeight - 36}
          rx={10}
          fill="#0c111c"
          stroke="#1e293b"
          strokeWidth={2}
        />

        {/* 3. CANALETAS RANURADAS PERIMETRALES PARA ORDENAR CABLES */}
        {hasCableDucts && (
          <>
            {/* Canaleta Vertical Izquierda */}
            <rect
              x={24}
              y={24}
              width={26}
              height={cabinetHeight - 48}
              rx={3}
              fill="url(#cable-duct-slots)"
              stroke="#334155"
              strokeWidth={1}
            />
            {/* Canaleta Vertical Derecha */}
            <rect
              x={cabinetWidth - 50}
              y={24}
              width={26}
              height={cabinetHeight - 48}
              rx={3}
              fill="url(#cable-duct-slots)"
              stroke="#334155"
              strokeWidth={1}
            />
            {/* Canaleta Horizontal Superior */}
            <rect
              x={50}
              y={24}
              width={cabinetWidth - 100}
              height={20}
              rx={3}
              fill="url(#cable-duct-slots)"
              stroke="#334155"
              strokeWidth={1}
            />
            {/* Canaleta Horizontal Inferior */}
            <rect
              x={50}
              y={cabinetHeight - 44}
              width={cabinetWidth - 100}
              height={20}
              rx={3}
              fill="url(#cable-duct-slots)"
              stroke="#334155"
              strokeWidth={1}
            />
          </>
        )}

        {/* 4. RIELES DIN METÁLICOS DE 35 mm CON RANURAS */}
        {rails.map((rail, rIdx) => {
          const railY = 60 + rIdx * rowHeightPx + 45;
          const railStartX = 65;
          const railLength = railWidthPx;

          return (
            <g key={rail.id} id={`rail_${rail.id}`}>
              {/* Etiqueta del riel */}
              <text
                x={railStartX}
                y={railY - 48}
                fill="#64748b"
                fontSize="10"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="600"
              >
                {rail.name} · ({rail.capacityModules} Módulos DIN 35mm)
              </text>

              {/* Perfil del Riel DIN 35x7.5 mm */}
              <rect
                x={railStartX}
                y={railY}
                width={railLength}
                height={26}
                rx={2}
                fill="url(#din-rail-metal)"
                stroke="#475569"
                strokeWidth={1.5}
                className="shadow-inner"
              />

              {/* Ranuras troqueladas de fijación del riel metálico */}
              {Array.from({ length: Math.floor(railLength / 36) }).map((_, slotIdx) => (
                <rect
                  key={slotIdx}
                  x={railStartX + slotIdx * 36 + 10}
                  y={railY + 8}
                  width={16}
                  height={10}
                  rx={2}
                  fill="#1e293b"
                  opacity={0.6}
                />
              ))}

              {/* Dispositivos montados sobre este riel */}
              {devices
                .filter((d) => d.railId === rail.id)
                .sort((a, b) => a.slotIndex - b.slotIndex)
                .map((dev) => {
                  const devX = railStartX + dev.slotIndex * 36;
                  const devY = railY - 42; // Encaja perfectamente sobre el riel DIN

                  return (
                    <g key={dev.id} transform={`translate(${devX}, ${devY})`}>
                      <RealisticDeviceSVG
                        device={dev}
                        isSelected={selectedDeviceId === dev.id}
                        isEnergized={energizedTerminals.has(`${dev.id}:1_in`)}
                        selectedTerminalId={
                          selectedDeviceId === dev.id ? selectedTerminalId : null
                        }
                        onSelect={() => onSelectDevice(dev.id)}
                        onToggleState={() => onToggleDeviceState(dev.id)}
                        onTestDifferential={() => onTestDifferential(dev.id)}
                        onTerminalClick={(term, rx, ry) =>
                          onTerminalClick(dev.id, term, devX + rx, devY + ry)
                        }
                        viewMode={viewMode}
                      />
                    </g>
                  );
                })}
            </g>
          );
        })}

        {/* 5. PUERTA DEL GABINETE (Abatible / Visible cuando doorOpen = false) */}
        {!doorOpen && (
          <g className="transition-all duration-300">
            {/* Ventana fumé transparente o cubierta ciega */}
            <rect
              x={18}
              y={18}
              width={cabinetWidth - 36}
              height={cabinetHeight - 36}
              rx={10}
              fill={
                doorType === 'fume'
                  ? 'rgba(15, 23, 42, 0.75)'
                  : doorType === 'transparente'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : '#1e293b'
              }
              stroke="#64748b"
              strokeWidth={3}
              className="backdrop-blur-xs"
            />

            {/* Maneta o cerradura de la puerta */}
            <g transform={`translate(${cabinetWidth - 45}, ${cabinetHeight / 2 - 15})`}>
              <rect x={0} y={0} width={12} height={30} rx={4} fill="#475569" stroke="#94a3b8" strokeWidth={1.5} />
              <circle cx={6} cy={15} r={3} fill="#0f172a" />
            </g>

            {/* Texto de advertencia de peligro eléctrico en la puerta */}
            <g transform={`translate(${cabinetWidth / 2}, ${cabinetHeight - 40})`}>
              <rect x={-110} y={-14} width={220} height={24} rx={4} fill="#eab308" stroke="#ca8a04" strokeWidth={1.5} />
              <text
                x={0}
                y={2}
                textAnchor="middle"
                fill="#451a03"
                fontSize="10"
                fontWeight="extrabold"
                fontFamily="'JetBrains Mono', monospace"
              >
                ⚡ PELIGRO 220V - TABLERO SECCIONAL
              </text>
            </g>
          </g>
        )}
      </g>
    </svg>
  );
};
