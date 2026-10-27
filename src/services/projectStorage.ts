/**
 * ELECTRA PLAN — Servicio de Almacenamiento y Gestión Multidispositivo de Proyectos
 * Soporta múltiples viviendas independientes, plantilla de demostración permanente,
 * creación desde cero y confirmación de guardado.
 */
import { Project } from '../types/electra';
import { createDemoProject } from './demoProject';

export interface ProjectMetadataSummary {
  id: string;
  name: string;
  client?: string;
  address?: string;
  updatedAt: string;
  roomsCount: number;
  symbolsCount: number;
  circuitsCount: number;
  isTemplate?: boolean;
}

const STORAGE_INDEX_KEY = 'electra_plan_projects_index_v1';
const STORAGE_PREFIX = 'electra_plan_proj_';
const ACTIVE_PROJ_ID_KEY = 'electra_plan_active_id_v1';
export const DEMO_PROJECT_ID = 'demo_vivienda_2amb';

/**
 * Crea un proyecto completamente vacío desde cero sin ninguna habitación ni bocas heredadas.
 */
export function createEmptyProject(name = 'Nueva Vivienda en Blanco', client = ''): Project {
  const newId = `proj_${Date.now()}`;
  return {
    version: '1.2.0',
    metadata: {
      id: newId,
      name: name.trim() || 'Nueva Vivienda en Blanco',
      client: client.trim(),
      address: '',
      description: 'Proyecto creado desde cero sin elementos heredados.',
      author: 'Instalador Electricista',
      date: new Date().toISOString().slice(0, 10),
      country: 'Argentina',
      normative: 'AEA 90364-771',
      gridSize: 20,
      snapToGrid: true,
      showDimensions: true,
      scale: 40,
    },
    floors: [{ id: 'floor_1', name: 'Planta Baja', level: 0, scalePixelsPerMeter: 40 }],
    activeFloorId: 'floor_1',
    rooms: [], // Completamente vacío
    architecturalElements: [], // Sin muros heredados
    symbols: [], // Sin luminarias ni tomas heredados
    wires: [], // Sin cables
    circuits: [
      {
        id: 'C1',
        name: 'Iluminación de Uso General (IUG)',
        type: 'IUG',
        voltage: 220,
        phases: 1,
        powerFactor: 0.95,
        conductorMaterial: 'Cu',
        crossSectionMm2: 1.5,
        breakerAmps: 10,
        breakerCurve: 'C',
        breakerPoles: '2P',
        color: '#3b82f6',
        installationMethod: 'cañeria_embutida',
        lengthMetersEstimate: 10,
      },
      {
        id: 'C2',
        name: 'Tomacorrientes de Uso General (TUG)',
        type: 'TUG',
        voltage: 220,
        phases: 1,
        powerFactor: 0.9,
        conductorMaterial: 'Cu',
        crossSectionMm2: 2.5,
        breakerAmps: 16,
        breakerCurve: 'C',
        breakerPoles: '2P',
        color: '#10b981',
        installationMethod: 'cañeria_embutida',
        lengthMetersEstimate: 15,
      },
    ],
    switchboard: {
      id: 'board_main',
      name: 'Tablero Seccional Principal (TSG)',
      location: 'Ingreso',
      mainBreakerAmps: 32,
      differentialAmps: 40,
      components: [
        {
          id: 'comp_iga',
          type: 'iga',
          name: 'Interruptor General IGA 2x32A (Curva C)',
          ratingAmps: 32,
          poles: '2P',
          state: 'closed',
        },
        {
          id: 'comp_id',
          type: 'diferencial',
          name: 'Disyuntor Diferencial 2x40A / 30mA (IRAM 2301)',
          ratingAmps: 40,
          poles: '2P',
          sensitivityMa: 30,
          state: 'closed',
        },
      ],
    },
    currency: 'ARS',
  };
}

/**
 * Obtiene la lista de proyectos registrados.
 * Asegura que la plantilla "Vivienda Prototipo 2 Ambientes" esté siempre disponible.
 */
