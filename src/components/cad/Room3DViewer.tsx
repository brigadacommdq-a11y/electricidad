/**
 * ELECTRA PLAN — Visor 3D Interactivo y Estudio de Instalaciones Eléctricas
 * Motor Three.js WebGL PBR con sincronización total 2D/3D:
 * - Arquitectura derivada del plano: muros a 2.60m, aberturas para puertas con barrido y ventanas con vidrio translúcido.
 * - Pisos por ambiente texturados con zócalos y cartelería técnica 3D.
 * - Capas de visualización independientes (Arquitectura, Componentes, Cableado, Etiquetas, Puesta a Tierra).
 * - Opciones de techo (mostrar/ocultar) y paredes (sólidas, translúcidas al 35%, ocultas).
 * - Componentes eléctricos realistas a cotas reglamentarias AEA 90364:
 *   Luminarias a 2.60m, interruptores a 1.10m, tomas a 0.30m, tablero a 1.40m, jabalina en suelo.
 * - Simulación en tiempo real: encendido interactivo de interruptores por raycasting y emisión de luz física con sombras.
 * - Diagnóstico en 3D: detección y resaltado de cortocircuitos, sobrecargas y falta de tierra con aislamiento visual.
 * - Navegación ergonómica: presets (Perspectiva, Cenital, Ojos a 1.65m, Tablero, Encuadrar todo) y dock colapsable.
 */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Project, ElectricalSymbol, SimulationState, FaultDetail, ArchElement, Room } from '../../types/electra';
import {
  Eye,
  EyeOff,
  Maximize2,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  AlertTriangle,
  Zap,
  ShieldCheck,
  CheckCircle2,
  X,
  Compass,
  Sliders,
  Box,
  Focus,
  Radio,
} from 'lucide-react';

interface Room3DViewerProps {
  project: Project;
  simState: SimulationState;
  onToggleSwitch: (symbolId: string) => void;
  onSelectSymbol?: (symbolId: string) => void;
  onOpenLearningModal?: (symbolType: string) => void;
}

export type WallDisplayMode = 'solid' | 'translucent' | 'hidden';

