let scene, camera, renderer;
let planets = [];
let isRunning = false;
let time = 0;
let trails = [];

// --- スケールファクター定義 ---
// 1 unit = 1,000,000 km
const DIST_SCALE = 1e6;     // 距離スケール: km → sim unit
const RADIUS_SCALE = 1e6;   // 半径スケール: km → sim unit
const MASS_SCALE = 1e24;    // 質量スケール: kg → sim unit
const MIN_RADIUS = 0.5;     // 可視化のための最小半径（unit）

// --- SI単位系の重力定数（km^3/kg/s^2）---
const G_SI = 6.67430e-20; // (km^3/kg/s^2)
// シミュレーション単位系に合わせてスケーリング
const G = G_SI * Math.pow(DIST_SCALE, -3) * MASS_SCALE; // (sim unit^3/sim mass/s^2)

// --- 惑星の実データ（km, kg, km/s）---
const realData = {
    sun:     { radius_km: 695700,  mass_kg: 1.9884e30, distance_km: 0,            color: "#ffff00" },
  
    mercury: { radius_km:   2439.7, mass_kg: 3.301e23,  distance_km: 5.7909e7,   color: "#bfbfbf" },
    venus:   { radius_km:   6051.8, mass_kg: 4.8673e24, distance_km: 1.0821e8,   color: "#ffcc99" },
    earth:   { radius_km:   6371.0, mass_kg: 5.9722e24, distance_km: 1.49598e8,  color: "#4444ff" },
    mars:    { radius_km:   3389.5, mass_kg: 6.4169e23, distance_km: 2.27956e8,  color: "#ff4444" },
    jupiter: { radius_km:  69911,   mass_kg: 1.89813e27,distance_km: 7.78479e8,  color: "#ffaa88" },
    saturn:  { radius_km:  58232,   mass_kg: 5.6832e26, distance_km: 1.432041e9, color: "#ffdd77" },
    uranus:  { radius_km:  25362,   mass_kg: 8.6811e25, distance_km: 2.867043e9, color: "#66ccff" },
    neptune: { radius_km:  24622,   mass_kg: 1.02409e26,distance_km: 4.514953e9, color: "#4477ff" }
  };
  

// --- 公転速度計算（万有引力による円運動近似）---
function calcOrbitalVelocity(M_central, r_km) {
    // v = sqrt(G * M / r) [km/s]
    const v_kms = Math.sqrt(G_SI * M_central / r_km);
    // → sim unit/s に直す（1 unit = DIST_SCALE [km]）
    return v_kms / DIST_SCALE; // [sim unit/s]
}

