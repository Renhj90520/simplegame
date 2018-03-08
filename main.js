function setUp() {
  setupThreejs();
  setupWorld();

  animate();
}

var scene, renderer, camera, clock, player;
var orbitcontrols;
var floor;
var map =
  "   XXXXXXXX     XXXXXXXX      \n" +
  "   X      X     X      X      \n" +
  "   X  S   X     X   S  X      \n" +
  "   X      XXXXXXX      X      \n" +
  "   X                  XXXXXXXX\n" +
  "   X         S               X\n" +
  "   XXXX XX       XXXX    S   X\n" +
  "      X XX       X  X        X\n" +
  "   XXXX XXX     XX  X        X\n" +
  "   X      XX   XXXXXXTTXX  XXX\n" +
  "   X      XTTTTTXXXTTTTXX  X  \n" +
  "   XX  S  XTTTTTXXTTTTTXX  XXX\n" +
  "XXXXX     XTTTTTXTTTTTTX     X\n" +
  "X      XTTXTTTTTTTTTTTTX     X\n" +
  "X  S  XXTTTTTTTTXTTTTTXX  S  X\n" +
  "X     XTTTTTTTTTXTTTTTX      X\n" +
  "X     TTTTTTTTTTXXXXTTX  XXXXX\n" +
  "X     XTTTTTTTTTX X      X    \n" +
  "XX  XXXTTTTTTTTTX X      X    \n" +
  " X  X XTTTTTTTTTX X      X    \n" +
  " X  XXX         X X      X    \n" +
  " X             XXXX      XX   \n" +
  " XXXXX    T               X   \n" +
  "     X                 S  X   \n" +
  "     XX   S  XXXXXXXX     X   \n" +
  "      XX    XX      XXXXXXX   \n" +
  "       XXXXXX                 ";
map = map.split("\n");
var meshMap = new Array(map.length);
var HORIZONTAL_UNIT = 100;
var VERTICAL_UNIT = 100;
var ZSIZE = map.length * HORIZONTAL_UNIT;
var XSIZE = map[0].length * HORIZONTAL_UNIT;
function setupThreejs() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xdcf7e7, 0.001);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    60,
    renderer.domElement.width / renderer.domElement.height,
    1,
    10000
  );
  camera.position.y = 20;

  clock = new THREE.Clock(false);
//   orbitcontrols = new THREE.OrbitControls(camera);
}
function setupWorld() {
  setupMap();

  player = new Player();
  player.add(camera);
  player.position.y = 20;
  scene.add(player);

  var light = new THREE.DirectionalLight(0xfffaf3, 1.5);
  light.position.set(1, 1, 1);
  scene.add(light);

  light = new THREE.DirectionalLight(0xf3faff, 0.75);
  light.position.set(-1, -0.5, -1);
  scene.add(light);
}
function setupMap() {
  for (var i = 0, rows = map.length; i < rows; i++) {
    for (var j = 0, cols = map[i].length; j < cols; j++) {
      if (typeof meshMap[i] === "undefined") {
        meshMap[i] = new Array(cols);
      }
      meshMap[i][j] = addVoxel(map[i].charAt(j), i, j);
    }
  }

  var material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
  var floorGeo = new THREE.PlaneGeometry(XSIZE, ZSIZE, 20, 20);
  floor = new THREE.Mesh(floorGeo, material);
  floor.rotation.x = Math.PI / -2;
  scene.add(floor);
}
var spawnPoints = [];
var addVoxel = (function() {
  var XOFFSET = map.length / 2 * HORIZONTAL_UNIT,
    ZOFFSET = map[0].length / 2 * HORIZONTAL_UNIT,
    materials = [];

  for (var i = 0; i < 8; i++) {
    materials.push(
      new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(
          Math.random() * 0.2 + 0.3,
          0.5,
          Math.random() * 0.25 + 0.75
        )
      })
    );
  }
  function material() {
    return materials[Math.floor(Math.random() * materials.length)].clone();
  }

  var WALL = new THREE.BoxGeometry(
    HORIZONTAL_UNIT,
    VERTICAL_UNIT,
    HORIZONTAL_UNIT
  );

  return function(type, row, col) {
    var z = (row + 1) * HORIZONTAL_UNIT - ZOFFSET,
      x = (col + 1) * HORIZONTAL_UNIT - XOFFSET,
      mesh;

    switch (type) {
      case " ":
        break;
      case "S":
        spawnPoints.push(new THREE.Vector3(x, 0, z));
        break;
      case "T":
        mesh = new THREE.Mesh(WALL.clone(), material());
        mesh.position.set(x, VERTICAL_UNIT * 0.5, z);
        break;
      case "X":
        mesh = new THREE.Mesh(WALL.clone(), material());
        mesh.scale.y = 3;
        mesh.position.set(x, VERTICAL_UNIT * 1.5, z);
        break;
    }
    if (mesh) {
      scene.add(mesh);
    }
    return mesh;
  };
})();

window.addEventListener(
  "resize",
  function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = renderer.domElement.width / renderer.domElement.height;
    camera.updateProjectionMatrix();
    draw();
  },
  false
);

function draw() {
  renderer.render(scene, camera);
}

// Animation loop=================================
var frameDelta = 0;
function animate() {
  draw();
//   orbitcontrols.update();

  //   frameDelta += clock.getDelta();
  requestAnimationFrame(animate);
}

setUp();
