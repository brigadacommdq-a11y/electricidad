/**
 * ELECTRA PLAN — ASISTENTE ELECTRICISTA VISUAL INTELIGENTE
 * Análisis multimodal con IA (Gemini 3.8 Flash), marcadores interactivos de componentes eléctricos,
 * diagnóstico normativo (AEA 90364 / IRAM 2183), conversación inteligente con contexto de foto
 * y generador interactivo del esquema correctivo "CÓMO DEBERÍA QUEDAR".
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  Scan,
  ShieldAlert,
  Zap,
  Info,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MessageSquare,
  Wrench,
  Send,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Check,
  RefreshCw,
  Cpu,
  Layers,
  FileCheck,
} from 'lucide-react';
import { Project } from '../types/electra';
import { CorrectiveSchemeView, CorrectiveSchemeData } from './CorrectiveSchemeView';

interface DetectedComponent {
  id: string;
  name: string;
  category: 'termica' | 'diferencial' | 'interruptor' | 'tomacorriente' | 'luminaria' | 'cable' | 'caja' | 'dps' | 'puesta_tierra' | 'otro';
  apparentFunction: string;
  visualState: 'bueno' | 'regular' | 'deteriorado' | 'incompleto';
  possibleIssue: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number }; // 0 a 100%
}

interface AnalysisResult {
  title: string;
  installationType: 'tablero' | 'tomacorriente' | 'interruptor_luminaria' | 'caja_derivacion' | 'acometida_pilar' | 'maquina_taller' | 'cableado_general';
  overview: {
    whatIsSeen: string;
    apparentFunction: string;
    observedWiring: string;
  };
  components: DetectedComponent[];
  whatIsCorrect: string[];
  whatIsWrong: string[];
  whatIsMissing: string[];
  remedySteps: string[];
  safetyLevel: 'seguro' | 'advertencia' | 'peligro_inmediato';
  safetyWarning: string;
  suggestedSchemeType: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface PhotoAnalysisViewProps {
  project: Project;
  onImportToCAD?: (recognizedData: any) => void;
}

// Catálogo de ejemplos predefinidos de alta resolución para demostración y aprendizaje inmediato
const SAMPLE_PRESETS = [
  {
    id: 'tablero_domiciliario',
    title: 'Tablero Seccional con Térmicas y Disyuntor',
    type: 'Tablero DIN',
    description: 'Tablero monofásico típico con protecciones modulares y peines de conexión.',
    url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1000&q=80',
    fallbackData: {
      title: 'Tablero Seccional Monofásico con PIAs y Diferencial',
      installationType: 'tablero' as const,
      overview: {
        whatIsSeen: 'Gabinete de distribución modular DIN con interruptores termomagnéticos bipolares y disyuntor diferencial de cabecera.',
        apparentFunction: 'Distribución y seccionamiento de circuitos terminales monofásicos (IUG y TUG).',
        observedWiring: 'Conductores aislados con peines de interconexión bipolar en cabecera de las protecciones.'
      },
      components: [
        {
          id: 'c1',
          name: 'Interruptor Diferencial Bipolar 40A / 30mA',
          category: 'diferencial' as const,
          apparentFunction: 'Protección contra contactos directos, indirectos y corrientes de fuga a tierra.',
          visualState: 'bueno' as const,
          possibleIssue: 'Verificar accionamiento periódico del pulsador de prueba [TEST].',
          confidence: 0.98,
          box: { x: 22, y: 32, width: 18, height: 35 }
        },
        {
          id: 'c2',
          name: 'Interruptor Termomagnético Bipolar C16 (Iluminación)',
          category: 'termica' as const,
          apparentFunction: 'Protección contra sobrecargas y cortocircuitos en circuito de iluminación.',
          visualState: 'bueno' as const,
          possibleIssue: 'Asegurar apriete adecuado en bornes (2 N·m).',
          confidence: 0.96,
          box: { x: 42, y: 32, width: 14, height: 35 }
        },
        {
          id: 'c3',
          name: 'Interruptor Termomagnético Bipolar C20 (Tomas)',
          category: 'termica' as const,
          apparentFunction: 'Alimentación protegida para circuito de tomacorrientes generales.',
          visualState: 'bueno' as const,
          possibleIssue: 'Sin anomalías visibles.',
          confidence: 0.95,
          box: { x: 58, y: 32, width: 14, height: 35 }
        }
      ],
      whatIsCorrect: [
        'Presencia de interruptor diferencial de alta sensibilidad (30mA).',
        'Corte bipolar simultáneo (fase y neutro seccionados juntos).',
        'Montaje firme sobre riel DIN normalizado de 35mm.'
      ],
      whatIsWrong: [
        'No se visualiza la barra colectora de puesta a tierra (PE) con los conductores verde-amarillo en el encuadre.'
      ],
      whatIsMissing: [
        'Contratapa calada cubrebornes para evitar contacto accidental con dedos (IP2X).',
        'Rotulación indeleble de circuitos según AEA 90364-771.',
        'Verificación instrumental del tiempo de disparo del diferencial (máx 300ms a IΔn).'
      ],
      remedySteps: [
        'Desenergizar la instalación desde el tablero principal o interruptor general aguas arriba.',
        'Verificar ausencia de tensión con multímetro o detector confiable.',
        'Instalar barra de puesta a tierra vinculada a la jabalina.',
        'Colocar cubierta cubrebornes y rotular cada PIA según su destino (ej: C1: Luces, C2: Tomas).'
      ],
      safetyLevel: 'advertencia' as const,
      safetyWarning: 'Corte siempre la energía en el interruptor principal antes de retirar cubiertas o tocar bornes.',
      suggestedSchemeType: 'tablero_seccional'
    }
  },
  {
    id: 'toma_doble',
    title: 'Tomacorriente 10A/20A con Conexión a la Vista',
    type: 'Módulo de Uso',
    description: 'Módulo tomacorriente de pared con bornes y conductores descubiertos.',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
    fallbackData: {
      title: 'Módulo Tomacorriente IRAM 2071 de 3 Espigas Planas',
      installationType: 'tomacorriente' as const,
      overview: {
        whatIsSeen: 'Caja rectangular metálica de 5x10cm con bastidor y módulo tomacorriente con bornes expuestos.',
        apparentFunction: 'Punto de conexión para electrodomésticos y cargas portátiles en 220V.',
        observedWiring: 'Conductores unipolares ingresando por el conector de cañería.'
      },
      components: [
        {
          id: 'c1',
          name: 'Módulo Tomacorriente 2P+T IRAM 2071',
          category: 'tomacorriente' as const,
          apparentFunction: 'Conector polarizado con toma de tierra de 10A.',
          visualState: 'regular' as const,
          possibleIssue: 'Falta fijar la tapa embellecedora y verificar borne de tierra.',
          confidence: 0.94,
          box: { x: 30, y: 25, width: 40, height: 50 }
        }
      ],
      whatIsCorrect: [
        'Uso de módulo normalizado con espigas planas con disposición a 120° reglamentaria.'
      ],
      whatIsWrong: [
        'Bornes con partes vivas accesibles sin su tapa frontal.',
        'Falta confirmación visual de conexión del conductor PE (verde-amarillo) a la espiga central inferior.'
      ],
      whatIsMissing: [
        'Conexión garantizada del conductor de protección PE (mínimo 2.5 mm² para circuito de tomas).',
        'Puesta a tierra de la caja metálica si no es de material aislante.',
        'Placa exterior de terminación.'
      ],
      remedySteps: [
        'Bajar la térmica correspondiente al circuito en el tablero seccional.',
        'Comprobar ausencia de tensión con buscapolo o multímetro.',
        'Conectar Fase (marrón) en borne derecho mirando de frente, Neutro (celeste) en izquierdo y Tierra (verde-amarillo) en centro.',
        'Colocar la tapa frontal de fijación.'
      ],
      safetyLevel: 'peligro_inmediato' as const,
      safetyWarning: 'Peligro de electrocución: un tomacorriente destapado presenta conductores con 220V expuestos.',
      suggestedSchemeType: 'toma_con_tierra'
    }
  },
  {
    id: 'caja_derivacion',
    title: 'Caja de Paso y Derivación con Empalmes',
    type: 'Caja Octogonal / Cuadrada',
    description: 'Distribución de circuitos en cañería embutida con empalmes de conductores.',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80',
    fallbackData: {
      title: 'Caja de Paso y Derivación de Circuitos',
      installationType: 'caja_derivacion' as const,
      overview: {
        whatIsSeen: 'Caja de derivación embutida donde confluyen cañerías con conductores de fase, neutro y retornos.',
        apparentFunction: 'Distribución de ramales hacia cajas de tomas e iluminación.',
        observedWiring: 'Múltiples conductores aislados agrupados para empalme.'
      },
      components: [
        {
          id: 'c1',
          name: 'Empalmes de Conductores',
          category: 'cable' as const,
          apparentFunction: 'Derivación de ramales de alimentación.',
          visualState: 'regular' as const,
          possibleIssue: 'Deben utilizarse borneras de conexión reglamentarias o capuchones roscados normalizados.',
          confidence: 0.91,
          box: { x: 35, y: 30, width: 30, height: 40 }
        }
      ],
      whatIsCorrect: [
        'Conductores canalizados dentro de cañería protectora.'
      ],
      whatIsWrong: [
        'Empalmes realizados con cinta aisladora común sin bornera de derivación homologada.',
        'No se identifica claramente la continuidad del conductor de tierra en todos los ramales.'
      ],
      whatIsMissing: [
        'Conectores o borneras de derivación según norma IRAM.',
        'Tapa ciega de la caja para asegurar grado de protección contra polvo y contacto accidental.'
      ],
      remedySteps: [
        'Cortar la energía general antes de abrir o manipular cables en la caja.',
        'Reemplazar empalmes trenzados por borneras de presión tipo Wago o regletas homologadas.',
        'Garantizar que el conductor verde-amarillo esté presente y continuo hacia todas las bocas.',
        'Cerrar la caja con su tapa ciega atornillada.'
      ],
      safetyLevel: 'advertencia' as const,
      safetyWarning: 'Los falsos contactos en empalmes flojos generan sobrecalentamiento e incendios.',
      suggestedSchemeType: 'caja_derivacion'
    }
  },
  {
    id: 'bomba_taller',
    title: 'Bomba Centrífuga / Motor Eléctrico con Puesta a Tierra',
    type: 'Fuerza Motriz / Especial',
    description: 'Conexión de motor de elevación de agua con cañería rígida y puesta a tierra.',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
    fallbackData: {
      title: 'Motor Eléctrico para Bomba con Puesta a Tierra de Carcasa',
      installationType: 'maquina_taller' as const,
      overview: {
        whatIsSeen: 'Bomba centrífuga o motor monofásico estacionario con bornera de conexión y carcasa metálica.',
        apparentFunction: 'Impulsión de agua sanitaria o accionamiento mecánico de taller.',
        observedWiring: 'Alimentación mediante cable tipo taller con conductor PE fijado a la carcasa.'
      },
      components: [
        {
          id: 'c1',
          name: 'Bornera de Motor y Carcasa Conductora',
          category: 'puesta_tierra' as const,
          apparentFunction: 'Conexión equipotencial de seguridad para derivar corrientes de falla.',
          visualState: 'bueno' as const,
          possibleIssue: 'Comprobar firmeza del tornillo de tierra y ausencia de óxido.',
          confidence: 0.93,
          box: { x: 40, y: 35, width: 25, height: 35 }
        }
      ],
      whatIsCorrect: [
        'Conexión explícita del conductor de protección a la masa metálica del motor.'
      ],
      whatIsWrong: [
        'Entorno con humedad potencial: debe asegurarse prensaestopa estanco (IP54 mínimo).'
      ],
      whatIsMissing: [
        'Guardamotor o protección térmica calibrada a la corriente nominal In de la placa del motor.',
        'Interruptor diferencial de 30mA en el circuito exclusivo de la bomba.'
      ],
      remedySteps: [
        'Desconectar la alimentación antes de abrir la bornera de conexiones.',
        'Verificar el apriete del borne de tierra con arandela dentada grower antiaflojamiento.',
        'Instalar interruptor guardamotor ajustado a la corriente de placa para evitar quemar el bobinado.'
      ],
      safetyLevel: 'seguro' as const,
      safetyWarning: 'Los motores en zonas húmedas presentan alto riesgo de fuga a tierra si no cuentan con disyuntor.',
      suggestedSchemeType: 'circuito_especial'
    }
  }
];

export const PhotoAnalysisView: React.FC<PhotoAnalysisViewProps> = ({ project }) => {
  // Estado de la imagen
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_PRESETS[0].url);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  // Estado del análisis
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(SAMPLE_PRESETS[0].fallbackData);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>('c1');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Estado del esquema correctivo interactivo
  const [showCorrectiveScheme, setShowCorrectiveScheme] = useState<boolean>(false);
  const [correctiveSchemeData, setCorrectiveSchemeData] = useState<CorrectiveSchemeData | null>(null);
  const [isGeneratingScheme, setIsGeneratingScheme] = useState<boolean>(false);

  // Estado del Chat interactivo
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: '¡Hola! Soy tu Asistente Electricista Visual de ELECTRA PLAN. He analizado esta instalación según las normas AEA 90364 e IRAM 2183. Podés tocar cualquier componente marcado en la foto, preguntarme qué significa o generar el esquema de "Cómo debería quedar". ¿Qué duda tenés sobre esta foto?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  // Referencias para file input y scroll del chat
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Scroll automático en el chat al recibir mensajes
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Convertir URL a base64 para poder enviarla a Gemini
  const convertUrlToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Error fetching sample as base64, using fallback:', e);
      return '';
    }
  };

  // Cargar preset de muestra
  const handleSelectPreset = async (preset: typeof SAMPLE_PRESETS[0]) => {
    setPhotoUrl(preset.url);
    setSelectedComponentId(null);
    setZoomLevel(1);
    setCorrectiveSchemeData(null);
    setShowCorrectiveScheme(false);

    // Preparar mensaje de bienvenida del chat para el nuevo componente
    setChatMessages([
      {
        id: `welcome_${preset.id}`,
        role: 'model',
        content: `Cargué el caso de ejemplo: **${preset.title}**. Podés consultar el análisis visual a continuación o preguntarme sobre cualquier detalle de las conexiones, protecciones o normativas.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Establecer datos predefinidos de inmediato para respuesta instantánea
    setAnalysisResult(preset.fallbackData);

    // En segundo plano, obtener base64 por si el usuario interactúa con el chat con IA real
    try {
      const b64 = await convertUrlToBase64(preset.url);
      if (b64) {
        setImageBase64(b64);
        setMimeType('image/jpeg');
      }
    } catch {
      // Ignorar error de CORS si ocurriera en presets
    }
  };

  // Procesar archivo seleccionado (subido o tomado con la cámara)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoUrl(result);
        setImageBase64(result);
        setMimeType(file.type || 'image/jpeg');
        setCorrectiveSchemeData(null);
        setShowCorrectiveScheme(false);
        // Disparar análisis real con Gemini
        runLiveAnalysis(result, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
    // Limpiar input para permitir seleccionar la misma foto nuevamente si se desea
    e.target.value = '';
  };

  // Ejecutar análisis real mediante el endpoint del backend
  const runLiveAnalysis = async (b64Data: string, mime: string) => {
    setIsAnalyzing(true);
    setSelectedComponentId(null);

    // Mensaje en chat notificando inicio
    setChatMessages((prev) => [
      ...prev,
      {
        id: `analysis_start_${Date.now()}`,
        role: 'model',
        content: '🔍 Analizando la fotografía con inteligencia artificial especializada en AEA 90364 e IRAM 2183... Identificando componentes, conductores y estado de seguridad.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const response = await fetch('/api/analyze-electrical-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: b64Data,
          mimeType: mime,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);
      if (data.components && data.components.length > 0) {
        setSelectedComponentId(data.components[0].id);
      }

      // Mensaje de éxito en el chat
      setChatMessages((prev) => [
        ...prev,
        {
          id: `analysis_done_${Date.now()}`,
          role: 'model',
          content: `✅ **Análisis completado**: Detecté **${data.title}** con nivel de seguridad: **${
            data.safetyLevel === 'seguro'
              ? 'Instalación segura'
              : data.safetyLevel === 'advertencia'
              ? 'Requiere atención y mejoras'
              : 'Peligro inmediato / Riesgo de choque eléctrico'
          }**. ${data.overview.whatIsSeen} ${
            data.whatIsWrong.length > 0 ? `\n\n⚠️ **Atención:** ${data.whatIsWrong[0]}` : ''
          }`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('Error al analizar foto con IA:', err);
      // Notificar al usuario y aplicar fallback técnico
      setChatMessages((prev) => [
        ...prev,
        {
          id: `analysis_err_${Date.now()}`,
          role: 'model',
          content: '⚠️ No se pudo conectar con el servidor de análisis en la nube. Te muestro las directrices de inspección técnica reglamentarias para este tipo de elemento.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Enviar mensaje en el chat inteligente
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || isSendingMessage) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/photo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64,
          mimeType: mimeType,
          analysisContext: analysisResult,
          history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          message: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en chat endpoint');
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          role: 'model',
          content: data.reply || 'No obtuve respuesta del asistente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      // Fallback didáctico si la API no estuviera disponible
      let fallbackReply = `Respecto a "${text}": según la reglamentación AEA 90364, toda instalación eléctrica domiciliaria debe contar con interruptor diferencial de 30mA, termomagnéticas bipolares de calibre adecuado a los conductores y red de puesta a tierra con jabalina. Nunca trabajes con tensión activa.`;
      if (text.toLowerCase().includes('tierra') || text.toLowerCase().includes('jabalina')) {
        fallbackReply = 'La puesta a tierra según AEA 90364-771 requiere una jabalina de acero-cobre de 1.5m mínimo, cable de protección PE verde-amarillo continuo sin fusibles ni interruptores interpuestos, y resistencia R < 10 Ohms para asegurar la desconexión rápida del diferencial ante fallas.';
      } else if (text.toLowerCase().includes('diferencial') || text.toLowerCase().includes('disyuntor')) {
        fallbackReply = 'El interruptor diferencial mide el equilibrio entre la corriente que entra por la fase y la que sale por el neutro. Si hay una fuga a tierra de 30mA (por ejemplo una persona tocando un electrodoméstico con falla de aislamiento), se dispara en menos de 300ms, salvando vidas.';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot_fb_${Date.now()}`,
          role: 'model',
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Generar o abrir el esquema correctivo "CÓMO DEBERÍA QUEDAR"
  const handleShowCorrectiveScheme = async () => {
    if (correctiveSchemeData) {
      setShowCorrectiveScheme(true);
      return;
    }

    setIsGeneratingScheme(true);
    try {
      const response = await fetch('/api/generate-corrective-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisResult: analysisResult,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar esquema');
      }

      const data: CorrectiveSchemeData = await response.json();
      setCorrectiveSchemeData(data);
      setShowCorrectiveScheme(true);
    } catch (e: any) {
      console.warn('Fallback esquema correctivo local:', e);
      // Generar esquema correctivo robusto local acorde al tipo detectado
      const type = analysisResult?.installationType || 'tablero';
      const fallbackScheme: CorrectiveSchemeData = {
        schemeTitle: `Esquema Técnico Correctivo Normalizado — ${analysisResult?.title || 'Instalación Reglamentaria'}`,
        diagramType: type === 'tomacorriente' ? 'tomacorriente' : type === 'interruptor_luminaria' ? 'interruptor_luminaria' : 'tablero',
        summary: 'Esquema unifilar y multifilar normalizado según AEA 90364 e IRAM 2183 con colores reglamentarios de conductores y puesta a tierra obligatoria.',
        requiredComponents: [
          {
            id: 'c_iga',
            name: 'Interruptor Termomagnético Bipolar (IGA)',
            technicalSpec: 'Curva C, 25A o 32A según calibre de línea principal, 3000A / 4500A Pdc',
            role: 'Cabecera general y corte de seccionamiento de toda la vivienda',
            normativeRef: 'AEA 90364-771.18.2'
          },
          {
            id: 'c_id',
            name: 'Interruptor Diferencial Bipolar (ID)',
            technicalSpec: '2x40A / 30mA clase AC o A',
            role: 'Protección contra contactos directos, indirectos e incendios por fugas',
            normativeRef: 'AEA 90364-771.18.3'
          },
          {
            id: 'c_pe',
            name: 'Barra Colectora Principal de Puesta a Tierra (PE)',
            technicalSpec: 'Regleta de latón con tornillos para cable verde-amarillo',
            role: 'Equipotencialización de todas las masas metálicas de la vivienda',
            normativeRef: 'IRAM 2183 / AEA 90364'
          }
        ],
        connections: [
          {
            id: 'w1',
            from: 'IGA L1 Out',
            to: 'ID L1 In',
            conductorType: 'fase',
            color: '#8B4513',
            crossSectionMm2: 4,
            purpose: 'Conductor de Fase R/S/T reglamentario color marrón'
          },
          {
            id: 'w2',
            from: 'IGA N Out',
            to: 'ID N In',
            conductorType: 'neutro',
            color: '#0284c7',
            crossSectionMm2: 4,
            purpose: 'Conductor Neutro reglamentario color celeste'
          },
          {
            id: 'w3',
            from: 'Jabalina PAT',
            to: 'Barra PE',
            conductorType: 'tierra',
            color: '#16a34a',
            crossSectionMm2: 10,
            purpose: 'Conductor de Puesta a Tierra verde-amarillo'
          }
        ],
        differencesBeforeAfter: [
          {
            aspect: 'Puesta a Tierra',
            observedInPhoto: analysisResult?.whatIsMissing?.some(m => m.toLowerCase().includes('tierra')) ? 'Ausente o no identificable en la foto' : 'Incompleta',
            correctedState: 'Conductor PE verde-amarillo continuo en todos los circuitos conectado a jabalina.'
          },
          {
            aspect: 'Colores de Conductores',
            observedInPhoto: 'Colores mezclados o sin distinción reglamentaria clara',
            correctedState: 'Fase Marrón/Negro/Rojo, Neutro Celeste exclusivo, Tierra Verde-Amarillo.'
          },
          {
            aspect: 'Protección Diferencial',
            observedInPhoto: 'Falta de diferencial o falta de botón de test comprobado',
            correctedState: 'Disyuntor bipolar 30mA aguas arriba de las térmicas de circuitos.'
          }
        ],
        stepByStepExecution: [
          '1. Interrumpir el suministro eléctrico desde el pilar o interruptor principal de cabecera.',
          '2. Comprobar la ausencia de tensión en los bornes con buscapolo o multímetro.',
          '3. Conectar la barra de puesta a tierra y pasar conductor verde-amarillo de 2.5 mm² o 4 mm².',
          '4. Respetar estrictamente los colores de norma IRAM 2183.',
          '5. Rearmar las protecciones y pulsar el botón [TEST] del disyuntor para validar el salto.'
        ],
        safetyDisclaimer: 'Toda intervención en la red debe realizarse con la instalación desenergizada y ser certificada por un electricista matriculado.'
      };
      setCorrectiveSchemeData(fallbackScheme);
      setShowCorrectiveScheme(true);
    } finally {
      setIsGeneratingScheme(false);
    }
  };

  // Preguntas sugeridas de acuerdo al tipo de instalación detectada
  const quickQuestions = [
    '¿Por qué este conexionado puede ser peligroso?',
    '¿Qué calibre de cables exige la norma IRAM 2183 acá?',
    '¿Qué térmica o disyuntor corresponde poner?',
    '¿Cómo verifico si la puesta a tierra funciona?',
    '¿Cómo desenergizo de manera 100% segura antes de tocar?'
  ];

  // Componente seleccionado actualmente
  const selectedComponent = analysisResult?.components.find((c) => c.id === selectedComponentId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F6F8] dark:bg-slate-900 text-[#18313B] dark:text-slate-100 overflow-hidden">
      {/* Vista de Esquema Correctivo si está activo */}
      {showCorrectiveScheme && correctiveSchemeData ? (
        <CorrectiveSchemeView
          data={correctiveSchemeData}
          originalPhotoUrl={photoUrl}
          onBackToAnalysis={() => setShowCorrectiveScheme(false)}
          onAskQuestionAboutComponent={(q) => {
            setShowCorrectiveScheme(false);
            handleSendMessage(q);
          }}
        />
      ) : (
        <>
          {/* Header del Asistente Visual */}
          <div className="bg-white dark:bg-slate-800 border-b border-[#DCE4E8] dark:border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#167D78] text-white flex items-center justify-center shadow-xs">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg text-[#18313B] dark:text-white leading-tight">
                    ASISTENTE ELECTRICISTA VISUAL
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> IA Multimodal AEA 90364
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Analiza fotos reales de tableros, tomas, teclas, derivaciones, cables, pilares y motores con diagnóstico normativo
                </p>
              </div>
            </div>

            {/* Acciones principales: Subir foto / Cámara / Botón "CÓMO DEBERÍA QUEDAR" */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isAnalyzing}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Tomar foto con la cámara del dispositivo móvil o tablet"
              >
                <Camera className="w-4 h-4 text-[#167D78] dark:text-emerald-400" />
                <span className="hidden sm:inline">Tomar Foto</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cargar foto desde galería o archivos"
              >
                <Upload className="w-4 h-4 text-[#167D78] dark:text-emerald-400" />
                <span className="hidden sm:inline">Subir Imagen</span>
              </button>

              {/* Botón estelar: MOSTRARME CÓMO DEBERÍA QUEDAR */}
              <button
                onClick={handleShowCorrectiveScheme}
                disabled={isGeneratingScheme || isAnalyzing}
                className="px-3.5 py-2 bg-[#167D78] hover:bg-[#115e5a] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {isGeneratingScheme ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Wrench className="w-4 h-4 text-emerald-200" />
                )}
                <span>🔧 MOSTRARME CÓMO DEBERÍA QUEDAR</span>
              </button>
            </div>
          </div>

          {/* Selector de Presets de Demostración */}
          <div className="bg-white dark:bg-slate-800/80 border-b border-[#DCE4E8] dark:border-slate-700 px-4 py-2 overflow-x-auto flex items-center gap-2 no-scrollbar">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Ejemplos de prueba:
            </span>
            {SAMPLE_PRESETS.map((p) => {
              const isSelected = photoUrl === p.url;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#167D78] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span>{p.title}</span>
                </button>
              );
            })}
          </div>

          {/* Área Principal Dividida: [Visor de Foto con Marcadores] | [Diagnóstico Normativo] | [Chat Inteligente] */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
            {/* COLUMNA IZQUIERDA: Visor de Foto e Inspección de Componentes (Col 1 a 6) */}
            <div className="lg:col-span-6 flex flex-col border-r border-[#DCE4E8] dark:border-slate-700 overflow-hidden bg-slate-900/5 dark:bg-slate-950/40">
              {/* Barra de controles de la imagen: Zoom, Marcadores, Selector */}
              <div className="bg-white dark:bg-slate-800 px-3 py-2 border-b border-[#DCE4E8] dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {analysisResult?.title || 'Fotografía en inspección'}
                  </span>
                  {isAnalyzing && (
                    <span className="flex items-center gap-1 text-xs text-[#167D78] dark:text-emerald-400 ml-2 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando con IA...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                      showBoundingBoxes ? 'text-[#167D78] dark:text-emerald-400' : 'text-slate-400'
                    }`}
                    title={showBoundingBoxes ? 'Ocultar marcadores' : 'Mostrar marcadores'}
                  >
                    {showBoundingBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Acercar imagen"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 1))}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Alejar imagen"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Restablecer zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visor de la fotografía con bounding boxes interactivos */}
              <div
                ref={imageContainerRef}
                className="flex-1 relative overflow-auto p-4 flex items-center justify-center bg-black/80 select-none min-h-[300px]"
              >
                {photoUrl ? (
                  <div
                    className="relative transition-transform duration-150 inline-block max-w-full"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                  >
                    <img
                      src={photoUrl}
                      alt="Instalación eléctrica analizada"
                      className="max-h-[500px] w-auto object-contain rounded-lg shadow-lg border border-slate-700"
                    />

                    {/* Cajas delimitadoras de componentes eléctricos identificados */}
                    {showBoundingBoxes &&
                      analysisResult?.components?.map((comp) => {
                        const isSelected = selectedComponentId === comp.id;
                        const isWarning = comp.visualState === 'regular' || comp.visualState === 'incompleto';
                        const isDanger = comp.visualState === 'deteriorado';

                        const borderColor = isDanger
                          ? 'border-red-500 bg-red-500/20 text-white'
                          : isWarning
                          ? 'border-amber-400 bg-amber-400/20 text-white'
                          : 'border-emerald-400 bg-emerald-400/20 text-white';

                        return (
                          <div
                            key={comp.id}
                            onClick={() => setSelectedComponentId(comp.id)}
                            style={{
                              position: 'absolute',
                              left: `${comp.box.x}%`,
                              top: `${comp.box.y}%`,
                              width: `${comp.box.width}%`,
                              height: `${comp.box.height}%`,
                            }}
                            className={`border-2 rounded transition-all cursor-pointer group ${borderColor} ${
                              isSelected ? 'ring-4 ring-emerald-300 ring-offset-1 z-20 shadow-lg' : 'hover:border-white z-10'
                            }`}
                            title={`${comp.name} (${Math.round(comp.confidence * 100)}% de certeza)`}
                          >
                            {/* Etiqueta flotante */}
                            <span
                              className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-xs pointer-events-none ${
                                isDanger
                                  ? 'bg-red-600 text-white'
                                  : isWarning
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-[#167D78] text-white'
                              }`}
                            >
                              {comp.name.split(' ')[0]} {comp.name.split(' ')[1] || ''}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <Scan className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Selecciona una imagen o toma una fotografía para comenzar</p>
                  </div>
                )}
              </div>

              {/* Inspector inferior del componente seleccionado */}
              <div className="bg-white dark:bg-slate-800 border-t border-[#DCE4E8] dark:border-slate-700 p-3 max-h-[160px] overflow-y-auto">
                {selectedComponent ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-[#167D78] dark:text-emerald-400" />
                        <span className="font-bold text-slate-800 dark:text-white">
                          {selectedComponent.name}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          selectedComponent.visualState === 'bueno'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : selectedComponent.visualState === 'deteriorado'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        Estado: {selectedComponent.visualState}
                      </span>
                    </div>

                    <p className="text-[#64748B] dark:text-slate-300">
                      <strong className="text-slate-700 dark:text-slate-200">Función:</strong>{' '}
                      {selectedComponent.apparentFunction}
                    </p>

                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Observación técnica:
                        </span>{' '}
                        <span className="text-[#64748B] dark:text-slate-300">
                          {selectedComponent.possibleIssue}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] dark:text-slate-400 text-center py-2">
                    Toca cualquier marcador sobre la foto para ver los detalles técnicos de ese componente.
                  </p>
                )}
              </div>
            </div>

            {/* COLUMNA CENTRAL: Diagnóstico Normativo Estructurado A, B, C, D (Col 7 a 9) */}
            <div className="lg:col-span-3 flex flex-col border-r border-[#DCE4E8] dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto p-4 space-y-4">
              {/* Badge de Nivel de Seguridad */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  analysisResult?.safetyLevel === 'peligro_inmediato'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                    : analysisResult?.safetyLevel === 'advertencia'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-sm">
                    {analysisResult?.safetyLevel === 'peligro_inmediato'
                      ? 'Peligro Eléctrico Detectado'
                      : analysisResult?.safetyLevel === 'advertencia'
                      ? 'Instalación con Observaciones'
                      : 'Condición Aparente Segura'}
                  </div>
                  <p className="mt-1 opacity-90 leading-relaxed">
                    {analysisResult?.safetyWarning ||
                      'Antes de cualquier intervención corte siempre la energía desde la cabecera.'}
                  </p>
                </div>
              </div>

              {/* SECCIÓN A: QUÉ ESTÁ VIENDO */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[#167D78] dark:text-emerald-400">
                  <Info className="w-3.5 h-3.5" />
                  <span>A. Qué se observa en la foto</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                  <p>{analysisResult?.overview.whatIsSeen}</p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Cableado aparente:</strong>{' '}
                    {analysisResult?.overview.observedWiring}
                  </p>
                </div>
              </div>

              {/* SECCIÓN B: QUÉ ESTÁ MAL (Defectos y anomalías) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>B. Qué anomalías presenta</span>
                </div>
                <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  {analysisResult?.whatIsWrong && analysisResult.whatIsWrong.length > 0 ? (
                    <ul className="space-y-1.5 list-disc list-inside">
                      {analysisResult.whatIsWrong.map((w, idx) => (
                        <li key={idx} className="text-red-900 dark:text-red-200 leading-relaxed">
                          {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                      ✓ No se identifican anomalías visuales graves en esta toma.
                    </p>
                  )}
                </div>
              </div>

              {/* SECCIÓN C: QUÉ PODRÍA FALTAR (Aspectos que requieren instrumental) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>C. Qué falta o verificar in situ</span>
                </div>
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  {analysisResult?.whatIsMissing && analysisResult.whatIsMissing.length > 0 ? (
                    <ul className="space-y-1.5 list-disc list-inside">
                      {analysisResult.whatIsMissing.map((m, idx) => (
                        <li key={idx} className="text-amber-900 dark:text-amber-200 leading-relaxed">
                          {m}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400">
                      Verificación básica completa.
                    </p>
                  )}
                </div>
              </div>

              {/* SECCIÓN D: CÓMO CORREGIRLO (Procedimiento seguro) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>D. Procedimiento de corrección seguro</span>
                </div>
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  {analysisResult?.remedySteps && (
                    <ol className="space-y-1.5 list-decimal list-inside">
                      {analysisResult.remedySteps.map((step, idx) => (
                        <li key={idx} className="text-emerald-950 dark:text-emerald-200 leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>

              {/* Botón para abrir el esquema correctivo visual */}
              <button
                onClick={handleShowCorrectiveScheme}
                disabled={isGeneratingScheme}
                className="w-full py-2.5 px-3 bg-[#167D78] hover:bg-[#115e5a] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Wrench className="w-4 h-4" />
                <span>Ver Esquema Normalizado de Conexión</span>
              </button>
            </div>

            {/* COLUMNA DERECHA: Chat Inteligente Contextual sobre la Foto (Col 10 a 12) */}
            <div className="lg:col-span-3 flex flex-col bg-slate-50 dark:bg-slate-900/60 overflow-hidden">
              {/* Header del Chat */}
              <div className="bg-white dark:bg-slate-800 px-3 py-2.5 border-b border-[#DCE4E8] dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#167D78] dark:text-emerald-400" />
                  <span className="font-bold text-xs text-slate-800 dark:text-white">
                    Chat con Asistente Electricista
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  En línea
                </span>
              </div>

              {/* Historial de Mensajes */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                {chatMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-xl px-3 py-2 shadow-2xs leading-relaxed ${
                          isUser
                            ? 'bg-[#167D78] text-white rounded-br-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
                {isSendingMessage && (
                  <div className="flex items-center gap-1.5 text-xs text-[#167D78] dark:text-emerald-400 font-medium py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Escribiendo respuesta...
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chips de Preguntas Rápidas */}
              <div className="p-2 border-t border-[#DCE4E8] dark:border-slate-700 bg-white dark:bg-slate-800 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={isSendingMessage}
                    className="shrink-0 text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Entrada de Texto del Chat */}
              <div className="p-2.5 bg-white dark:bg-slate-800 border-t border-[#DCE4E8] dark:border-slate-700 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Preguntale al asistente sobre esta foto..."
                  className="flex-1 bg-slate-100 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167D78]"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isSendingMessage}
                  className="p-1.5 bg-[#167D78] hover:bg-[#115e5a] disabled:opacity-40 text-white rounded-lg cursor-pointer transition-colors"
                  title="Enviar pregunta"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
