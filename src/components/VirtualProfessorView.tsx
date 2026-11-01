/**
 * ELECTRA PLAN — Profesor Virtual de Electricidad (Fase 5)
 * Tutor pedagógico inteligente contextualizado a la instalación y proyecto del usuario.
 * Ofrece dos niveles pedagógicos: "Modo Principiante" (analogías sencillas) y "Modo Técnico Matriculado" (AEA 90364).
 * Genera lecciones interactivas, diagnóstico de diseño y consultorio de dudas eléctricas.
 */
import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Zap,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Search,
  Layers,
  Compass,
  Info,
} from 'lucide-react';
import { Project, Circuit } from '../types/electra';

interface VirtualProfessorViewProps {
  project: Project;
}

type PedagogyLevel = 'principiante' | 'matriculado';

export const VirtualProfessorView: React.FC<VirtualProfessorViewProps> = ({ project }) => {
  const [pedagogyLevel, setPedagogyLevel] = useState<PedagogyLevel>('principiante');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('leccion_viaje');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);

  // Análisis contextual del proyecto
  const totalWatts = project.symbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0);
  const totalAmps = (totalWatts / 220).toFixed(1);
  const lampsCount = project.symbols.filter((s) => s.type === 'luminaria').length;
  const socketsCount = project.symbols.filter((s) => s.type === 'tomacorriente' || s.type === 'toma_especial').length;
  const hasGround = project.symbols.some((s) => s.type === 'puesta_tierra');
  const hasRCD = project.symbols.some((s) => s.type === 'diferencial') || project.switchboard?.components?.some((c) => c.type === 'diferencial');
  const hasIGA = project.symbols.some((s) => s.type === 'interruptor_general') || project.switchboard?.components?.some((c) => c.type === 'iga');

  // Lecciones personalizadas según los datos del proyecto
  const LESSONS = useMemo(() => [
    {
      id: 'leccion_viaje',
      title: '¿Cómo viaja la corriente por tu casa?',
      icon: Zap,
      summary: 'El camino de los electrones desde la vereda hasta la lámpara de tu habitación.',
      beginnerText: `
        Imaginate que la electricidad es como agua que fluye por tuberías:
        • La red de la calle te entrega la "presión" de agua (eso son los 220 Voltios).
        • En la entrada de tu casa tenés el Tablero (TSG), que actúa como una llave maestra inteligente: si hay peligro, corta todo al instante.
        • En tu proyecto tenés ${project.circuits.length} circuitos independientes. Cada uno es un caño separado para que si se rompe la luz del baño, los enchufes de la cocina sigan funcionando.
        • Para que una lámpara encienda, el circuito tiene que cerrarse: la Fase lleva la energía y el Neutro la regresa. Si la llave de luz está abierta, el camino se corta y la luz se apaga.
      `,
      proText: `
        Topología de distribución y lazo galvánico según AEA 90364-771:
        • La acometida monofásica 220V 50Hz ingresa a la caja de toma y medidor con conductores de acometida de 4 mm² o 6 mm² (IRAM 2183).
        • Aguas abajo del medidor se ubica el Interruptor General Automático (IGA) omnipolar de corte simultáneo (${hasIGA ? 'Presente en tu proyecto' : 'Pendiente de colocación'}).
        • La protección diferencial clase AC de 30 mA garantiza desconexión en t < 30 ms ante corrientes de fuga a tierra (${hasRCD ? 'Correctamente instalado' : 'Faltante reglamentario'}).
        • En tu instalación se dimensionaron ${project.circuits.length} circuitos seccionales independientes, asegurando que la corriente de proyecto Ib nunca supere la corriente nominal In de cada interruptor termomagnético.
      `,
    },
    {
      id: 'leccion_tierra',
      title: 'El salvavidas invisible: Puesta a Tierra y Disyuntor',
      icon: ShieldCheck,
      summary: 'Por qué no te electrocutas al tocar la chapa del lavarropas o la heladera.',
      beginnerText: `
        El cable verde y amarillo es el guardaespaldas de tu familia:
        • Si un cable con corriente se pela adentro de tu lavarropas y toca la chapa metálica, la chapa se electrifica a 220V.
        • Si no hubiera cable a tierra y vos tocás el lavarropas descalzo, toda la corriente pasaría por tu cuerpo hacia el piso.
        • Pero como tenés el cable verde y amarillo conectado a la jabalina (${hasGround ? 'Tu proyecto tiene jabalina colocada' : '¡Atención: Te falta agregar la jabalina al plano!'}), la corriente prefiere irse por ese cable de cobre que ofrece un camino mil veces más fácil que tu cuerpo.
        • En ese mismo instante, el Disyuntor siente que la corriente se está escapando y corta la luz en menos de un parpadeo (30 milésimas de segundo).
      `,
      proText: `
        Esquema de conexión a tierra TT según AEA 90364-771.3.2:
        • El neutro del transformador MT/BT está sólidamente puesto a tierra en el centro de transformación (Rn).
        • Las masas de la instalación de usuario están unidas a una toma de tierra local independiente mediante conductor de protección PE (Verde-Amarillo, IRAM 2183) de sección mínima 2,5 mm².
        • La resistencia de puesta a tierra Ra del electrodo de jabalina debe satisfacer la condición: Ra · IΔn ≤ 24 V (tensión límite de seguridad en locales secos). Para IΔn = 30 mA, Ra máxima teórica es 800 Ω, pero AEA 771 exige estrictamente Ra ≤ 10 Ω para garantizar equipotencialidad sólida.
      `,
    },
    {
      id: 'leccion_regla_oro',
      title: 'La Regla de Oro del Electricista: Ib ≤ In ≤ Iz',
      icon: BookOpen,
      summary: 'La fórmula que evita que los cables se quemen adentro de los caños.',
      beginnerText: `
        Esta es la regla más importante de la electricidad doméstica:
        • Ib es lo que gastan tus electrodomésticos (ej: 10 Amperes).
        • In es la fuerza de la térmica (ej: 16 Amperes).
        • Iz es lo máximo que aguanta el cable antes de prenderse fuego (ej: 18 Amperes para cable de 2,5 mm²).
        • La térmica tiene que ser más fuerte que tus aparatos para no saltar de gusto, pero MÁS DÉBIL que el cable para saltar antes de que el cable se derrita.
      `,
      proText: `
        Coordinación y protección de conductores contra sobrecargas (AEA 771.19):
        • Condición 1: Ib ≤ In ≤ Iz
          Donde Ib es la corriente de diseño de la carga simultánea, In es la corriente asignada del dispositivo de protección, e Iz es la corriente admisible en régimen permanente del conductor según método de instalación B1 (caño embutido en mampostería) a 40°C ambiente.
        • Condición 2 de sobrecarga admisible: I2 ≤ 1.45 · Iz
          Donde I2 es la corriente convencional de disparo térmico de la termomagnética (1.45 · In para IEC 60898).
        • Para conductores de 1,5 mm² (Iz = 15 A), In máxima = 10 A o 13 A.
        • Para conductores de 2,5 mm² (Iz = 21 A), In máxima = 16 A.
        • Para conductores de 4,0 mm² (Iz = 28 A), In máxima = 20 A o 25 A.
      `,
    },
    {
      id: 'leccion_pava_caloventor',
      title: '¿Por qué salta la térmica con la pava y el caloventor?',
      icon: Lightbulb,
      summary: 'La física de las sobrecargas domésticas y cómo evitar incendios.',
      beginnerText: `
        Imaginate que un enchufe común soporta hasta 10 Amperes (unos 2200 Watts):
        • Un caloventor gasta unos 2000 Watts (unos 9 Amperes).
        • Una pava eléctrica gasta unos 1800 Watts (unos 8 Amperes).
        • Si los enchufás los dos al mismo tiempo en el mismo circuito, suman 17 Amperes.
        • La térmica de 16A del circuito empieza a calentarse por dentro. Una chapita metálica se curva lentamente y, después de unos segundos, se dispara con un "clack" salvando tu casa de que se quemen los cables adentro de la pared.
      `,
      proText: `
        Curva de disparo térmico bimetálico y corriente de sobrecarga:
        • Un interruptor termomagnético curva C (IEC 60898) posee dos mecanismos de disparo: bimetal térmico (para sobrecargas lentas de 1.13 a 1.45 In) y bobina electromagnética instantánea (para cortocircuitos de 5 a 10 In).
        • Al conectar 3800 W en un circuito de tomacorrientes de 220V:
          Ib = 3800 / 220 = 17.27 A > In = 16 A.
        • El coeficiente de sobrecarga es k = 17.27 / 16 = 1.08. A medida que el bimetal se calienta por efecto Joule (P = I² · R), se deforma mecánicamente liberando el pestillo en un lapso de 10 a 60 minutos.
        • Solución reglamentaria: Asignar circuitos exclusivos de tomas de uso especial (TUE) con térmicas de 20A y cables de 4 mm² para artefactos de alto consumo continuo.
      `,
    },
  ], [project, hasGround, hasRCD, hasIGA]);

  // Consultorio de Preguntas Frecuentes de Alumnos y Clientes
  const FAQS = [
    {
      id: 'faq_neutro_pasa_corriente',
      q: '¿Por qué si toco el neutro no me da una patada si por ahí vuelve la corriente?',
      a: 'Porque el Neutro está conectado directamente a tierra en el transformador de la empresa eléctrica en la calle. Por lo tanto, el neutro tiene un potencial casi igual al del suelo donde vos estás parado (0 Voltios). La corriente solo pasa por tu cuerpo si hay una "diferencia de altura" eléctrica (diferencia de potencial). Como entre el neutro y el piso hay 0V, los electrones no tienen motivo para atravesarte. ¡Ojo! Si el cable de neutro se corta adentro de tu casa, se electrifica a 220V a través de cualquier lámpara enchufada.',
    },
    {
      id: 'faq_seccion_cables',
      q: '¿Puedo poner cable de 1,5 mm² en los tomacorrientes si solo enchufo veladores?',
      a: '¡No! La norma AEA 90364-771 lo prohíbe terminantemente. En los tomacorrientes (TUG) el cable mínimo obligatorio es de 2,5 mm² de cobre. El motivo es que vos hoy enchufás un velador, pero mañana otra persona puede enchufar una estufa de 2000W o una aspiradora. Los cables deben dimensionarse para lo que el enchufe permite conectar físicamente, no para tu hábito personal.',
    },
    {
      id: 'faq_disyuntor_vs_termica',
      q: '¿Cuál es la diferencia entre el disyuntor y la térmica?',
      a: 'La Térmica protege a los CABLES y a la casa de incendios (salta si hay demasiada corriente o cortocircuito). El Disyuntor protege a las PERSONAS de morir electrocutadas (salta si la corriente se desvía hacia el cuerpo de una persona o chasis a tierra). Ambos son obligatorios y cumplen roles complementarios: la térmica no te salva de una patada, y el disyuntor no salva los cables de una sobrecarga.',
    },
    {
      id: 'faq_guirnalda',
      q: '¿Por qué no se debe puentear de un toma a otro en guirnalda?',
      a: 'Porque toda la corriente del segundo, tercer y cuarto toma tiene que pasar a través de los pequeños tornillitos del primer enchufe. Si conectás una estufa en el último toma, los bornes del primer enchufe se recalientan por efecto Joule, el plástico se tuesta y se genera un principio de incendio dentro de la caja de la pared. Lo reglamentario es hacer un empalme seguro en la caja con bornera y sacar ramales hacia cada toma.',
    },
  ];

  const currentLesson = LESSONS.find((l) => l.id === selectedLessonId) || LESSONS[0];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F6F8] dark:bg-[#0D161C] text-[#18313B] dark:text-[#F1F5F9] transition-colors">
      {/* Cabecera del Profesor Virtual */}
      <div className="bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#18313B] dark:text-white flex items-center gap-2">
              <span>Profesor Virtual de Electricidad</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800">
                Tutor Didáctico AEA
              </span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Aprende física eléctrica aplicada a tu proyecto con explicaciones claras para principiantes y electricistas.
            </p>
          </div>
        </div>

        {/* Selector de Nivel Pedagógico */}
        <div className="flex items-center gap-1.5 bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setPedagogyLevel('principiante')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              pedagogyLevel === 'principiante'
                ? 'bg-[#167D78] text-white shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Modo Principiante</span>
          </button>
          <button
            onClick={() => setPedagogyLevel('matriculado')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              pedagogyLevel === 'matriculado'
                ? 'bg-[#167D78] text-white shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Técnico Matriculado (AEA 90364)</span>
          </button>
        </div>
      </div>

      {/* Resumen del Diagnóstico Pedagógico de la Instalación Actual */}
      <div className="bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-4 sm:px-6 py-3 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 block">Potencia de Proyecto:</span>
            <span className="font-bold font-mono text-[#167D78] dark:text-[#2DD4BF] text-sm sm:text-base">
              {totalWatts} W ({totalAmps} A)
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 block">Circuitos Activos:</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm sm:text-base">
              {project.circuits.length} derivados
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 block">Bocas Totales:</span>
            <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm sm:text-base">
              {lampsCount} luces · {socketsCount} tomas
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-[10px] text-[#64748B] dark:text-slate-400 block">Seguridad Vital:</span>
            <span className="font-bold text-xs flex items-center gap-1 mt-0.5">
              {hasRCD && hasGround ? (
                <span className="text-emerald-600 dark:text-emerald-400">✓ ID + Jabalina OK</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">⚠ Faltan protecciones</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Cuerpo Principal del Profesor */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* =========================================================================
              COLUMNA IZQUIERDA: MENÚ DE LECCIONES
              ========================================================================= */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-[#18313B] dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
              <span>Lecciones Interactivas sobre tu Casa</span>
            </h3>

            <div className="space-y-2">
              {LESSONS.map((lesson) => {
                const Icon = lesson.icon;
                const isSelected = lesson.id === selectedLessonId;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 border-[#167D78] shadow-xs'
                        : 'bg-white dark:bg-[#142028] border-[#DCE4E8] dark:border-[#243542] hover:border-[#167D78]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-[#167D78] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 truncate">
                        <h4 className="font-bold text-xs text-[#18313B] dark:text-white truncate">
                          {lesson.title}
                        </h4>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400 line-clamp-2">
                          {lesson.summary}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tarjeta de Advertencia Pedagógica */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-950 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Info className="w-4 h-4" />
                <span>Consejo del Profesor:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Nunca trabajes con tensión en vivo. Antes de tocar cualquier cable, baja el interruptor general y comprueba con voltímetro o buscapolo que no exista diferencia de potencial (0 V).
              </p>
            </div>
          </div>

          {/* =========================================================================
              COLUMNA DERECHA: EXPLICACIÓN DETALLADA Y CONSULTORIO
              ========================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Contenido de la Lección Seleccionada */}
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#167D78] text-white">
                    <currentLesson.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-[#18313B] dark:text-white">
                      {currentLesson.title}
                    </h3>
                    <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                      Nivel activo:{' '}
                      <strong className="text-[#167D78] dark:text-[#2DD4BF]">
                        {pedagogyLevel === 'principiante' ? 'Modo Principiante (Analogías sencillas)' : 'Modo Profesional (Normativa AEA)'}
                      </strong>
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {pedagogyLevel === 'principiante' ? '🌱 Básico' : '📐 Técnico'}
                </span>
              </div>

              {/* Texto de la lección renderizado con formato limpio */}
              <div className="text-xs sm:text-sm text-[#18313B] dark:text-slate-200 leading-relaxed whitespace-pre-line space-y-2 font-sans">
                {pedagogyLevel === 'principiante' ? currentLesson.beginnerText : currentLesson.proText}
              </div>

              <div className="pt-3 border-t border-[#DCE4E8] dark:border-[#243542] flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
                <span>¿Quieres profundizar más? Cambia el nivel pedagógico arriba.</span>
                <span className="font-semibold text-[#167D78] dark:text-[#2DD4BF]">ELECTRA PLAN Academia</span>
              </div>
            </div>

            {/* Consultorio de Dudas Frecuentes */}
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#18313B] dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                <span>Consultorio de Dudas Típicas de Electricidad y Obra</span>
              </h3>

              <div className="space-y-2">
                {FAQS.map((faq) => {
                  const isOpen = activeFaqId === faq.id;

                  return (
                    <div
                      key={faq.id}
                      className="border border-[#DCE4E8] dark:border-[#243542] rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setActiveFaqId(isOpen ? null : faq.id)}
                        className="w-full text-left p-3.5 bg-[#F8FAFC] dark:bg-[#182631] hover:bg-[#F1F5F9] dark:hover:bg-[#1E2F3D] font-bold text-xs text-[#18313B] dark:text-white flex items-center justify-between gap-2 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <span className="text-[#167D78] dark:text-[#2DD4BF] text-sm">
                          {isOpen ? '▲' : '▼'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white dark:bg-[#142028] text-xs text-[#64748B] dark:text-slate-300 leading-relaxed border-t border-[#DCE4E8] dark:border-[#243542]">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