// --- 惑星データをスケール変換して生成 ---
let planetConfigs = [
    // 太陽（基準）
    {
        name: "太陽",
        mass:   realData.sun.mass_kg   / MASS_SCALE,
        radius: Math.max(realData.sun.radius_km / RADIUS_SCALE, MIN_RADIUS),
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        color: realData.sun.color
    },

    // 水星
    {
        name: "水星",
        mass:   realData.mercury.mass_kg   / MASS_SCALE,
        radius: Math.max(realData.mercury.radius_km / RADIUS_SCALE, MIN_RADIUS),
        x:  realData.mercury.distance_km / DIST_SCALE, y: 0, z: 0,
        vx: 0,
        vy:  calcOrbitalVelocity(realData.sun.mass_kg, realData.mercury.distance_km),
        vz: 0,
        color: realData.mercury.color
    },

    // 金星
    {
        name: "金星",
        mass:   realData.venus.mass_kg   / MASS_SCALE,
        radius: Math.max(realData.venus.radius_km / RADIUS_SCALE, MIN_RADIUS),
        x:  realData.venus.distance_km / DIST_SCALE, y: 0, z: 0,
        vx: 0,
        vy:  calcOrbitalVelocity(realData.sun.mass_kg, realData.venus.distance_km),
        vz: 0,
        color: realData.venus.color
    },

    // 地球
    {
        name: "地球",
        mass:   realData.earth.mass_kg   / MASS_SCALE,
        radius: Math.max(realData.earth.radius_km / RADIUS_SCALE, MIN_RADIUS),
        x:  realData.earth.distance_km / DIST_SCALE, y: 0, z: 0,
        vx: 0,
        vy:  calcOrbitalVelocity(realData.sun.mass_kg, realData.earth.distance_km),
        vz: 0,
        color: realData.earth.color
    },

    // 火星
    {
        name: "火星",
        mass:   realData.mars.mass_kg   / MASS_SCALE,
        radius: Math.max(realData.mars.radius_km / RADIUS_SCALE, MIN_RADIUS),
        x:  realData.mars.distance_km / DIST_SCALE, y: 0, z: 0,
        vx: 0,
        vy:  calcOrbitalVelocity(realData.sun.mass_kg, realData.mars.distance_km),
        vz: 0,
        color: realData.mars.color
    },

    // 木星
    {
        name: "木星",
        mass:   realData.jupiter.mass_kg   / MASS_SCALE,
        radius: Math.max(realData.jupiter.radius_km / RADIUS_SCALE, MIN_RADIUS),
        x:  realData.jupiter.distance_km / DIST_SCALE, y: 0, z: 0,
        vx: 0,
        vy:  calcOrbitalVelocity(realData.sun.mass_kg, realData.jupiter.distance_km),
        vz: 0,
        color: realData.jupiter.color
    },

    // 土星
    {
        name: "土星",
        mass:   realData.saturn.mass_kg   / MASS_SCALE,
        radius: Math.max(realData.saturn.radius_km / RADIUS_SCALE, MIN_RADIUS),
        x:  realData.saturn.distance_km / DIST_SCALE, y: 0, z: 0,
        vx: 0,
        vy:  calcOrbitalVelocity(realData.sun.mass_kg, realData.saturn.distance_km),
        vz: 0,
        color: realData.saturn.color
    },

    // 天王星
    {
        name: "天王星",
        mass:   realData.uranus.mass_kg   / MASS_SCALE,
        radius: Math.max(realData.uranus.radius_km / RADIUS_SCALE, MIN_RADIUS),
        x:  realData.uranus.distance_km / DIST_SCALE, y: 0, z: 0,
        vx: 0,
        vy:  calcOrbitalVelocity(realData.sun.mass_kg, realData.uranus.distance_km),
        vz: 0,
        color: realData.uranus.color
    },

    // 海王星
    {
        name: "海王星",
        mass:   realData.neptune.mass_kg   / MASS_SCALE,
        radius: Math.max(realData.neptune.radius_km / RADIUS_SCALE, MIN_RADIUS),
        x:  realData.neptune.distance_km / DIST_SCALE, y: 0, z: 0,
        vx: 0,
        vy:  calcOrbitalVelocity(realData.sun.mass_kg, realData.neptune.distance_km),
        vz: 0,
        color: realData.neptune.color
    }
];


// 初期化
init();
createUI();

function init() {
    // シーン作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    
    // カメラ作成
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 200, 300);
    camera.lookAt(0, 0, 0);
    
    // レンダラー作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // カメラコントロール
    setupCameraControls();
    
    // 環境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    // 点光源
    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
    
    // 格子線
    const gridHelper = new THREE.GridHelper(500, 50, 0x444444, 0x222222);
    scene.add(gridHelper);
    
    // ウィンドウリサイズ対応
    window.addEventListener('resize', onWindowResize);
    
    // 初期惑星作成
    createPlanets();
    
    // 描画開始
    animate();
}

function setupCameraControls() {
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let cameraDistance = 400;
    let cameraAngleX = 0, cameraAngleY = 0;
    
    renderer.domElement.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        
        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;
        
        cameraAngleY += deltaX * 0.01;
        cameraAngleX += deltaY * 0.01;
        cameraAngleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraAngleX));
        
        updateCameraPosition();
        
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
    
    renderer.domElement.addEventListener('wheel', (e) => {
        cameraDistance += e.deltaY * 0.5;
        cameraDistance = Math.max(50, Math.min(2000, cameraDistance));
        updateCameraPosition();
        e.preventDefault();
    });
    
    function updateCameraPosition() {
        camera.position.x = cameraDistance * Math.cos(cameraAngleX) * Math.sin(cameraAngleY);
        camera.position.y = cameraDistance * Math.sin(cameraAngleX);
        camera.position.z = cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
        camera.lookAt(0, 0, 0);
    }
}

