import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { decryptFile } from "./decrypt";

/** Loads the (encrypted) developer character and prepares it for rendering. */
const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loadCharacter = async (): Promise<GLTF> => {
    const dracoLoader = new DRACOLoader().setDecoderPath("/draco/");
    const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
    const decrypted = await decryptFile("/models/character.enc", "Character3D#@");
    const blobUrl = URL.createObjectURL(new Blob([decrypted]));
    try {
      const gltf = await loader.loadAsync(blobUrl);
      const character = gltf.scene;
      character.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = true;
      });
      // feet sit on the floor plane of the scene
      const footR = character.getObjectByName("footR") || character.getObjectByName("foot.R");
      if (footR) footR.position.y = 3.36;
      const footL = character.getObjectByName("footL") || character.getObjectByName("foot.L");
      if (footL) footL.position.y = 3.36;
      renderer.compile(character, camera, scene);
      return gltf;
    } finally {
      URL.revokeObjectURL(blobUrl);
      dracoLoader.dispose();
    }
  };

  return { loadCharacter };
};

export default setCharacter;
