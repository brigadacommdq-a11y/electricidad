/**
 * ELECTRA PLAN — Renderizador SVG Fotorrealista de Componentes Eléctricos
 * Proporciona modelos detallados con textura, tornillos, palancas, bornes y biseles.
 * Soporta 3 modos de vista: 'realista', 'conexiones' y 'esquematica'.
 */
import React from 'react';
import { ElectricalSymbol } from '../../types/electra';

export type CADViewMode = 'realista' | 'simbolo' | 'aprender' | 'conexiones' | 'esquematica';

interface RealisticCADSymbolSVGProps {
  symbol: ElectricalSymbol;
  viewMode: CADViewMode;
  isSelected: boolean;
  isOn?: boolean;
}

export const RealisticCADSymbolSVG: React.FC<RealisticCADSymbolSVGProps> = ({
  symbol,
  viewMode,
  isSelected,
  isOn = false,
}) => {
  // Si el usuario eligió vista de símbolo unifilar/multifilar normalizado IRAM
  if (viewMode === 'simbolo' || viewMode === 'esquematica') {
    return renderSchematicSymbol(symbol, isSelected, isOn);
  }

  // Si eligió el MODO APRENDER: vista dual lado a lado (Físico + Símbolo IRAM con líneas de correspondencia)
  if (viewMode === 'aprender') {
    return renderAprenderDualMode(symbol, isSelected, isOn);
  }

  // Si eligió vista de conexiones, destacamos las borneras internas y los recorridos de cable
  if (viewMode === 'conexiones') {
    return renderConnectionSymbol(symbol, isSelected, isOn);
  }

  // Vista Realista Física
  switch (symbol.type) {
    case 'luminaria':
      return (
        <g id={symbol.id}>
          <defs>
            {/* Gradiente de cuerpo metálico de luminaria */}
            <radialGradient id={`diffuser-grad-${symbol.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isOn ? '#ffffff' : '#e2e8f0'} />
              <stop offset="60%" stopColor={isOn ? '#fef08a' : '#cbd5e1'} />
              <stop offset="90%" stopColor={isOn ? '#facc15' : '#94a3b8'} />
              <stop offset="100%" stopColor={isOn ? '#eab308' : '#64748b'} />
            </radialGradient>
            {/* Bisel de aluminio cepillado */}
            <linearGradient id={`bezel-grad-${symbol.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            {/* Sombra de profundidad del plafón */}
            <filter id={`shadow-${symbol.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Halo de luz emitida cuando está encendida */}
          {isOn && (
            <g className="pointer-events-none">
              <circle cx={0} cy={0} r={48} fill="rgba(250, 204, 21, 0.12)" />
              <circle cx={0} cy={0} r={34} fill="rgba(253, 224, 71, 0.25)" />
              <circle cx={0} cy={0} r={24} fill="rgba(254, 240, 138, 0.45)" />
            </g>
          )}

          {/* Sombra y Aro exterior / Bisel de fijación embutido */}
          <circle
            cx={0}
            cy={0}
            r={20}
            fill={`url(#bezel-grad-${symbol.id})`}
            stroke={isSelected ? '#f59e0b' : '#334155'}
            strokeWidth={isSelected ? 2.5 : 1.5}
            filter={`url(#shadow-${symbol.id})`}
          />

          {/* Aro interior de fijación */}
          <circle cx={0} cy={0} r={17} fill="#1e293b" stroke="#475569" strokeWidth={0.8} />

          {/* Lente difusor acrílico microprismático */}
          <circle
            cx={0}
            cy={0}
            r={15.5}
            fill={`url(#diffuser-grad-${symbol.id})`}
            stroke={isOn ? '#eab308' : '#64748b'}
            strokeWidth={0.8}
          />

          {/* Microanillos de difusión concéntricos del lente LED */}
          <circle cx={0} cy={0} r={11} fill="none" stroke={isOn ? '#fde047' : '#94a3b8'} strokeWidth={0.5} opacity={0.6} />
          <circle cx={0} cy={0} r={6} fill="none" stroke={isOn ? '#ffffff' : '#cbd5e1'} strokeWidth={0.5} opacity={0.8} />

          {/* Pestañas de fijación por resorte (clips laterales del plafón) */}
          <rect x={-22} y={-3} width={3} height={6} rx={1} fill="#94a3b8" />
          <rect x={19} y={-3} width={3} height={6} rx={1} fill="#94a3b8" />

          {/* Indicador de potencia central sutil */}
          <text
            x={0}
            y={2.5}
            textAnchor="middle"
            fontSize="6"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
            fill={isOn ? '#854d0e' : '#64748b'}
            className="select-none pointer-events-none"
          >
            {symbol.powerWatts || 60}W
          </text>
        </g>
      );

    case 'interruptor_simple':
    case 'interruptor_doble':
    case 'conmutado':
    case 'pulsador': {
      // Placa modular 10x5 cm realista con bastidor, tapa blanca de policarbonato y tecla basculante
      const isOpen = symbol.state?.isOpen !== false;
      const isConmutado = symbol.type === 'conmutado';
      const isDoble = symbol.type === 'interruptor_doble';
      const isPulsador = symbol.type === 'pulsador';

      return (
        <g id={symbol.id}>
          <defs>
            <linearGradient id={`plate-grad-${symbol.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id={`rocker-grad-on-${symbol.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id={`rocker-grad-off-${symbol.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>

          {/* Sombra de la caja de embutir en la pared */}
          <rect x={-20} y={-26} width={40} height={52} rx={4} fill="#090d16" opacity={0.4} />

          {/* Tapa exterior de policarbonato blanco con esquinas redondeadas (Norma 10x5) */}
          <rect
            x={-19}
            y={-25}
            width={38}
            height={50}
            rx={3}
            fill={`url(#plate-grad-${symbol.id})`}
            stroke={isSelected ? '#f59e0b' : '#94a3b8'}
            strokeWidth={isSelected ? 2 : 1}
          />

          {/* Bisel y rebaje interno decorativo del marco */}
          <rect x={-16} y={-22} width={32} height={44} rx={2} fill="none" stroke="#f1f5f9" strokeWidth={0.8} />

          {/* Tornillos de fijación del bastidor a la caja 10x5 (superior e inferior con ranura) */}
          <g transform="translate(0, -21)">
            <circle cx={0} cy={0} r={1.8} fill="#94a3b8" stroke="#64748b" strokeWidth={0.5} />
            <line x1={-1.2} y1={0} x2={1.2} y2={0} stroke="#334155" strokeWidth={0.6} />
          </g>
          <g transform="translate(0, 21)">
            <circle cx={0} cy={0} r={1.8} fill="#94a3b8" stroke="#64748b" strokeWidth={0.5} />
            <line x1={-1.2} y1={0} x2={1.2} y2={0} stroke="#334155" strokeWidth={0.6} />
          </g>

          {/* Ventana portamódulo central */}
          <rect x={-12} y={-15} width={24} height={30} rx={1.5} fill="#334155" />

          {isDoble ? (
            // Dos balancines independientes de medio módulo
            <>
              {/* Tecla 1 (Superior) */}
              <rect
                x={-11}
                y={-14}
                width={22}
                height={13}
                rx={1}
                fill={!isOpen ? '#e2e8f0' : '#ffffff'}
                stroke="#64748b"
                strokeWidth={0.8}
              />
              <line x1={-7} y1={-8} x2={7} y2={-8} stroke="#cbd5e1" strokeWidth={1} />
              <circle cx={0} cy={-11} r={1.2} fill={!isOpen ? '#10b981' : '#94a3b8'} />

              {/* Tecla 2 (Inferior) */}
              <rect
                x={-11}
                y={1}
                width={22}
                height={13}
                rx={1}
                fill="#ffffff"
                stroke="#64748b"
                strokeWidth={0.8}
              />
              <line x1={-7} y1={7} x2={7} y2={7} stroke="#cbd5e1" strokeWidth={1} />
              <circle cx={0} cy={4} r={1.2} fill="#94a3b8" />
            </>
          ) : (
            // Balancín único central (Módulo ancho)
            <>
              <rect
                x={-11}
                y={-14}
                width={22}
                height={28}
                rx={1.5}
                fill={!isOpen ? `url(#rocker-grad-on-${symbol.id})` : `url(#rocker-grad-off-${symbol.id})`}
                stroke="#64748b"
                strokeWidth={0.8}
              />

              {/* Hendidura o relieve táctil central de la tecla */}
              <line x1={-8} y1={0} x2={8} y2={0} stroke="#cbd5e1" strokeWidth={1.5} />
              <line x1={-8} y1={-1} x2={8} y2={-1} stroke="#94a3b8" strokeWidth={0.5} />

              {/* Punto indicador o símbolo de tecla */}
              {isPulsador ? (
                // Icono campana/resorte en pulsador
                <circle cx={0} cy={-6} r={2.5} fill="#f59e0b" />
              ) : isConmutado ? (
                // Flechas cruzadas en conmutador
                <g transform="translate(0, -6)">
                  <line x1={-3} y1={-2} x2={3} y2={2} stroke="#a855f7" strokeWidth={1} />
                  <line x1={-3} y1={2} x2={3} y2={-2} stroke="#a855f7" strokeWidth={1} />
                </g>
              ) : (
                // Punto de estado I/O en tecla unipolar
                <circle
                  cx={0}
                  cy={-7}
                  r={1.8}
                  fill={!isOpen ? '#10b981' : '#94a3b8'}
                />
              )}

              {/* Sombra de inclinación según si está presionado (ON) o reposo (OFF) */}
              <rect
                x={-10}
                y={!isOpen ? -13 : 3}
                width={20}
                height={10}
                fill="#000000"
                opacity={0.08}
                rx={1}
              />
            </>
          )}
        </g>
      );
    }

    case 'tomacorriente':
    case 'toma_especial': {
      // Tomacorriente de pared fotorrealista norma IRAM 2071 (2P+T con espigas inclinadas a 120°)
      const is20A = symbol.type === 'toma_especial';
      const isEnergized = symbol.state?.isEnergized;

      return (
        <g id={symbol.id}>
          <defs>
            <linearGradient id={`outlet-plate-${symbol.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <filter id={`inset-slot-${symbol.id}`}>
              <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Sombra de la caja de embutir */}
          <rect x={-20} y={-26} width={40} height={52} rx={4} fill="#090d16" opacity={0.4} />

          {/* Placa exterior policarbonato blanco */}
          <rect
            x={-19}
            y={-25}
            width={38}
            height={50}
            rx={3}
            fill={`url(#outlet-plate-${symbol.id})`}
            stroke={isSelected ? '#f59e0b' : '#94a3b8'}
            strokeWidth={isSelected ? 2 : 1}
          />

          {/* Tornillos de fijación embutidos */}
          <circle cx={0} cy={-21} r={1.6} fill="#94a3b8" stroke="#64748b" strokeWidth={0.5} />
          <circle cx={0} cy={21} r={1.6} fill="#94a3b8" stroke="#64748b" strokeWidth={0.5} />

          {/* Cavidad circular del zócalo del tomacorriente */}
          <circle
            cx={0}
            cy={0}
            r={16}
            fill="#f1f5f9"
            stroke={is20A ? '#d97706' : '#94a3b8'}
            strokeWidth={is20A ? 1.5 : 1}
          />
          <circle cx={0} cy={0} r={14.5} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={0.6} />

          {/* Ranuras IRAM 2071 (2 Espigas inclinadas para Fase y Neutro + 1 vertical para Tierra) */}
          {/* Ranura Fase (Izquierda, inclinada -30°) */}
          <g transform="translate(-5.5, -4) rotate(30)">
            <rect
              x={-1.2}
              y={-4}
              width={2.4}
              height={8}
              rx={0.6}
              fill="#0f172a"
              filter={`url(#inset-slot-${symbol.id})`}
            />
            {/* Bronce visible al fondo de la espiga */}
            <line x1={0} y1={-2} x2={0} y2={2} stroke="#b45309" strokeWidth={0.8} />
          </g>

          {/* Ranura Neutro (Derecha, inclinada +30°) */}
          <g transform="translate(5.5, -4) rotate(-30)">
            <rect
              x={-1.2}
              y={-4}
              width={2.4}
              height={8}
              rx={0.6}
              fill="#0f172a"
              filter={`url(#inset-slot-${symbol.id})`}
            />
            <line x1={0} y1={-2} x2={0} y2={2} stroke="#0284c7" strokeWidth={0.8} />
          </g>

          {/* Ranura Puesta a Tierra (Inferior, vertical) */}
          <g transform="translate(0, 5.5)">
            <rect
              x={-1.2}
              y={-4.5}
              width={2.4}
              height={9}
              rx={0.6}
              fill="#0f172a"
              filter={`url(#inset-slot-${symbol.id})`}
            />
            <line x1={0} y1={-2} x2={0} y2={2} stroke="#16a34a" strokeWidth={0.8} />
          </g>

          {/* Etiqueta grabada 10A / 20A en la placa */}
          <text
            x={0}
            y={12.5}
            textAnchor="middle"
            fontSize="5.5"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
            fill={is20A ? '#b45309' : '#64748b'}
            className="select-none pointer-events-none"
          >
            {is20A ? '20A TUE' : '10A TUG'}
          </text>

          {/* LED / Indicador sutil si tiene tensión activa */}
          {isEnergized && (
            <circle cx={11} cy={-11} r={1.5} fill="#10b981" />
          )}
        </g>
      );
    }

    case 'caja_paso': {
      // Caja de paso octogonal o 10x10 en chapa estampada cincada o PVC con troqueles para cañerías
      return (
        <g id={symbol.id}>
          <defs>
            <linearGradient id={`metal-box-${symbol.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Polígono octogonal de la caja de embutir */}
          <polygon
            points="-18,-8 -8,-18 8,-18 18,-8 18,8 8,18 -8,18 -18,8"
            fill={`url(#metal-box-${symbol.id})`}
            stroke={isSelected ? '#f59e0b' : '#64748b'}
            strokeWidth={isSelected ? 2 : 1.5}
          />

          {/* Fondo embutido */}
          <polygon
            points="-15,-6 -6,-15 6,-15 15,-6 15,6 6,15 -6,15 -15,6"
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth={1}
          />

          {/* 4 Troqueles / Knockouts estampados para entrada de caños de 3/4" y 7/8" */}
          <circle cx={-12} cy={0} r={3} fill="#1e293b" stroke="#64748b" strokeWidth={0.8} strokeDasharray="2,1" />
          <circle cx={12} cy={0} r={3} fill="#1e293b" stroke="#64748b" strokeWidth={0.8} strokeDasharray="2,1" />
          <circle cx={0} cy={-12} r={3} fill="#1e293b" stroke="#64748b" strokeWidth={0.8} strokeDasharray="2,1" />
          <circle cx={0} cy={12} r={3} fill="#1e293b" stroke="#64748b" strokeWidth={0.8} strokeDasharray="2,1" />

          {/* Bornera o tuerca central de puesta a tierra de la caja metálica */}
          <circle cx={0} cy={0} r={4} fill="#b45309" stroke="#d97706" strokeWidth={0.6} />
          <line x1={-2.5} y1={-2.5} x2={2.5} y2={2.5} stroke="#0f172a" strokeWidth={0.8} />
          <line x1={-2.5} y1={2.5} x2={2.5} y2={-2.5} stroke="#0f172a" strokeWidth={0.8} />
        </g>
      );
    }

    case 'ventilador': {
      // Ventilador de techo con aspas y tulipa central de luz
      return (
        <g id={symbol.id}>
          {/* 4 Aspas estilizadas */}
          <g opacity={0.85}>
            {/* Aspa horizontal izquierda */}
            <path d="M -6 -3 L -24 -7 L -24 7 L -6 3 Z" fill="#78350f" stroke="#451a03" strokeWidth={0.8} />
            {/* Aspa horizontal derecha */}
            <path d="M 6 -3 L 24 -7 L 24 7 L 6 3 Z" fill="#78350f" stroke="#451a03" strokeWidth={0.8} />
            {/* Aspa vertical arriba */}
            <path d="M -3 -6 L -7 -24 L 7 -24 L 3 -6 Z" fill="#78350f" stroke="#451a03" strokeWidth={0.8} />
            {/* Aspa vertical abajo */}
            <path d="M -3 6 L -7 24 L 7 24 L 3 6 Z" fill="#78350f" stroke="#451a03" strokeWidth={0.8} />
          </g>

          {/* Carcasa del motor central metálica */}
          <circle cx={0} cy={0} r={11} fill="#e2e8f0" stroke={isSelected ? '#f59e0b' : '#64748b'} strokeWidth={1.5} />

          {/* Tulipa de iluminación central */}
          <circle
            cx={0}
            cy={0}
            r={7}
            fill={isOn ? '#fef08a' : '#f8fafc'}
            stroke={isOn ? '#eab308' : '#94a3b8'}
            strokeWidth={1}
          />
          {isOn && <circle cx={0} cy={0} r={4} fill="#facc15" />}
        </g>
      );
    }

    case 'puesta_tierra': {
      // Electrodo de puesta a tierra: cámara de inspección circular con tomacables de bronce
      return (
        <g id={symbol.id}>
          {/* Tapa de hormigón/hierro de la cámara de inspección */}
          <circle cx={0} cy={0} r={18} fill="#334155" stroke={isSelected ? '#f59e0b' : '#64748b'} strokeWidth={1.8} />
          <circle cx={0} cy={0} r={15} fill="#1e293b" stroke="#475569" strokeWidth={1} />

          {/* Tomacables y sección de la jabalina de cobre hincada */}
          <circle cx={0} cy={0} r={7} fill="#b45309" stroke="#d97706" strokeWidth={1.2} />
          <circle cx={0} cy={0} r={4} fill="#ea580c" />

          {/* Tornillo pasante de ajuste de bronce */}
          <rect x={-6} y={-1.5} width={12} height={3} fill="#fbbf24" stroke="#92400e" strokeWidth={0.5} />

          {/* Símbolo internacional de tierra verde/amarillo */}
          <g transform="translate(0, -9)">
            <line x1={-5} y1={0} x2={5} y2={0} stroke="#16a34a" strokeWidth={1.2} />
            <line x1={-3} y1={2} x2={3} y2={2} stroke="#16a34a" strokeWidth={1.2} />
            <line x1={-1} y1={4} x2={1} y2={4} stroke="#16a34a" strokeWidth={1.2} />
          </g>
        </g>
      );
    }

    case 'tablero': {
      // Miniatura de Gabinete de Tablero Seccional con contratapa transparente y módulo DIN
      return (
        <g id={symbol.id}>
          {/* Marco exterior del gabinete */}
          <rect
            x={-22}
            y={-18}
            width={44}
            height={36}
            rx={3}
            fill="#1e293b"
            stroke={isSelected ? '#f59e0b' : '#38bdf8'}
            strokeWidth={isSelected ? 2.5 : 1.5}
          />
          {/* Contratapa interior / Riel DIN visible */}
          <rect x={-18} y={-14} width={36} height={28} rx={2} fill="#0f172a" stroke="#334155" strokeWidth={1} />
          <line x1={-18} y1={0} x2={18} y2={0} stroke="#94a3b8" strokeWidth={2} strokeDasharray="3,1.5" />

          {/* Miniaturización de interruptores modulares montados en riel DIN */}
          <rect x={-14} y={-10} width={9} height={20} rx={1} fill="#e2e8f0" stroke="#64748b" strokeWidth={0.6} />
          <rect x={-12} y={-4} width={5} height={8} fill="#0284c7" />
          <rect x={-3} y={-10} width={8} height={20} rx={1} fill="#e2e8f0" stroke="#64748b" strokeWidth={0.6} />
          <rect x={-1} y={-4} width={4} height={8} fill="#10b981" />
          <rect x={7} y={-10} width={8} height={20} rx={1} fill="#e2e8f0" stroke="#64748b" strokeWidth={0.6} />
          <rect x={9} y={-4} width={4} height={8} fill="#0f172a" />
        </g>
      );
    }

    case 'fuente_ac': {
      // Acometida Red Eléctrica con onda senoidal y medidor
      return (
        <g id={symbol.id}>
          <circle cx={0} cy={0} r={17} fill="#0f172a" stroke={isSelected ? '#f59e0b' : '#38bdf8'} strokeWidth={2} />
          <circle cx={0} cy={0} r={14} fill="#1e293b" stroke="#334155" strokeWidth={1} />
          {/* Onda senoidal 220V AC */}
          <path
            d="M -9 0 C -6 -6, -3 -6, 0 0 C 3 6, 6 6, 9 0"
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2}
          />
          <text
            x={0}
            y={9}
            textAnchor="middle"
            fontSize="6"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
            fill="#38bdf8"
            className="select-none pointer-events-none"
          >
            220V
          </text>
        </g>
      );
    }

    case 'termica': {
      // Pequeño Interruptor Automático (PIA / Térmica) modular DIN fotorrealista
      const isTripped = symbol.state?.isTripped;
      return (
        <g id={symbol.id}>
          {/* Cuerpo plástico del módulo DIN gris claro */}
          <rect
            x={-18}
            y={-22}
            width={36}
            height={44}
            rx={2.5}
            fill="#e2e8f0"
            stroke={isSelected ? '#f59e0b' : '#64748b'}
            strokeWidth={isSelected ? 2 : 1.2}
          />
          {/* Ranura frontal y bisel */}
          <rect x={-14} y={-16} width={28} height={32} rx={1.5} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={0.6} />

          {/* Bornes superiores con tornillos prisioneros ranurados (Entrada L y N) */}
          <g transform="translate(-8, -18)">
            <circle cx={0} cy={0} r={2.5} fill="#334155" stroke="#1e293b" strokeWidth={0.5} />
            <line x1={-1.5} y1={0} x2={1.5} y2={0} stroke="#94a3b8" strokeWidth={0.8} />
          </g>
          <g transform="translate(8, -18)">
            <circle cx={0} cy={0} r={2.5} fill="#334155" stroke="#1e293b" strokeWidth={0.5} />
            <line x1={-1.5} y1={0} x2={1.5} y2={0} stroke="#94a3b8" strokeWidth={0.8} />
          </g>

          {/* Bornes inferiores con tornillos (Salida L y N) */}
          <g transform="translate(-8, 18)">
            <circle cx={0} cy={0} r={2.5} fill="#334155" stroke="#1e293b" strokeWidth={0.5} />
            <line x1={-1.5} y1={0} x2={1.5} y2={0} stroke="#94a3b8" strokeWidth={0.8} />
          </g>
          <g transform="translate(8, 18)">
            <circle cx={0} cy={0} r={2.5} fill="#334155" stroke="#1e293b" strokeWidth={0.5} />
            <line x1={-1.5} y1={0} x2={1.5} y2={0} stroke="#94a3b8" strokeWidth={0.8} />
          </g>

          {/* Palanca basculante ergonómica negra */}
          <rect
            x={-7}
            y={isTripped ? 2 : -10}
            width={14}
            height={9}
            rx={2}
            fill="#0f172a"
            stroke="#334155"
            strokeWidth={0.8}
          />
          <line x1={-5} y1={isTripped ? 6 : -5} x2={5} y2={isTripped ? 6 : -5} stroke="#64748b" strokeWidth={1} />

          {/* Ventana de estado I/O */}
          <rect x={-5} y={-1} width={10} height={4} rx={0.8} fill={isTripped ? '#10b981' : '#ef4444'} />

          {/* Texto de calibre (ej: C16) */}
          <text
            x={0}
            y={12}
            textAnchor="middle"
            fontSize="5.5"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
            fill="#0f172a"
          >
            C16 3000A
          </text>
        </g>
      );
    }

    case 'diferencial': {
      // Disyuntor diferencial con botón TEST 'T' y sensibilidad 30mA
      return (
        <g id={symbol.id}>
          {/* Cuerpo DIN doble módulo */}
          <rect
            x={-20}
            y={-22}
            width={40}
            height={44}
            rx={2.5}
            fill="#f1f5f9"
            stroke={isSelected ? '#f59e0b' : '#38bdf8'}
            strokeWidth={isSelected ? 2 : 1.2}
          />
          <rect x={-16} y={-16} width={32} height={32} rx={1.5} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={0.6} />

          {/* Tornillos superiores */}
          <circle cx={-10} cy={-18} r={2.5} fill="#334155" />
          <circle cx={10} cy={-18} r={2.5} fill="#334155" />
          {/* Tornillos inferiores */}
          <circle cx={-10} cy={18} r={2.5} fill="#334155" />
          <circle cx={10} cy={18} r={2.5} fill="#334155" />

          {/* BOTÓN TEST 'T' AMARILLO FUNDAMENTAL */}
          <circle cx={-8} cy={-5} r={4.5} fill="#facc15" stroke="#ca8a04" strokeWidth={0.8} />
          <text x={-8} y={-3.2} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#713f12">
            T
          </text>

          {/* Palanca de rearme */}
          <rect x={3} y={-8} width={8} height={12} rx={1.5} fill="#0284c7" stroke="#0369a1" strokeWidth={0.8} />

          {/* Marca de 30 mA */}
          <text
            x={0}
            y={12}
            textAnchor="middle"
            fontSize="5"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
            fill="#0369a1"
          >
            40A 30mA
          </text>
        </g>
      );
    }

    case 'interruptor_general': {
      // IGA de cabecera con palanca roja robusta
      return (
        <g id={symbol.id}>
          <rect
            x={-20}
            y={-22}
            width={40}
            height={44}
            rx={2.5}
            fill="#e2e8f0"
            stroke={isSelected ? '#f59e0b' : '#ef4444'}
            strokeWidth={isSelected ? 2.5 : 1.5}
          />
          <rect x={-16} y={-16} width={32} height={32} rx={1.5} fill="#cbd5e1" />
          {/* Palanca roja unificada */}
          <rect x={-10} y={-7} width={20} height={10} rx={2} fill="#dc2626" stroke="#991b1b" strokeWidth={0.8} />
          <text x={0} y={12} textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#0f172a">
            IGA 32A 2P
          </text>
        </g>
      );
    }

    case 'dps': {
      // Protector de sobretensiones con cartucho y rayo
      return (
        <g id={symbol.id}>
          <rect
            x={-16}
            y={-22}
            width={32}
            height={44}
            rx={2.5}
            fill="#e2e8f0"
            stroke={isSelected ? '#f59e0b' : '#10b981'}
            strokeWidth={isSelected ? 2 : 1.2}
          />
          {/* Visor de estado Verde (OK) */}
          <rect x={-6} y={-10} width={12} height={6} rx={1} fill="#10b981" stroke="#047857" strokeWidth={0.6} />
          {/* Símbolo de Rayo */}
          <path d="M 0 -1 L -3 4 L 1 4 L -1 9 L 4 3 L 0 3 Z" fill="#f59e0b" stroke="#b45309" strokeWidth={0.5} />
          <text x={0} y={13} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#0f172a">
            DPS 20kA
          </text>
        </g>
      );
    }

    case 'barra_pe': {
      // Barra de latón de tierra con tornillos y soporte verde
      return (
        <g id={symbol.id}>
          {/* Soportes aislantes verdes */}
          <rect x={-20} y={-6} width={5} height={12} rx={1} fill="#16a34a" />
          <rect x={15} y={-6} width={5} height={12} rx={1} fill="#16a34a" />
          {/* Barra de latón dorada */}
          <rect x={-18} y={-4} width={36} height={8} rx={1} fill="#fbbf24" stroke="#d97706" strokeWidth={1} />
          {/* 4 Tornillos */}
          <circle cx={-12} cy={0} r={1.8} fill="#78350f" />
          <circle cx={-4} cy={0} r={1.8} fill="#78350f" />
          <circle cx={4} cy={0} r={1.8} fill="#78350f" />
          <circle cx={12} cy={0} r={1.8} fill="#78350f" />
          <text x={0} y={9} textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#16a34a">
            PE TIERRA
          </text>
        </g>
      );
    }

    case 'barra_n': {
      // Barra de neutro con soporte celeste
      return (
        <g id={symbol.id}>
          <rect x={-20} y={-6} width={5} height={12} rx={1} fill="#0284c7" />
          <rect x={15} y={-6} width={5} height={12} rx={1} fill="#0284c7" />
          <rect x={-18} y={-4} width={36} height={8} rx={1} fill="#cbd5e1" stroke="#64748b" strokeWidth={1} />
          <circle cx={-12} cy={0} r={1.8} fill="#334155" />
          <circle cx={-4} cy={0} r={1.8} fill="#334155" />
          <circle cx={4} cy={0} r={1.8} fill="#334155" />
          <circle cx={12} cy={0} r={1.8} fill="#334155" />
          <text x={0} y={9} textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#0284c7">
            N NEUTRO
          </text>
        </g>
      );
    }

    case 'peine_distribucion': {
      // Peine bipolar DIN con dientes de cobre
      return (
        <g id={symbol.id}>
          <rect x={-20} y={-6} width={40} height={12} rx={1.5} fill="#475569" stroke="#334155" strokeWidth={1} />
          {/* Puntas de cobre salientes */}
          <rect x={-14} y={-10} width={3} height={5} fill="#f59e0b" />
          <rect x={-6} y={-10} width={3} height={5} fill="#f59e0b" />
          <rect x={6} y={-10} width={3} height={5} fill="#f59e0b" />
          <rect x={14} y={-10} width={3} height={5} fill="#f59e0b" />
          <text x={0} y={2.5} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#f8fafc">
            PEINE 2P
          </text>
        </g>
      );
    }

    case 'contactor_modular': {
      // Contactor DIN con bornes A1/A2
      return (
        <g id={symbol.id}>
          <rect
            x={-18}
            y={-22}
            width={36}
            height={44}
            rx={2.5}
            fill="#e2e8f0"
            stroke={isSelected ? '#f59e0b' : '#64748b'}
            strokeWidth={1.5}
          />
          <rect x={-8} y={-10} width={16} height={10} rx={1} fill="#0f172a" />
          <text x={0} y={-3} textAnchor="middle" fontSize="5" fill="#38bdf8" fontWeight="bold">
            A1-A2
          </text>
          <text x={0} y={12} textAnchor="middle" fontSize="5" fill="#0f172a" fontWeight="bold">
            KM 25A
          </text>
        </g>
      );
    }

    case 'temporizador': {
      // Timer horario DIN con dial circular
      return (
        <g id={symbol.id}>
          <rect
            x={-18}
            y={-22}
            width={36}
            height={44}
            rx={2.5}
            fill="#e2e8f0"
            stroke={isSelected ? '#f59e0b' : '#f59e0b'}
            strokeWidth={1.5}
          />
          {/* Cuadrante reloj */}
          <circle cx={0} cy={-2} r={9} fill="#0f172a" stroke="#64748b" strokeWidth={0.8} />
          {/* Manecillas reloj */}
          <line x1={0} y1={-2} x2={0} y2={-7} stroke="#38bdf8" strokeWidth={1} />
          <line x1={0} y1={-2} x2={4} y2={-2} stroke="#38bdf8" strokeWidth={1} />
          <text x={0} y={13} textAnchor="middle" fontSize="5" fill="#0f172a" fontWeight="bold">
            TIMER 24h
          </text>
        </g>
      );
    }

    default:
      // Fallback genérico realista para otros dispositivos
      return (
        <g id={symbol.id}>
          <rect
            x={-16}
            y={-14}
            width={32}
            height={28}
            rx={3}
            fill="#1e293b"
            stroke={isSelected ? '#f59e0b' : '#64748b'}
            strokeWidth={1.8}
          />
          <circle cx={0} cy={0} r={6} fill="#0f172a" stroke="#38bdf8" strokeWidth={1} />
        </g>
      );
  }
};

/**
 * Renderizado en Vista de Conexiones
 * Destaca los bornes con códigos de color y muestra el circuito interno esquemático
 */
function renderConnectionSymbol(
  symbol: ElectricalSymbol,
  isSelected: boolean,
  isOn: boolean
): React.ReactNode {
  return (
    <g>
      {/* Placa base translúcida para ver terminales claramente */}
      <rect
        x={-22}
        y={-22}
        width={44}
        height={44}
        rx={4}
        fill="rgba(15, 23, 42, 0.85)"
        stroke={isSelected ? '#f59e0b' : '#38bdf8'}
        strokeWidth={1.5}
        strokeDasharray="3,2"
      />

      {/* Tipo de componente en texto claro */}
      <text
        x={0}
        y={-13}
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="bold"
        fill="#38bdf8"
        fontFamily="'JetBrains Mono', monospace"
      >
        {symbol.type.replace('_', ' ').toUpperCase()}
      </text>

      {/* Rutas internas entre terminales */}
      {symbol.terminals.length >= 2 && (
        <path
          d={`M ${symbol.terminals[0].relX} ${symbol.terminals[0].relY} Q 0 0 ${symbol.terminals[1].relX} ${symbol.terminals[1].relY}`}
          fill="none"
          stroke={isOn ? '#10b981' : '#64748b'}
          strokeWidth={1.5}
          strokeDasharray="2,2"
        />
      )}

      {/* Símbolo central */}
      <circle cx={0} cy={2} r={8} fill="#1e293b" stroke="#475569" strokeWidth={1} />
      <text
        x={0}
        y={4.5}
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill={isOn ? '#f59e0b' : '#94a3b8'}
      >
        {symbol.label}
      </text>
    </g>
  );
}

/**
 * MODO APRENDER: Visualización Dual Simultánea (Físico + Símbolo IRAM)
 * Muestra el componente real y el símbolo técnico lado a lado, unidos por líneas de correspondencia
 * para que el estudiante aprenda qué parte del símbolo representa cada borne del aparato real.
 */
function renderAprenderDualMode(
  symbol: ElectricalSymbol,
  isSelected: boolean,
  isOn: boolean
): React.ReactNode {
  const stroke = isSelected ? '#f59e0b' : '#38bdf8';

  return (
    <g>
      {/* Fondo contenedor didáctico con borde resaltado */}
      <rect
        x={-52}
        y={-28}
        width={104}
        height={56}
        rx={6}
        fill="rgba(15, 23, 42, 0.92)"
        stroke={stroke}
        strokeWidth={isSelected ? 2 : 1.2}
      />

      {/* Rótulo superior "MODO APRENDER" */}
      <rect x={-34} y={-27} width={68} height={10} rx={2} fill="#1e293b" />
      <text
        x={0}
        y={-20}
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="bold"
        fill="#f59e0b"
        fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.5"
      >
        APRENDER: FÍSICO ↔ SÍMBOLO
      </text>

      {/* Lado Izquierdo: Aspecto Físico Real (escalado a 0.68) */}
      <g transform="translate(-25, 4) scale(0.68)">
        <RealisticCADSymbolSVG symbol={symbol} viewMode="realista" isSelected={false} isOn={isOn} />
      </g>
      <text
        x={-25}
        y={24}
        textAnchor="middle"
        fontSize="5"
        fontWeight="bold"
        fill="#94a3b8"
        fontFamily="'Plus Jakarta Sans', sans-serif"
      >
        MODELO FÍSICO
      </text>

      {/* Flechas y enlace de correspondencia central */}
      <g transform="translate(0, 4)">
        <line x1={-8} y1={-4} x2={8} y2={-4} stroke="#38bdf8" strokeWidth={1} strokeDasharray="2,1" />
        <line x1={-8} y1={4} x2={8} y2={4} stroke="#10b981" strokeWidth={1} strokeDasharray="2,1" />
        <circle cx={0} cy={0} r={4} fill="#0f172a" stroke="#f59e0b" strokeWidth={1} />
        <text x={0} y={1.8} textAnchor="middle" fontSize="4.5" fill="#f59e0b" fontWeight="bold">
          ≡
        </text>
      </g>

      {/* Lado Derecho: Símbolo Normalizado IRAM / IEC (escalado a 0.72) */}
      <g transform="translate(25, 4) scale(0.72)">
        {renderSchematicSymbol(symbol, false, isOn)}
      </g>
      <text
        x={25}
        y={24}
        textAnchor="middle"
        fontSize="5"
        fontWeight="bold"
        fill="#38bdf8"
        fontFamily="'Plus Jakarta Sans', sans-serif"
      >
        SÍMBOLO IRAM
      </text>
    </g>
  );
}

/**
 * Renderizado de Símbolo Técnico Esquemático Normalizado (IRAM 2012 / IEC 60617)
 */
function renderSchematicSymbol(
  symbol: ElectricalSymbol,
  isSelected: boolean,
  isOn: boolean
): React.ReactNode {
  const stroke = isSelected ? '#f59e0b' : '#e2e8f0';

  switch (symbol.type) {
    case 'luminaria':
      return (
        <g>
          <circle cx={0} cy={0} r={14} fill={isOn ? '#fef08a' : '#0f172a'} stroke={stroke} strokeWidth={2} />
          <line x1={-10} y1={-10} x2={10} y2={10} stroke={stroke} strokeWidth={1.5} />
          <line x1={-10} y1={10} x2={10} y2={-10} stroke={stroke} strokeWidth={1.5} />
        </g>
      );

    case 'interruptor_simple':
      return (
        <g>
          <circle cx={0} cy={0} r={12} fill="#0f172a" stroke={stroke} strokeWidth={1.8} />
          <line
            x1={-8}
            y1={0}
            x2={symbol.state?.isOpen ? 6 : 8}
            y2={symbol.state?.isOpen ? -8 : 0}
            stroke={symbol.state?.isOpen ? '#94a3b8' : '#10b981'}
            strokeWidth={2}
          />
          <circle cx={-8} cy={0} r={2} fill={stroke} />
          <circle cx={8} cy={0} r={2} fill={stroke} />
        </g>
      );

    case 'interruptor_doble':
      return (
        <g>
          <circle cx={0} cy={0} r={13} fill="#0f172a" stroke={stroke} strokeWidth={1.8} />
          <line x1={-8} y1={-4} x2={6} y2={-8} stroke="#10b981" strokeWidth={1.5} />
          <line x1={-8} y1={4} x2={6} y2={0} stroke="#10b981" strokeWidth={1.5} />
          <circle cx={-8} cy={-4} r={1.5} fill={stroke} />
          <circle cx={-8} cy={4} r={1.5} fill={stroke} />
        </g>
      );

    case 'conmutado':
      return (
        <g>
          <circle cx={0} cy={0} r={13} fill="#0f172a" stroke={stroke} strokeWidth={1.8} />
          <line x1={-9} y1={0} x2={6} y2={-6} stroke="#a855f7" strokeWidth={2} />
          <circle cx={-9} cy={0} r={2} fill="#a855f7" />
          <circle cx={7} cy={-6} r={1.8} fill={stroke} />
          <circle cx={7} cy={6} r={1.8} fill={stroke} />
        </g>
      );

    case 'pulsador':
      return (
        <g>
          <circle cx={0} cy={0} r={12} fill="#0f172a" stroke={stroke} strokeWidth={1.8} />
          <line x1={-8} y1={0} x2={-2} y2={0} stroke={stroke} strokeWidth={1.5} />
          <line x1={2} y1={0} x2={8} y2={0} stroke={stroke} strokeWidth={1.5} />
          <line x1={-3} y1={-6} x2={3} y2={-6} stroke="#f59e0b" strokeWidth={2} />
          <line x1={0} y1={-6} x2={0} y2={-10} stroke="#f59e0b" strokeWidth={1.5} />
        </g>
      );

    case 'tomacorriente':
    case 'toma_especial': {
      const is20A = symbol.type === 'toma_especial';
      return (
        <g>
          <path d="M -13 0 A 13 13 0 0 1 13 0 Z" fill={is20A ? '#78350f' : '#0f172a'} stroke={stroke} strokeWidth={2} />
          <line x1={-13} y1={0} x2={13} y2={0} stroke={stroke} strokeWidth={2} />
          <line x1={-5} y1={-4} x2={-2} y2={-9} stroke="#ffffff" strokeWidth={1.5} />
          <line x1={5} y1={-4} x2={2} y2={-9} stroke="#ffffff" strokeWidth={1.5} />
          <line x1={0} y1={-2} x2={0} y2={-7} stroke="#16a34a" strokeWidth={1.5} />
        </g>
      );
    }

    case 'termica':
      return (
        <g>
          <rect x={-14} y={-16} width={28} height={32} fill="#0f172a" stroke={stroke} strokeWidth={1.8} rx={2} />
          {/* Interruptor unipolar con disparo térmico y magnético */}
          <line x1={-10} y1={0} x2={4} y2={-8} stroke="#38bdf8" strokeWidth={2} />
          <circle cx={-10} cy={0} r={2} fill={stroke} />
          <circle cx={10} cy={0} r={2} fill={stroke} />
          {/* Símbolo térmico (bimetal) */}
          <path d="M 2 -4 L 6 -4 L 6 -1 L 2 -1 Z" fill="none" stroke="#f59e0b" strokeWidth={1.2} />
          {/* Símbolo magnético */}
          <path d="M -2 4 L -6 4 L -6 7 L -2 7" fill="none" stroke="#ef4444" strokeWidth={1.2} />
        </g>
      );

    case 'diferencial':
      return (
        <g>
          <rect x={-16} y={-16} width={32} height={32} fill="#0f172a" stroke="#38bdf8" strokeWidth={2} rx={2} />
          {/* Transformador toroidal con lazo */}
          <ellipse cx={0} cy={-2} rx={10} ry={6} fill="none" stroke="#38bdf8" strokeWidth={1.5} />
          {/* Líneas primarias cruzando */}
          <line x1={-5} y1={-12} x2={-5} y2={8} stroke="#ffffff" strokeWidth={1} />
          <line x1={5} y1={-12} x2={5} y2={8} stroke="#ffffff" strokeWidth={1} />
          {/* Disparador diferencial (Delta I) */}
          <text x={0} y={11} textAnchor="middle" fontSize="6" fontWeight="bold" fill="#facc15">
            ΔI 30mA
          </text>
        </g>
      );

    case 'interruptor_general':
      return (
        <g>
          <rect x={-16} y={-16} width={32} height={32} fill="#0f172a" stroke="#ef4444" strokeWidth={2} rx={2} />
          <line x1={-10} y1={-6} x2={4} y2={-12} stroke="#ef4444" strokeWidth={2} />
          <line x1={-10} y1={6} x2={4} y2={0} stroke="#ef4444" strokeWidth={2} />
          <line x1={-4} y1={-9} x2={-4} y2={3} stroke="#ef4444" strokeWidth={1} strokeDasharray="2,1" />
          <text x={0} y={12} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#ffffff">
            IGA 2P
          </text>
        </g>
      );

    case 'dps':
      return (
        <g>
          <rect x={-14} y={-16} width={28} height={32} fill="#0f172a" stroke="#10b981" strokeWidth={1.8} rx={2} />
          {/* Símbolo de Varistor (resistencia con línea oblicua) */}
          <rect x={-8} y={-6} width={16} height={10} fill="none" stroke="#f59e0b" strokeWidth={1.2} />
          <line x1={-11} y1={7} x2={11} y2={-9} stroke="#f59e0b" strokeWidth={1.5} />
          <text x={0} y={12} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#10b981">
            DPS
          </text>
        </g>
      );

    case 'puesta_tierra':
      return (
        <g>
          <line x1={0} y1={-14} x2={0} y2={-2} stroke="#16a34a" strokeWidth={2.5} />
          <line x1={-12} y1={-2} x2={12} y2={-2} stroke="#16a34a" strokeWidth={2.5} />
          <line x1={-8} y1={3} x2={8} y2={3} stroke="#16a34a" strokeWidth={2} />
          <line x1={-4} y1={8} x2={4} y2={8} stroke="#16a34a" strokeWidth={1.5} />
          <circle cx={0} cy={-14} r={2.5} fill="#16a34a" />
        </g>
      );

    case 'barra_pe':
      return (
        <g>
          <line x1={-16} y1={0} x2={16} y2={0} stroke="#16a34a" strokeWidth={3} />
          <circle cx={-12} cy={0} r={2} fill="#ffffff" />
          <circle cx={-4} cy={0} r={2} fill="#ffffff" />
          <circle cx={4} cy={0} r={2} fill="#ffffff" />
          <circle cx={12} cy={0} r={2} fill="#ffffff" />
          <text x={0} y={9} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#16a34a">
            BARRA PE
          </text>
        </g>
      );

    case 'barra_n':
      return (
        <g>
          <line x1={-16} y1={0} x2={16} y2={0} stroke="#0284c7" strokeWidth={3} />
          <circle cx={-12} cy={0} r={2} fill="#ffffff" />
          <circle cx={-4} cy={0} r={2} fill="#ffffff" />
          <circle cx={4} cy={0} r={2} fill="#ffffff" />
          <circle cx={12} cy={0} r={2} fill="#ffffff" />
          <text x={0} y={9} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#0284c7">
            BARRA N
          </text>
        </g>
      );

    case 'caja_paso':
      return (
        <g>
          <rect x={-12} y={-12} width={24} height={24} fill="#0f172a" stroke={stroke} strokeWidth={1.8} strokeDasharray="3,2" />
          <circle cx={0} cy={0} r={4} fill="#b45309" stroke="#f59e0b" strokeWidth={1} />
        </g>
      );

    case 'contactor_modular':
      return (
        <g>
          <rect x={-14} y={-16} width={28} height={32} fill="#0f172a" stroke={stroke} strokeWidth={1.8} rx={2} />
          <rect x={-8} y={-10} width={16} height={8} fill="none" stroke="#38bdf8" strokeWidth={1.2} />
          <line x1={-12} y1={-6} x2={-8} y2={-6} stroke="#38bdf8" strokeWidth={1.5} />
          <line x1={8} y1={-6} x2={12} y2={-6} stroke="#38bdf8" strokeWidth={1.5} />
          <text x={0} y={11} textAnchor="middle" fontSize="6" fontWeight="bold" fill="#ffffff">
            KM
          </text>
        </g>
      );

    case 'temporizador':
      return (
        <g>
          <rect x={-14} y={-16} width={28} height={32} fill="#0f172a" stroke={stroke} strokeWidth={1.8} rx={2} />
          <circle cx={0} cy={-2} r={8} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
          <line x1={0} y1={-2} x2={0} y2={-6} stroke="#f59e0b" strokeWidth={1.2} />
          <line x1={0} y1={-2} x2={3} y2={-2} stroke="#f59e0b" strokeWidth={1.2} />
          <text x={0} y={11} textAnchor="middle" fontSize="6" fontWeight="bold" fill="#f59e0b">
            KT
          </text>
        </g>
      );

    default:
      return (
        <g>
          <rect x={-14} y={-14} width={28} height={28} fill="#0f172a" stroke={stroke} strokeWidth={2} />
          <text x={0} y={4} textAnchor="middle" fontSize="9" fontWeight="bold" fill={stroke}>
            {symbol.label}
          </text>
        </g>
      );
  }
}