function createPlanets() {
    // 既存の惑星を削除
    planets.forEach(planet => {
        scene.remove(planet.mesh);
    });
    planets = [];
    
    planetConfigs.forEach((config, index) => {
        const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: config.color });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(config.x, config.y, config.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        scene.add(mesh);
        
        const planet = {
            mesh: mesh,
            mass: config.mass,
            position: new THREE.Vector3(config.x, config.y, config.z),
            velocity: new THREE.Vector3(config.vx, config.vy, config.vz),
            trail: [],
            centerPosition: new THREE.Vector3(0, 0, 0) // 太陽を中心とする
        };

        // --- 軌道検出用プロパティの初期化 ---
        const rel0 = new THREE.Vector3().subVectors(planet.position, planet.centerPosition);
        planet.prevRelPos = rel0.clone();
        planet.angularMomentum = rel0.clone().cross(planet.velocity).normalize();
        planet.initialPosition = rel0.clone();       // 「初期位置ベクトル」を保存
        planet.initialRadius = rel0.length();
        planet.angleAccumulated = 0;
        planet.orbitCount = 0;
        planet.pendingOrbitCount = 0;
        planet.lastDetectionDistance = Infinity;
        planet.lastDetectionFrame = 0;

        planets.push(planet);
    });
}

function createUI() {
    const container = document.getElementById('planets-container');
    container.innerHTML = '';
    
    planetConfigs.forEach((config, index) => {
        const div = document.createElement('div');
        div.className = 'planet-config';
        div.innerHTML = `
            <h4>${config.name} ${index > 0 ? `<button class="remove-btn" onclick="removePlanet(${index})">削除</button>` : ''}</h4>
            ${index > 0 ? `<div class="orbit-info"><span id="orbit-display-${index}" style="display: none; color: #00ff00; font-size: 0.9em;"></span></div>` : ''}
            <div class="input-group">
                <label>質量: <input type="number" value="${config.mass}" onchange="updateConfig(${index}, 'mass', this.value)"></label>
                <label>色: <input type="color" value="${config.color}" onchange="updateConfig(${index}, 'color', this.value)"></label>
                <label>半径: <input type="number" value="${config.radius}" onchange="updateConfig(${index}, 'radius', this.value)"></label>
            </div>
            <div class="input-group">
                <label>位置 X: <input type="number" value="${config.x}" onchange="updateConfig(${index}, 'x', this.value)"></label>
                <label>位置 Y: <input type="number" value="${config.y}" onchange="updateConfig(${index}, 'y', this.value)"></label>
                <label>位置 Z: <input type="number" value="${config.z}" onchange="updateConfig(${index}, 'z', this.value)"></label>
            </div>
            <div class="input-group">
                <label>速度 X: <input type="number" value="${config.vx}" step="0.1" onchange="updateConfig(${index}, 'vx', this.value)"></label>
                <label>速度 Y: <input type="number" value="${config.vy}" step="0.1" onchange="updateConfig(${index}, 'vy', this.value)"></label>
                <label>速度 Z: <input type="number" value="${config.vz}" step="0.1" onchange="updateConfig(${index}, 'vz', this.value)"></label>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateConfig(index, property, value) {
    planetConfigs[index][property] = parseFloat(value) || value;
    createPlanets();
}

function addPlanet() {
    const newPlanet = {
        name: `惑星${planetConfigs.length}`,
        mass: 10,
        x: 200,
        y: 0,
        z: 0,
        vx: 0,
        vy: 2,
        vz: 0,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        radius: 5
    };
    
    planetConfigs.push(newPlanet);
    createPlanets();
    createUI();
    
    // 新しい惑星の軌道周期情報を初期化
    const newPlanetIndex = planets.length - 1;
    if (planets[newPlanetIndex]) {
        const planet = planets[newPlanetIndex];
        
        // 軌道検出用プロパティの初期化
        const rel0 = new THREE.Vector3().subVectors(planet.position, planet.centerPosition);
        planet.prevRelPos = rel0.clone();
        planet.angularMomentum = rel0.clone().cross(planet.velocity).normalize();
        planet.initialPosition = rel0.clone();       // 「初期位置ベクトル」を保存
        planet.initialRadius = rel0.length();
        planet.angleAccumulated = 0;
        planet.orbitCount = 0;
        planet.pendingOrbitCount = 0;
        planet.lastDetectionDistance = Infinity;
        planet.lastDetectionFrame = 0;
    }
}

function removePlanet(index) {
    if (index === 0) return;
    
    planetConfigs.splice(index, 1);
    createPlanets();
    createUI();
}

function toggleSimulation() {
    isRunning = !isRunning;
    const btn = document.getElementById('startBtn');
    btn.textContent = isRunning ? '停止' : '開始';
}

function resetSimulation() {
    if (isRunning) toggleSimulation();
    
    time = 0;
    clearTrails();
    createPlanets();
    
    // 初期位置に戻す
    planetConfigs.forEach((config, index) => {
        if (planets[index]) {
            planets[index].position.set(config.x, config.y, config.z);
            planets[index].velocity.set(config.vx, config.vy, config.vz);
            planets[index].mesh.position.copy(planets[index].position);
            
            // 軌道周期情報もリセット
            if (index > 0) {
                const planet = planets[index];
                
                // 軌道検出用プロパティのリセット
                const rel0 = new THREE.Vector3().subVectors(planet.position, planet.centerPosition);
                planet.prevRelPos = rel0.clone();
                planet.angularMomentum = rel0.clone().cross(planet.velocity).normalize();
                planet.initialPosition = rel0.clone();       // 「初期位置ベクトル」を保存
                planet.initialRadius = rel0.length();
                planet.angleAccumulated = 0;
                planet.orbitCount = 0;
                planet.pendingOrbitCount = 0;
                planet.lastDetectionDistance = Infinity;
                planet.lastDetectionFrame = 0;
                
                // UI表示もリセット
                const orbitDisplay = document.getElementById(`orbit-display-${index}`);
                if (orbitDisplay) {
                    orbitDisplay.style.display = 'none';
                }
            }
        }
    });
}

function clearTrails() {
    trails.forEach(trail => {
        scene.remove(trail);
    });
    trails = [];
    
    planets.forEach(planet => {
        planet.trail = [];
    });
}

function updatePhysics() {
    if (!isRunning) return;
    
    // dt は「1フレームあたりのsim秒」として使用
    // デフォルトは1 sim秒に設定
    const dt = parseFloat(document.getElementById('timeScale').value) || 1;
    
    // 正しくスケール済みのGを使用（UIスライダーではなく）
    const G_val = G;
    
    // 万有引力計算
    planets.forEach((planet, i) => {
        const force = new THREE.Vector3(0, 0, 0);
        
        planets.forEach((otherPlanet, j) => {
            if (i === j) return;
            
            const r = new THREE.Vector3().subVectors(otherPlanet.position, planet.position);
            const distance = r.length();
            
            if (distance > 0) {
                // 正しくスケール済みGを使う
                const forceMagnitude = G_val * planet.mass * otherPlanet.mass / (distance * distance);
                r.normalize();
                r.multiplyScalar(forceMagnitude);
                force.add(r);
            }
        });
        
        // 加速度 = 力 / 質量
        const acceleration = force.divideScalar(planet.mass);
        
        // 位置と速度の更新（単位：sim秒 を使う）
        planet.velocity.add(acceleration.multiplyScalar(dt));
        planet.position.add(planet.velocity.clone().multiplyScalar(dt));
        planet.mesh.position.copy(planet.position);
        // 軌跡記録
        planet.trail.push(planet.position.clone());
        if (planet.trail.length > 500) planet.trail.shift();
        
        // 軌道一周検出（太陽以外の惑星のみ）
        if (i > 0) {
            checkOrbitCompletion(planet, i, time);
        }
    });
    
    // 軌道を描画
    updateTrails();
    
    // シミュレーション内の経過 sim秒 を積算
    time += dt;
    document.getElementById('timeDisplay').textContent = time.toFixed(1);
  
    // sim秒＝real秒（地球周期3.16e7秒→1年）として表示
    const realDays = time / (24 * 3600);
    if (realDays < 1) {
      document.getElementById('realTimeDisplay').textContent = `${(realDays * 24).toFixed(10)}時間`;
    } else if (realDays < 365) {
      document.getElementById('realTimeDisplay').textContent = `${realDays.toFixed(10)}日`;
    } else {
      document.getElementById('realTimeDisplay').textContent = `${(realDays/365).toFixed(10)}年`;
    }
}

function checkOrbitCompletion(planet, planetIndex, currentTime) {
  // --- 今フレームの相対位置 & 距離 ---
  const rel = new THREE.Vector3().subVectors(planet.position, planet.centerPosition);
  const dist0 = rel.distanceTo(planet.initialPosition);
  const r0    = planet.initialRadius;
  const threshold = r0 * 0.10;  // 初期半径の±10%

  // --- 1) 角度差分累積 ---
  const cross = new THREE.Vector3().crossVectors(planet.prevRelPos, rel);
  const dot   = planet.prevRelPos.dot(rel);
  let delta  = Math.atan2(cross.length(), dot);
  if (cross.dot(planet.angularMomentum) < 0) delta = -delta;
  planet.angleAccumulated += delta;
  planet.prevRelPos.copy(rel);

  // --- 2) 周回開始：angleAccumulated ≥ 2π かつ未保留なら "保留" を開始 ---
  const currentFrame = Math.floor(currentTime * 60);
  if (planet.angleAccumulated >= 2 * Math.PI && planet.pendingOrbitCount === 0) {
    planet.pendingOrbitCount     = planet.orbitCount + 1;
    planet.lastDetectionDistance = Infinity;
    planet.lastDetectionFrame    = currentFrame;
    updateOrbitDisplay(planetIndex, planet.pendingOrbitCount, currentTime);  // (保留中)
    console.log(`軌道検出(保留中): 惑星${planetIndex}, 周回=${planet.pendingOrbitCount}`);
  }

  // --- 3) 保留中の最接近更新 ---
  console.log(planet.pendingOrbitCount, dist0, threshold, planet.lastDetectionDistance);
  if (planet.pendingOrbitCount > 0 && dist0 < threshold) {
    if (dist0 < planet.lastDetectionDistance) {
      planet.lastDetectionDistance = dist0;
      planet.lastDetectionFrame    = currentFrame;
      // lastDetectionFrameのときの時間を計算（60FPS想定）
      const detectionTime = planet.lastDetectionFrame / 60;
      updateOrbitDisplay(planetIndex, planet.pendingOrbitCount, detectionTime);  // (保留中) 更新
      console.log(`最接近更新: 惑星${planetIndex}, 距離=${dist0.toFixed(3)}`);
    }
  }

  // --- 4) 離脱確定：しきい値の２倍以上離れたら "確定" ---
  if (planet.pendingOrbitCount > 0 && dist0 > threshold * 2) {
    planet.orbitCount        = planet.pendingOrbitCount;
    planet.pendingOrbitCount = 0;
    planet.angleAccumulated -= 2 * Math.PI;  // 次サイクルへ
    const detectionTime = planet.lastDetectionFrame / 60;
    updateOrbitDisplay(planetIndex, planet.orbitCount, detectionTime);  // (確定)
    console.log(`軌道確定: 惑星${planetIndex}, 確定=${planet.orbitCount}`);
  }
}

function updateOrbitDisplay(planetIndex, orbitCount, simTime) {
    // 現実時間換算
    const realDays = simTime / (24 * 3600);
    let realTimeText;
    if (realDays < 1) {
        realTimeText = `${(realDays * 24).toFixed(10)}時間`;
    } else if (realDays < 365) {
        realTimeText = `${realDays.toFixed(10)}日`;
    } else {
        realTimeText = `${(realDays/365).toFixed(10)}年`;
    }
    
    // 軌道周期表示を更新
    const orbitDisplay = document.getElementById(`orbit-display-${planetIndex}`);
    if (orbitDisplay) {
        // 保留中かどうかを判定（確定軌道数と比較）
        const planet = planets[planetIndex];
        const isPending = planet && planet.pendingOrbitCount > 0 && planet.pendingOrbitCount === orbitCount;
        const statusText = isPending ? "(保留中)" : "(確定)";
        
                orbitDisplay.textContent = `軌道${orbitCount}周完了${statusText}: ${simTime.toFixed(1)}秒 (${realTimeText})`;
        orbitDisplay.style.display = 'inline';
    }
}

function updateTrails() {
    // 既存の軌道を削除
    trails.forEach(trail => {
        scene.remove(trail);
    });
    trails = [];
    
    planets.forEach((planet, index) => {
        if (planet.trail.length < 2) return;
        
        const points = planet.trail.map(pos => pos.clone());
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: planetConfigs[index].color,
            opacity: 0.6,
            transparent: true
        });
        const line = new THREE.Line(geometry, material);
        
        scene.add(line);
        trails.push(line);
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    updatePhysics();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
} 