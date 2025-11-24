// --- Game Constants & Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameRunning = false;
let lives = WAVE_CONFIG.initialLives;
let money = WAVE_CONFIG.initialMoney;
let wave = 1;
let prepEndTime = 0;
let frameCount = 0;
let selectedTowerType = null;
let mouseX = 0;
let mouseY = 0;
let prepInitialized = false;

// Wave Logic
let isWaveActive = false; 
let enemiesToSpawnTotal = 0;
let enemiesSpawnedCount = 0;
let spawnTimer = 0;          
let spawnInterval = 60;      
let wavePreviewShown = false; // Đã hiển thị thông báo wave sắp tới chưa

// Damage Statistics (Bảng thống kê sát thương)
let damageStats = {
    basic: 0,
    ice: 0,
    poison: 0,
    sniper: 0,
    tesla: 0,
    laser: 0,
    rocket: 0,
    support: 0,
    total: 0
};

let enemies = [];
let towers = [];
let projectiles = [];
let particles = [];

// --- Game Functions ---

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    resetVariables();
    gameRunning = true;
    
    isWaveActive = false;
    updateWaveButton();
    updateDamageStats(); // Khởi tạo bảng thống kê
    showWaveNotification(wave, 10000);
    window.prepTimerVisibleFrom = Date.now() + 10000;
    prepEndTime = window.prepTimerVisibleFrom + 90000;
    prepInitialized = true;
    
    // Hide manual next-wave control
    const nextWaveContainer = document.getElementById('next-wave-container');
    if (nextWaveContainer) nextWaveContainer.style.display = 'none';
    
    // Show farm portal after game starts (only if not in farm mode)
    setTimeout(() => {
        if (!farmMode) {
            showFarmPortal();
        }
    }, 2000);
    
    gameLoop();
}

function updateWaveButton() {
    const btn = document.getElementById('btn-next-wave');
    if (!btn) return;
    if (!wavePreviewShown) {
        btn.classList.remove('wave-start');
        btn.textContent = `👁️ XEM THÔNG TIN ĐỢT ${wave}`;
    } else {
        btn.classList.add('wave-start');
        btn.textContent = `⚔️ BẮT ĐẦU ĐỢT ${wave}`;
    }
}

function resetVariables() {
    lives = WAVE_CONFIG.initialLives;
    money = WAVE_CONFIG.initialMoney;
    wave = 1;
    // prepEndTime sẽ được đặt sau khi popup 10s kết thúc
    enemies = [];
    towers = [];
    projectiles = [];
    particles = [];
    frameCount = 0;
    
    isWaveActive = false;
    enemiesToSpawnTotal = 0;
    enemiesSpawnedCount = 0;
    wavePreviewShown = false; // Reset preview flag
    
    // Reset farm variables
    farmMode = false;
    farmGrid = [];
    farmCrops = [];
    lastWaterWarning = 0;
    waterWarningCount = 0;
    farmMoneyEarned = 0;
    totalCropsHarvested = 0;
    selectedCropType = null;
    
    // Reset damage stats
    initializeDamageStats();
     
    // Sinh bản đồ đầu tiên
    generateMapForWave(1);
    prepInitialized = false;
    
    updateUI();
}

function handleWaveButtonClick() {
    // Lần đầu ấn nút: hiển thị thông báo quái sắp tới
    if (!wavePreviewShown) {
        showWaveNotification(wave);
        wavePreviewShown = true;
        updateWaveButton(); // Cập nhật nút thành giai đoạn 2
        return;
    }
    
    // Lần thứ 2: thực sự bắt đầu wave
    startNextWave();
}

function startNextWave() {
    if (isWaveActive) return; 
    if (Date.now() < prepEndTime) {
        const remain = Math.ceil((prepEndTime - Date.now())/1000);
        console.log(`⏳ Còn ${remain}s chuẩn bị, chưa thể bắt đầu đợt`);
        return;
    }

    isWaveActive = true;
    enemiesSpawnedCount = 0;
    wavePreviewShown = false; // Reset cho wave tiếp theo
    const baselineMoney = 100 + 50 * wave;
    if (money < baselineMoney) {
        money = baselineMoney;
        updateUI();
    }
    
    enemiesToSpawnTotal = WAVE_CONFIG.baseEnemyCount + Math.floor(wave * WAVE_CONFIG.enemyCountPerWave);
    spawnInterval = Math.max(WAVE_CONFIG.minSpawnInterval, WAVE_CONFIG.baseSpawnInterval - wave * WAVE_CONFIG.spawnIntervalDecreasePerWave);

    updateWaveButton();
}

