import {
  CircleGeometry,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  TorusKnotGeometry,
} from 'three';

export interface ExampleModel {
  group: Group;
  update(elapsedTime: number): void;
}

export function createExampleModel(): ExampleModel {
  const group = new Group();

  const pedestal = new Mesh(
    new CylinderGeometry(1.95, 2.25, 0.6, 64),
    new MeshStandardMaterial({
      color: new Color('#8f745d'),
      metalness: 0.12,
      roughness: 0.84,
    })
  );
  pedestal.position.y = 0.3;
  group.add(pedestal);

  const assembly = new Group();
  assembly.position.y = 1.7;
  group.add(assembly);

  const bodyGeometry = new TorusKnotGeometry(1.14, 0.33, 240, 36);
  const body = new Mesh(
    bodyGeometry,
    new MeshPhysicalMaterial({
      color: new Color('#d36e4a'),
      roughness: 0.26,
      metalness: 0.34,
      clearcoat: 0.72,
      clearcoatRoughness: 0.14,
    })
  );
  assembly.add(body);

  const edgeOverlay = new LineSegments(
    new EdgesGeometry(bodyGeometry, 28),
    new LineBasicMaterial({
      color: new Color('#2f2118'),
      opacity: 0.28,
      transparent: true,
    })
  );
  assembly.add(edgeOverlay);

  const slicePlane = new Mesh(
    new CircleGeometry(1.85, 64),
    new MeshBasicMaterial({
      color: new Color('#ffb26e'),
      opacity: 0.16,
      transparent: true,
    })
  );
  slicePlane.position.y = assembly.position.y;
  slicePlane.rotation.x = -Math.PI / 2;
  group.add(slicePlane);

  return {
    group,
    update(elapsedTime: number): void {
      assembly.rotation.y = elapsedTime * 0.3;
      assembly.rotation.x = Math.sin(elapsedTime * 0.45) * 0.14;
      slicePlane.position.y = 1.7 + Math.sin(elapsedTime * 0.85) * 0.52;
    },
  };
}
