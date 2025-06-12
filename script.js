// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#solar-system"),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Lighting
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 300);
scene.add(sunLight);

// Camera position
camera.position.z = 70;

// Add stars
function addStars() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
  });

  const starsVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starsVertices, 3)
  );
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}

// Planet data
const planetData = {
  mercury: {
    radius: 0.8,
    distance: 10,
    speed: 1,
    color: 0x8c8c8c,
    name: "Mercury",
  },
  venus: {
    radius: 1.2,
    distance: 15,
    speed: 1,
    color: 0xe39e1c,
    name: "Venus",
  },
  earth: {
    radius: 1.5,
    distance: 20,
    speed: 1,
    color: 0x2b83ff,
    name: "Earth",
  },
  mars: { radius: 1, distance: 25, speed: 1, color: 0xc1440e, name: "Mars" },
  jupiter: {
    radius: 3,
    distance: 35,
    speed: 1,
    color: 0xd8ca9d,
    name: "Jupiter",
  },
  saturn: {
    radius: 2.5,
    distance: 45,
    speed: 1,
    color: 0xe3bb76,
    name: "Saturn",
  },
  uranus: {
    radius: 2,
    distance: 55,
    speed: 1,
    color: 0x5580aa,
    name: "Uranus",
  },
  neptune: {
    radius: 2,
    distance: 65,
    speed: 1,
    color: 0x366896,
    name: "Neptune",
  },
};

// Create sun
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Create planets
const planets = {};
const planetSpeeds = {};
const planetAngles = {};

Object.entries(planetData).forEach(([name, data]) => {
  const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
  const material = new THREE.MeshPhongMaterial({ color: data.color });
  const planet = new THREE.Mesh(geometry, material);

  // Create orbit
  const orbitGeometry = new THREE.RingGeometry(
    data.distance - 0.1,
    data.distance + 0.1,
    128
  );
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  planet.position.x = data.distance;
  scene.add(planet);
  planets[name] = planet;
  planetSpeeds[name] = data.speed;
  planetAngles[name] = Math.random() * Math.PI * 2;
});

// Add stars
addStars();

// Animation state
let isPaused = false;
const clock = new THREE.Clock();

// Raycaster for hover detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.querySelector(".tooltip");

// Handle mouse move for tooltips
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update tooltip position
  tooltip.style.left = event.clientX + 10 + "px";
  tooltip.style.top = event.clientY + 10 + "px";
});

// Handle click for zoom
window.addEventListener("click", (event) => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(Object.values(planets));

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    const planetName = Object.keys(planets).find(
      (key) => planets[key] === planet
    );
    const distance = planetData[planetName].distance;

    // Zoom to planet
    gsap.to(camera.position, {
      duration: 1,
      x: planet.position.x * 0.5,
      y: planet.position.y * 0.5,
      z: distance * 0.5,
      ease: "power2.inOut",
    });
  } else {
    // Reset camera position
    gsap.to(camera.position, {
      duration: 1,
      x: 0,
      y: 0,
      z: 70,
      ease: "power2.inOut",
    });
  }
});

function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    const delta = clock.getDelta();

    // Rotate sun
    sun.rotation.y += 0.002;

    // Rotate planets
    Object.entries(planets).forEach(([name, planet]) => {
      const speed = planetSpeeds[name];
      planetAngles[name] += delta * speed * 0.5;
      const distance = planetData[name].distance;

      planet.position.x = Math.cos(planetAngles[name]) * distance;
      planet.position.z = Math.sin(planetAngles[name]) * distance;
      planet.rotation.y += 0.01;
    });

    // Update tooltip
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(planets));

    if (intersects.length > 0) {
      const planet = intersects[0].object;
      const planetName = Object.keys(planets).find(
        (key) => planets[key] === planet
      );
      tooltip.style.display = "block";
      tooltip.textContent = planetData[planetName].name;
    } else {
      tooltip.style.display = "none";
    }
  }

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Speed control handlers
Object.keys(planetData).forEach((planet) => {
  const slider = document.getElementById(`${planet}-speed`);
  const valueDisplay = slider.nextElementSibling;

  slider.addEventListener("input", (e) => {
    const speed = parseFloat(e.target.value);
    planetSpeeds[planet] = speed;
    valueDisplay.textContent = `${speed}x`;
  });
});

// Pause/Resume button
const pauseButton = document.getElementById("pause-resume");
pauseButton.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
});

// Theme toggle
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  themeToggle.textContent = document.body.classList.contains("light-mode")
    ? "Dark Mode"
    : "Light Mode";
});

// Start animation
animate();