function showWaveNotification(waveNumber, durationMs = WAVE_CONFIG.waveNotificationDuration) {
    const notifDiv = document.getElementById('wave-notification');
    const titleDiv = document.getElementById('wave-notification-title');
    const textDiv = document.getElementById('wave-notification-text');
    
    titleDiv.textContent = `🌊 Đợt ${waveNumber} sắp tới`;
    
    // Xác định loại quái sẽ xuất hiện trong wave này
    let possibleTypes = [];
    let specialWarning = '';
    
    if (waveNumber <= 2) {
        possibleTypes = ['normal'];
    } else if (waveNumber <= 5) {
        possibleTypes = ['normal', 'fast', 'armored'];
    } else if (waveNumber <= 8) {
        possibleTypes = ['normal', 'fast', 'armored', 'flying', 'basicImmune'];
        specialWarning = '⚠️ CẢNH BÁO: Có quái chỉ chịu sát thương BASIC!\n';
    } else if (waveNumber <= 12) {
        possibleTypes = ['normal', 'fast', 'armored', 'flying', 'basicImmune', 'ghost'];
        specialWarning = '⚠️ CẢNH BÁO: Có quái MA ẢO chỉ chịu Sniper!\n';
    } else if (waveNumber <= 15) {
        possibleTypes = ['normal', 'fast', 'armored', 'flying', 'resilient', 'basicImmune', 'laserImmune', 'ghost', 'mirror'];
        specialWarning = '⚠️ CẢNH BÁO: Có quái PHẢN XẠ LASER và MA ẢO!\n';
    } else if (waveNumber <= 18) {
        possibleTypes = ['normal', 'fast', 'armored', 'flying', 'resilient', 'basicImmune', 'laserImmune', 'ghost', 'mirror', 'timebender'];
        specialWarning = '⚠️ CẢNH BÁO: Có quái THỜI GIAN cần đóng băng trước!\n';
    } else if (waveNumber <= 20) {
        possibleTypes = ['normal', 'fast', 'armored', 'flying', 'resilient', 'basicImmune', 'laserImmune', 'ghost', 'mirror', 'timebender', 'virus'];
        specialWarning = '⚠️ CẢNH BÁO: Có quái VIRUS chỉ chịu độc và THỜI GIAN!\n';
    } else {
        // Wave 20+: tất cả loại quái
        possibleTypes = ['normal', 'fast', 'armored', 'flying', 'resilient', 'basicImmune', 'laserImmune', 'ghost', 'mirror', 'timebender', 'virus', 'chainbreaker'];
        specialWarning = '⚠️ CẢNH BÁO: Có quái CHỈ CHỊU TESLA và đủ loại đặc biệt!\n';
    }
    
    // Hiển thị danh sách quái
    let notification = specialWarning;
    notification += '🎯 Quái trong đợt này:\n';
    
    for (let type of possibleTypes) {
        const enemyType = ENEMY_CONFIG.types[type];
        const emoji = {
            'normal': '🟢',
            'fast': '⚡',
            'armored': '🛡️',
            'flying': '🦅',
            'resilient': '💪',
            'basicImmune': '🔵',
            'laserImmune': '🔴',
            // Emoji cho quái mới
            'ghost': '👻',
            'mirror': '🪞',
            'timebender': '⏰',
            'virus': '🦠',
            'chainbreaker': '⛓️'
        }[type];
        
        let typeDisplay = `${emoji} ${enemyType.name}`;
        if (enemyType.requiredWeapon) {
            const weaponConfig = TOWER_CONFIG[enemyType.requiredWeapon];
            typeDisplay += ` [Cần ${weaponConfig.name}]`;
        } else if (enemyType.onlyDamageType) {
            const weaponConfig = TOWER_CONFIG[enemyType.onlyDamageType];
            typeDisplay += ` [Chỉ ${weaponConfig.name}]`;
        } else if (enemyType.immuneToLaser) {
            typeDisplay += ` [Kháng Laser]`;
        } else if (enemyType.requiresFreeze) {
            typeDisplay += ` [Cần đóng băng]`;
        }
        notification += typeDisplay + '\n';
    }
    
    textDiv.innerHTML = notification.replace(/\n/g, '<br>');
    notifDiv.classList.remove('hidden');
    
    // Ẩn thông báo sau thời lượng quy định
    setTimeout(() => {
        notifDiv.classList.add('hidden');
    }, durationMs);
}

function resetGame() {
    startGame();
}

function takeDamage() {
    lives--;
    updateUI();
    document.getElementById('game-container').style.borderColor = 'red';
    setTimeout(() => document.getElementById('game-container').style.borderColor = 'transparent', 200);
    
    if (lives <= 0) {
        gameOver();
    }
}

function changeToNextMap() {
    console.log(`🗺️  Changing to next map! Current wave: ${wave}`);
    
    // Lưu tiền hiện tại
    const savedMoney = money;
    
    // Reset tháp và đạn
    towers = [];
    projectiles = [];
    particles = [];
    
    // Sinh map mới
    const newMap = generateMapForWave(wave);
    
    // Áp dụng economy scaling cho map mới
    applyMapEconomyScaling(newMap);
    
    // Hiệu ứng chuyển map
    showMapTransition(newMap);
    
    // Cập nhật UI
    updateUI();
    
    console.log(`✅ Map changed to: ${newMap.name} | Money kept: ${savedMoney}$`);
}

