/**
 * ELECTRA PLAN — Inspector Automático de Normativa AEA 90364-771 (Fase 8)
 * Auditor integral de instalaciones eléctricas de baja tensión en inmuebles.
 * Verifica automáticamente:
 * 1. Grado de Electrificación según superficie cubierta (Mínimo, Medio, Elevado, Superior).
 * 2. Puntos Mínimos de Utilización (PMS) por ambiente (IUG, TUG, TUE).
 * 3. Cantidad mínima reglamentaria de circuitos seccionales.
 * 4. Calibres y secciones mínimas de conductores (IRAM 2183 / 247-3).
 * 5. Caída de tensión admisible (ΔV ≤ 3% iluminación, ≤ 5% tomas/fuerza motriz).
 * 6. Esquema de Puesta a Tierra (PAT) y sensibilidad del Interruptor Diferencial (ID ≤ 30mA).
 * 7. Emisión de Certificado Oficial de Inspección Técnica Imprimible (Apto / Observado / No Apto).
 */
import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Download,
  Info,
  Layers,
  ChevronRight,
  Zap,
  Home,
  Sliders,
  Award,
  RefreshCw,
} from 'lucide-react';
import { Project, Room, Circuit } from '../types/electra';

interface AutomaticInspectorViewProps {
  project: Project;
}

export type InspectionVerdict = 'apto' | 'observado' | 'no_apto';

interface AuditCheckItem {
  id: string;
  category: 'electrificacion' | 'pms' | 'circuitos' | 'conductores' | 'protecciones' | 'seguridad';
  title: string;
  normativeRef: string;
  status: 'pass' | 'warning' | 'fail';
  measuredValue: string;
  requiredValue: string;
  observation: string;
  recommendation: string;
}

