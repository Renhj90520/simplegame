function setUp() {
  setupThreejs();
  setupWorld();
  setupEnemies();
  animate();
  spawn();
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

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    60,
    renderer.domElement.width / renderer.domElement.height,
    1,
    10000
  );

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

  var material = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa
  });
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

var enemies = [],
  numEnemies = 5;

var FIRING_DELAY = 1000,
  BOT_MOVE_DELAY = 2000;

function setupEnemies() {
  var texture = new THREE.TextureLoader().load("textures/face.png");
  var geometry = new THREE.BoxGeometry(
    Player.RADIUS * 2,
    Player.RADIUS * 2,
    Player.RADIUS * 2
  );
  var material = new THREE.MeshBasicMaterial({
    map: texture
  });

  var now = Date.now();
  for (var i = 0; i < numEnemies; i++) {
    var enemy = new Player(geometry.clone(), material.clone());
    spawn(enemy);
    enemies.push(enemy);
    scene.add(enemy);
    enemy.lastShot = now + Math.random() * FIRING_DELAY;
    enemy.lastMove = now + Math.random() * BOT_MOVE_DELAY;
  }
}

function MapCell() {
  this.set.apply(this, arguments);
}

MapCell.prototype.set = function(row, col, char, mesh) {
  this.row = row;
  this.col = col;
  this.char = char;
  this.mesh = mesh;
  return this;
};

function spawn(unit) {
  unit = unit || player;
  var cell = new MapCell(),
    point;
  do {
    point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    mapCellFromPosition(point, cell);
  } while (isPlayerInCell(cell.row, cell.col));
  unit.position.copy(point);
  unit.position.y = unit.cameraHeight;
  var direction = (point.z > 0 ? 0 : -1) * Math.PI;
  unit.rotation.y = direction;
}

function mapCellFromPosition(position, cell) {
  cell = cell || new MapCell();
  var XOFFSET = (map.length + 1) / 2 * HORIZONTAL_UNIT,
    ZOFFSET = (map[0].length + 1) / 2 * HORIZONTAL_UNIT;
  var mapCol = Math.floor((position.x + XOFFSET) / HORIZONTAL_UNIT) - 1,
    mapRow = Math.floor((position.z + ZOFFSET) / HORIZONTAL_UNIT) - 1;
  var char = map[mapRow].charAt(mapCol),
    mesh = meshMap[mapRow][mapCol];
  return cell.set(mapRow, mapCol, char, mesh);
}

