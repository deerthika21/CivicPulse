import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/* ------------------------------------------------------------------
   CityScene — a particle map of Chennai; complaint pins send light
   streams into a pulsing AI core, which routes priority-coloured
   streams to 10 department nodes on an arc.
   Everything dynamic is drawn in a handful of draw calls.
------------------------------------------------------------------- */

type Variant = 'hero' | 'core';

const PRIORITY_COLORS = ['#dc2626', '#f97316', '#f59e0b', '#0ea5e9', '#94a3b8'].map((c) => new THREE.Color(c));
const INBOUND = new THREE.Color('#7dd3fc');

/** Neighbourhood centres (lat, lng) → map plane (x east, z south). */
const AREAS: [number, number][] = [
  [13.0418, 80.2341], [13.0067, 80.257], [12.9815, 80.218], [13.085, 80.2101], [13.0339, 80.2619],
  [12.9249, 80.1], [13.0382, 80.1565], [13.0067, 80.2206], [13.0521, 80.2255], [13.121, 80.2329],
  [13.0544, 80.264], [13.0213, 80.2231], [13.0569, 80.2425], [13.0732, 80.2609], [12.901, 80.2279],
  [12.9986, 80.2665], [12.9516, 80.1462], [13.126, 80.288], [13.0359, 80.2122], [13.1076, 80.2063],
];
const project = (lat: number, lng: number) => new THREE.Vector3((lng - 80.2) * 21, 0, -(lat - 13.02) * 21);
const coastX = (z: number) => 1.95 + 0.12 * Math.sin(z * 1.7) - z * 0.05;

