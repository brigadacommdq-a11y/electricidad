/**
 * ELECTRA PLAN — Renderizador Vectorial Realista de Dispositivos DIN
 * Interruptores termomagnéticos (PIAs/MCB), disyuntores diferenciales con botón TEST,
 * IGA, descargadores de sobretensiones DPS, medidor digital multifunción LCD, contactor y borneras.
 */
import React from 'react';
import { RealisticDINDevice, DeviceTerminal } from '../../types/switchboardWorkshop';

interface RealisticDeviceSVGProps {
  device: RealisticDINDevice;
  isSelected?: boolean;
  isEnergized?: boolean;
  selectedTerminalId?: string | null;
  onSelect?: () => void;
  onToggleState?: () => void;
  onTestDifferential?: () => void;
  onTerminalClick?: (terminal: DeviceTerminal, absX: number, absY: number) => void;
  viewMode?: 'realista' | 'esquema' | 'conexiones';
}

export const RealisticDeviceSVG: React.FC<RealisticDeviceSVGProps> = ({
  device,
  isSelected = false,
  isEnergized = false,
  selectedTerminalId = null,
  onSelect,
  onToggleState,
  onTestDifferential,
  onTerminalClick,
  viewMode = 'realista',
}) => {
  const width = device.modulesWidth * 36;
  const height = 110;

  const isClosed = device.state === 'closed';
  const isTripped = device.state === 'tripped';

  // Carcasa frontal con textura y biseles
  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      className="cursor-pointer select-none group"
    >
      {/* Sombra proyectada del componente */}
      <rect
        x={2}
        y={4}
        width={width}
        height={height}
        rx={5}
        fill="rgba(0,0,0,0.4)"
        filter="blur(3px)"
      />

      {/* Carcasa principal (Termoplástico Poliamida ignífuga RAL 7035) */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={5}
        fill={
          viewMode === 'esquema'
            ? '#0f172a'
            : isSelected
            ? '#1e293b'
            : '#1e2430'
        }
        stroke={
          isSelected
            ? '#f59e0b'
            : isTripped
            ? '#ef4444'
            : isEnergized
            ? '#38bdf8'
            : '#475569'
        }
        strokeWidth={isSelected ? 2.5 : 1.5}
      />

      {/* Biseles y gradiente superior de carcasa */}
      {viewMode === 'realista' && (
        <>
          {/* Tapa frontal escalonada */}
          <rect
            x={3}
            y={20}
            width={width - 6}
            height={height - 40}
            rx={3}
            fill="#273142"
            stroke="#334155"
            strokeWidth={1}
          />

          {/* Ranuras laterales de ventilación térmica */}
          {Array.from({ length: 3 }).map((_, i) => (
            <line
              key={i}
              x1={4}
              y1={28 + i * 5}
              x2={8}
              y2={28 + i * 5}
              stroke="#0f172a"
              strokeWidth={1.5}
            />
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <line
              key={`r_${i}`}
              x1={width - 8}
              y1={28 + i * 5}
              x2={width - 4}
              y2={28 + i * 5}
              stroke="#0f172a"
              strokeWidth={1.5}
            />
          ))}

          {/* Ranura central de división para polos múltiples */}
          {device.modulesWidth > 1 &&
            Array.from({ length: device.modulesWidth - 1 }).map((_, idx) => (
              <line
                key={`div_${idx}`}
                x1={(idx + 1) * 36}
                y1={0}
                x2={(idx + 1) * 36}
                y2={height}
                stroke="#0f172a"
                strokeWidth={1.5}
                strokeDasharray="4,2"
              />
            ))}
        </>
      )}

      {/* DETALLES ESPECÍFICOS SEGÚN EL TIPO DE DISPOSITIVO */}

      {/* 1. Medidor Digital Multifunción con pantalla LCD retroiluminada */}
      {device.type === 'medidor_digital' && (
        <g transform="translate(6, 24)">
          {/* Marco de pantalla LCD */}
          <rect
            x={0}
            y={0}
            width={width - 12}
            height={50}
            rx={3}
            fill="#031628"
            stroke="#0ea5e9"
            strokeWidth={1.5}
          />
          {/* Texto de pantalla LCD digital */}
          <text
            x={(width - 12) / 2}
            y={15}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
          >
            {isEnergized ? '228.4 V ~ 50Hz' : '0.0 V [OFF]'}
          </text>
          <text
            x={(width - 12) / 2}
            y={29}
            textAnchor="middle"
            fill="#4ade80"
            fontSize="11"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="extrabold"
          >
            {isEnergized ? '12.4 A · 2.8 kW' : '0.00 A'}
          </text>
          <text
            x={(width - 12) / 2}
            y={42}
            textAnchor="middle"
            fill="#fbbf24"
            fontSize="8"
            fontFamily="'JetBrains Mono', monospace"
          >
            cos φ 0.94 · 142 kWh
          </text>
        </g>
      )}

      {/* 2. Descargador de Sobretensiones (DPS / SPD) */}
      {device.type === 'dps' && (
        <g transform="translate(6, 24)">
          <rect
            x={0}
            y={0}
            width={width - 12}
            height={55}
            rx={3}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth={1}
          />
          {/* Cartucho enchufable con visor de estado */}
          <rect
            x={(width - 12) / 2 - 12}
            y={12}
            width={24}
            height={14}
            rx={2}
            fill={isTripped ? '#ef4444' : '#22c55e'}
            stroke="#0f172a"
            strokeWidth={1.5}
          />
          <text
            x={(width - 12) / 2}
            y={22}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="8"
            fontWeight="bold"
          >
            {isTripped ? 'DEFECT' : 'OK'}
          </text>
          <text
            x={(width - 12) / 2}
            y={40}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="8"
            fontFamily="'JetBrains Mono', monospace"
          >
            SPD 20kA 275V
          </text>
        </g>
      )}

      {/* 3. Disyuntor Diferencial (ID con botón TEST) */}
      {device.type === 'diferencial' && (
        <g transform={`translate(${width / 2 - 14}, 25)`}>
          {/* Botón TEST [T] */}
          <rect
            x={0}
            y={0}
            width={28}
            height={16}
            rx={3}
            fill="#eab308"
            stroke="#ca8a04"
            strokeWidth={1}
            onClick={(e) => {
              e.stopPropagation();
              onTestDifferential?.();
            }}
            className="hover:scale-105 active:scale-95 transition-transform"
          />
          <text
            x={14}
            y={11}
            textAnchor="middle"
            fill="#451a03"
            fontSize="9"
            fontWeight="extrabold"
            fontFamily="'JetBrains Mono', monospace"
          >
            TEST [T]
          </text>
        </g>
      )}

      {/* 4. Palanca / Maneta de accionamiento manual (para IGA, ID, PIA, Contactor) */}
      {device.type !== 'dps' &&
        device.type !== 'medidor_digital' &&
        device.type !== 'repartidor_bloque' &&
        device.type !== 'barra_neutro' &&
        device.type !== 'barra_tierra' && (
          <g
            transform={`translate(${width / 2 - 12}, 46)`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleState?.();
            }}
            className="hover:brightness-125 transition-all"
          >
            {/* Fondo de la cavidad de la maneta */}
            <rect
              x={0}
              y={0}
              width={24}
              height={26}
              rx={3}
              fill="#090d16"
              stroke="#334155"
              strokeWidth={1}
            />

            {/* Bandera indicadora de estado físico (Verde = 0 / OFF, Rojo = I / ON) */}
            <rect
              x={2}
              y={2}
              width={20}
              height={6}
              rx={1}
              fill={isClosed ? '#ef4444' : '#22c55e'}
            />
            <text
              x={12}
              y={7}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="6"
              fontWeight="bold"
            >
              {isClosed ? 'I · ON' : '0 · OFF'}
            </text>

            {/* Maneta ergonómica basculante */}
            <rect
              x={2}
              y={isClosed ? 6 : 14}
              width={20}
              height={10}
              rx={2}
              fill={isTripped ? '#dc2626' : '#475569'}
              stroke="#64748b"
              strokeWidth={1}
              className="transition-all duration-150 shadow-md"
            />
            {/* Estrías de agarre en la maneta */}
            <line
              x1={6}
              y1={isClosed ? 11 : 19}
              x2={18}
              y2={isClosed ? 11 : 19}
              stroke="#94a3b8"
              strokeWidth={1}
            />
          </g>
        )}

      {/* 5. Serigrafía técnica y rótulo de calibración */}
      <g transform="translate(0, 77)">
        {/* Etiqueta de Tipo y Calibre */}
        <text
          x={width / 2}
          y={6}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="9"
          fontWeight="bold"
          fontFamily="'JetBrains Mono', monospace"
        >
          {device.type === 'diferencial'
            ? `${device.ratingAmps}A 30mA`
            : device.type === 'dps'
            ? 'DPS 20kA'
            : device.type === 'medidor_digital'
            ? '63A 230V'
            : device.type === 'barra_neutro'
            ? 'BARRA N'
            : device.type === 'barra_tierra'
            ? 'BARRA PE'
            : `C${device.ratingAmps}`}
        </text>

        {/* Marca de poder de corte o norma */}
        <text
          x={width / 2}
          y={15}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="7"
          fontFamily="'JetBrains Mono', monospace"
        >
          {device.type === 'diferencial'
            ? 'Clase AC · 6kA'
            : device.type === 'iga'
            ? 'IGA 6000A'
            : device.type === 'termomagnetico'
            ? `${device.breakingCapacityKa || 4.5}kA · 230V`
            : device.poles}
        </text>

        {/* Rótulo de circuito personalizado en la base del módulo */}
        <rect
          x={4}
          y={19}
          width={width - 8}
          height={11}
          rx={2}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={0.8}
        />
        <text
          x={width / 2}
          y={27.5}
          textAnchor="middle"
          fill={device.circuitId ? '#38bdf8' : '#e2e8f0'}
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          className="truncate"
        >
          {device.customTag || device.circuitId || device.label}
        </text>
      </g>

      {/* 6. Bornes y Tornillos Metálicos (Terminales Superior e Inferior) */}
      {device.terminals.map((term) => {
        const isSelectedTerm = selectedTerminalId === term.id;
        return (
          <g
            key={term.id}
            transform={`translate(${term.relX}, ${term.relY})`}
            onClick={(e) => {
              e.stopPropagation();
              onTerminalClick?.(term, term.relX, term.relY);
            }}
            className="group/term"
          >
            {/* Zona táctil invisible ampliada para dedos en celular (26 px diámetro) */}
            <circle cx={0} cy={0} r={13} fill="transparent" />

            {/* Caja metálica de apriete / borne DIN */}
            <rect
              x={-5}
              y={-5}
              width={10}
              height={10}
              rx={1.5}
              fill="#334155"
              stroke={isSelectedTerm ? '#f59e0b' : '#64748b'}
              strokeWidth={isSelectedTerm ? 2 : 1}
            />

            {/* Cabeza del tornillo de apriete (acero zincado con ranura Pozidriv) */}
            <circle
              cx={0}
              cy={0}
              r={3.5}
              fill={
                term.type === 'fase'
                  ? '#854d0e'
                  : term.type === 'neutro'
                  ? '#0284c7'
                  : term.type === 'tierra'
                  ? '#16a34a'
                  : '#475569'
              }
            />
            {/* Ranura del tornillo */}
            <line x1={-2} y1={0} x2={2} y2={0} stroke="#ffffff" strokeWidth={0.8} />

            {/* Identificador técnico del borne */}
            <text
              x={0}
              y={term.position === 'top' ? -7 : 11}
              textAnchor="middle"
              fill={isSelectedTerm ? '#f59e0b' : '#94a3b8'}
              fontSize="6"
              fontWeight="bold"
              fontFamily="'JetBrains Mono', monospace"
            >
              {term.id}
            </text>
          </g>
        );
      })}
    </g>
  );
};