export const Room3DViewer: React.FC<Room3DViewerProps> = ({
  project,
  simState,
  onToggleSwitch,
  onSelectSymbol,
  onOpenLearningModal,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Estados de Interfaz y Opciones 3D
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isNightMode, setIsNightMode] = useState(true);
  const [selectedSym3D, setSelectedSym3D] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'cenital' | 'eye' | 'tablero' | 'fit'>('iso');

  // Capas de visualización independientes
  const [showArch, setShowArch] = useState(true);
  const [showComponents, setShowComponents] = useState(true);
  const [showConduits, setShowConduits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrounding, setShowGrounding] = useState(true);

  // Opciones de Muros y Techo
  const [showCeiling, setShowCeiling] = useState(false);
  const [wallMode, setWallMode] = useState<WallDisplayMode>('solid');

  // Diagnóstico 3D: Aislamiento visual del circuito con falla
  const [isolatedFaultId, setIsolatedFaultId] = useState<string | null>(null);

  // Referencias Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const interactablesRef = useRef<THREE.Object3D[]>([]);
  const pointLightsRef = useRef<Map<string, THREE.PointLight>>(new Map());

  // Grupos organizados por capas para control de visibilidad instantáneo
  const archGroupRef = useRef<THREE.Group | null>(null);
  const ceilingGroupRef = useRef<THREE.Group | null>(null);
  const wallsGroupRef = useRef<THREE.Group | null>(null);
  const openingsGroupRef = useRef<THREE.Group | null>(null);
  const symbolsGroupRef = useRef<THREE.Group | null>(null);
  const pipesGroupRef = useRef<THREE.Group | null>(null);
  const labelsGroupRef = useRef<THREE.Group | null>(null);
  const faultsGroupRef = useRef<THREE.Group | null>(null);

  // Animación de cámara lerp
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  // Escala fija: 40 px en 2D = 1 metro en 3D (escala reglamentaria AEA 90364)
  const PIXELS_PER_METER = 40;
  const WALL_HEIGHT = 2.60; // 2.60m estándar de vivienda
  const DOOR_HEIGHT = 2.05; // 2.05m dintel de puerta
  const WINDOW_SILL = 1.00; // 1.00m antepecho
  const WINDOW_TOP = 2.20;  // 2.20m dintel de ventana

  // Helper procedural para generar texturas de cartelería técnica nítidas (SRGBColorSpace)
  const createLabelTexture = useCallback((title: string, subtitle?: string, isError?: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 256, 128);

    // Fondo redondeado satinado
    ctx.fillStyle = isError ? 'rgba(239, 68, 68, 0.92)' : 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = isError ? '#ffffff' : '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 112, 16);
    ctx.fill();
    ctx.stroke();

    // Texto de Título
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 128, subtitle ? 48 : 64);

    // Texto de Subtítulo si existe
    if (subtitle) {
      ctx.fillStyle = isError ? '#fee2e2' : '#94a3b8';
      ctx.font = '18px "JetBrains Mono", monospace';
      ctx.fillText(subtitle, 128, 86);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  // 1. Inicialización de Three.js Scene, Renderer, PBR Lighting y OrbitControls
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detección de Software WebGL (Directiva Three.js)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Escena principal y niebla que combina con el fondo
    const scene = new THREE.Scene();
    const bgHex = isNightMode ? 0x090d16 : 0x0e1726;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.035);
    sceneRef.current = scene;

    // Cámara Perspectiva
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(7, 7, 8.5);
    cameraRef.current = camera;

    // Renderer con PBR, Tone Mapping y Shadows
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // PMREMGenerator Studio Environment (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Iluminación Natural y de Estudio
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, isNightMode ? 0.35 : 0.85);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, isNightMode ? 0.45 : 1.25);
    dirLight.position.set(10, 14, 8);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 35;
    const d = 10;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    // OrbitControls con amortiguación suave y soporte táctil
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.02; // No descender por debajo del suelo
    controls.minDistance = 1.2;
    controls.maxDistance = 30;
    controls.target.set(0, 1.2, 0);
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // Inicializar Jerarquía de Grupos por Capas
    const archGroup = new THREE.Group();
    archGroup.name = 'layer_arch';
    scene.add(archGroup);
    archGroupRef.current = archGroup;

    const wallsGroup = new THREE.Group();
    wallsGroup.name = 'sub_walls';
    archGroup.add(wallsGroup);
    wallsGroupRef.current = wallsGroup;

    const openingsGroup = new THREE.Group();
    openingsGroup.name = 'sub_openings';
    archGroup.add(openingsGroup);
    openingsGroupRef.current = openingsGroup;

    const ceilingGroup = new THREE.Group();
    ceilingGroup.name = 'sub_ceiling';
    archGroup.add(ceilingGroup);
    ceilingGroupRef.current = ceilingGroup;

    const symGroup = new THREE.Group();
    symGroup.name = 'layer_symbols';
    scene.add(symGroup);
    symbolsGroupRef.current = symGroup;

    const pipeGroup = new THREE.Group();
    pipeGroup.name = 'layer_pipes';
    scene.add(pipeGroup);
    pipesGroupRef.current = pipeGroup;

    const labelsGroup = new THREE.Group();
    labelsGroup.name = 'layer_labels';
    scene.add(labelsGroup);
    labelsGroupRef.current = labelsGroup;

    const faultsGroup = new THREE.Group();
    faultsGroup.name = 'layer_faults';
    scene.add(faultsGroup);
    faultsGroupRef.current = faultsGroup;

    // Ciclo de animación
    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Transición suave de cámara hacia preset o falla
      if (targetCamPosRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, delta * 3.8);
        if (targetLookAtRef.current) {
          controlsRef.current.target.lerp(targetLookAtRef.current, delta * 3.8);
        }
        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 0.05) {
          targetCamPosRef.current = null;
        }
      }

      // Animación suave de elementos de falla (anillo de alarma)
      if (faultsGroupRef.current && faultsGroupRef.current.children.length > 0) {
        const time = clock.getElapsedTime();
        faultsGroupRef.current.children.forEach((child) => {
          if (child.name === 'fault_pulse') {
            const scale = 1 + Math.sin(time * 5) * 0.15;
            child.scale.set(scale, scale, scale);
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Redimensionamiento
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Sincronización del fondo y niebla al cambiar Día / Noche
  useEffect(() => {
    if (!sceneRef.current) return;
    const bgHex = isNightMode ? 0x090d16 : 0x0e1726;
    sceneRef.current.background = new THREE.Color(bgHex);
    sceneRef.current.fog = new THREE.FogExp2(bgHex, 0.035);
  }, [isNightMode]);

  // Control reactivo de capas de visualización
  useEffect(() => {
    if (archGroupRef.current) archGroupRef.current.visible = showArch;
    if (symbolsGroupRef.current) symbolsGroupRef.current.visible = showComponents;
    if (pipesGroupRef.current) pipesGroupRef.current.visible = showConduits;
    if (labelsGroupRef.current) labelsGroupRef.current.visible = showLabels;
    if (ceilingGroupRef.current) ceilingGroupRef.current.visible = showCeiling;
  }, [showArch, showComponents, showConduits, showLabels, showCeiling]);

  // 2. Construcción Arquitectónica 3D Derivada del Plano 2D
  // (Pisos por ambiente, Muros perimetrales y manuales a 2.60m, Puertas y Ventanas)
  useEffect(() => {
    const archGroup = archGroupRef.current;
    const wallsGroup = wallsGroupRef.current;
    const openingsGroup = openingsGroupRef.current;
    const ceilingGroup = ceilingGroupRef.current;
    const labelsGroup = labelsGroupRef.current;
    if (!archGroup || !wallsGroup || !openingsGroup || !ceilingGroup || !labelsGroup) return;

    // Limpieza de geometrías anteriores
    const clearGroup = (g: THREE.Group) => {
      while (g.children.length > 0) {
        const obj = g.children[0] as THREE.Mesh;
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
        g.remove(obj);
      }
    };

    // Mantener sólo el suelo base en archGroup y limpiar subgrupos
    clearGroup(wallsGroup);
    clearGroup(openingsGroup);
    clearGroup(ceilingGroup);
    clearGroup(labelsGroup);

    // Eliminar pisos previos directos de archGroup
    const existingFloors = archGroup.children.filter((c) => c.name?.startsWith('floor_'));
    existingFloors.forEach((f) => archGroup.remove(f));

    // Determinar límites del proyecto a partir de habitaciones
    let minX = 0;
    let maxX = 8;
    let minZ = 0;
    let maxZ = 6;

    if (project.rooms.length > 0) {
      minX = Math.min(...project.rooms.map((r) => r.x / PIXELS_PER_METER));
      maxX = Math.max(...project.rooms.map((r) => (r.x + r.width) / PIXELS_PER_METER));
      minZ = Math.min(...project.rooms.map((r) => r.y / PIXELS_PER_METER));
      maxZ = Math.max(...project.rooms.map((r) => (r.y + r.height) / PIXELS_PER_METER));
    }

    const roomW = Math.max(maxX - minX, 6);
    const roomD = Math.max(maxZ - minZ, 5);
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Suelo exterior de terreno / cimientos
    let groundBase = archGroup.getObjectByName('ground_terrain');
    if (!groundBase) {
      const terrainGeo = new THREE.PlaneGeometry(roomW + 8, roomD + 8);
      const terrainMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.95,
        metalness: 0.05,
      });
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.name = 'ground_terrain';
      terrainMesh.rotation.x = -Math.PI / 2;
      terrainMesh.position.set(centerX, -0.01, centerZ);
      terrainMesh.receiveShadow = true;
      archGroup.add(terrainMesh);
    }

    // Materiales de Pared según wallMode
    const isTranslucent = wallMode === 'translucent';
    const isHidden = wallMode === 'hidden';
    wallsGroup.visible = !isHidden;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.75,
      metalness: 0.05,
      transparent: isTranslucent,
      opacity: isTranslucent ? 0.32 : 1.0,
      depthWrite: !isTranslucent,
    });

    const wallBorderMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.45,
    });

    // Paleta de texturas/tonos de piso por tipo de ambiente
    const getRoomFloorColor = (name: string, defaultColor?: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('baño') || lower.includes('toil')) return 0x334155; // Cerámica gris
      if (lower.includes('coci')) return 0x1e293b; // Porcelanato oscuro
      if (lower.includes('dorm') || lower.includes('habita')) return 0x292524; // Piso cálido simil madera
      if (lower.includes('lavad')) return 0x1e293b;
      return 0x1e293b; // Estar / Living
    };

    // A. Construcción de Pisos Individuales por Ambiente con Zócalos
    project.rooms.forEach((room) => {
      const rx = room.x / PIXELS_PER_METER;
      const rz = room.y / PIXELS_PER_METER;
      const rw = room.width / PIXELS_PER_METER;
      const rd = room.height / PIXELS_PER_METER;
      const areaM2 = ((room.width / PIXELS_PER_METER) * (room.height / PIXELS_PER_METER)).toFixed(1);

      // 1. Suelo del ambiente
      const floorGeo = new THREE.PlaneGeometry(rw, rd);
      const floorMat = new THREE.MeshStandardMaterial({
        color: getRoomFloorColor(room.name, room.color),
        roughness: 0.3,
        metalness: 0.15,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.name = `floor_${room.id}`;
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(rx + rw / 2, 0.005, rz + rd / 2);
      floorMesh.receiveShadow = true;
      archGroup.add(floorMesh);

      // Cuadrícula sutil sobre el piso del ambiente
      const roomGrid = new THREE.GridHelper(Math.max(rw, rd), Math.round(Math.max(rw, rd) * 2), 0x0284c7, 0x334155);
      roomGrid.position.set(rx + rw / 2, 0.008, rz + rd / 2);
      archGroup.add(roomGrid);

      // 2. Zócalos perimetrales (altura 0.08m)
      const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      const bbThick = 0.02;
      const bbHeight = 0.08;

      // Zócalo Norte
      const bbN = new THREE.Mesh(new THREE.BoxGeometry(rw, bbHeight, bbThick), baseboardMat);
      bbN.position.set(rx + rw / 2, bbHeight / 2, rz + bbThick / 2);
      archGroup.add(bbN);

      // Zócalo Sur
      const bbS = new THREE.Mesh(new THREE.BoxGeometry(rw, bbHeight, bbThick), baseboardMat);
      bbS.position.set(rx + rw / 2, bbHeight / 2, rz + rd - bbThick / 2);
      archGroup.add(bbS);

      // Zócalo Oeste
      const bbW = new THREE.Mesh(new THREE.BoxGeometry(bbThick, bbHeight, rd), baseboardMat);
      bbW.position.set(rx + bbThick / 2, bbHeight / 2, rz + rd / 2);
      archGroup.add(bbW);

      // Zócalo Este
      const bbE = new THREE.Mesh(new THREE.BoxGeometry(bbThick, bbHeight, rd), baseboardMat);
      bbE.position.set(rx + rw - bbThick / 2, bbHeight / 2, rz + rd / 2);
      archGroup.add(bbE);

      // 3. Etiqueta 3D en el suelo con el nombre del ambiente y m²
      const labelTex = createLabelTexture(room.name, `${areaM2} m²`);
      if (labelTex) {
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, opacity: 0.85 });
        const labelPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), labelMat);
        labelPlane.rotation.x = -Math.PI / 2;
        labelPlane.position.set(rx + rw / 2, 0.012, rz + rd / 2);
        labelsGroup.add(labelPlane);
      }

      // 4. Techo de la habitación (si está activo showCeiling)
      const ceilingMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(rw, rd),
        new THREE.MeshStandardMaterial({
          color: 0xf1f5f9,
          roughness: 0.8,
          side: THREE.DoubleSide,
        })
      );
      ceilingMesh.rotation.x = Math.PI / 2;
      ceilingMesh.position.set(rx + rw / 2, WALL_HEIGHT, rz + rd / 2);
      ceilingMesh.castShadow = true;
      ceilingGroup.add(ceilingMesh);

      // Vigas estructurales caladas del techo
      const beamGeo = new THREE.BoxGeometry(rw, 0.08, 0.08);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const beam1 = new THREE.Mesh(beamGeo, beamMat);
      beam1.position.set(rx + rw / 2, WALL_HEIGHT + 0.04, rz + rd / 3);
      ceilingGroup.add(beam1);

      const beam2 = new THREE.Mesh(beamGeo, beamMat);
      beam2.position.set(rx + rw / 2, WALL_HEIGHT + 0.04, rz + (rd * 2) / 3);
      ceilingGroup.add(beam2);
    });

    // B. Construcción de Muros Sincronizados (Manuales de project.architecturalElements o Perimetrales)
    const manualWalls = project.architecturalElements.filter((a) => a.type === 'wall');

    if (manualWalls.length > 0) {
      // Usar muros manuales exactos dibujados en el CAD
      manualWalls.forEach((w) => {
        const x1 = w.x1 / PIXELS_PER_METER;
        const z1 = w.y1 / PIXELS_PER_METER;
        const x2 = w.x2 / PIXELS_PER_METER;
        const z2 = w.y2 / PIXELS_PER_METER;

        const dx = x2 - x1;
        const dz = z2 - z1;
        const wallLen = Math.sqrt(dx * dx + dz * dz);
        if (wallLen < 0.1) return;

        const thick = (w.thickness ? w.thickness / PIXELS_PER_METER : 0.15) || 0.15;
        const angle = Math.atan2(dz, dx);

        const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(wallLen, WALL_HEIGHT, thick), wallMat);
        wallMesh.position.set((x1 + x2) / 2, WALL_HEIGHT / 2, (z1 + z2) / 2);
        wallMesh.rotation.y = -angle;
        wallMesh.castShadow = !isTranslucent;
        wallMesh.receiveShadow = true;
        wallsGroup.add(wallMesh);

        // Bordes del muro para nitidez arquitectónica
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(wallMesh.geometry), wallBorderMat);
        edges.position.copy(wallMesh.position);
        edges.rotation.copy(wallMesh.rotation);
        wallsGroup.add(edges);
      });
    } else {
      // Fallback: Si no hay muros individuales explícitos, construir muros perimetrales de cada habitación
      project.rooms.forEach((room) => {
        const rx = room.x / PIXELS_PER_METER;
        const rz = room.y / PIXELS_PER_METER;
        const rw = room.width / PIXELS_PER_METER;
        const rd = room.height / PIXELS_PER_METER;
        const thick = 0.15;

        // Pared Norte
        const wallN = new THREE.Mesh(new THREE.BoxGeometry(rw, WALL_HEIGHT, thick), wallMat);
        wallN.position.set(rx + rw / 2, WALL_HEIGHT / 2, rz);
        wallsGroup.add(wallN);

        // Pared Sur
        const wallS = new THREE.Mesh(new THREE.BoxGeometry(rw, WALL_HEIGHT, thick), wallMat);
        wallS.position.set(rx + rw / 2, WALL_HEIGHT / 2, rz + rd);
        wallsGroup.add(wallS);

        // Pared Oeste
        const wallW = new THREE.Mesh(new THREE.BoxGeometry(thick, WALL_HEIGHT, rd), wallMat);
        wallW.position.set(rx, WALL_HEIGHT / 2, rz + rd / 2);
        wallsGroup.add(wallW);

        // Pared Este
        const wallE = new THREE.Mesh(new THREE.BoxGeometry(thick, WALL_HEIGHT, rd), wallMat);
        wallE.position.set(rx + rw, WALL_HEIGHT / 2, rz + rd / 2);
        wallsGroup.add(wallE);
      });
    }

    // C. Construcción de Puertas 3D con Vano, Marco y Hoja Abatible
    const doors = project.architecturalElements.filter((a) => a.type === 'door');
    doors.forEach((door) => {
      const x1 = door.x1 / PIXELS_PER_METER;
      const z1 = door.y1 / PIXELS_PER_METER;
      const x2 = door.x2 / PIXELS_PER_METER;
      const z2 = door.y2 / PIXELS_PER_METER;

      const dx = x2 - x1;
      const dz = z2 - z1;
      const doorW = Math.max(0.7, Math.sqrt(dx * dx + dz * dz));
      const angle = Math.atan2(dz, dx);

      const doorGroup = new THREE.Group();
      doorGroup.position.set(x1, 0, z1);
      doorGroup.rotation.y = -angle;

      // Marco de madera / aluminio
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
      const frameJambGeo = new THREE.BoxGeometry(0.06, DOOR_HEIGHT, 0.16);

      const jambLeft = new THREE.Mesh(frameJambGeo, frameMat);
      jambLeft.position.set(0, DOOR_HEIGHT / 2, 0);
      doorGroup.add(jambLeft);

      const jambRight = new THREE.Mesh(frameJambGeo, frameMat);
      jambRight.position.set(doorW, DOOR_HEIGHT / 2, 0);
      doorGroup.add(jambRight);

      const frameHeader = new THREE.Mesh(new THREE.BoxGeometry(doorW, 0.06, 0.16), frameMat);
      frameHeader.position.set(doorW / 2, DOOR_HEIGHT, 0);
      doorGroup.add(frameHeader);

      // Dintel de muro superior hasta el techo (2.05m a 2.60m)
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, WALL_HEIGHT - DOOR_HEIGHT, 0.15), wallMat);
      lintel.position.set(doorW / 2, DOOR_HEIGHT + (WALL_HEIGHT - DOOR_HEIGHT) / 2, 0);
      doorGroup.add(lintel);

      // Hoja de la puerta abatible con ángulo (abierta a 45° para realismo)
      const isExt = door.swingDirection === 'exterior';
      const isRight = door.hingeSide === 'derecha';
      const swingAngle = isExt ? (isRight ? -0.85 : 0.85) : isRight ? 0.85 : -0.85;

      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x78350f, // Madera cedro / roble
        roughness: 0.6,
        metalness: 0.1,
      });
      const leafGeo = new THREE.BoxGeometry(doorW - 0.08, DOOR_HEIGHT - 0.04, 0.04);
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      leafMesh.position.set((doorW - 0.08) / 2, (DOOR_HEIGHT - 0.04) / 2, 0);

      // Pivote de la bisagra
      const hingePivot = new THREE.Group();
      hingePivot.position.set(isRight ? doorW - 0.04 : 0.04, 0, 0);
      hingePivot.rotation.y = swingAngle;
      hingePivot.add(leafMesh);
      doorGroup.add(hingePivot);

      // Manija de puerta metálica a 0.95m
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12), handleMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(isRight ? -doorW + 0.15 : doorW - 0.15, 0.95, 0.04);
      leafMesh.add(handle);

      openingsGroup.add(doorGroup);
    });

    // D. Construcción de Ventanas 3D con Antepecho a 1.00m y Vidrio Translúcido
    const windows = project.architecturalElements.filter((a) => a.type === 'window');
    windows.forEach((win) => {
      const x1 = win.x1 / PIXELS_PER_METER;
      const z1 = win.y1 / PIXELS_PER_METER;
      const x2 = win.x2 / PIXELS_PER_METER;
      const z2 = win.y2 / PIXELS_PER_METER;

      const dx = x2 - x1;
      const dz = z2 - z1;
      const winW = Math.max(0.8, Math.sqrt(dx * dx + dz * dz));
      const angle = Math.atan2(dz, dx);

      const winGroup = new THREE.Group();
      winGroup.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
      winGroup.rotation.y = -angle;

      // 1. Antepecho de muro desde 0 hasta 1.00m
      const sillMesh = new THREE.Mesh(new THREE.BoxGeometry(winW, WINDOW_SILL, 0.15), wallMat);
      sillMesh.position.set(0, WINDOW_SILL / 2, 0);
      sillMesh.castShadow = true;
      sillMesh.receiveShadow = true;
      winGroup.add(sillMesh);

      // 2. Dintel superior de muro desde 2.20m hasta 2.60m
      const topLintel = new THREE.Mesh(new THREE.BoxGeometry(winW, WALL_HEIGHT - WINDOW_TOP, 0.15), wallMat);
      topLintel.position.set(0, WINDOW_TOP + (WALL_HEIGHT - WINDOW_TOP) / 2, 0);
      topLintel.castShadow = true;
      topLintel.receiveShadow = true;
      winGroup.add(topLintel);

      // 3. Marco de carpintería de aluminio blanco
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 });
      const frameH = WINDOW_TOP - WINDOW_SILL;
      const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(winW, frameH, 0.06), frameMat);
      frameOuter.position.set(0, WINDOW_SILL + frameH / 2, 0);

      // 4. Vidrio de ventana PBR translúcido con reflejo
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.88,
        opacity: 0.45,
        transparent: true,
        roughness: 0.05,
        ior: 1.52,
        reflectivity: 0.9,
      });
      const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(winW - 0.08, frameH - 0.08, 0.012), glassMat);
      glassMesh.position.set(0, WINDOW_SILL + frameH / 2, 0);
      winGroup.add(glassMesh);

      openingsGroup.add(winGroup);
    });
  }, [project.rooms, project.architecturalElements, wallMode, showCeiling, createLabelTexture]);

  // 3. Renderizado de Componentes Eléctricos Realistas a Cotas Reglamentarias AEA
  // (Plafones LED a 2.60m, Teclas a 1.10m, Tomas a 0.30m, Tablero a 1.40m, Jabalina a nivel suelo)
  useEffect(() => {
    const symGroup = symbolsGroupRef.current;
    if (!symGroup) return;

    // Limpieza
    while (symGroup.children.length > 0) {
      const obj = symGroup.children[0] as THREE.Object3D;
      symGroup.remove(obj);
    }
    interactablesRef.current = [];
    pointLightsRef.current.clear();

    project.symbols.forEach((sym) => {
      // Si la puesta a tierra está oculta y el símbolo es jabalina, omitir
      if (!showGrounding && sym.type === 'puesta_tierra') return;

      const posX = sym.x / PIXELS_PER_METER;
      const posZ = sym.y / PIXELS_PER_METER;

      const compGroup = new THREE.Group();
      compGroup.userData = { symbolId: sym.id, type: sym.type, name: sym.name, label: sym.label };

      // Resaltado de selección
      const isSelected = selectedSym3D === sym.id;

      if (sym.type === 'luminaria') {
        // --- 1. LUMINARIA / PLAFÓN LED CIRCULAR EN TECHO (Y = 2.58m) ---
        const posY = 2.58;
        compGroup.position.set(posX, posY, posZ);

        // Bisel de aluminio
        const bezelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 32);
        const bezelMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xf59e0b : 0x94a3b8,
          metalness: 0.85,
          roughness: 0.2,
        });
        const bezel = new THREE.Mesh(bezelGeo, bezelMat);
        compGroup.add(bezel);

        // Difusor de policarbonato con brillo reactivo
        const isOn = simState.activeLamps.has(sym.id);
        const diffuserGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.042, 32);
        const diffuserMat = new THREE.MeshStandardMaterial({
          color: isOn ? 0xfef08a : 0xe2e8f0,
          emissive: isOn ? 0xfacc15 : 0x000000,
          emissiveIntensity: isOn ? 1.8 : 0,
          roughness: 0.15,
        });
        const diffuser = new THREE.Mesh(diffuserGeo, diffuserMat);
        compGroup.add(diffuser);

        // Luz puntual realista que ilumina la habitación en 3D
        if (isOn) {
          const pointLight = new THREE.PointLight(0xfef08a, 2.8, 8.5, 1.2);
          pointLight.position.set(0, -0.15, 0);
          pointLight.castShadow = true;
          compGroup.add(pointLight);
          pointLightsRef.current.set(sym.id, pointLight);
        }

        // Etiqueta flotante con nombre L1, L2
        if (showLabels) {
          const badgeTex = createLabelTexture(sym.label || 'L', `${sym.powerWatts}W`);
          if (badgeTex) {
            const badge = new THREE.Mesh(
              new THREE.PlaneGeometry(0.5, 0.25),
              new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true })
            );
            badge.position.set(0, -0.25, 0.2);
            badge.rotation.x = -Math.PI / 4;
            compGroup.add(badge);
          }
        }
      } else if (sym.category === 'comando') {
        // --- 2. INTERRUPTOR DE PARED (Y = 1.10m SEGÚN AEA) ---
        const posY = 1.10;
        compGroup.position.set(posX, posY, posZ);

        // Placa exterior blanca con bastidor 10x5cm
        const plateGeo = new THREE.BoxGeometry(0.12, 0.18, 0.025);
        const plateMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xf59e0b : 0xffffff,
          roughness: 0.35,
          metalness: 0.05,
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        compGroup.add(plate);

        // Tecla basculante móvil (se inclina si está cerrada/abierta)
        const isOpen = sym.state?.isOpen !== false;
        const rockerGeo = new THREE.BoxGeometry(0.06, 0.09, 0.03);
        const rockerMat = new THREE.MeshStandardMaterial({
          color: !isOpen ? 0x10b981 : 0x94a3b8,
          roughness: 0.4,
        });
        const rocker = new THREE.Mesh(rockerGeo, rockerMat);
        rocker.position.set(0, 0, 0.008);
        rocker.rotation.x = !isOpen ? -0.18 : 0.18; // Ángulo de inclinación táctil
        compGroup.add(rocker);

        // Tornillos del bastidor
        const screwMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.3 });
        const screw1 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 8), screwMat);
        screw1.rotation.x = Math.PI / 2;
        screw1.position.set(0, 0.07, 0.01);
        compGroup.add(screw1);

        const screw2 = screw1.clone();
        screw2.position.set(0, -0.07, 0.01);
        compGroup.add(screw2);
      } else if (sym.type === 'tomacorriente' || sym.type === 'toma_especial') {
        // --- 3. TOMACORRIENTE DE PARED (Y = 0.30m SEGÚN AEA) ---
        const posY = 0.30;
        compGroup.position.set(posX, posY, posZ);

        const plateGeo = new THREE.BoxGeometry(0.12, 0.18, 0.025);
        const plateMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xf59e0b : 0xffffff,
          roughness: 0.35,
          metalness: 0.05,
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        compGroup.add(plate);

        // Módulo IRAM 2071 de 3 patas planas (Fase, Neutro, Tierra)
        const socketRing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.028, 24),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
        );
        socketRing.rotation.x = Math.PI / 2;
        compGroup.add(socketRing);

        // Espiga de tierra
        const earthSlot = new THREE.Mesh(
          new THREE.BoxGeometry(0.008, 0.02, 0.03),
          new THREE.MeshBasicMaterial({ color: 0x0f172a })
        );
        earthSlot.position.set(0, -0.018, 0.005);
        compGroup.add(earthSlot);
      } else if (sym.type === 'tablero') {
        // --- 4. TABLERO SECCIONAL GENERAL (Y = 1.40m) ---
        const posY = 1.40;
        compGroup.position.set(posX, posY, posZ);

        // Gabinete DIN estanco con marco
        const cabGeo = new THREE.BoxGeometry(0.38, 0.48, 0.14);
        const cabMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xf59e0b : 0x1e293b,
          roughness: 0.4,
        });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        compGroup.add(cab);

        // Riel DIN interior metálico
        const dinRail = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.035, 0.01),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
        );
        dinRail.position.set(0, 0, 0.05);
        compGroup.add(dinRail);

        // Interruptor Termomagnético IGA + Disyuntor Diferencial 30mA
        const breakerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
        const iga = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.08), breakerMat);
        iga.position.set(-0.08, 0, 0.07);
        compGroup.add(iga);

        const rcd = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.12, 0.08),
          new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 })
        );
        rcd.position.set(0.02, 0, 0.07);
        compGroup.add(rcd);

        // Barra de Tierra de latón (PE)
        const peBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.02, 0.015),
          new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.6, roughness: 0.3 })
        );
        peBar.position.set(0, -0.16, 0.05);
        compGroup.add(peBar);

        // Puerta fumé translúcida
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.46, 0.01),
          new THREE.MeshPhysicalMaterial({
            color: 0x0284c7,
            transmission: 0.85,
            opacity: 0.4,
            transparent: true,
            roughness: 0.1,
            ior: 1.5,
          })
        );
        door.position.set(0, 0, 0.08);
        compGroup.add(door);
      } else if (sym.type === 'puesta_tierra') {
        // --- 5. JABALINA DE PUESTA A TIERRA (PAT) EN EL SUELO (Y = 0) ---
        compGroup.position.set(posX, 0.02, posZ);

        // Caja de inspección redonda reglamentaria 15cm
        const pitGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.05, 24);
        const pitMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
        const pit = new THREE.Mesh(pitGeo, pitMat);
        compGroup.add(pit);

        // Barra de cobre cobreado de la jabalina (3/4" x 1.50m clavada)
        const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 16);
        const rodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.95, roughness: 0.2 });
        const rod = new THREE.Mesh(rodGeo, rodMat);
        rod.position.set(0, 0.08, 0);
        compGroup.add(rod);

        // Morseto de bronce de conexión con cable verde-amarillo
        const clamp = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.04, 0.05),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
        );
        clamp.position.set(0, 0.14, 0);
        compGroup.add(clamp);
      } else if (sym.type === 'caja_paso') {
        // --- 6. CAJA DE PASO OCTOGONAL EN TECHO (Y = 2.58m) ---
        const posY = 2.58;
        compGroup.position.set(posX, posY, posZ);

        const boxGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        compGroup.add(box);
      }

      symGroup.add(compGroup);
      interactablesRef.current.push(compGroup);
    });
  }, [project.symbols, simState.activeLamps, selectedSym3D, showGrounding, showLabels, createLabelTexture]);

  // 4. Cañerías y Recorridos Eléctricos 3D Reglamentarios
  // (Diferenciación de conductores: Fase marrón, Neutro celeste, Tierra verde-amarillo, Retorno violeta)
  useEffect(() => {
    const pipeGroup = pipesGroupRef.current;
    if (!pipeGroup) return;

    while (pipeGroup.children.length > 0) {
      const obj = pipeGroup.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      pipeGroup.remove(obj);
    }

    // Materiales de cañería y conductores según la reglamentación
    const conduitMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Caño corrugado naranja ignífugo
      roughness: 0.5,
      metalness: 0.1,
    });

    const phaseWireMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.3 }); // Marrón Fase
    const neutralWireMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }); // Celeste Neutro
    const earthWireMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 }); // Verde Tierra PE
    const returnWireMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3 }); // Violeta Retorno

    project.wires.forEach((wire) => {
      // Si la capa de puesta a tierra está oculta y el cable es tierra, omitir
      if (!showGrounding && wire.type === 'tierra') return;

      const fromSym = project.symbols.find((s) => s.id === wire.fromComponentId);
      const toSym = project.symbols.find((s) => s.id === wire.toComponentId);
      if (!fromSym || !toSym) return;

      const getSymY = (sym: ElectricalSymbol) => {
        if (sym.type === 'luminaria' || sym.type === 'caja_paso') return 2.58;
        if (sym.type === 'tablero') return 1.40;
        if (sym.category === 'comando') return 1.10;
        if (sym.type === 'puesta_tierra') return 0.05;
        return 0.30; // Tomacorrientes
      };

      const p1X = fromSym.x / PIXELS_PER_METER;
      const p1Z = fromSym.y / PIXELS_PER_METER;
      const p1Y = getSymY(fromSym);

      const p2X = toSym.x / PIXELS_PER_METER;
      const p2Z = toSym.y / PIXELS_PER_METER;
      const p2Y = getSymY(toSym);

      // Si es un cable de tierra hacia la jabalina, recorre por el suelo (Y=0.08m)
      const isGroundRun = wire.type === 'tierra' || fromSym.type === 'puesta_tierra' || toSym.type === 'puesta_tierra';
      const midY = isGroundRun ? 0.08 : 2.58; // Subida al techo para distribución general o por suelo

      const midX = (p1X + p2X) / 2;
      const midZ = (p1Z + p2Z) / 2;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p1X, p1Y, p1Z),
        new THREE.Vector3(p1X, midY, p1Z),
        new THREE.Vector3(midX, midY, midZ),
        new THREE.Vector3(p2X, midY, p2Z),
        new THREE.Vector3(p2X, p2Y, p2Z),
      ]);

      // Caño exterior
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.016, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, conduitMat);
      pipeGroup.add(tubeMesh);

      // Conductor interior coloreado asomando sutilmente
      const wireMat =
        wire.type === 'fase'
          ? phaseWireMat
          : wire.type === 'neutro'
          ? neutralWireMat
          : wire.type === 'tierra'
          ? earthWireMat
          : returnWireMat;

      const innerWireGeo = new THREE.TubeGeometry(curve, 32, 0.008, 6, false);
      const innerWireMesh = new THREE.Mesh(innerWireGeo, wireMat);
      pipeGroup.add(innerWireMesh);
    });
  }, [project.wires, project.symbols, showGrounding]);

  // 5. Diagnóstico en 3D: Resaltado visual de componentes con falla (Etapa 3)
  useEffect(() => {
    const faultsGroup = faultsGroupRef.current;
    if (!faultsGroup) return;

    while (faultsGroup.children.length > 0) {
      faultsGroup.remove(faultsGroup.children[0]);
    }

    const activeFaults = simState.activeFaults || [];

    activeFaults.forEach((fault) => {
      // Identificar coordenadas del componente o cable
      let targetX = 0;
      let targetZ = 0;
      let targetY = 1.2;

      if (fault.involvedComponentIds && fault.involvedComponentIds.length > 0) {
        const sym = project.symbols.find((s) => s.id === fault.involvedComponentIds[0]);
        if (sym) {
          targetX = sym.x / PIXELS_PER_METER;
          targetZ = sym.y / PIXELS_PER_METER;
          targetY = sym.type === 'luminaria' ? 2.58 : sym.category === 'comando' ? 1.10 : 0.30;
        }
      }

      // Anillo de alarma pulsante rojo
      const ringGeo = new THREE.RingGeometry(0.2, 0.32, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.name = 'fault_pulse';
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(targetX, targetY + 0.1, targetZ);
      faultsGroup.add(ringMesh);

      // Icono / Cartel 3D de Alarma
      const alertTex = createLabelTexture('⚠️ FALLA DETECTADA', fault.title, true);
      if (alertTex) {
        const alertMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 0.6),
          new THREE.MeshBasicMaterial({ map: alertTex, transparent: true })
        );
        alertMesh.position.set(targetX, targetY + 0.55, targetZ);
        alertMesh.rotation.y = Math.PI / 4;
        faultsGroup.add(alertMesh);
      }
    });
  }, [simState.activeFaults, project.symbols, createLabelTexture]);

  // 6. Manejador de Clic en 3D con Raycasting para interactuar con componentes
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObjects(interactablesRef.current, true);

    if (intersects.length > 0) {
      let hitObj: THREE.Object3D | null = intersects[0].object;
      while (hitObj && !hitObj.userData?.symbolId && hitObj.parent) {
        hitObj = hitObj.parent;
      }

      if (hitObj?.userData?.symbolId) {
        const symId = hitObj.userData.symbolId;
        setSelectedSym3D(symId);
        if (onSelectSymbol) onSelectSymbol(symId);

        // Si es un interruptor/comando, accionarlo de inmediato
        if (hitObj.userData.type?.includes('interruptor') || hitObj.userData.type === 'conmutado') {
          onToggleSwitch(symId);
        }
      }
    } else {
      // Clic en el vacío: deseleccionar
      setSelectedSym3D(null);
    }
  };

  // 7. Transiciones de presets de cámara con suavizado lerp
  const applyCameraPreset = (preset: 'iso' | 'cenital' | 'eye' | 'tablero' | 'fit') => {
    setCameraPreset(preset);
    const target = controlsRef.current?.target || new THREE.Vector3(4, 1.2, 3);

    // Bounding Box del proyecto para ajuste de encuadre
    let minX = 0;
    let maxX = 8;
    let minZ = 0;
    let maxZ = 6;
    if (project.rooms.length > 0) {
      minX = Math.min(...project.rooms.map((r) => r.x / PIXELS_PER_METER));
      maxX = Math.max(...project.rooms.map((r) => (r.x + r.width) / PIXELS_PER_METER));
      minZ = Math.min(...project.rooms.map((r) => r.y / PIXELS_PER_METER));
      maxZ = Math.max(...project.rooms.map((r) => (r.y + r.height) / PIXELS_PER_METER));
    }
    const cX = (minX + maxX) / 2;
    const cZ = (minZ + maxZ) / 2;
    const maxDim = Math.max(maxX - minX, maxZ - minZ, 5);

    if (preset === 'iso') {
      targetCamPosRef.current = new THREE.Vector3(cX + maxDim * 0.9, 5.5, cZ + maxDim * 1.1);
      targetLookAtRef.current = new THREE.Vector3(cX, 1.2, cZ);
    } else if (preset === 'cenital') {
      targetCamPosRef.current = new THREE.Vector3(cX, maxDim * 1.6, cZ + 0.05);
      targetLookAtRef.current = new THREE.Vector3(cX, 0, cZ);
    } else if (preset === 'eye') {
      targetCamPosRef.current = new THREE.Vector3(cX - 1.2, 1.65, cZ + 1.2);
      targetLookAtRef.current = new THREE.Vector3(cX + 1.5, 1.5, cZ - 1.2);
    } else if (preset === 'tablero') {
      const ts = project.symbols.find((s) => s.type === 'tablero');
      if (ts) {
        const tx = ts.x / PIXELS_PER_METER;
        const tz = ts.y / PIXELS_PER_METER;
        targetCamPosRef.current = new THREE.Vector3(tx, 1.45, tz + 1.2);
        targetLookAtRef.current = new THREE.Vector3(tx, 1.40, tz);
      } else {
        targetCamPosRef.current = new THREE.Vector3(cX, 1.6, cZ + 2);
        targetLookAtRef.current = new THREE.Vector3(cX, 1.4, cZ);
      }
    } else if (preset === 'fit') {
      targetCamPosRef.current = new THREE.Vector3(cX + maxDim * 1.1, maxDim * 0.9, cZ + maxDim * 1.3);
      targetLookAtRef.current = new THREE.Vector3(cX, 1.0, cZ);
    }
  };

  // Función para enfocar cámara directamente en una falla detectada
  const focusFault = (fault: FaultDetail) => {
    setIsolatedFaultId(fault.id);
    if (fault.involvedComponentIds && fault.involvedComponentIds[0]) {
      const sym = project.symbols.find((s) => s.id === fault.involvedComponentIds[0]);
      if (sym) {
        const fx = sym.x / PIXELS_PER_METER;
        const fz = sym.y / PIXELS_PER_METER;
        const fy = sym.type === 'luminaria' ? 2.58 : 1.10;
        targetCamPosRef.current = new THREE.Vector3(fx + 1.2, fy + 0.6, fz + 1.5);
        targetLookAtRef.current = new THREE.Vector3(fx, fy, fz);
      }
    }
  };

  // Datos del componente seleccionado actualmente
  const selectedSymbolData = useMemo(() => {
    if (!selectedSym3D) return null;
    return project.symbols.find((s) => s.id === selectedSym3D) || null;
  }, [selectedSym3D, project.symbols]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* 1. Canvas WebGL Three.js con interacción directa */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2. Barra Superior Minimalista (Top-Left): Identidad y Capas de Visualización */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-20 pointer-events-auto">
        <div className="px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2">
          <Box className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
          <span className="text-xs font-bold text-white tracking-wide">ESTUDIO 3D</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono rounded font-semibold border border-amber-500/30">
            Escala 1:1 AEA
          </span>
        </div>

        {/* Capas de Visualización Rápidas */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1 rounded-xl shadow-xl backdrop-blur-md text-xs text-slate-300">
          <button
            onClick={() => setShowArch(!showArch)}
            className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
              showArch ? 'bg-[#167D78] text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mostrar / Ocultar Arquitectura (muros, pisos, aberturas)"
          >
            <span>Muros & Pisos</span>
          </button>
          <button
            onClick={() => setShowComponents(!showComponents)}
            className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
              showComponents ? 'bg-[#167D78] text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mostrar / Ocultar Componentes Eléctricos"
          >
            <span>Bocas</span>
          </button>
          <button
            onClick={() => setShowConduits(!showConduits)}
            className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
              showConduits ? 'bg-[#167D78] text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mostrar / Ocultar Cañerías y Conductores"
          >
            <span>Cañerías</span>
          </button>
          <button
            onClick={() => setShowGrounding(!showGrounding)}
            className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
              showGrounding ? 'bg-[#15803d] text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Mostrar / Ocultar Puesta a Tierra y Jabalina"
          >
            <span>Tierra PE</span>
          </button>
          <button
            onClick={() => setShowCeiling(!showCeiling)}
            className={`px-2 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
              showCeiling ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Mostrar / Ocultar Techos"
          >
            <span>Techo</span>
          </button>
        </div>
      </div>

      {/* 3. Acciones de Esquina Superior Derecha: Día/Noche, Transparencia de Paredes y Ficha */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
        {/* Selector de Transparencia de Paredes */}
        <button
          onClick={() => {
            setWallMode((prev) => (prev === 'solid' ? 'translucent' : prev === 'translucent' ? 'hidden' : 'solid'));
          }}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title="Alternar Paredes: Sólidas / Translúcidas (35%) / Ocultas"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">
            {wallMode === 'solid' ? 'Muros Sólidos' : wallMode === 'translucent' ? 'Muros Translúcidos' : 'Muros Ocultos'}
          </span>
        </button>

        {/* Día / Noche */}
        <button
          onClick={() => setIsNightMode((prev) => !prev)}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Alternar Iluminación Ambiental Día/Noche"
        >
          {isNightMode ? (
            <>
              <Moon className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Noche (Luces 3D)</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-yellow-400" />
              <span className="hidden sm:inline">Día</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Tarjeta Flotante de Inspección de Componente Seleccionado (Top-Right flank suave) */}
      {selectedSymbolData && (
        <div className="absolute top-16 right-3 z-30 max-w-xs w-72 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs text-slate-200 animate-fade-in">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#2DD4BF]">
                {selectedSymbolData.category}
              </span>
              <h4 className="font-bold text-white text-sm">{selectedSymbolData.name}</h4>
              <p className="text-[11px] text-slate-400 font-mono">ID: {selectedSymbolData.label || selectedSymbolData.id}</p>
            </div>
            <button
              onClick={() => setSelectedSym3D(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Potencia nominal:</span>
              <span className="font-mono font-bold text-amber-400">{selectedSymbolData.powerWatts} W</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Circuito asociado:</span>
              <span className="font-mono font-semibold text-cyan-400">{selectedSymbolData.circuitId || 'Sin asignar'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tensión de servicio:</span>
              <span className="font-mono">{selectedSymbolData.voltage} V</span>
            </div>
            {selectedSymbolData.category === 'comando' && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Estado de tecla:</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                    selectedSymbolData.state?.isOpen === false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {selectedSymbolData.state?.isOpen === false ? 'Cerrado (ON)' : 'Abierto (OFF)'}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {selectedSymbolData.category === 'comando' && (
              <button
                onClick={() => onToggleSwitch(selectedSymbolData.id)}
                className="flex-1 py-1.5 bg-[#167D78] hover:bg-[#0F5E5A] text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
              >
                <span>Accionar Tecla</span>
              </button>
            )}
            {onOpenLearningModal && (
              <button
                onClick={() => onOpenLearningModal(selectedSymbolData.type)}
                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                title="Consultar ficha técnica reglamentaria AEA"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Ficha</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Alerta de Diagnóstico y Localización de Fallas en 3D (Etapa 3) */}
      {simState.activeFaults && simState.activeFaults.length > 0 && (
        <div className="absolute top-16 left-3 z-30 max-w-sm bg-red-950/95 border-2 border-red-500/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs text-red-100 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-red-200 uppercase tracking-wide text-[11px]">
                  Falla Activa en 3D
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-red-800 text-white rounded font-mono">
                  {simState.activeFaults.length} detectada(s)
                </span>
              </div>
              <p className="font-bold text-white text-xs leading-snug">
                {simState.activeFaults[0].title}
              </p>
              <p className="text-[11px] text-red-300 leading-relaxed">
                {simState.activeFaults[0].detectionReason}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => focusFault(simState.activeFaults![0])}
                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md"
                >
                  <Focus className="w-3.5 h-3.5" />
                  <span>Aislar en 3D</span>
                </button>
                <button
                  onClick={() => applyCameraPreset('fit')}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-700"
                >
                  Vista Completa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DOCK DE CONTROL INFERIOR COLAPSABLE (Directiva de Diseño Three.js: 100% Sin ocluir el centro) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[min(940px,94vw)] z-20 transition-all duration-300">
        <div className="flex flex-col items-center">
          {/* Pestaña de colapso/expansión */}
          <button
            onClick={() => setIsCinemaMode((prev) => !prev)}
            className="px-3.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-b-0 border-slate-700/80 rounded-t-xl text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-md transition-colors"
          >
            {isCinemaMode ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mostrar Controles 3D</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modo Inmersivo (Ocultar Dock)</span>
              </>
            )}
          </button>

          {/* Barra Principal de Presets de Cámara y Navegación */}
          {!isCinemaMode && (
            <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-200">
              {/* Presets de Cámara */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => applyCameraPreset('iso')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    cameraPreset === 'iso'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Perspectiva
                </button>
                <button
                  onClick={() => applyCameraPreset('cenital')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    cameraPreset === 'cenital'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cenital
                </button>
                <button
                  onClick={() => applyCameraPreset('eye')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    cameraPreset === 'eye'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ojos (1.65m)
                </button>
                <button
                  onClick={() => applyCameraPreset('tablero')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    cameraPreset === 'tablero'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tablero
                </button>
                <button
                  onClick={() => applyCameraPreset('fit')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    cameraPreset === 'fit'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Encuadrar la vivienda completa"
                >
                  Ajustar Todo
                </button>
              </div>

              {/* Indicador de ayuda táctil / mouse */}
              <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 border-l border-slate-800 pl-3 font-mono">
                <span>🖱️ Arrastra para girar • Rueda para zoom • Toca interruptores para simular</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