/** Seeded RNG so the map looks identical on every load (no visual jitter between renders). */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- particle map ---------------- */
function CityMap({ count }: { count: number }) {
  const { positions, colors } = useMemo(() => {
    const r = rng(42);
    const pos: number[] = [];
    const col: number[] = [];
    const a = new THREE.Color('#4f46e5');
    const b = new THREE.Color('#14b8a6');
    const centres = AREAS.map(([lat, lng]) => project(lat, lng));
    let i = 0;
    while (i < count) {
      let x: number;
      let z: number;
      if (r() < 0.6) {
        const c = centres[Math.floor(r() * centres.length)];
        const ang = r() * Math.PI * 2;
        const rad = Math.sqrt(-2 * Math.log(r() + 1e-6)) * 0.32;
        x = c.x + Math.cos(ang) * rad;
        z = c.z + Math.sin(ang) * rad;
      } else {
        x = -2.7 + r() * 5;
        z = -2.9 + r() * 5.8;
      }
      if (x > coastX(z) || Math.abs(z) > 3 || x < -2.8) continue;
      pos.push(x, (r() - 0.5) * 0.04, z);
      const mix = new THREE.Color().lerpColors(a, b, r());
      const bright = 0.35 + r() * 0.65;
      col.push(mix.r * bright, mix.g * bright, mix.b * bright);
      i++;
    }
    return { positions: new Float32Array(pos), colors: new Float32Array(col) };
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.028} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ---------------- streams (packets with trails) ---------------- */
interface Packet {
  curve: THREE.QuadraticBezierCurve3;
  t: number;
  speed: number;
  color: THREE.Color;
  kind: 'in' | 'out';
  active: boolean;
}

const TRAIL = 9;

function Streams({
  pins,
  core,
  nodes,
  max,
  spawnEvery,
  onCoreHit,
  onPinFire,
}: {
  pins: THREE.Vector3[];
  core: THREE.Vector3;
  nodes: THREE.Vector3[];
  max: number;
  spawnEvery: number;
  onCoreHit: () => void;
  onPinFire: (i: number) => void;
}) {
  const geom = useRef<THREE.BufferGeometry>(null);
  const tex = useMemo(glowTexture, []);
  const packets = useMemo<Packet[]>(() => Array.from({ length: max }, () => ({ curve: new THREE.QuadraticBezierCurve3(), t: 0, speed: 0, color: new THREE.Color(), kind: 'in', active: false })), [max]);
  const buffers = useMemo(() => ({ pos: new Float32Array(max * TRAIL * 3), col: new Float32Array(max * TRAIL * 3) }), [max]);
  const timer = useRef(0);
  const r = useMemo(() => rng(7), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const launch = (from: THREE.Vector3, to: THREE.Vector3, color: THREE.Color, kind: Packet['kind'], lift: number) => {
    const p = packets.find((x) => !x.active);
    if (!p) return;
    const mid = from.clone().lerp(to, 0.5);
    mid.y += lift;
    p.curve.v0.copy(from);
    p.curve.v1.copy(mid);
    p.curve.v2.copy(to);
    p.t = 0;
    p.speed = 0.35 + r() * 0.25;
    p.color.copy(color);
    p.kind = kind;
    p.active = true;
  };

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    timer.current += dt;
    if (timer.current > spawnEvery) {
      timer.current = 0;
      const i = Math.floor(r() * pins.length);
      onPinFire(i);
      launch(pins[i].clone().setY(0.28), core, INBOUND, 'in', 0.9);
    }
    for (let k = 0; k < packets.length; k++) {
      const p = packets[k];
      if (p.active) {
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.active = false;
          if (p.kind === 'in') {
            onCoreHit();
            launch(core, nodes[Math.floor(r() * nodes.length)], PRIORITY_COLORS[Math.floor(r() * PRIORITY_COLORS.length)], 'out', 0.5);
          }
        }
      }
      for (let j = 0; j < TRAIL; j++) {
        const idx = (k * TRAIL + j) * 3;
        const tt = p.t - j * 0.018;
        if (!p.active || tt < 0) {
          buffers.pos[idx + 1] = -999; // park off-screen
          continue;
        }
        p.curve.getPoint(Math.min(tt, 1), tmp);
        buffers.pos[idx] = tmp.x;
        buffers.pos[idx + 1] = tmp.y;
        buffers.pos[idx + 2] = tmp.z;
        const fade = 1 - j / TRAIL;
        buffers.col[idx] = p.color.r * fade;
        buffers.col[idx + 1] = p.color.g * fade;
        buffers.col[idx + 2] = p.color.b * fade;
      }
    }
    if (geom.current) {
      geom.current.attributes.position.needsUpdate = true;
      geom.current.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geom}>
        <bufferAttribute attach="attributes-position" args={[buffers.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[buffers.col, 3]} />
      </bufferGeometry>
      <pointsMaterial map={tex} size={0.13} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

/* ---------------- AI core ---------------- */
function Core({ position, pulse }: { position: THREE.Vector3; pulse: React.MutableRefObject<number> }) {
  const tex = useMemo(glowTexture, []);
  const halo = useRef<THREE.Sprite>(null);
  const shell = useRef<THREE.Mesh>(null);
  const shell2 = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, dt) => {
    pulse.current = Math.max(0, pulse.current - dt * 2.2);
    const t = clock.elapsedTime;
    const s = 1.9 + Math.sin(t * 2) * 0.12 + pulse.current * 0.9;
    halo.current?.scale.set(s, s, 1);
    if (shell.current) {
      shell.current.rotation.y = t * 0.35;
      shell.current.rotation.x = t * 0.15;
    }
    if (shell2.current) shell2.current.rotation.y = -t * 0.22;
  });
  return (
    <group position={position}>
      <sprite ref={halo}>
        <spriteMaterial map={tex} color="#6366f1" transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[0.9, 0.9, 1]}>
        <spriteMaterial map={tex} color="#c7d2fe" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshBasicMaterial color="#312e81" />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[0.44, 1]} />
        <meshBasicMaterial color="#2dd4bf" wireframe transparent opacity={0.35} />
      </mesh>
      <mesh ref={shell2} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.62, 0.006, 8, 96]} />
        <meshBasicMaterial color="#e6c868" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/* ---------------- department nodes ---------------- */
