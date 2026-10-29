/**
 * ELECTRA PLAN — Servicio de Configuración y Preferencias del Usuario
 * Persistencia en localStorage y aplicación en tiempo real de preferencias de interfaz,
 * editor CAD, controles táctiles, parámetros eléctricos y accesibilidad.
 */

export interface AppSettings {
  // 1. Apariencia
  theme: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  fontSize: 'normal' | 'large';

  // 2. Editor CAD
  gridSize: number; // 10, 20 o 40 px
  snapToGrid: boolean;
  showDimensions: 'always' | 'selected' | 'never';
  units: 'm' | 'cm';

  // 3. Controles
  touchEnhancedTargets: boolean; // Objetivos táctiles mínimos de 48px
  touchZoomSensitivity: 'normal' | 'high' | 'smooth';
  defaultTapAction: 'select' | 'pan'; // Acción con 1 dedo en plano libre

  // 4. Parámetros Eléctricos (AEA 90364)
  nominalVoltage: 220 | 380;
  maxVoltageDropPercent: number; // 3.0% o 5.0%
  defaultPowerFactor: number; // 0.85, 0.90 o 0.95

  // 5. Guardado
  autoSave: boolean;

  // 6. Accesibilidad
  highContrastLabels: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  density: 'comfortable',
  fontSize: 'normal',
  gridSize: 20,
  snapToGrid: true,
  showDimensions: 'selected',
  units: 'm',
  touchEnhancedTargets: true,
  touchZoomSensitivity: 'normal',
  defaultTapAction: 'select',
  nominalVoltage: 220,
  maxVoltageDropPercent: 3.0,
  defaultPowerFactor: 0.9,
  autoSave: true,
  highContrastLabels: false,
  reducedMotion: false,
};

const SETTINGS_KEY = 'electra_plan_settings_v1';

export function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Error al cargar configuración:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Sincronizar tema con la clave existente
    localStorage.setItem('electra_plan_theme', settings.theme);
  } catch (e) {
    console.warn('Error al guardar configuración:', e);
  }
}
