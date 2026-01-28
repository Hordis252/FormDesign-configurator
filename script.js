// Nastavení scény a kamery
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  1,
  0.1,
  100000
);
camera.position.set(-10, 7, 12);

const canvas = document.getElementById("scene");
const container = document.querySelector(".model-container");

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setClearColor(0xf1f1f1, 1);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function resizeToContainer() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w > 0 && h > 0) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}
resizeToContainer();
window.addEventListener("resize", resizeToContainer);

// Ovládání
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = 1.7;
controls.minDistance = 10;
controls.maxDistance = 30;

// Světla
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(2, 10, 2);
directionalLight.castShadow = true;

// Kvalita stínů
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

// Měkké rozmazané stíny
directionalLight.shadow.radius = 10;
directionalLight.shadow.bias = -0.001;

// Hranice pro stíny
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;

scene.add(directionalLight);

// Podlaha pro stíny
const planeGeometry = new THREE.PlaneGeometry(200, 200);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.25 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -4.8;
plane.receiveShadow = true;
scene.add(plane);

// Načtení modelu
let model;
const loader = new THREE.GLTFLoader();
loader.load('cabrio_low_template_orient.glb', (gltf) => {
  model = gltf.scene;
  model.scale.set(0.015, 0.015, 0.015);
  model.position.set(0, 3, 0);

  model.traverse((child) => {
    if (child.isMesh) {
      if (child.material.map) child.material.map.encoding = THREE.sRGBEncoding;
      if (child.material.emissiveMap) child.material.emissiveMap.encoding = THREE.sRGBEncoding;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);

  setPartTexture("frame_front", "textures/dub/24DB1.jpg");
  setPartTexture("frame_side", "textures/plywood.jpg");
  setPartTexture("seat", "textures/klasik/dublin/dublin_14.jpg");
});

const textureLoader = new THREE.TextureLoader();

// Načtení envMap pro odlesky
const envLoader = new THREE.TextureLoader();
let envTexture;

envLoader.load('textures/envmap.jpg', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  envTexture = texture;
  scene.environment = envTexture;
});

// Funkce pro změnu textury
function setPartTexture(partName, textureURL) {
  if (!model) return;

  const texture = textureLoader.load(textureURL);
  texture.encoding = THREE.sRGBEncoding;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);

  if (partName === "frame_front") {
    texture.repeat.set(3, 3);
    texture.rotation = Math.PI / 2;
  }

  model.traverse((child) => {
    if (child.isMesh && child.name.toLowerCase().includes(partName.toLowerCase())) {
      // Rozlišení materiálu podle části
      let materialProps = {
        map: texture,
        side: THREE.DoubleSide,
        transparent: false,
        envMap: envTexture
      };

      if (partName.toLowerCase().includes("seat")) {
        // látka – matná, slabé odlesky
        materialProps.metalness = 0;
        materialProps.roughness = 0.85;
      } else {
        // rám / dřevo – výraznější odlesky
        materialProps.metalness = 0;
        materialProps.roughness = 0.6;
      }

      child.material = new THREE.MeshStandardMaterial(materialProps);
      child.geometry.computeVertexNormals();
      child.material.needsUpdate = true;
    }
  });
}

// Možná animace / rotace modelu
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (model) model.rotation.y += 0.00;
  renderer.render(scene, camera);
}
animate();

// Seznam textur
const seatTextures = [
  "dublin_02.jpg",
  "dublin_04.jpg",
  "dublin_14.jpg",
  "dublin_16.jpg",
  "dublin_17.jpg",
  "dublin_18.jpg",
  "dublin_24.jpg",
  "dublin_25.jpg",
  "dublin_26.jpg",
  "dublin_27.jpg",
  "dublin_28.jpg",
  "dublin_33.jpg",
  "dublin_37.jpg",
  "dublin_38.jpg",
  "dublin_39.jpg",
  "dublin_44.jpg",
  "dublin_56.jpg",
  "dublin_57.jpg",
  "dublin_58.jpg",
  "dublin_84.jpg"
];

const frameTextures = [
  "24DB1.jpg",
  "24DB2.jpg",
  "24DB3.jpg",
  "24DB4.jpg",
  "24DB5.jpg",
  "24DB6.jpg",
  "24DB7.jpg"
];

// Funkce pro naplnění dropdownu obrázky
function filltextureDropdown(dropdownId, textures, folderPath, partName) {
  const dropdown = document.getElementById(dropdownId);
  const optionsContainer = dropdown.querySelector('.options');
  const selectedImg = dropdown.querySelector('.selected img');
  const selectedText = dropdown.querySelector('.selected span');

  textures.forEach(tex => {
    const div = document.createElement('div');
    div.classList.add('option');
    div.dataset.value = folderPath + tex;

    const img = document.createElement('img');
    img.src = folderPath + tex;
    img.alt = tex;

    const span = document.createElement('span');
    span.textContent = tex;

    div.appendChild(img);
    div.appendChild(span);
    optionsContainer.appendChild(div);

    div.addEventListener('click', () => {
      selectedImg.src = folderPath + tex;
      selectedText.textContent = tex;
      optionsContainer.style.display = 'none';
      setPartTexture(partName, folderPath + tex);
    });
  });

  const selected = dropdown.querySelector('.selected');
  selected.addEventListener('click', () => {
    optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target)) {
      optionsContainer.style.display = 'none';
    }
  });
}

// Naplnění dropdownů
filltextureDropdown('seat-dropdown', seatTextures, 'textures/klasik/dublin/', 'seat');
filltextureDropdown('frame-dropdown', frameTextures, 'textures/dub/', 'frame_front');

// Scroll mechanika
window.addEventListener("scroll", function () {
  const header = document.querySelector("header");
  if (this.window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