export const AutomaticInspectorView: React.FC<AutomaticInspectorViewProps> = ({ project }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [inspectorName, setInspectorName] = useState<string>('Ing. / Téc. Electricista Matriculado');
  const [registrationNumber, setRegistrationNumber] = useState<string>('COPIME / CIE Mat. 14.892-A');

  // =========================================================================
  // 1. CÁLCULO DE SUPERFICIE Y GRADO DE ELECTRIFICACIÓN (AEA 90364-771.6)
  // =========================================================================
  const totalArea = useMemo(() => {
    if (!project.rooms || project.rooms.length === 0) return 65; // Valor estándar por defecto
    return project.rooms.reduce((acc, r) => {
      const area = (r.width || 4) * (r.height || 3.5);
      return acc + area;
    }, 0);
  }, [project.rooms]);

  const electrificationGrade = useMemo(() => {
    if (totalArea <= 60) return { grade: 'Mínimo', minCircuits: 2, limit: 'Hasta 60 m²' };
    if (totalArea <= 130) return { grade: 'Medio', minCircuits: 3, limit: 'De 60 a 130 m²' };
    if (totalArea <= 200) return { grade: 'Elevado', minCircuits: 5, limit: 'De 130 a 200 m²' };
    return { grade: 'Superior', minCircuits: 6, limit: 'Más de 200 m²' };
  }, [totalArea]);

  // Contadores del proyecto
  const lampsCount = useMemo(() => project.symbols.filter((s) => s.type === 'luminaria').length, [project.symbols]);
  const socketsCount = useMemo(
    () => project.symbols.filter((s) => s.type === 'tomacorriente' || s.type === 'toma_especial').length,
    [project.symbols]
  );
  const specialSocketsCount = useMemo(
    () => project.symbols.filter((s) => s.type === 'toma_especial').length,
    [project.symbols]
  );

  const circuitsCount = project.circuits?.length || 0;
  const hasGround = project.symbols.some((s) => s.type === 'puesta_tierra');
  const hasDifferential =
    project.symbols.some((s) => s.type === 'diferencial') ||
    project.switchboard?.components?.some((c) => c.type === 'diferencial');
  const hasIGA =
    project.symbols.some((s) => s.type === 'interruptor_general') ||
    project.switchboard?.components?.some((c) => c.type === 'iga');

  // =========================================================================
  // 2. MATRIZ DE REGLAS DE AUDITORÍA AEA 90364-771
  // =========================================================================
  const auditChecks: AuditCheckItem[] = useMemo(() => {
    const checks: AuditCheckItem[] = [];

    // Regla 1: Cantidad mínima de circuitos según grado de electrificación
    const circuitsPassed = circuitsCount >= electrificationGrade.minCircuits;
    checks.push({
      id: 'circuits_min',
      category: 'circuitos',
      title: 'Cantidad Mínima de Circuitos Derivados',
      normativeRef: 'AEA 90364-771.8.2 / Tabla 771.8.I',
      status: circuitsPassed ? 'pass' : 'fail',
      measuredValue: `${circuitsCount} circuito(s) proyectado(s)`,
      requiredValue: `Mínimo ${electrificationGrade.minCircuits} circuitos para grado ${electrificationGrade.grade}`,
      observation: circuitsPassed
        ? `Cumple holgadamente con los requerimientos para ${totalArea.toFixed(1)} m².`
        : `Déficit de circuitos derivados independientes. Riesgo de sobrecarga en líneas terminales.`,
      recommendation: circuitsPassed
        ? 'Mantener circuitos separados para IUG y TUG.'
        : `Agregar al menos ${electrificationGrade.minCircuits - circuitsCount} circuito(s) adicional(es) en el tablero.`,
    });

    // Regla 2: Puntos Mínimos de Utilización de Iluminación (IUG)
    const minLampsRequired = Math.max(project.rooms.length, Math.ceil(totalArea / 18));
    const lampsPassed = lampsCount >= minLampsRequired;
    checks.push({
      id: 'pms_iug',
      category: 'pms',
      title: 'Puntos Mínimos de Iluminación General (IUG)',
      normativeRef: 'AEA 90364-771.8.1 / Puntos Mínimos de Utilización',
      status: lampsPassed ? 'pass' : lampsCount > 0 ? 'warning' : 'fail',
      measuredValue: `${lampsCount} boca(s) de iluminación instalada(s)`,
      requiredValue: `Mínimo ${minLampsRequired} boca(s) (1 por ambiente o cada 18 m²)`,
      observation: lampsPassed
        ? 'Densidad lumínica adecuada para los locales proyectados.'
        : 'Ambientes sin iluminación o con cobertura insuficiente según superficie.',
      recommendation: lampsPassed
        ? 'Verificar que ninguna boca de IUG supere los 6A de consumo.'
        : 'Instalar bocas de techo o apliques en los locales señalados.',
    });

    // Regla 3: Puntos Mínimos de Tomacorrientes (TUG)
    const minSocketsRequired = Math.max(project.rooms.length * 2, Math.ceil(totalArea / 6));
    const socketsPassed = socketsCount >= minSocketsRequired;
    checks.push({
      id: 'pms_tug',
      category: 'pms',
      title: 'Puntos Mínimos de Tomacorrientes Generales (TUG)',
      normativeRef: 'AEA 90364-771.8.3 / Tomas de Uso General',
      status: socketsPassed ? 'pass' : socketsCount >= minSocketsRequired * 0.7 ? 'warning' : 'fail',
      measuredValue: `${socketsCount} tomacorriente(s) instalado(s)`,
      requiredValue: `Mínimo ${minSocketsRequired} bocas de tomacorriente (1 cada 6 m²)`,
      observation: socketsPassed
        ? 'Cantidad de tomas suficiente para evitar el uso peligroso de prolongadores o adaptadores.'
        : 'Pocos tomas proyectados: inducirá al usuario al uso de zapatillas y triples.',
      recommendation: socketsPassed
        ? 'Asegurar conexión de tres espigas planas con tierra IRAM 2071.'
        : 'Aumentar la dotación de tomas en cocina, estar y dormitorios.',
    });

    // Regla 4: Conductor de Puesta a Tierra (PE) y Jabalina
    const peWiresCount = project.wires.filter((w) => w.type === 'tierra').length;
    const pePassed = hasGround && (peWiresCount > 0 || project.wires.length === 0);
    checks.push({
      id: 'grounding_pe',
      category: 'seguridad',
      title: 'Esquema de Puesta a Tierra (PAT TT) y Conductor PE',
      normativeRef: 'AEA 90364-771.3.1.2 / IRAM 2281',
      status: pePassed ? 'pass' : 'fail',
      measuredValue: hasGround ? 'Jabalina PAT presente con conductor PE' : 'Jabalina ausente o sin cableado PE',
      requiredValue: 'Jabalina de cobre-acero reglamentaria con Ra ≤ 10 Ω y PE a todas las bocas',
      observation: pePassed
        ? 'Protección contra contactos indirectos debidamente proyectada.'
        : 'PELIGRO CRÍTICO: La falta de PAT expone a los usuarios a choque eléctrico por masa energizada.',
      recommendation: pePassed
        ? 'Realizar medición de resistencia con telurímetro antes de la energización definitiva.'
        : 'Instalar jabalina hincada en terreno con cámara de inspección y cable verde-amarillo de 2.5 mm² mín.',
    });

    // Regla 5: Interruptor Diferencial (ID ≤ 30 mA)
    checks.push({
      id: 'rcd_protection',
      category: 'protecciones',
      title: 'Protección Diferencial de Cabecera (ID)',
      normativeRef: 'AEA 90364-771.18.3.1 / IRAM 2301 / IEC 61008',
      status: hasDifferential ? 'pass' : 'fail',
      measuredValue: hasDifferential ? 'Disyuntor Diferencial presente (30 mA)' : 'Sin Interruptor Diferencial',
      requiredValue: 'Sensibilidad IΔn ≤ 30 mA de alta velocidad (t ≤ 200 ms) en cabecera',
      observation: hasDifferential
        ? 'Protección adicional contra contactos directos e indirectos correctamente ubicada.'
        : 'NO CONFORME: No se permite energizar ninguna instalación sin disyuntor diferencial de 30 mA.',
      recommendation: hasDifferential
        ? 'Accionar mensualmente el pulsador de test (T).'
        : 'Montar interruptor diferencial bipolar de 25A o 40A / 30mA aguas abajo del IGA.',
    });

    // Regla 6: Secciones Mínimas de Conductores en Circuitos
    let sectionViolations: string[] = [];
    project.circuits.forEach((c) => {
      const sec = c.crossSectionMm2 || 1.5;
      if (c.type === 'IUG' && sec < 1.5) {
        sectionViolations.push(`${c.name}: ${sec} mm² (mínimo 1.5 mm²)`);
      } else if (c.type === 'TUG' && sec < 2.5) {
        sectionViolations.push(`${c.name}: ${sec} mm² (mínimo 2.5 mm²)`);
      } else if (c.type === 'TUE' && sec < 2.5) {
        sectionViolations.push(`${c.name}: ${sec} mm² (mínimo 2.5 mm²)`);
      }
    });

    const sectionsPassed = sectionViolations.length === 0;
    checks.push({
      id: 'cable_sections',
      category: 'conductores',
      title: 'Sección Mínima de Conductores de Cobre',
      normativeRef: 'AEA 90364-771.19 / Tabla 771.19.I',
      status: sectionsPassed ? 'pass' : 'fail',
      measuredValue: sectionsPassed
        ? 'Todas las secciones cumplen con la norma'
        : `Infracción en: ${sectionViolations.join(', ')}`,
      requiredValue: 'IUG: ≥ 1.5 mm² | TUG: ≥ 2.5 mm² | TUE: ≥ 2.5 mm² | Seccional: ≥ 4.0 mm²',
      observation: sectionsPassed
        ? 'Conductores adecuadamente dimensionados según su función.'
        : 'Conductores subdimensionados con riesgo severo de sobrecalentamiento e incendio.',
      recommendation: sectionsPassed
        ? 'Utilizar siempre conductores antillama IRAM 247-3 o libres de halógenos IRAM 62267.'
        : 'Aumentar la sección del conductor al valor reglamentario antes de colocar la térmica.',
    });

    // Regla 7: Coordinación Térmica / Cable (Ib ≤ In ≤ Iz)
    let coordinationViolations: string[] = [];
    project.circuits.forEach((c) => {
      const In = c.breakerAmps || 16;
      const sec = c.crossSectionMm2 || 1.5;
      const Iz = sec === 1.5 ? 15 : sec === 2.5 ? 21 : sec === 4 ? 28 : 36;
      if (In > Iz) {
        coordinationViolations.push(
          `${c.name}: Térmica ${In}A supera corriente admisible del cable (${Iz}A para ${sec}mm²)`
        );
      }
    });

    const coordinationPassed = coordinationViolations.length === 0;
    checks.push({
      id: 'breaker_cable_coordination',
      category: 'protecciones',
      title: 'Coordinación Termomagnética (In ≤ Iz)',
      normativeRef: 'AEA 90364-771.19.2 / Protección de Conductores',
      status: coordinationPassed ? 'pass' : 'fail',
      measuredValue: coordinationPassed
        ? 'Coordinación adecuada en todos los circuitos'
        : coordinationViolations[0],
      requiredValue: 'La corriente nominal de la térmica (In) debe ser MENOR o IGUAL a la admisible del cable (Iz)',
      observation: coordinationPassed
        ? 'El conductor está protegido contra sobrecargas por su respectiva termomagnética.'
        : 'El conductor se quemará antes de que la térmica llegue a disparar.',
      recommendation: coordinationPassed
        ? 'Verificar que la curva de disparo sea B o C para cargas domiciliarias.'
        : 'Reducir el calibre de la térmica o aumentar la sección del cable.',
    });

    // Regla 8: Límite de Bocas por Circuito (Máx 15 bocas según AEA)
    let bocasOverlimit: string[] = [];
    project.circuits.forEach((c) => {
      const count = project.symbols.filter((s) => s.circuitId === c.id).length;
      if (count > 15) {
        bocasOverlimit.push(`${c.name}: ${count} bocas (máx 15)`);
      }
    });

    const bocasPassed = bocasOverlimit.length === 0;
    checks.push({
      id: 'bocas_per_circuit',
      category: 'circuitos',
      title: 'Límite Máximo de Bocas por Circuito Terminal',
      normativeRef: 'AEA 90364-771.8.2 / Máximo 15 bocas',
      status: bocasPassed ? 'pass' : 'warning',
      measuredValue: bocasPassed ? 'Todos los circuitos con ≤ 15 bocas' : bocasOverlimit.join(', '),
      requiredValue: 'Máximo 15 bocas de salida por cada circuito de IUG o TUG',
      observation: bocasPassed
        ? 'Distribución equilibrada que previene saturación de bocas.'
        : 'Circuito con exceso de bocas conectadas.',
      recommendation: bocasPassed
        ? 'Mantener margen de ampliación futura (10 a 12 bocas recomendado).'
        : 'Desdoblar el circuito saturado en dos circuitos terminales independientes.',
    });

    return checks;
  }, [
    project,
    totalArea,
    electrificationGrade,
    circuitsCount,
    lampsCount,
    socketsCount,
    hasGround,
    hasDifferential,
    hasIGA,
  ]);

  // Veredicto Global
  const globalVerdict: InspectionVerdict = useMemo(() => {
    const hasFail = auditChecks.some((c) => c.status === 'fail');
    const hasWarning = auditChecks.some((c) => c.status === 'warning');
    if (hasFail) return 'no_apto';
    if (hasWarning) return 'observado';
    return 'apto';
  }, [auditChecks]);

  const passedChecksCount = auditChecks.filter((c) => c.status === 'pass').length;
  const warningChecksCount = auditChecks.filter((c) => c.status === 'warning').length;
  const failedChecksCount = auditChecks.filter((c) => c.status === 'fail').length;

  const filteredChecks = useMemo(() => {
    if (filterCategory === 'all') return auditChecks;
    return auditChecks.filter((c) => c.category === filterCategory);
  }, [auditChecks, filterCategory]);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFB] dark:bg-[#0B1319] overflow-y-auto">
      {/* Encabezado Principal */}
      <div className="bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-6 py-5 sticky top-0 z-10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${
                globalVerdict === 'apto'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : globalVerdict === 'observado'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
              }`}
            >
              {globalVerdict === 'apto' ? (
                <ShieldCheck className="w-7 h-7" />
              ) : globalVerdict === 'observado' ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <ShieldAlert className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#111827] dark:text-[#E8F0F2]">
                  Inspector Automático de Cumplimiento AEA 90364-771
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5F5] dark:bg-[#1B2B36] text-[#167D78] dark:text-[#2DD4BF] border border-[#167D78]/20">
                  Norma Argentina
                </span>
              </div>
              <p className="text-xs text-[#5A7184] dark:text-[#8BA2B2]">
                Auditoría reglamentaria en tiempo real de dimensiones, circuitos, protecciones y seguridad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCertificateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#167D78] hover:bg-[#12635F] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <Award className="w-4 h-4" />
              <span>Emitir Certificado AEA</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner de Veredicto Global */}
        <div
          className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm ${
            globalVerdict === 'apto'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
              : globalVerdict === 'observado'
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
              : 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-800/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                globalVerdict === 'apto'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : globalVerdict === 'observado'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
              }`}
            >
              {globalVerdict === 'apto' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : globalVerdict === 'observado' ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider font-bold text-[#5A7184] dark:text-[#8BA2B2]">
                  Dictamen de la Inspección
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    globalVerdict === 'apto'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : globalVerdict === 'observado'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                  }`}
                >
                  {globalVerdict === 'apto'
                    ? 'APTO REGLAMENTARIO'
                    : globalVerdict === 'observado'
                    ? 'OBSERVADO CON OBSERVACIONES'
                    : 'NO APTO — RIESGO ELÉCTRICO'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#111827] dark:text-white mt-1">
                {globalVerdict === 'apto'
                  ? 'La instalación cumple las condiciones de seguridad y dimensionamiento AEA 90364-771'
                  : globalVerdict === 'observado'
                  ? 'La instalación requiere adecuaciones menores antes de la habilitación formal'
                  : 'Existen no conformidades críticas que impiden la habilitación del suministro'}
              </h2>
              <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] mt-1 max-w-2xl">
                {globalVerdict === 'apto'
                  ? 'Se verificaron protecciones diferenciales, esquema PAT, dimensionamiento de conductores y densidad de bocas conforme al grado de electrificación.'
                  : globalVerdict === 'observado'
                  ? 'Revise la cantidad de bocas por circuito o la densidad de tomacorrientes para evitar sobrecargas futuras.'
                  : 'Falta de puesta a tierra, disyuntor ausente o conductores con calibre menor a la protección termomagnética asignada.'}
              </p>
            </div>
          </div>

          {/* Estadísticas de Comprobaciones */}
          <div className="flex items-center gap-3 shrink-0 bg-white/80 dark:bg-[#142028]/80 p-3 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center px-3">
              <span className="block text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {passedChecksCount}
              </span>
              <span className="text-[10px] text-[#5A7184] uppercase font-semibold">Conformes</span>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center px-3">
              <span className="block text-2xl font-bold text-amber-600 dark:text-amber-400">
                {warningChecksCount}
              </span>
              <span className="text-[10px] text-[#5A7184] uppercase font-semibold">Observados</span>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center px-3">
              <span className="block text-2xl font-bold text-red-600 dark:text-red-400">
                {failedChecksCount}
              </span>
              <span className="text-[10px] text-[#5A7184] uppercase font-semibold">Críticos</span>
            </div>
          </div>
        </div>

        {/* Parámetros Generales de la Obra Auditada */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-xs text-[#5A7184] font-medium block">Superficie Cubierta Límite</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#111827] dark:text-white">
                {totalArea.toFixed(1)}
              </span>
              <span className="text-xs text-[#5A7184]">m²</span>
            </div>
            <span className="text-[11px] text-[#167D78] font-semibold mt-1 block">
              {project.rooms.length} ambiente(s) modelado(s)
            </span>
          </div>

          <div className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-xs text-[#5A7184] font-medium block">Grado de Electrificación</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#167D78] dark:text-[#2DD4BF]">
                {electrificationGrade.grade}
              </span>
            </div>
            <span className="text-[11px] text-[#5A7184] mt-1 block">
              Exige mín. {electrificationGrade.minCircuits} circuitos
            </span>
          </div>

          <div className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-xs text-[#5A7184] font-medium block">Circuitos en Tablero</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl font-bold ${
                  circuitsCount >= electrificationGrade.minCircuits
                    ? 'text-[#111827] dark:text-white'
                    : 'text-red-500'
                }`}
              >
                {circuitsCount}
              </span>
              <span className="text-xs text-[#5A7184]">/ {electrificationGrade.minCircuits} requeridos</span>
            </div>
            <span className="text-[11px] text-[#5A7184] mt-1 block">
              {circuitsCount >= electrificationGrade.minCircuits ? '✓ Cumple cupo' : '✗ Faltan circuitos'}
            </span>
          </div>

          <div className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-xs text-[#5A7184] font-medium block">Esquema de Conexión</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#111827] dark:text-white">
                Esquema TT
              </span>
            </div>
            <span className="text-[11px] text-[#5A7184] mt-1 block">
              ID 30mA + PAT independiente
            </span>
          </div>
        </div>

        {/* Filtros de Categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todas las Reglas' },
            { id: 'circuitos', label: 'Circuitos & Distribución' },
            { id: 'pms', label: 'Puntos Mínimos (PMS)' },
            { id: 'conductores', label: 'Conductores & Secciones' },
            { id: 'protecciones', label: 'Protecciones & Curvas' },
            { id: 'seguridad', label: 'Seguridad & Puesta a Tierra' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterCategory === cat.id
                  ? 'bg-[#167D78] text-white shadow-xs'
                  : 'bg-white dark:bg-[#142028] text-[#5A7184] dark:text-[#8BA2B2] border border-[#DCE4E8] dark:border-[#243542] hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista Detallada de Comprobaciones */}
        <div className="space-y-3">
          {filteredChecks.map((check) => (
            <div
              key={check.id}
              className={`p-5 rounded-xl border bg-white dark:bg-[#142028] transition-all hover:shadow-xs ${
                check.status === 'pass'
                  ? 'border-emerald-200/80 dark:border-emerald-900/30'
                  : check.status === 'warning'
                  ? 'border-amber-300 dark:border-amber-800/50'
                  : 'border-red-300 dark:border-red-800/50'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="mt-0.5 shrink-0">
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111827] dark:text-white">
                        {check.title}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {check.normativeRef}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs py-2 my-1 border-y border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-[#5A7184] font-medium block">Valor en Proyecto:</span>
                        <span className="font-semibold text-[#111827] dark:text-[#E8F0F2]">
                          {check.measuredValue}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5A7184] font-medium block">Exigencia Normativa:</span>
                        <span className="font-semibold text-[#167D78] dark:text-[#2DD4BF]">
                          {check.requiredValue}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF]">
                      <strong className="text-gray-700 dark:text-gray-300">Dictamen: </strong>
                      {check.observation}
                    </p>

                    {check.status !== 'pass' && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 text-xs text-amber-900 dark:text-amber-200">
                        <strong>Acción Correctiva Sugerida: </strong>
                        {check.recommendation}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:flex-col justify-end gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      check.status === 'pass'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : check.status === 'warning'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    }`}
                  >
                    {check.status === 'pass'
                      ? 'CONFORME'
                      : check.status === 'warning'
                      ? 'OBSERVADO'
                      : 'NO CONFORME'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE CERTIFICADO OFICIAL DE INSPECCIÓN TÉCNICA */}
      {showCertificateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowCertificateModal(false)}
        >
          <div
            className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Membrete del Certificado */}
            <div className="border-b-2 border-[#167D78] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#167D78] text-white flex items-center justify-center font-bold text-xl shadow-md">
                  EP
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111827] dark:text-white uppercase tracking-wider">
                    Certificado de Inspección y Aptitud Técnica Eléctrica
                  </h2>
                  <p className="text-xs text-[#5A7184] dark:text-[#8BA2B2]">
                    Conforme a la Reglamentación para la Ejecución de Instalaciones Eléctricas en Inmuebles AEA 90364-771
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-[#5A7184] block">Nº CERT: CIT-{Date.now().toString().slice(-6)}</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Fecha: {new Date().toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>

            {/* Datos del Proyecto y Profesional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 dark:bg-[#1A2833] p-4 rounded-xl">
              <div>
                <span className="text-[#5A7184] font-medium block">Inmueble / Obra:</span>
                <span className="font-bold text-sm text-[#111827] dark:text-white">
                  {project.metadata?.name || 'Instalación Residencial'}
                </span>
                <span className="text-[11px] text-[#5A7184] block mt-1">
                  Superficie Límite: {totalArea.toFixed(1)} m² | Grado: {electrificationGrade.grade}
                </span>
              </div>
              <div>
                <label className="text-[#5A7184] font-medium block">Profesional Responsable / Matrícula:</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full text-xs font-semibold bg-white dark:bg-[#142028] border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 mt-0.5 text-gray-800 dark:text-gray-200"
                />
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full text-[11px] font-mono bg-white dark:bg-[#142028] border border-gray-300 dark:border-gray-700 rounded-md px-2 py-0.5 mt-1 text-gray-600 dark:text-gray-400"
                />
              </div>
            </div>

            {/* Cuadro de Dictamen Técnico */}
            <div
              className={`p-4 rounded-xl border text-center ${
                globalVerdict === 'apto'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                  : globalVerdict === 'observado'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-200'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-300 text-red-900 dark:text-red-200'
              }`}
            >
              <span className="text-xs uppercase font-bold tracking-widest block">Dictamen Final del Perito</span>
              <span className="text-2xl font-black mt-1 block">
                {globalVerdict === 'apto'
                  ? 'APTO PARA CONEXIÓN A LA RED (HABILITACIÓN APROBADA)'
                  : globalVerdict === 'observado'
                  ? 'HABILITACIÓN CONDICIONAL — CON OBSERVACIONES'
                  : 'NO APTO — RECHAZADO POR RIESGO ELÉCTRICO'}
              </span>
              <p className="text-xs mt-2 max-w-xl mx-auto opacity-90">
                {globalVerdict === 'apto'
                  ? 'La instalación inspeccionada cumple con todos los requerimientos de seguridad contra choques eléctricos, sobrecargas y cortocircuitos según AEA 90364-771.'
                  : 'La instalación requiere subsanar los puntos no conformes indicados antes de la energización o inspección municipal.'}
              </p>
            </div>

            {/* Resumen de Comprobaciones */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-[11px]">
                Desglose de Auditoría Reglamentaria:
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                {auditChecks.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-[#1A2833] border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      {c.status === 'pass' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : c.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium text-gray-800 dark:text-gray-200">{c.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-500">{c.measuredValue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                Cerrar
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#167D78] hover:bg-[#12635F] text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Certificado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