var isPlayerInCell = (function() {
  var cell = new MapCell();
  return function(row, col) {
    mapCellFromPosition(player.position, cell);
    if (cell.row == row && cell.col == col) return true;
    for (var i = 0; i < enemies.length; i++) {
      mapCellFromPosition(enemies[i].position, cell);
      if (cell.row == row && cell.col == col) return true;
    }
    return false;
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

  frameDelta += clock.getDelta();
  while (frameDelta > INV_MAX_FPS) {
    update(INV_MAX_FPS);
    frameDelta -= INV_MAX_FPS;
  }

  if (!pause) {
    requestAnimationFrame(animate);
  }
}

var INV_MAX_FPS = 1 / 100;

function update(delta) {
  player.update(delta);
  checkPlayerCollision(player);

  for (var i = 0; i < bullets.length; i++) {
    bullets[i].update(delta);
    checkBulletCollision(bullets[i], i);
  }

  var now = Date.now();
  for (var j = 0; j < enemies.length; j++) {
    var enemy = enemies[j];
    enemy.update(delta);
    if (enemy.helth <= 0) {
      enemy.helth = enemy.maxHelth;
      spawn(enemy);
    }
    checkPlayerCollision(enemy);

    if (enemy.lastShot + FIRING_DELAY < now) {
      shoot(enemy, player);
      enemy.lastShot = now;
    }

    if (enemy.lastMove + BOT_MOVE_DELAY < now) {
      move(enemy);
      enemy.lastMove = now;
    }
  }
}

var checkBulletCollision = (function() {
  var cell = new MapCell();

  function removeBullet(bullet, i) {
    scene.remove(bullet);
    deadBulletPool.push(bullet);
    bullets.splice(i, 1);
  }
  return function(bullet, i) {
    if (bullet.player !== player && spheresOverlap(bullet, player)) {
      removeBullet(bullet, i);
    }

    for (var j = 0; j < numEnemies; j++) {
      if (bullet.player !== enemies[j] && spheresOverlap(bullet, enemies[j])) {
        enemies[j].health - bullet.damage;
        removeBullet(bullet, i);
        break;
      }
    }

    mapCellFromPosition(bullet.position, cell);
    if (
      cell.char == "X" ||
      (cell.char == "T" &&
        bullet.position.y - Bullet.RADIUS <
          cell.mesh.position.y + VERTICAL_UNIT * 0 / 5) ||
      bullet.position.y - Bullet.RADIUS < floor.position.y ||
      bullet.position.y > VERTICAL_UNIT * 5
    ) {
      removeBullet(bullet, i);
    }
  };
})();

function spheresOverlap(obj1, obj2) {
  var combinedRadius = obj1.constructor.RADIUS + obj2.constructor.RADIUS;
  return (
    combinedRadius * combinedRadius >
    obj1.position.distanceToSquared(obj2.position)
  );
}
var BOT_MAX_AXIAL_ERROR = 10;
var bullets = [];
var deadBulletPool = [];
var shoot = (function() {
  var negativeZ = new THREE.Vector3(0, 0, -1);
  var error = new THREE.Vector3();

  function productError(deg) {
    if (typeof deg === "undefined") deg = BOT_MAX_AXIAL_ERROR;
    return Math.random() * (deg / 90) - deg / 180;
  }

  return function(from, to) {
    from = from || player;
    bullet = deadBulletPool.length ? deadBulletPool.pop() : new Bullet();
    bullet.position.copy(from.position);
    bullet.rotation.copy(from.rotation);
    if (to) {
      bullet.direction = to.position
        .clone()
        .sub(from.position)
        .normalize();
    } else {
      bullet.direction = negativeZ.clone().applyQuaternion(from.quaternion);
    }
    error.set(productError(), productError(), productError());
    bullet.direction.add(error);
    bullet.player = from;
    bullets.push(bullet);
    scene.add(bullet);
  };
})();

function move(bot) {
  bot.rotation.y = Math.random() * Math.PI * 2;
  var leftBias = bot.moveDirection.LEFT ? -0.1 : 0.1;
  var forwardBias = bot.moveDirection.FORWARD ? -0.1 : 0.1;
  bot.moveDirection.LEFT = Math.random() + leftBias < 0.1;
  bot.moveDirection.RIGHT =
    !bot.moveDirection.LEFT && Math.random() + leftBias < 0.1;
  bot.moveDirection.FORWARD = Math.random() + forwardBias < 0.8;
  bot.moveDirection.BACKWARD =
    !bot.moveDirection.FORWARD && Math.random() < 0.05;
  if (Math.random() < 0.4) bot.jump();
}

var checkPlayerCollision = (function() {
  var cell = new MapCell();
  return function(player) {
    player.collideFloor(floor.position.y);
    mapCellFromPosition(player.position, cell);
    switch (cell.char) {
      case " ":
      case "S":
        if (
          Math.floor(player.position.y - player.cameraHeight) <=
          floor.position.y
        ) {
          player.canJump = true;
        }
        break;
      case "T":
        var topPosition = cell.mesh.position.y + VERTICAL_UNIT * 0.5;
        if (player.collideFloor(topPosition)) {
          player.canJump = true;
        } else if (
          player.position.y - player.cameraHeight * 0.5 <
          topPosition
        ) {
          moveOutSide(cell.mesh.position, player.position);
        }
        break;
      case "X":
        moveOutSide(cell.mesh.position, player.position);
        break;
    }
  };
})();

function moveOutSide(meshPosition, playerPosition) {
  var mw = HORIZONTAL_UNIT,
    md = HORIZONTAL_UNIT,
    mx = meshPosition.x - mw * 0.5,
    mz = meshPosition.z - md * 0.5;
  var px = playerPosition.x,
    pz = playerPosition.z;
  if (px > mx && px < mx + mw && pz > mz && pz < mz + md) {
    var xOverlap = px - mx < mw * 0.5 ? px - mx : px - mx - mw,
      zOverlap = pz - mz < md * 0.5 ? pz - mz : pz - mz - md;
    if (Math.abs(xOverlap) > Math.abs(zOverlap)) {
      playerPosition.x -= xOverlap;
    } else {
      playerPosition.z -= zOverlap;
    }
  }
}
var pause = true;

function startAnimating() {
  if (pause) {
    pause = false;
    clock.start();
    requestAnimationFrame(animate);
  }
}

function stopAnimating() {
  pause = true;
  clock.stop();
}

// Input==========================================
document.addEventListener(
  "mousemove",
  function(event) {
    player.rotate(event.movementY, event.movementX, 0);
  },
  false
);
document.addEventListener(
  "keydown",
  function(event) {
    if (
      !event.ctrlKey ||
      !(event.keyCode == 76 || event.keyCode == 84 || event.keyCode == 87)
    ) {
      if (event.keyCode != 116) {
        event.preventDefault();
      }
    }
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        player.moveDirection.FORWARD = true;
        break;
      case 37: // left
      case 65: // a
        player.moveDirection.LEFT = true;
        break;
      case 40: // down
      case 83: // s
        player.moveDirection.BACKWARD = true;
        break;
      case 39: // right
      case 68: // d
        player.moveDirection.RIGHT = true;
        break;
      case 32: // space
        player.jump();
        break;
    }
  },
  false
);
document.addEventListener(
  "keyup",
  function(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        player.moveDirection.FORWARD = false;
        break;
      case 37: // left
      case 65: // a
        player.moveDirection.LEFT = false;
        break;
      case 40: // down
      case 83: // s
        player.moveDirection.BACKWARD = false;
        break;
      case 39: // right
      case 68: // d
        player.moveDirection.RIGHT = false;
        break;
      case 32: // space
        break;
    }
  },
  false
);
document.addEventListener("click", function(event) {
  if (!pause) {
    event.preventDefault();
    shoot();
  }
});
document.getElementById("start").addEventListener("click", function() {
  if (BigScreen.enabled) {
    var startEl = this;
    var crosshair = document.getElementById("crosshair");
    crosshair.className = "hidden";
    BigScreen.request(
      document.body,
      function() {
        PL.requestPointerLock(document.body, function() {
          startEl.className = "hidden";
          crosshair.className = "";
          startAnimating();
        });
      },
      function() {
        startEl.className = "exited";
        crosshair.className = "hidden";
        stopAnimating();
      }
    );
  }
});
setUp();