function applyMapEconomyScaling(mapConfig) {
    // Áp dụng multiplier cho economy
    // Lưu ý: tiền thưởng wave sẽ được tính toán lại trong game loop
    console.log(`💰 Applying economy scaling for ${mapConfig.name}:`);
    console.log(`   Money multiplier: ${mapConfig.moneyMultiplier}`);
    console.log(`   Reward multiplier: ${mapConfig.rewardMultiplier}`);
    console.log(`   Tower cost multiplier: ${mapConfig.towerCostMultiplier}`);
    console.log(`   Upgrade cost multiplier: ${mapConfig.upgradeCostMultiplier}`);
}

function showMapTransition(mapConfig) {
    // Hiệu ứng thông báo chuyển map
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid #f1c40f;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 0 30px rgba(241, 196, 15, 0.5);
            color: white;
        ">
            <h2 style="color: #f1c40f; margin-bottom: 15px;">🗺️ CHUYỂN MAP MỚI!</h2>
            <h3 style="color: #e74c3c; margin-bottom: 10px;">${mapConfig.name}</h3>
            <p style="color: #bdc3c7; margin-bottom: 15px;">${mapConfig.description}</p>
            <p style="color: #f1c40f; font-weight: bold;">Độ khó: ${mapConfig.difficulty}/6</p>
            <p style="color: #27ae60; font-size: 0.9rem;">💰 Tiền được giữ lại: ${money}$</p>
            <p style="color: #e67e22; font-size: 0.8rem;">⚠️ Tháp đã được reset - Hãy bố trí lại chiến thuật!</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Tự động ẩn sau 4 giây
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 4000);
}

function gameOver() {
    gameRunning = false;
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Bạn đã sống sót qua ${wave - 1} đợt tấn công!`;
}

function gameLoop() {
    if (!gameRunning) return; 

    // Don't run tower game loop if in farm mode
    if (farmMode) {
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Logic Updates
    if (isWaveActive) {
        spawnTimer++;
        if (spawnTimer >= spawnInterval && enemiesSpawnedCount < enemiesToSpawnTotal) {
            enemies.push(new Enemy(wave));
            enemiesSpawnedCount++;
            spawnTimer = 0;
            updateWaveButton(); 
        }
        if (enemiesSpawnedCount >= enemiesToSpawnTotal && enemies.length === 0) {
            isWaveActive = false;
            wavePreviewShown = false; // Reset preview flag cho wave tiếp theo
            
            // --- LOGIC TIỀN THƯỞNG WAVE MỚI (HARDCORE) ---
            const waveReward = 0;
            wave++;
            // Popup 10s, sau đó 90s chuẩn bị cho wave tiếp theo
            showWaveNotification(wave, 10000);
            window.prepTimerVisibleFrom = Date.now() + 10000;
            prepEndTime = window.prepTimerVisibleFrom + 90000;
            
            // --- CHUYỂN MAP MỚI SAU MỖI 5 WAVE ---
            if (wave % 5 === 1 && wave > 1) {
                changeToNextMap();
            }
            
            // Reset damage stats cho wave mới
            resetDamageStats();
            
            updateUI();
            updateWaveButton();
        }
    }

    for (let tower of towers) tower.update();

    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (!projectiles[i].active) {
            projectiles.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let reachedEnd = enemies[i].update();
        
        if (enemies[i].health <= 0) {
            // --- KHÔNG CỘNG TIỀN KHI GIẾT QUÁI ---
            // money += 0; 
            
            createParticles(enemies[i].x, enemies[i].y, enemies[i].color, 5);
            enemies.splice(i, 1);
            // updateUI(); // Không cần update UI tiền nữa
            if (isWaveActive) updateWaveButton();
        } else if (reachedEnd) {
            enemies.splice(i, 1);
            if (isWaveActive) updateWaveButton();
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // 2. Rendering
    drawMap();
    
    drawSynergyLines();

    for (let tower of towers) tower.draw();
    for (let enemy of enemies) enemy.draw();
    for (let p of projectiles) p.draw();
    for (let part of particles) part.draw();
    
    drawPlacementPreview();

    frameCount++;
    if (!isWaveActive) {
        updateWaveButton();
        updatePrepTimers();
        if (!prepInitialized) {
            showWaveNotification(wave, 10000);
            window.prepTimerVisibleFrom = Date.now() + 10000;
            prepEndTime = window.prepTimerVisibleFrom + 90000;
            prepInitialized = true;
        }
        if (Date.now() >= prepEndTime) startNextWave();
    } else {
        updatePrepTimers();
    }
    requestAnimationFrame(gameLoop);
}

// Init
resetVariables();
drawMap();
