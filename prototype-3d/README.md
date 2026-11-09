# Protótipo 3D — Capivara: O Segredo das Duas Eras

Esta pasta inicia a reconstrução 3D de forma isolada. A versão Canvas 2D que está na raiz do site continua intacta; este protótipo ainda não substitui nem é servido pelo Cloudflare Pages.

## Sistema de câmera

`src/camera/CameraDirector.js` fornece quatro modos:

- `free`: órbita livre de 360°.
- `thirdPerson`: câmera de acompanhamento em terceira pessoa.
- `cinematic`: órbita automática para cenas especiais.
- `close`: câmera próxima para observar detalhes.

### Dependências

- Three.js com suporte a ES Modules.
- `OrbitControls` de `three/addons/controls/OrbitControls.js`.

### Integração mínima

```js
import * as THREE from 'three';
import { CameraDirector } from './camera/CameraDirector.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// player deve ser um THREE.Object3D já adicionado à cena.
const cameraDirector = new CameraDirector({
  camera,
  domElement: renderer.domElement,
  scene,
  target: player,
  collisionObjects: obstacles
});

// Troca de modo sem reiniciar a fase:
cameraDirector.setMode('free');       // 'free' | 'thirdPerson' | 'cinematic' | 'close'
cameraDirector.setSensitivity(0.9);
cameraDirector.setDistance(8);
cameraDirector.setHeight(3);

// No loop principal:
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  // Atualize física e posição do player antes da câmera.
  cameraDirector.update(delta);
  renderer.render(scene, camera);
}
animate();

// Ao desmontar a cena:
cameraDirector.dispose();
```

OrbitControls trata rotação por mouse/toque e zoom por roda/pinça nos dispositivos compatíveis. As preferências de modo, sensibilidade, distância e altura são salvas em localStorage. Informe em `collisionObjects` os objetos sólidos que devem impedir a câmera de atravessar o cenário.

## Estado atual e limites

Este commit adiciona o módulo de câmera e sua documentação. O repositório ainda contém o jogo 2D Canvas na raiz; não há ainda cena 3D, personagem GLB, colisores de mundo ou integração do módulo ao loop do jogo. É necessário construir essa cena e conectar o módulo antes de chamar a experiência de jogo 3D.