function DepartmentNodes({ nodes }: { nodes: THREE.Vector3[] }) {
  const tex = useMemo(glowTexture, []);
  const arc = useMemo(() => new THREE.CatmullRomCurve3(nodes).getPoints(80), [nodes]);
  const arcGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(arc), [arc]);
  return (
    <group>
      <line>
        <primitive object={arcGeom} attach="geometry" />
        <lineBasicMaterial color="#e6c868" transparent opacity={0.25} />
      </line>
      {nodes.map((p, i) => (
        <group key={i} position={p}>
          <sprite scale={[0.42, 0.42, 1]}>
            <spriteMaterial map={tex} color="#e6c868" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <mesh>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshBasicMaterial color="#fde68a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------------- complaint pins ---------------- */
function Pins({ pins, fire }: { pins: THREE.Vector3[]; fire: React.MutableRefObject<Float32Array> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dt) => {
    if (!mesh.current) return;
    for (let i = 0; i < pins.length; i++) {
      fire.current[i] = Math.max(0, fire.current[i] - dt * 1.4);
      const h = fire.current[i];
      dummy.position.set(pins[i].x, 0.06 + h * 0.3, pins[i].z);
      dummy.scale.setScalar(0.9 + h * 0.8);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, pins.length]}>
      <octahedronGeometry args={[0.05, 0]} />
      <meshBasicMaterial color="#99f6e4" />
    </instancedMesh>
  );
}

/* ---------------- camera rig: slow sway + mouse parallax ---------------- */
function Rig({ base, look }: { base: THREE.Vector3; look: THREE.Vector3 }) {
  const { camera, pointer } = useThree();
  const world = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    camera.position.x += (base.x + pointer.x * 0.45 - camera.position.x) * 0.04;
    camera.position.y += (base.y + pointer.y * 0.25 - camera.position.y) * 0.04;
    camera.lookAt(look);
    if (world.current) world.current.rotation.y = Math.sin(clock.elapsedTime * 0.07) * 0.28;
  });
  return <group ref={world} />;
}

function World({ variant, offsetX }: { variant: Variant; offsetX: number }) {
  const hero = variant === 'hero';
  const pins = useMemo(() => (hero ? AREAS.map(([lat, lng]) => project(lat, lng)) : Array.from({ length: 14 }, (_, i) => new THREE.Vector3(Math.cos((i / 14) * Math.PI * 2) * 2.2, 0, Math.sin((i / 14) * Math.PI * 2) * 1.2))), [hero]);
  const core = useMemo(() => new THREE.Vector3(0, hero ? 1.55 : 1.2, -0.2), [hero]);
  const nodes = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = -1.25 + (i / 9) * 2.5;
        return new THREE.Vector3(Math.sin(a) * 2.9, core.y + 0.25 + Math.cos(a) * 1.05, -1.6);
      }),
    [core],
  );
  const pulse = useRef(0);
  const fire = useRef(new Float32Array(pins.length));
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.07) * 0.28;
  });

  return (
    <>
      <Rig base={hero ? new THREE.Vector3(offsetX * 0.35, 2.7, 6.4) : new THREE.Vector3(0, 1.9, 6.9)} look={new THREE.Vector3(offsetX * 0.35, hero ? 0.9 : 1.1, 0)} />
      <group ref={group} position={[offsetX, 0, 0]} rotation={[hero ? -0.06 : 0, 0, 0]}>
        {hero && <CityMap count={2600} />}
        <Pins pins={pins} fire={fire} />
        <Core position={core} pulse={pulse} />
        <DepartmentNodes nodes={nodes} />
        <Streams
          pins={pins}
          core={core}
          nodes={nodes}
          max={hero ? 36 : 18}
          spawnEvery={hero ? 0.32 : 0.6}
          onCoreHit={() => (pulse.current = Math.min(1, pulse.current + 0.45))}
          onPinFire={(i) => (fire.current[i] = 1)}
        />
      </group>
    </>
  );
}

/** Pauses rendering whenever the canvas is off-screen. */
export default function CityScene({ variant = 'hero', className }: { variant?: Variant; className?: string }) {
  const [offsetX, setOffsetX] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const set = () => setOffsetX(variant === 'hero' && mq.matches ? 2.15 : 0);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, [variant]);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [0, 2.7, 6.4], fov: variant === 'hero' ? 42 : 46, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <World variant={variant} offsetX={offsetX} />
      </Canvas>
    </div>
  );
}
