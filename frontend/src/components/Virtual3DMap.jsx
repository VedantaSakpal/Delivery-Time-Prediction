import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  getRestaurantVirtualLocation,
  calculateDistanceKm,
  estimateDeliveryDurationMin,
  findNearestDistrict,
  generateVirtualAddress,
  CITY_PRESET_NEIGHBORHOODS,
  FIXED_RESTAURANT_LOCATIONS
} from '../utils/virtualCityData';
import {
  Navigation,
  Clock,
  Compass,
  Maximize2,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function Virtual3DMap({
  restaurantId,
  restaurantName,
  userLocation,
  onLocationSelect,
  height = '460px',
  prepTimeMin = 15,
  showNeighborhoodPills = true
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // Active restaurant fixed coordinates
  const restaurantLoc = useMemo(() => {
    return getRestaurantVirtualLocation(restaurantId, restaurantName);
  }, [restaurantId, restaurantName]);

  // Current selected user location (defaulting to a nearby district if none passed)
  const [currentLoc, setCurrentLoc] = useState(() => {
    if (userLocation && typeof userLocation.x === 'number') {
      return { x: userLocation.x, z: userLocation.z };
    }
    // Default to Powai Tech Park or adjacent sector offset from restaurant
    const defaultX = Math.max(-50, Math.min(50, restaurantLoc.x + 22));
    const defaultZ = Math.max(-50, Math.min(50, restaurantLoc.z + 18));
    return { x: defaultX, z: defaultZ };
  });

  const [distanceKm, setDistanceKm] = useState(() => calculateDistanceKm(restaurantLoc, currentLoc));
  const [estTimeMin, setEstTimeMin] = useState(() => estimateDeliveryDurationMin(distanceKm, prepTimeMin));
  const [nearestDistrict, setNearestDistrict] = useState(() => findNearestDistrict(currentLoc.x, currentLoc.z));
  const [cameraMode, setCameraMode] = useState('perspective'); // 'perspective' | 'topdown'

  // Live order time clock
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentHour = now.getHours();
  const timeOfDayLabel =
    currentHour >= 6 && currentHour < 12 ? 'Morning' :
    currentHour >= 12 && currentHour < 17 ? 'Afternoon' :
    currentHour >= 17 && currentHour < 22 ? 'Evening' : 'Night';

  const arrivalDate = new Date(now.getTime() + estTimeMin * 60000);
  const estimatedArrivalStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // References to dynamic 3D objects for updates inside the Three.js loop
  const userPinGroupRef = useRef(null);
  const routeLineRef = useRef(null);
  const pulseRingsRef = useRef([]);
  const movingCourierDotRef = useRef(null);
  const routeCurveRef = useRef(null);

  // Update distance, ETA, and parent callback when location changes
  const updateLocation = (newLoc) => {
    setCurrentLoc(newLoc);
    const dist = calculateDistanceKm(restaurantLoc, newLoc);
    const eta = estimateDeliveryDurationMin(dist, prepTimeMin);
    const district = findNearestDistrict(newLoc.x, newLoc.z);
    const addr = generateVirtualAddress(newLoc);

    setDistanceKm(dist);
    setEstTimeMin(eta);
    setNearestDistrict(district);

    const updatedArrival = new Date(now.getTime() + eta * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (onLocationSelect) {
      onLocationSelect({
        x: newLoc.x,
        z: newLoc.z,
        distanceKm: dist,
        estimatedTimeMin: eta,
        district: district.district,
        landmark: district.name,
        address: addr,
        orderTimeISO: now.toISOString(),
        orderTimeFormatted: currentTimeStr,
        estimatedArrivalTime: updatedArrival,
        timeOfDay: timeOfDayLabel
      });
    }
  };

  // Initial notification to parent
  useEffect(() => {
    const dist = calculateDistanceKm(restaurantLoc, currentLoc);
    const eta = estimateDeliveryDurationMin(dist, prepTimeMin);
    const district = findNearestDistrict(currentLoc.x, currentLoc.z);
    const addr = generateVirtualAddress(currentLoc);

    if (onLocationSelect) {
      onLocationSelect({
        x: currentLoc.x,
        z: currentLoc.z,
        distanceKm: dist,
        estimatedTimeMin: eta,
        district: district.district,
        landmark: district.name,
        address: addr
      });
    }
  }, [restaurantLoc]);

  // Sync external userLocation prop if it changes
  useEffect(() => {
    if (userLocation && (userLocation.x !== currentLoc.x || userLocation.z !== currentLoc.z)) {
      updateLocation({ x: userLocation.x, z: userLocation.z });
    }
  }, [userLocation]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const heightPx = container.clientHeight || 460;

    // 1. Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f141c);
    scene.fog = new THREE.FogExp2(0x0f141c, 0.0075);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 1, 450);
    camera.position.set(0, 58, 68);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.18; // Keep above ground level
    controls.minDistance = 22;
    controls.maxDistance = 140;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x475569, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe2e8f0, 1.6);
    dirLight.position.set(40, 70, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 160;
    dirLight.shadow.camera.left = -65;
    dirLight.shadow.camera.right = 65;
    dirLight.shadow.camera.top = 65;
    dirLight.shadow.camera.bottom = -65;
    scene.add(dirLight);

    // Warm secondary light
    const fillLight = new THREE.DirectionalLight(0xf59e0b, 0.45);
    fillLight.position.set(-40, 30, -30);
    scene.add(fillLight);

    // 6. Ground & Road Network
    // Base Ground Plane
    const groundGeo = new THREE.PlaneGeometry(150, 150);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x141a24,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // City Grid Floor Lines
    const gridHelper = new THREE.GridHelper(140, 28, 0x334155, 0x1e293b);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // Major Cross Avenues (Dual-lane asphalt with glow borders)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e2533, roughness: 0.8 });
    const roadLinesMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.55 });
    const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.7 });

    const createAvenue = (w, l, x, z, rotY = 0) => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(w, l), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.rotation.z = rotY;
      road.position.set(x, 0.08, z);
      road.receiveShadow = true;
      scene.add(road);

      // Center Divider Dashes
      const dividerGeo = new THREE.PlaneGeometry(0.3, l * 0.95);
      const divider = new THREE.Mesh(dividerGeo, roadLinesMat);
      divider.rotation.x = -Math.PI / 2;
      divider.rotation.z = rotY;
      divider.position.set(x, 0.11, z);
      scene.add(divider);
    };

    createAvenue(8, 140, 0, 0, 0); // North-South Main Spine
    createAvenue(8, 140, 0, 0, Math.PI / 2); // East-West Main Spine
    createAvenue(6, 140, -30, 0, 0);
    createAvenue(6, 140, 30, 0, 0);
    createAvenue(6, 140, 0, -30, Math.PI / 2);
    createAvenue(6, 140, 0, 30, Math.PI / 2);

    // Green Park Districts
    const parkMat = new THREE.MeshStandardMaterial({ color: 0x132e22, roughness: 0.9 });
    const createPark = (x, z, w, d) => {
      const park = new THREE.Mesh(new THREE.PlaneGeometry(w, d), parkMat);
      park.rotation.x = -Math.PI / 2;
      park.position.set(x, 0.09, z);
      park.receiveShadow = true;
      scene.add(park);

      // Low-poly park trees
      for (let i = 0; i < 4; i++) {
        const tx = x + (Math.random() - 0.5) * (w * 0.7);
        const tz = z + (Math.random() - 0.5) * (d * 0.7);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 6), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
        trunk.position.set(tx, 1, tz);
        scene.add(trunk);
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.2, 7), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }));
        foliage.position.set(tx, 3.2, tz);
        foliage.castShadow = true;
        scene.add(foliage);
      }
    };

    createPark(26, 24, 16, 16);
    createPark(-42, 24, 14, 14);

    // 7. 3D Procedural Buildings (Arranged in city blocks)
    const buildingPalette = [
      new THREE.MeshStandardMaterial({ color: 0x1e2738, roughness: 0.7, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x243044, roughness: 0.6, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x1c222e, roughness: 0.8, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x2b384e, roughness: 0.5, metalness: 0.35 })
    ];
    const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Seeded procedural generator for blocks
    const blockCenters = [
      // Quadrant 1
      { x: -16, z: -16 }, { x: -45, z: -16 }, { x: -16, z: -45 }, { x: -45, z: -45 },
      // Quadrant 2
      { x: 16, z: -16 }, { x: 45, z: -16 }, { x: 16, z: -45 }, { x: 45, z: -45 },
      // Quadrant 3
      { x: -16, z: 16 }, { x: -45, z: 16 }, { x: -16, z: 45 }, { x: -45, z: 45 },
      // Quadrant 4
      { x: 16, z: 16 }, { x: 45, z: 16 }, { x: 16, z: 45 }, { x: 45, z: 45 }
    ];

    blockCenters.forEach((block, bIdx) => {
      // 4 buildings per block
      const offsets = [
        { dx: -5, dz: -5 },
        { dx: 5, dz: -5 },
        { dx: -5, dz: 5 },
        { dx: 5, dz: 5 }
      ];

      offsets.forEach((off, oIdx) => {
        const bx = block.x + off.dx;
        const bz = block.z + off.dz;

        // Skip building placement if close to registered restaurant
        let isRestaurantSpot = false;
        Object.values(FIXED_RESTAURANT_LOCATIONS).forEach((rLoc) => {
          if (Math.hypot(bx - rLoc.x, bz - rLoc.z) < 6.5) {
            isRestaurantSpot = true;
          }
        });
        if (isRestaurantSpot) return;

        const bw = 5 + (bIdx % 3);
        const bd = 5 + (oIdx % 3);
        const bh = 8 + ((bIdx * 7 + oIdx * 11) % 20);

        const bGeo = new THREE.BoxGeometry(bw, bh, bd);
        const bMat = buildingPalette[(bIdx + oIdx) % buildingPalette.length];
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(bx, bh / 2, bz);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);

        // Rooftop feature: antenna with blinking tip or helipad
        if (bh > 18) {
          const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
          );
          antenna.position.set(bx, bh + 2, bz);
          scene.add(antenna);

          const beaconTip = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xef4444 })
          );
          beaconTip.position.set(bx, bh + 4, bz);
          scene.add(beaconTip);
        } else if (bh > 12 && (bIdx + oIdx) % 3 === 0) {
          const helipad = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 0.2, 16),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
          );
          helipad.position.set(bx, bh + 0.1, bz);
          scene.add(helipad);
        }

        // Glowing Window Stripes
        const windowGeo = new THREE.PlaneGeometry(bw * 0.8, 0.4);
        for (let floor = 3; floor < bh - 2; floor += 3.5) {
          const win = new THREE.Mesh(windowGeo, (floor + bIdx) % 2 === 0 ? windowGlowMat : cyanGlowMat);
          win.position.set(bx, floor, bz + bd / 2 + 0.05);
          scene.add(win);
        }
      });
    });

    // 8. Registered Restaurant 3D Markers
    const pulseRings = [];
    Object.entries(FIXED_RESTAURANT_LOCATIONS).forEach(([id, rLoc]) => {
      const isSelected = id === restaurantId || rLoc.name === restaurantLoc.name;

      const group = new THREE.Group();
      group.position.set(rLoc.x, 0, rLoc.z);

      // Base cylinder
      const baseGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.5, 24);
      const baseMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xd97706 : 0x334155,
        roughness: 0.4,
        metalness: 0.6
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.25;
      base.receiveShadow = true;
      group.add(base);

      // 3D Culinary Beacon
      const beaconGeo = new THREE.OctahedronGeometry(isSelected ? 2.2 : 1.4, 0);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xf59e0b : 0xea580c,
        emissive: isSelected ? 0xf59e0b : 0x7c2d12,
        emissiveIntensity: isSelected ? 0.9 : 0.4,
        roughness: 0.2,
        metalness: 0.8
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = isSelected ? 5.5 : 3.8;
      beacon.castShadow = true;
      group.add(beacon);

      // Rotating stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, isSelected ? 5 : 3.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
      );
      stem.position.y = (isSelected ? 5 : 3.5) / 2;
      group.add(stem);

      // If active restaurant, add vertical light beam & pulsing ring
      if (isSelected) {
        // Vertical beam
        const beamGeo = new THREE.CylinderGeometry(0.8, 3.2, 45, 16, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = 22.5;
        group.add(beam);

        // Ground Pulsing Ring
        const ringGeo = new THREE.RingGeometry(3.8, 4.8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.15;
        group.add(ring);
        pulseRings.push(ring);
      }

      scene.add(group);
    });
    pulseRingsRef.current = pulseRings;

    // 9. User Delivery Drop-off 3D Pin (Emerald)
    const userPinGroup = new THREE.Group();
    userPinGroup.position.set(currentLoc.x, 0, currentLoc.z);

    // Drop Pin Cone
    const pinConeGeo = new THREE.ConeGeometry(1.6, 4.5, 16);
    pinConeGeo.rotateX(Math.PI); // Point down
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.7
    });
    const pinCone = new THREE.Mesh(pinConeGeo, pinMat);
    pinCone.position.y = 4.2;
    pinCone.castShadow = true;
    userPinGroup.add(pinCone);

    // Glowing Sphere Cap
    const pinSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.9
      })
    );
    pinSphere.position.y = 6.4;
    userPinGroup.add(pinSphere);

    // Ground Target Circle
    const targetRingGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.y = 0.16;
    userPinGroup.add(targetRing);
    pulseRings.push(targetRing);

    scene.add(userPinGroup);
    userPinGroupRef.current = userPinGroup;

    // 10. Delivery Route 3D Trajectory & Courier Pulse Dot
    const updateRouteCurve = (startPos, endPos) => {
      // Remove old route line
      if (routeLineRef.current) {
        scene.remove(routeLineRef.current);
        routeLineRef.current.geometry.dispose();
      }

      // 3D Parabolic Arc over the city
      const midX = (startPos.x + endPos.x) / 2;
      const midZ = (startPos.z + endPos.z) / 2;
      const dist = Math.hypot(startPos.x - endPos.x, startPos.z - endPos.z);
      const arcHeight = Math.min(22, Math.max(8, dist * 0.28));

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startPos.x, 2.5, startPos.z),
        new THREE.Vector3(midX, arcHeight, midZ),
        new THREE.Vector3(endPos.x, 2.0, endPos.z)
      ]);
      routeCurveRef.current = curve;

      const points = curve.getPoints(60);
      const routeGeo = new THREE.BufferGeometry().setFromPoints(points);

      const routeMat = new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        dashSize: 1.8,
        gapSize: 1.2,
        linewidth: 3,
        transparent: true,
        opacity: 0.95
      });

      const line = new THREE.Line(routeGeo, routeMat);
      line.computeLineDistances();
      scene.add(line);
      routeLineRef.current = line;

      // Moving Courier Dot
      if (!movingCourierDotRef.current) {
        const dotGeo = new THREE.SphereGeometry(0.85, 16, 16);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        scene.add(dot);
        movingCourierDotRef.current = dot;
      }
    };

    updateRouteCurve(restaurantLoc, currentLoc);

    // 11. Raycaster for Interactive Click on Ground
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let isDragging = false;
    let downCoord = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      downCoord = { x: e.clientX, y: e.clientY };
      isDragging = false;
    };

    const onPointerMove = (e) => {
      if (Math.hypot(e.clientX - downCoord.x, e.clientY - downCoord.y) > 5) {
        isDragging = true;
      }
    };

    const onPointerUp = (e) => {
      if (isDragging) return; // Ignore drag rotations

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(ground);

      if (intersects.length > 0) {
        const hit = intersects[0].point;
        // Clamp to city perimeter
        const cx = Math.max(-52, Math.min(52, hit.x));
        const cz = Math.max(-52, Math.min(52, hit.z));

        const target = { x: Math.round(cx * 10) / 10, z: Math.round(cz * 10) / 10 };
        updateLocation(target);

        // Move 3D user pin
        if (userPinGroupRef.current) {
          userPinGroupRef.current.position.set(target.x, 0, target.z);
        }
        updateRouteCurve(restaurantLoc, target);
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerup', onPointerUp);

    // 12. Animation Loop
    const startTime = performance.now();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Animate pulsing rings
      pulseRingsRef.current.forEach((r, idx) => {
        const scale = 1 + (Math.sin(elapsedTime * 3 + idx) + 1) * 0.35;
        r.scale.set(scale, scale, 1);
      });

      // Animate user drop pin bobbing
      if (userPinGroupRef.current) {
        userPinGroupRef.current.children[0].position.y = 4.2 + Math.sin(elapsedTime * 4) * 0.4;
        userPinGroupRef.current.children[1].position.y = 6.4 + Math.sin(elapsedTime * 4) * 0.4;
      }

      // Animate moving courier pulse dot along the route
      if (routeCurveRef.current && movingCourierDotRef.current) {
        const t = (elapsedTime * 0.35) % 1;
        const pos = routeCurveRef.current.getPointAt(t);
        movingCourierDotRef.current.position.copy(pos);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 13. Responsive Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 460;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
      if (container && domEl) {
        container.removeChild(domEl);
      }
    };
  }, [restaurantLoc]);

  // Synchronize 3D user pin and route if currentLoc changes externally
  useEffect(() => {
    if (userPinGroupRef.current) {
      userPinGroupRef.current.position.set(currentLoc.x, 0, currentLoc.z);
    }
    if (sceneRef.current && routeLineRef.current) {
      sceneRef.current.remove(routeLineRef.current);
      const midX = (restaurantLoc.x + currentLoc.x) / 2;
      const midZ = (restaurantLoc.z + currentLoc.z) / 2;
      const dist = Math.hypot(restaurantLoc.x - currentLoc.x, restaurantLoc.z - currentLoc.z);
      const arcHeight = Math.min(22, Math.max(8, dist * 0.28));

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(restaurantLoc.x, 2.5, restaurantLoc.z),
        new THREE.Vector3(midX, arcHeight, midZ),
        new THREE.Vector3(currentLoc.x, 2.0, currentLoc.z)
      ]);
      routeCurveRef.current = curve;

      const points = curve.getPoints(60);
      const routeGeo = new THREE.BufferGeometry().setFromPoints(points);
      const routeMat = new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        dashSize: 1.8,
        gapSize: 1.2,
        linewidth: 3,
        transparent: true,
        opacity: 0.95
      });
      const line = new THREE.Line(routeGeo, routeMat);
      line.computeLineDistances();
      sceneRef.current.add(line);
      routeLineRef.current = line;
    }
  }, [currentLoc, restaurantLoc]);

  // Camera preset actions
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 58, 68);
    controlsRef.current.target.set(0, 2, 0);
    controlsRef.current.update();
    setCameraMode('perspective');
  };

  const setTopDownView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 95, 0.1);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    setCameraMode('topdown');
  };

  const focusOnRoute = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const midX = (restaurantLoc.x + currentLoc.x) / 2;
    const midZ = (restaurantLoc.z + currentLoc.z) / 2;
    controlsRef.current.target.set(midX, 2, midZ);
    cameraRef.current.position.set(midX, 42, midZ + 45);
    controlsRef.current.update();
    setCameraMode('perspective');
  };

  return (
    <div className="space-y-3">
      {/* 3D Map Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#ECE4D8]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-600">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#191411] flex items-center gap-1.5">
              Interactive 3D Virtual City Map
              <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold rounded-full">
                Active Transit Grid
              </span>
            </h4>
            <p className="text-[11px] text-[#6E6157]">
              Click anywhere in the 3D city to pinpoint your delivery drop-off location
            </p>
          </div>
        </div>

        {/* Real-time distance, current order time, and estimated arrival HUD */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 bg-white border border-[#ECE4D8] rounded-xl shadow-xs text-right">
            <p className="text-[9px] uppercase font-bold text-[#938376] tracking-wider">Order Time ({timeOfDayLabel})</p>
            <p className="text-sm font-black text-slate-800 flex items-center justify-end gap-1">
              <Clock size={13} className="text-amber-500" />
              {currentTimeStr}
            </p>
          </div>

          <div className="px-3 py-1.5 bg-white border border-[#ECE4D8] rounded-xl shadow-xs text-right">
            <p className="text-[9px] uppercase font-bold text-[#938376] tracking-wider">Transit Distance</p>
            <p className="text-sm font-black text-orange-600 flex items-center justify-end gap-1">
              <Navigation size={13} className="text-orange-500 fill-orange-500" />
              {distanceKm} km
            </p>
          </div>

          <div className="px-3 py-1.5 bg-white border border-[#ECE4D8] rounded-xl shadow-xs text-right">
            <p className="text-[9px] uppercase font-bold text-[#938376] tracking-wider">Est. Arrival ({estTimeMin}m)</p>
            <p className="text-sm font-black text-emerald-600 flex items-center justify-end gap-1">
              <Sparkles size={13} />
              ~{estimatedArrivalStr}
            </p>
          </div>
        </div>
      </div>

      {/* Three.js 3D WebGL Canvas Container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-[#1e2533] shadow-lg bg-[#0f141c] select-none"
        style={{ height }}
      >
        <div ref={mountRef} className="w-full h-full cursor-crosshair" />

        {/* Top-Left Floating Route Card */}
        <div className="absolute top-3 left-3 bg-[#0f141c]/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/60 text-white shadow-xl max-w-xs space-y-1.5 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] font-bold text-amber-300">
              Pickup Hub: {restaurantLoc.name || 'Restaurant'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {restaurantLoc.district} · {restaurantLoc.landmark}
          </p>
          <div className="pt-1 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
            <MapPin size={12} className="text-emerald-400 shrink-0" />
            Drop-off: {nearestDistrict.name}
          </div>
        </div>

        {/* Top-Right Camera Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-[#0f141c]/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
          <button
            type="button"
            onClick={resetCamera}
            title="Reset Perspective 3D View"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={setTopDownView}
            title="Top-Down 2.5D Architectural View"
            className={`p-2 rounded-lg transition-colors ${
              cameraMode === 'topdown' ? 'bg-orange-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass size={15} />
          </button>
          <button
            type="button"
            onClick={focusOnRoute}
            title="Fit Route in Frame"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Maximize2 size={15} />
          </button>
        </div>

        {/* Bottom Instruction Bar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#0f141c]/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/60 text-white shadow-xl pointer-events-none flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-medium text-[11px]">
            Drag to rotate 3D view · Click anywhere to place delivery pin
          </span>
        </div>
      </div>

      {/* Preset Neighborhood Quick-Pills */}
      {showNeighborhoodPills && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-[#6E6157]">
            <span className="font-bold flex items-center gap-1">
              <Sparkles size={13} className="text-orange-600" />
              Quick Pick Neighborhood:
            </span>
            <span className="text-[11px] text-[#938376]">1-Click Delivery Pin</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CITY_PRESET_NEIGHBORHOODS.map((hood, idx) => {
              const isSelected =
                Math.hypot(currentLoc.x - hood.x, currentLoc.z - hood.z) < 5;
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => updateLocation({ x: hood.x, z: hood.z })}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-[#4A3C34] border-[#ECE4D8] hover:border-orange-300 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span>{hood.icon}</span>
                  <span>{hood.name}</span>
                  {isSelected && <CheckCircle2 size={12} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