export function getSavedProjectsList(): ProjectMetadataSummary[] {
  let list: ProjectMetadataSummary[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_INDEX_KEY);
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error al leer índice de proyectos:', e);
  }

  // Verificar si la plantilla prototipo está en el índice; si no, agregarla
  const hasDemo = list.some((p) => p.id === DEMO_PROJECT_ID);
  if (!hasDemo) {
    list.unshift({
      id: DEMO_PROJECT_ID,
      name: 'Vivienda Prototipo 2 Ambientes (Plantilla)',
      client: 'Familia Demo',
      address: 'Calle Falsa 123',
      updatedAt: new Date().toISOString(),
      roomsCount: 4,
      symbolsCount: 16,
      circuitsCount: 3,
      isTemplate: true,
    });
    try {
      localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(list));
    } catch {}
  }

  return list;
}

/**
 * Guarda un proyecto en localStorage y actualiza el índice de metadatos.
 */
export function saveProjectToStorage(proj: Project): void {
  try {
    const key = `${STORAGE_PREFIX}${proj.metadata.id}`;
    localStorage.setItem(key, JSON.stringify(proj));
    localStorage.setItem(ACTIVE_PROJ_ID_KEY, proj.metadata.id);

    // Actualizar índice
    const list = getSavedProjectsList();
    const existingIdx = list.findIndex((p) => p.id === proj.metadata.id);
    const summary: ProjectMetadataSummary = {
      id: proj.metadata.id,
      name: proj.metadata.name,
      client: proj.metadata.client,
      address: proj.metadata.address,
      updatedAt: new Date().toISOString(),
      roomsCount: proj.rooms.length,
      symbolsCount: proj.symbols.length,
      circuitsCount: proj.circuits.length,
      isTemplate: proj.metadata.id === DEMO_PROJECT_ID,
    };

    if (existingIdx >= 0) {
      list[existingIdx] = summary;
    } else {
      list.unshift(summary);
    }

    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error al guardar proyecto en storage:', err);
  }
}

/**
 * Carga un proyecto por su ID. Si es el demo, genera la plantilla completa.
 */
export function loadProjectFromStorage(id: string): Project | null {
  if (id === DEMO_PROJECT_ID) {
    // Si hay una copia personalizada guardada la devuelve, si no crea una fresca
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${DEMO_PROJECT_ID}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    const demo = createDemoProject();
    demo.metadata.id = DEMO_PROJECT_ID;
    demo.metadata.name = 'Vivienda Prototipo 2 Ambientes (Plantilla)';
    return demo;
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error al cargar proyecto:', e);
  }
  return null;
}

/**
 * Elimina un proyecto del almacenamiento. (No permite borrar la plantilla demo).
 */
export function deleteProjectFromStorage(id: string): boolean {
  if (id === DEMO_PROJECT_ID) {
    alert('La plantilla de demostración no puede ser eliminada.');
    return false;
  }
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
    const list = getSavedProjectsList().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Error al eliminar proyecto:', e);
    return false;
  }
}

/**
 * Duplica un proyecto existente con un nuevo ID y nombre.
 */
export function duplicateProjectInStorage(sourceId: string): Project | null {
  const original = loadProjectFromStorage(sourceId);
  if (!original) return null;

  const clone: Project = JSON.parse(JSON.stringify(original));
  clone.metadata.id = `proj_${Date.now()}`;
  clone.metadata.name = `${original.metadata.name} (Copia)`;
  clone.metadata.date = new Date().toISOString().slice(0, 10);

  saveProjectToStorage(clone);
  return clone;
}

/**
 * Obtiene el ID del proyecto activo previamente guardado, o devuelve el demo.
 */
export function getActiveProjectId(): string {
  try {
    const activeId = localStorage.getItem(ACTIVE_PROJ_ID_KEY);
    if (activeId) return activeId;
  } catch {}
  return DEMO_PROJECT_ID;
}
