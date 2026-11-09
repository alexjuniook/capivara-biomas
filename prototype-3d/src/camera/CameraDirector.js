import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEFAULTS = {
  mode: 'thirdPerson',
  sensitivity: 0.85,
  distance: 7.5,
  height: 2.7,
  minDistance: 2.2,
  maxDistance: 18,
  collisionPadding: 0.35,
  transitionSpeed: 7,
  cinematicSpeed: 0.22,
  closeDistance: 3.1,
  closeHeight: 1.65
};

const MODES = new Set(['free', 'thirdPerson', 'cinematic', 'close']);

export class CameraDirector {
  constructor({
    camera,
    domElement,
    scene,
    target,
    collisionObjects = [],
    settingsKey = 'capivara-camera-settings',
    settings = {}
  }) {
    if (!camera?.isPerspectiveCamera) throw new Error('CameraDirector precisa de uma THREE.PerspectiveCamera.');
    if (!domElement) throw new Error('Informe o elemento de renderização para os controles.');
    if (!scene?.isScene) throw new Error('Informe a cena Three.js.');
    if (!target) throw new Error('Informe o personagem/objeto seguido pela câmera.');

    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;
    this.target = target;
    this.collisionObjects = collisionObjects;
    this.settingsKey = settingsKey;
    this.settings = { ...DEFAULTS, ...this.#loadSettings(), ...settings };
    this.mode = MODES.has(this.settings.mode) ? this.settings.mode : DEFAULTS.mode;
    this.lookTarget = new THREE.Vector3();
    this.desiredPosition = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.worldUp = new THREE.Vector3(0, 1, 0);
    this.direction = new THREE.Vector3();
    this.cinematicAngle = 0;
    this.disposed = false;

    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.rotateSpeed = this.settings.sensitivity;
    this.controls.zoomSpeed = 0.85;
    this.controls.panSpeed = 0.55;
    this.controls.enablePan = this.mode === 'free';
    this.controls.minDistance = this.settings.minDistance;
    this.controls.maxDistance = this.settings.maxDistance;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.copy(this.#getTargetPosition());
    this.#applyMode(true);
    this.#saveSettings();
  }

  #getTargetPosition() {
    const value = typeof this.target === 'function' ? this.target() : this.target;
    if (value?.isObject3D) {
      value.getWorldPosition(this.lookTarget);
      return this.lookTarget;
    }
    if (value?.isVector3) return this.lookTarget.copy(value);
    throw new Error('O alvo da câmera deve ser um Object3D, Vector3 ou função que retorne um deles.');
  }

  #loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.settingsKey) || '{}');
    } catch {
      return {};
    }
  }

  #saveSettings() {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify({
        mode: this.mode,
        sensitivity: this.settings.sensitivity,
        distance: this.settings.distance,
        height: this.settings.height
      }));
    } catch {
      // Armazenamento pode estar indisponível em navegação privada ou ambientes restritos.
    }
  }

  #applyMode(immediate = false) {
    const target = this.#getTargetPosition();
    this.controls.target.copy(target);
    this.controls.enabled = this.mode !== 'cinematic';
    this.controls.enablePan = this.mode === 'free';
    this.controls.enableRotate = this.mode !== 'cinematic';
    this.controls.enableZoom = this.mode !== 'cinematic';

    if (this.mode === 'free') {
      this.controls.minDistance = this.settings.minDistance;
      this.controls.maxDistance = this.settings.maxDistance;
    } else if (this.mode === 'close') {
      this.controls.minDistance = 1.8;
      this.controls.maxDistance = 5.5;
      this.#setOrbitPosition(this.settings.closeDistance, this.settings.closeHeight, immediate);
    } else if (this.mode === 'thirdPerson') {
      this.controls.minDistance = 3;
      this.controls.maxDistance = 12;
      this.#setOrbitPosition(this.settings.distance, this.settings.height, immediate);
    } else if (this.mode === 'cinematic') {
      this.controls.minDistance = 5;
      this.controls.maxDistance = 12;
      this.#setOrbitPosition(this.settings.distance + 1.5, this.settings.height + 1, immediate);
    }
    this.controls.update();
  }

  #setOrbitPosition(distance, height, immediate) {
    const target = this.#getTargetPosition();
    const offset = new THREE.Vector3(0, height, distance);
    // Começa atrás do personagem; o jogador pode girar a órbita depois.
    const position = target.clone().add(offset);
    if (immediate) this.camera.position.copy(position);
    else this.desiredPosition.copy(position);
    this.controls.target.copy(target);
  }

  setMode(mode) {
    if (!MODES.has(mode)) throw new Error(`Modo de câmera inválido: ${mode}`);
    if (this.mode === mode) return;
    this.mode = mode;
    this.#applyMode(false);
    this.#saveSettings();
  }

  setSensitivity(value) {
    this.settings.sensitivity = THREE.MathUtils.clamp(Number(value) || 0.85, 0.2, 2);
    this.controls.rotateSpeed = this.settings.sensitivity;
    this.#saveSettings();
  }

  setDistance(value) {
    this.settings.distance = THREE.MathUtils.clamp(Number(value) || 7.5, 3, 18);
    if (this.mode === 'thirdPerson' || this.mode === 'cinematic') {
      this.controls.minDistance = Math.min(this.controls.minDistance, this.settings.distance);
      this.controls.maxDistance = Math.max(this.controls.maxDistance, this.settings.distance);
    }
    this.#saveSettings();
  }

  setHeight(value) {
    this.settings.height = THREE.MathUtils.clamp(Number(value) || 2.7, 0.5, 8);
    this.#saveSettings();
  }

  setCollisionObjects(objects) {
    this.collisionObjects = Array.isArray(objects) ? objects : [];
  }

  #preventCameraClipping(targetPosition) {
    if (!this.collisionObjects.length) return;
    this.direction.subVectors(this.camera.position, targetPosition);
    const distance = this.direction.length();
    if (distance <= 0.001) return;
    this.direction.normalize();
    this.raycaster.set(targetPosition, this.direction);
    this.raycaster.far = distance;
    const hits = this.raycaster.intersectObjects(this.collisionObjects, true);
    if (hits.length) {
      const safeDistance = Math.max(1.25, hits[0].distance - this.settings.collisionPadding);
      this.camera.position.copy(targetPosition).addScaledVector(this.direction, safeDistance);
    }
  }

  update(deltaSeconds = 1 / 60) {
    if (this.disposed) return;
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.05);
    const target = this.#getTargetPosition();
    const followHeight = this.mode === 'close'
      ? this.settings.closeHeight
      : this.settings.height;

    this.controls.target.lerp(
      target.clone().add(new THREE.Vector3(0, followHeight * 0.45, 0)),
      1 - Math.exp(-this.settings.transitionSpeed * delta)
    );

    if (this.mode === 'cinematic') {
      this.cinematicAngle += this.settings.cinematicSpeed * delta;
      const radius = this.settings.distance + 1.5;
      const desired = new THREE.Vector3(
        target.x + Math.sin(this.cinematicAngle) * radius,
        target.y + this.settings.height + 1,
        target.z + Math.cos(this.cinematicAngle) * radius
      );
      this.camera.position.lerp(desired, 1 - Math.exp(2.5 * delta));
      this.camera.lookAt(this.controls.target);
    } else {
      this.controls.update();
      this.#preventCameraClipping(this.controls.target);
    }
  }

  getAvailableModes() {
    return [
      { id: 'free', label: 'Livre 360°', description: 'Órbita livre ao redor do personagem' },
      { id: 'thirdPerson', label: 'Terceira pessoa', description: 'Câmera atrás do personagem' },
      { id: 'cinematic', label: 'Cinematográfica', description: 'Movimento automático para cenas especiais' },
      { id: 'close', label: 'Próxima', description: 'Enquadramento aproximado para explorar detalhes' }
    ];
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.controls.dispose();
  }
}
