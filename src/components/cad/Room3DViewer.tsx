/**
 * ELECTRA PLAN — Visor 3D Interactivo de la Habitación e Instalación Eléctrica
 * Renderizado WebGL PBR con Three.js: Muros a 2.60m, aberturas, zócalos, suelo texturado,
 * llaves a 1.10m, tomacorrientes a 0.30m, plafones a 2.60m, tablero a 1.40m y cañerías 3D.
 * Interacción en tiempo real (clic en interruptores para encender luces 3D) y dock inferior colapsable.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Project, ElectricalSymbol, SimulationState } from '../../types/electra';
import {
  Eye,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface Room3DViewerProps {
  project: Project;
  simState: SimulationState;
  onToggleSwitch: (symbolId: string) => void;
  onSelectSymbol?: (symbolId: string) => void;
  onOpenLearningModal?: (symbolType: string) => void;
}

export const Room3DViewer: React.FC<Room3DViewerProps> = ({
  project,
  simState,
  onToggleSwitch,
  onSelectSymbol,
  onOpenLearningModal,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isNightMode, setIsNightMode] = useState(true);
  const [selectedSym3D, setSelectedSym3D] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'cenital' | 'eye' | 'tablero'>('iso');

  // Referencias mutables para animación y Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const interactablesRef = useRef<THREE.Object3D[]>([]);
  const pointLightsRef = useRef<Map<string, THREE.PointLight>>(new Map());
  const symbolsGroupRef = useRef<THREE.Group | null>(null);
  const pipesGroupRef = useRef<THREE.Group | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  // Escala: 40 px en 2D = 1 metro en 3D
  const PIXELS_PER_METER = 40;

  // 1. Inicialización de Three.js Scene, Renderer, PBR lighting & OrbitControls
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Software WebGL Detection (Three.js Skill Directive)
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

    // Escena y Niebla
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x090d16 : 0x0f172a);
    scene.fog = new THREE.FogExp2(isNightMode ? 0x090d16 : 0x0f172a, 0.04);
    sceneRef.current = scene;

    // Cámara Perspectiva
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(6, 6, 8);
    cameraRef.current = camera;

    // Renderer con PBR y ACESFilmicToneMapping
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

    // PMREMGenerator Studio Environment (Zero-dependency RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Iluminación de Estudio y Ambiente
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, isNightMode ? 0.35 : 0.85);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, isNightMode ? 0.4 : 1.2);
    dirLight.position.set(8, 12, 6);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    const d = 8;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    // OrbitControls con amortiguación suave
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // No descender por debajo del suelo
    controls.minDistance = 1.5;
    controls.maxDistance = 25;
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;

    // Grupos para componentes dinámicos
    const symGroup = new THREE.Group();
    scene.add(symGroup);
    symbolsGroupRef.current = symGroup;

    const pipeGroup = new THREE.Group();
    scene.add(pipeGroup);
    pipesGroupRef.current = pipeGroup;

    // Ciclo de animación
    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Transición suave de cámara si hay un target activo
      if (targetCamPosRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, delta * 3.5);
        if (targetLookAtRef.current) {
          controlsRef.current.target.lerp(targetLookAtRef.current, delta * 3.5);
        }
        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 0.05) {
          targetCamPosRef.current = null;
        }
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

  // 2. Construcción de la Arquitectura 3D (Suelo, Muros a 2.60m, Zócalos y Techo seccional)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remover arquitectura previa si existe
    const existingArch = scene.getObjectByName('arch_group');
    if (existingArch) scene.remove(existingArch);

    const archGroup = new THREE.Group();
    archGroup.name = 'arch_group';

    // Determinar límites del proyecto a partir de habitaciones o fijar un estándar 8m x 6m
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

    const roomW = Math.max(maxX - minX, 5);
    const roomD = Math.max(maxZ - minZ, 4);
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Centrar el target de los controles
    if (controlsRef.current) {
      controlsRef.current.target.set(centerX, 1.2, centerZ);
    }

    // Material de Suelo tipo Porcelanato / Baldosa
    const floorGeo = new THREE.PlaneGeometry(roomW + 2, roomD + 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(centerX, 0, centerZ);
    floorMesh.receiveShadow = true;
    archGroup.add(floorMesh);

    // Cuadrícula estética sobre el suelo
    const grid = new THREE.GridHelper(Math.max(roomW, roomD) + 2, 20, 0x38bdf8, 0x334155);
    grid.position.set(centerX, 0.005, centerZ);
    archGroup.add(grid);

    // Material de Paredes (Yeso blanco satinado con espesor)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8,
      metalness: 0.05,
    });
    const wallExtMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
    });

    const WALL_HEIGHT = 2.6; // Altura estándar 2.60m
    const WALL_THICK = 0.15; // 15 cm de ladrillo/revoque

    // Construcción de muros por habitación
    project.rooms.forEach((room) => {
      const rx = room.x / PIXELS_PER_METER;
      const rz = room.y / PIXELS_PER_METER;
      const rw = room.width / PIXELS_PER_METER;
      const rd = room.height / PIXELS_PER_METER;

      // Pared Trasera (Norte)
      const wallBackGeo = new THREE.BoxGeometry(rw, WALL_HEIGHT, WALL_THICK);
      const wallBack = new THREE.Mesh(wallBackGeo, wallMat);
      wallBack.position.set(rx + rw / 2, WALL_HEIGHT / 2, rz);
      wallBack.castShadow = true;
      wallBack.receiveShadow = true;
      archGroup.add(wallBack);

      // Pared Izquierda (Oeste)
      const wallLeftGeo = new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, rd);
      const wallLeft = new THREE.Mesh(wallLeftGeo, wallMat);
      wallLeft.position.set(rx, WALL_HEIGHT / 2, rz + rd / 2);
      wallLeft.castShadow = true;
      wallLeft.receiveShadow = true;
      archGroup.add(wallLeft);

      // Pared Derecha (Este) con apertura simulada
      const wallRightGeo = new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, rd);
      const wallRight = new THREE.Mesh(wallRightGeo, wallMat);
      wallRight.position.set(rx + rw, WALL_HEIGHT / 2, rz + rd / 2);
      wallRight.castShadow = true;
      wallRight.receiveShadow = true;
      archGroup.add(wallRight);

      // Zócalo de madera / PVC perimetral (altura 0.08m)
      const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
      const bbBack = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.08, 0.02), baseboardMat);
      bbBack.position.set(rx + rw / 2, 0.04, rz + WALL_THICK / 2 + 0.01);
      archGroup.add(bbBack);

      const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, rd), baseboardMat);
      bbLeft.position.set(rx + WALL_THICK / 2 + 0.01, 0.04, rz + rd / 2);
      archGroup.add(bbLeft);

      // Marco de Techo perimetral transparente para apreciar la instalación
      const ceilingBeams = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(rw, 0.1, rd)),
        new THREE.LineBasicMaterial({ color: 0x475569 })
      );
      ceilingBeams.position.set(rx + rw / 2, WALL_HEIGHT, rz + rd / 2);
      archGroup.add(ceilingBeams);
    });

    scene.add(archGroup);
  }, [project.rooms]);

  // 3. Renderizado de Componentes Eléctricos Realistas en 3D
  // (Plafones en techo a 2.60m, Teclas a 1.10m, Tomas a 0.30m, Tablero a 1.40m)
  useEffect(() => {
    const symGroup = symbolsGroupRef.current;
    if (!symGroup) return;

    // Limpiar objetos previos
    while (symGroup.children.length > 0) {
      const obj = symGroup.children[0];
      symGroup.remove(obj);
    }
    interactablesRef.current = [];
    pointLightsRef.current.clear();

    project.symbols.forEach((sym) => {
      const posX = sym.x / PIXELS_PER_METER;
      const posZ = sym.y / PIXELS_PER_METER;

      const compGroup = new THREE.Group();
      compGroup.userData = { symbolId: sym.id, type: sym.type };

      if (sym.type === 'luminaria') {
        // --- 1. LUMINARIA / PLAFÓN LED EN TECHO (Y = 2.60m) ---
        const posY = 2.58;
        compGroup.position.set(posX, posY, posZ);

        // Bisel exterior de aluminio cepillado
        const bezelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 32);
        const bezelMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.8,
          roughness: 0.2,
        });
        const bezel = new THREE.Mesh(bezelGeo, bezelMat);
        compGroup.add(bezel);

        // Difusor acrílico microprismático emisor de luz
        const isOn = simState.activeLamps.has(sym.id);
        const diffuserGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.042, 32);
        const diffuserMat = new THREE.MeshStandardMaterial({
          color: isOn ? 0xfef08a : 0xe2e8f0,
          emissive: isOn ? 0xfacc15 : 0x000000,
          emissiveIntensity: isOn ? 1.5 : 0,
          roughness: 0.1,
        });
        const diffuser = new THREE.Mesh(diffuserGeo, diffuserMat);
        compGroup.add(diffuser);

        // Luz puntual realista que ilumina la habitación en 3D
        if (isOn) {
          const pointLight = new THREE.PointLight(0xfef08a, 2.5, 8, 1.2);
          pointLight.position.set(0, -0.15, 0);
          pointLight.castShadow = true;
          compGroup.add(pointLight);
          pointLightsRef.current.set(sym.id, pointLight);
        }
      } else if (sym.category === 'comando') {
        // --- 2. INTERRUPTOR DE PARED (Y = 1.10m SEGÚN AEA) ---
        const posY = 1.1;
        compGroup.position.set(posX, posY, posZ);

        // Placa exterior blanca 10x5cm
        const plateGeo = new THREE.BoxGeometry(0.12, 0.18, 0.025);
        const plateMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.3,
          metalness: 0.05,
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        compGroup.add(plate);

        // Tecla basculante móvil
        const isOpen = sym.state?.isOpen !== false;
        const rockerGeo = new THREE.BoxGeometry(0.06, 0.09, 0.03);
        const rockerMat = new THREE.MeshStandardMaterial({
          color: !isOpen ? 0x10b981 : 0x94a3b8,
          roughness: 0.4,
        });
        const rocker = new THREE.Mesh(rockerGeo, rockerMat);
        rocker.position.set(0, 0, 0.008);
        rocker.rotation.x = !isOpen ? -0.15 : 0.15;
        compGroup.add(rocker);

        // Tornillos miniatura del bastidor
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
        const posY = 0.3;
        compGroup.position.set(posX, posY, posZ);

        // Placa exterior
        const plateGeo = new THREE.BoxGeometry(0.12, 0.18, 0.025);
        const plateMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.3,
          metalness: 0.05,
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        compGroup.add(plate);

        // Alveolos IRAM 2071 (ranuras en V)
        const socketRing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.028, 24),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
        );
        socketRing.rotation.x = Math.PI / 2;
        compGroup.add(socketRing);

        // Espiga tierra
        const earthSlot = new THREE.Mesh(
          new THREE.BoxGeometry(0.008, 0.02, 0.03),
          new THREE.MeshBasicMaterial({ color: 0x0f172a })
        );
        earthSlot.position.set(0, -0.018, 0.005);
        compGroup.add(earthSlot);
      } else if (sym.type === 'tablero') {
        // --- 4. TABLERO SECCIONAL GENERAL (Y = 1.40m) ---
        const posY = 1.4;
        compGroup.position.set(posX, posY, posZ);

        // Gabinete exterior con puerta de policarbonato fumé
        const cabGeo = new THREE.BoxGeometry(0.35, 0.45, 0.14);
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        compGroup.add(cab);

        // Riel DIN interior y módulos
        const dinRail = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.035, 0.01),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
        );
        dinRail.position.set(0, 0, 0.05);
        compGroup.add(dinRail);

        // Disyuntor y térmicas miniatura
        const breakerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
        const mcb1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.08), breakerMat);
        mcb1.position.set(-0.06, 0, 0.07);
        compGroup.add(mcb1);

        const mcb2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.08), breakerMat);
        mcb2.position.set(0.02, 0, 0.07);
        compGroup.add(mcb2);

        // Puerta transparente
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(0.33, 0.43, 0.01),
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
      } else if (sym.type === 'caja_paso') {
        // --- 5. CAJA DE PASO OCTOGONAL ---
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
  }, [project.symbols, simState.activeLamps]);

  // 4. Cañerías Eléctricas 3D (Tubos corrugados y rígidos que unen cajas y dispositivos)
  useEffect(() => {
    const pipeGroup = pipesGroupRef.current;
    if (!pipeGroup) return;

    while (pipeGroup.children.length > 0) {
      pipeGroup.remove(pipeGroup.children[0]);
    }

    // Material de caño de PVC curvable (amarillo o gris ignífugo)
    const conduitMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.5,
      metalness: 0.1,
    });

    project.wires.forEach((wire) => {
      const fromSym = project.symbols.find((s) => s.id === wire.fromComponentId);
      const toSym = project.symbols.find((s) => s.id === wire.toComponentId);
      if (!fromSym || !toSym) return;

      const p1X = fromSym.x / PIXELS_PER_METER;
      const p1Z = fromSym.y / PIXELS_PER_METER;
      const p1Y = fromSym.type === 'luminaria' || fromSym.type === 'caja_paso' ? 2.58 : fromSym.category === 'comando' ? 1.1 : 0.3;

      const p2X = toSym.x / PIXELS_PER_METER;
      const p2Z = toSym.y / PIXELS_PER_METER;
      const p2Y = toSym.type === 'luminaria' || toSym.type === 'caja_paso' ? 2.58 : toSym.category === 'comando' ? 1.1 : 0.3;

      // Curva 3D suave con punto de paso por el techo
      const midX = (p1X + p2X) / 2;
      const midZ = (p1Z + p2Z) / 2;
      const midY = 2.58; // Subida al techo para distribución

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p1X, p1Y, p1Z),
        new THREE.Vector3(p1X, midY, p1Z),
        new THREE.Vector3(midX, midY, midZ),
        new THREE.Vector3(p2X, midY, p2Z),
        new THREE.Vector3(p2X, p2Y, p2Z),
      ]);

      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.018, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, conduitMat);
      pipeGroup.add(tubeMesh);
    });
  }, [project.wires, project.symbols]);

  // 5. Manejador de Clic en 3D con Raycasting para accionar interruptores
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

        // Si es un comando/interruptor, accionarlo directamente
        if (hitObj.userData.type?.includes('interruptor') || hitObj.userData.type === 'conmutado') {
          onToggleSwitch(symId);
        }
      }
    }
  };

  // 6. Transiciones de presets de cámara suaves
  const applyCameraPreset = (preset: 'iso' | 'cenital' | 'eye' | 'tablero') => {
    setCameraPreset(preset);
    const target = controlsRef.current?.target || new THREE.Vector3(4, 1.2, 3);

    if (preset === 'iso') {
      targetCamPosRef.current = new THREE.Vector3(target.x + 6, target.y + 5, target.z + 7);
      targetLookAtRef.current = new THREE.Vector3(target.x, 1.2, target.z);
    } else if (preset === 'cenital') {
      targetCamPosRef.current = new THREE.Vector3(target.x, target.y + 9, target.z + 0.1);
      targetLookAtRef.current = new THREE.Vector3(target.x, 0, target.z);
    } else if (preset === 'eye') {
      targetCamPosRef.current = new THREE.Vector3(target.x - 2, 1.65, target.z + 2);
      targetLookAtRef.current = new THREE.Vector3(target.x + 1, 1.5, target.z - 1);
    } else if (preset === 'tablero') {
      // Buscar tablero si existe
      const ts = project.symbols.find((s) => s.type === 'tablero');
      if (ts) {
        const tx = ts.x / PIXELS_PER_METER;
        const tz = ts.y / PIXELS_PER_METER;
        targetCamPosRef.current = new THREE.Vector3(tx, 1.4, tz + 1.2);
        targetLookAtRef.current = new THREE.Vector3(tx, 1.4, tz);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Canvas WebGL Mount Point */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Título y badge minimalista en esquina superior izquierda */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-10">
        <div className="px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg shadow-lg flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white tracking-wide">ESTUDIO 3D DE INSTALACIÓN</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono rounded font-semibold border border-amber-500/30">
            Escala 1:1 AEA
          </span>
        </div>
      </div>

      {/* Botones de acción superior derecha: Modo Día/Noche y Ficha Técnica */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={() => setIsNightMode((prev) => !prev)}
          className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Alternar iluminación ambiental Día/Noche"
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

        {selectedSym3D && onOpenLearningModal && (
          <button
            onClick={() => {
              const sym = project.symbols.find((s) => s.id === selectedSym3D);
              if (sym) onOpenLearningModal(sym.type);
            }}
            className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
          >
            <Info className="w-4 h-4" />
            <span>Ficha Educativa</span>
          </button>
        )}
      </div>

      {/* DOCK DE CONTROL INFERIOR COLAPSABLE (Directiva de Diseño Three.js: 100% Sin ocluir el centro) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[min(940px,94vw)] z-20 transition-all duration-300">
        <div className="flex flex-col items-center">
          {/* Botón pestaña para colapsar/expandir */}
          <button
            onClick={() => setIsCinemaMode((prev) => !prev)}
            className="px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-b-0 border-slate-700/80 rounded-t-lg text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 shadow-md transition-colors"
          >
            {isCinemaMode ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mostrar Controles 3D</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modo Inmersivo</span>
              </>
            )}
          </button>

          {/* Barra de controles principal */}
          {!isCinemaMode && (
            <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-200">
              {/* Presets de Cámara */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => applyCameraPreset('iso')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    cameraPreset === 'iso'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Perspectiva
                </button>
                <button
                  onClick={() => applyCameraPreset('cenital')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    cameraPreset === 'cenital'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cenital (Plano)
                </button>
                <button
                  onClick={() => applyCameraPreset('eye')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    cameraPreset === 'eye'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ojos (1.65m)
                </button>
                <button
                  onClick={() => applyCameraPreset('tablero')}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    cameraPreset === 'tablero'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tablero
                </button>
              </div>

              {/* Indicador de ayuda táctil / mouse */}
              <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 border-l border-slate-800 pl-3 font-mono">
                <span>🖱️ Arrastra para girar • Rueda para zoom • Toca llaves para encender</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
