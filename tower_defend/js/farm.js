// --- Farm System Configuration ---

// Farm Configuration
const FARM_CONFIG = {
    // Crop types with different growth times and values (30s to 60s based on value)
    crops: {
        carrot: {
            name: 'Cà Rốt',
            cost: 10,
            growTime: 60000, // 1 phút
            waterInterval: 10000, // Tưới mỗi 10 giây
            baseValue: 25,
            color: '#ff6b35',
            stages: 3
        },
        wheat: {
            name: 'Lúa Mì',
            cost: 15,
            growTime: 90000, // 1 phút 30 giây
            waterInterval: 10000, // Tưới mỗi 10 giây
            baseValue: 40,
            color: '#f4d03f',
            stages: 3
        },
        pumpkin: {
            name: 'Bí Ngô',
            cost: 25,
            growTime: 120000, // 2 phút
            waterInterval: 10000, // Tưới mỗi 10 giây
            baseValue: 70,
            color: '#e67e22',
            stages: 3
        }
    },
    
    // Farm map configuration
    farmMap: {
        name: 'Vườn Cây Bí Mật',
        description: 'Nơi trồng trọt và kiếm tiền',
        rows: 15,
        cols: 20,
        tileSize: 40,
        waterCost: 5, // Cost per water action
        plantCostMultiplier: 1.0,
        plotSize: 3, // 3x3 planting areas
        plotSpacing: 1, // Space between plots
        soilAnimationSpeed: 0.02 // Speed of soil animation
    },
    
    // Warning system
    warnings: {
        waterReminderInterval: 10000, // Remind every 10 seconds
        criticalWaterThreshold: 3000, // 3 seconds without water
        maxWarningsPerWave: 3
    }
};

// Farm State
let farmMode = false;
let wateringMode = false;
let modeTransitioning = false;
let farmGrid = [];
let farmCrops = [];
let lastWaterWarning = 0;
let waterWarningCount = 0;
let farmMoneyEarned = 0;
let totalCropsHarvested = 0;
let soilAnimationTime = 0; // For animated soil effects
let farmLayout = { offsetX: 0, offsetY: 0, plotsPerRow: 0, plotsPerCol: 0 };

// Initialize farm grid
function initializeFarm() {
    farmGrid = Array(FARM_CONFIG.farmMap.rows).fill().map(() => Array(FARM_CONFIG.farmMap.cols).fill(null));
    farmCrops = [];
    console.log('🌱 Farm initialized with', FARM_CONFIG.farmMap.rows, 'rows and', FARM_CONFIG.farmMap.cols, 'cols');
}

// Crop class
class Crop {
    constructor(type, row, col, clickX = null, clickY = null) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.stage = 0;
        this.lastWatered = Date.now();
        this.plantedAt = Date.now();
        this.isAlive = true;
        this.waterLevel = 100;
        this.growthProgress = 0;
        this.clickX = clickX;
        this.clickY = clickY;
        this.plantAnimationTime = 0;
        this.isPlanting = true;
        this.lastUpdateTime = Date.now();
        this.nextWaterDueAt = Date.now() + FARM_CONFIG.crops[type].waterInterval;
        this.missedWaterCount = 0;
        
        const cropConfig = FARM_CONFIG.crops[type];
        this.maxStage = cropConfig.stages;
        this.growTime = cropConfig.growTime;
        this.waterInterval = cropConfig.waterInterval;
        this.baseValue = cropConfig.baseValue;
        this.color = cropConfig.color;
        
        console.log(`🌱 Planted ${cropConfig.name} at (${row}, ${col})`);
    }
    
    getStageIcon() {
        if (this.stage <= 0) return '🌱';
        if (this.type === 'carrot') return '🥕';
        if (this.type === 'wheat') return '🌾';
        if (this.type === 'pumpkin') return '🎃';
        return '🌿';
    }
    
    update() {
        if (!this.isAlive) return false;
        
        // Handle planting animation
        if (this.isPlanting) {
            this.plantAnimationTime += 0.1;
            if (this.plantAnimationTime >= 1) {
                this.isPlanting = false;
            }
        }
        
        const now = Date.now();
        const dt = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        const timeSinceWater = now - this.lastWatered;
        
        // Watering logic only applies during growth stage (stage == 1)
        if (this.stage === 1) {
            // Needs water when due time reached
            if (now >= this.nextWaterDueAt) {
                // Pause growth while thirsty
                // Accumulate missed periods; hard kill after 2 periods overdue
                const overdue = now - this.nextWaterDueAt;
                if (overdue >= this.waterInterval) {
                    this.missedWaterCount = Math.min(2, Math.floor(overdue / this.waterInterval));
                }
                if (overdue >= this.waterInterval * 2) {
                    this.die('Quá hạn tưới nước');
                    return false;
                }
            }
        }
        
        // Grow if healthy
        const canGrow = (this.stage !== 1) || (now < this.nextWaterDueAt);
        if (canGrow) {
            // Calculate growth based on actual time passed (milliseconds)
            const growthRate = 1000 / 60;
            this.growthProgress += growthRate;
            // Advance stage
            if (this.growthProgress >= this.growTime / this.maxStage) {
                this.growthProgress = 0;
                this.stage++;
                if (this.stage === 1) {
                    // Enter growth stage: set first watering deadline
                    this.nextWaterDueAt = now + this.waterInterval;
                    this.missedWaterCount = 0;
                }
                if (this.stage >= this.maxStage) {
                    this.harvest();
                    return true;
                }
            }
        }
        
        return false;
    }
    
    water() {
        if (!this.isAlive) return false;
        
        this.lastWatered = Date.now();
        this.waterLevel = 100;
        // Reset next due time only in growth stage
        if (this.stage === 1) {
            this.nextWaterDueAt = this.lastWatered + this.waterInterval;
            this.missedWaterCount = 0;
        }
        
        console.log(`💧 Watered ${this.type} at (${this.row}, ${this.col}), water level: ${this.waterLevel}%`);
        
        // Visual feedback
        createFarmParticles(this.col * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           this.row * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           '#3498db', 5);
        
        return true;
    }
    
    harvest() {
        if (!this.isAlive || this.stage < this.maxStage) return 0;
        
        const cropConfig = FARM_CONFIG.crops[this.type];
        const value = cropConfig.baseValue; // Giá trị cố định
        
        console.log(`🌾 Harvested ${cropConfig.name} for ${value}$`);
        
        // Visual feedback
        createFarmParticles(this.col * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           this.row * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           this.color, 10);
        
        return value;
    }
    
    die(reason) {
        this.isAlive = false;
        console.log(`💀 Crop at (${this.row}, ${this.col}) died: ${reason}`);
        
        // Visual feedback
        createFarmParticles(this.col * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           this.row * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           '#e74c3c', 8);
    }
    
    draw(ctx) {
        if (!this.isAlive) return;
        
        const x = this.col * FARM_CONFIG.farmMap.tileSize;
        const y = this.row * FARM_CONFIG.farmMap.tileSize;
        this.drawAtPosition(ctx, x, y);
    }
    
    drawAtPosition(ctx, x, y) {
        if (!this.isAlive) return;
        
        const size = FARM_CONFIG.farmMap.tileSize;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 5, y + size - 8, size - 10, 6);
        
        if (this.stage === 0) {
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(x + size/2 - 2, y + size - 12, 4, 6);
            ctx.beginPath();
            ctx.arc(x + size/2 - 6, y + size - 14, 3, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + size/2 + 6, y + size - 14, 3, 0, Math.PI*2);
            ctx.fill();
        } else if (this.stage === 1) {
            if (this.type === 'carrot') {
                ctx.fillStyle = '#228B22';
                ctx.fillRect(x + size/2 - 6, y + size - 8 - 18, 12, 18);
            } else if (this.type === 'wheat') {
                ctx.fillStyle = '#DAA520';
                for (let i = -2; i <= 2; i++) {
                    ctx.fillRect(x + size/2 + i*3, y + size - 8 - 20, 2, 20);
                }
            } else if (this.type === 'pumpkin') {
                ctx.fillStyle = '#228B22';
                ctx.fillRect(x + size/2 - 2, y + size - 8 - 16, 4, 16);
                ctx.beginPath();
                ctx.arc(x + size/2 - 8, y + size - 16, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + size/2 + 8, y + size - 16, 5, 0, Math.PI*2);
                ctx.fill();
            }
        } else if (this.stage >= 2) {
            if (this.type === 'carrot') {
                ctx.fillStyle = '#ff6b35';
                ctx.beginPath();
                ctx.moveTo(x + size/2, y + size - 10);
                ctx.lineTo(x + size/2 - 6, y + size - 18);
                ctx.lineTo(x + size/2 + 6, y + size - 18);
                ctx.closePath();
                ctx.fill();
            } else if (this.type === 'wheat') {
                ctx.fillStyle = '#DAA520';
                for (let i = -2; i <= 2; i++) {
                    ctx.fillRect(x + size/2 + i*3, y + size - 8 - 22, 2, 22);
                    ctx.fillRect(x + size/2 + i*3 - 2, y + size - 30, 6, 4);
                }
            } else if (this.type === 'pumpkin') {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(x + size/2, y + size - 14, 10, 0, Math.PI*2);
                ctx.fill();
            }
        }
        
        // Show water level indicator with pulsing effect
        if (this.waterLevel < 30) {
            const pulseSize = 4 + Math.sin(Date.now() * 0.01) * 2;
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + size/2 - pulseSize/2, y + 2, pulseSize, pulseSize);
        }
        
        const now = Date.now();
        const needsWater = this.stage === 1 && now >= this.nextWaterDueAt;
        drawWateringCanIcon(ctx, x + size - 14, y + 10, 10, needsWater);
    }
}

function drawWateringCanIcon(ctx, x, y, s, highlight=false) {
    ctx.save();
    ctx.fillStyle = highlight ? '#1f8bd6' : '#3498db';
    ctx.strokeStyle = highlight ? '#ffcc00' : '#2980b9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + s);
    ctx.lineTo(x + s, y + s);
    ctx.lineTo(x + s, y + s/2);
    ctx.lineTo(x + s/2, y + s/2);
    ctx.lineTo(x + s/2, y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s/2, y + s/2);
    ctx.lineTo(x + s + 4, y + s/2 - 2);
    ctx.stroke();
    ctx.fillStyle = highlight ? 'rgba(255,200,0,0.9)' : 'rgba(52,152,219,0.8)';
    ctx.beginPath();
    const dropY = y + s/2 + Math.sin(Date.now()*0.01) * 2;
    ctx.arc(x + s + 6, dropY, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

// Farm functions
function switchToFarm() {
    if (farmMode || modeTransitioning) return;
    modeTransitioning = true;
    farmMode = true;
    console.log('🌱 Switching to FARM mode');
    
    hideFarmPortal();
    if (farmGrid.length === 0) initializeFarm();
    
    // Immediate UI switch to avoid stuck state
    hideCombatUI();
    showFarmUI();
    showReturnPortal();
    
    // Gentle fade
    canvas.style.transition = 'opacity 0.3s ease';
    canvas.style.opacity = '0.8';
    setTimeout(() => { canvas.style.opacity = '1'; }, 300);
    
    if (!farmLoopRunning) farmLoop();
    modeTransitioning = false;
    wateringMode = false;
}

function switchToTower() {
    if (!farmMode || modeTransitioning) return;
    modeTransitioning = true;
    farmMode = false;
    console.log('🏰 Switching to TOWER mode');
    
    // Immediate UI switch
    hideFarmUI();
    hideReturnPortal();
    showCombatUI();
    showFarmPortal();
    
    // Stop farm loop quickly
    farmLoopRunning = false;
    
    canvas.style.transition = 'opacity 0.3s ease';
    canvas.style.opacity = '0.8';
    setTimeout(() => { canvas.style.opacity = '1'; modeTransitioning = false; }, 300);
    wateringMode = false;
}

function forceExitToTower() {
    modeTransitioning = false;
    farmMode = false;
    wateringMode = false;
    farmLoopRunning = false;
    try { hideFarmUI(); } catch (e) {}
    try { hideReturnPortal(); } catch (e) {}
    try { showCombatUI(); } catch (e) {}
    try { showFarmPortal(); } catch (e) {}
    canvas.style.opacity = '1';
}

function plantCrop(type, row, col, clickX = null, clickY = null) {
    if (!farmMode) return false;
    
    // Check bounds
    if (row < 0 || row >= FARM_CONFIG.farmMap.rows || col < 0 || col >= FARM_CONFIG.farmMap.cols) {
        return false;
    }
    
    // Check if spot is empty
    if (farmGrid[row][col] !== null) {
        return false;
    }
    
    const cropConfig = FARM_CONFIG.crops[type];
    const plantCost = Math.floor(cropConfig.cost * FARM_CONFIG.farmMap.plantCostMultiplier);
    
    // Check money
    if (money < plantCost) {
        console.log('💰 Not enough money to plant');
        return false;
    }
    
    // Plant the crop
    money -= plantCost;
    const crop = new Crop(type, row, col, clickX, clickY);
    farmGrid[row][col] = crop;
    farmCrops.push(crop);
    
    // Create planting animation at click position
    if (clickX !== null && clickY !== null) {
        createPlantingAnimation(clickX, clickY);
    }
    
    updateUI();
    return true;
}

function waterCrop(row, col) {
    if (!farmMode) return false;
    
    // Check bounds
    if (row < 0 || row >= FARM_CONFIG.farmMap.rows || col < 0 || col >= FARM_CONFIG.farmMap.cols) {
        return false;
    }
    
    const crop = farmGrid[row][col];
    if (!crop || !crop.isAlive) {
        return false;
    }
    crop.water();
    
    updateUI();
    return true;
}

function harvestCrop(row, col) {
    if (!farmMode) return 0;
    
    // Check bounds
    if (row < 0 || row >= FARM_CONFIG.farmMap.rows || col < 0 || col >= FARM_CONFIG.farmMap.cols) {
        return 0;
    }
    
    const crop = farmGrid[row][col];
    if (!crop || !crop.isAlive) {
        return 0;
    }
    
    const value = crop.harvest();
    if (value > 0) {
        money += value;
        farmMoneyEarned += value;
        totalCropsHarvested++;
        
        // Remove crop
        farmGrid[row][col] = null;
        const index = farmCrops.indexOf(crop);
        if (index > -1) {
            farmCrops.splice(index, 1);
        }
        
        updateUI();
    }
    
    return value;
}

function checkWaterNeeds() {
    const now = Date.now();
    
    // Only check every 10 seconds and max 3 warnings per wave
    if (now - lastWaterWarning < FARM_CONFIG.warnings.waterReminderInterval || 
        waterWarningCount >= FARM_CONFIG.warnings.maxWarningsPerWave) {
        return;
    }
    
    let needsWater = false;
    let criticalCrops = [];
    
    for (let crop of farmCrops) {
        if (!crop.isAlive) continue;
        
        if (crop.stage === 1 && now >= crop.nextWaterDueAt) {
            needsWater = true;
            
            const dynamicThreshold = crop.waterInterval * 2;
            if (now - crop.nextWaterDueAt > dynamicThreshold) {
                criticalCrops.push(crop);
            }
        }
    }
    
    if (needsWater && criticalCrops.length > 0) {
        lastWaterWarning = now;
        waterWarningCount++;
        
        showWaterWarning(criticalCrops.length);
    }
}

function showWaterWarning(criticalCount) {
    const message = `⚠️ ${criticalCount} cây cần tưới nước ngay! Nhấn TAB để chuyển sang vườn.`;
    
    // Create notification
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(231, 76, 60, 0.95);
            border: 2px solid #c0392b;
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: pulse 1s infinite;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);
    const tool = document.getElementById('water-tool');
    if (tool) tool.classList.add('need-water');
}

function drawFarm(ctx) {
    // Update soil animation
    soilAnimationTime += FARM_CONFIG.farmMap.soilAnimationSpeed;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0f1f');
    gradient.addColorStop(0.5, '#1b1035');
    gradient.addColorStop(1, '#0a0f1f');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 80; i++) {
        const x = (i * 45 + soilAnimationTime * 60) % canvas.width;
        const y = canvas.height * 0.75 + Math.sin(soilAnimationTime * 2 + i) * 6;
        const height = 20 + Math.sin(soilAnimationTime * 3 + i * 0.5) * 8;
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(soilAnimationTime * 4 + i) * 2, y - height);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    const plotSize = FARM_CONFIG.farmMap.plotSize;
    const plotSpacing = FARM_CONFIG.farmMap.plotSpacing;
    const tileSize = FARM_CONFIG.farmMap.tileSize;
    
    // Calculate plot dimensions
    const plotTileSize = plotSize * tileSize;
    const totalPlotSize = plotTileSize + (plotSpacing * tileSize);
    
    // Calculate centering offset
    const plotsPerRow = Math.floor(FARM_CONFIG.farmMap.cols / (plotSize + plotSpacing));
    const plotsPerCol = Math.floor(FARM_CONFIG.farmMap.rows / (plotSize + plotSpacing));
    const totalFarmWidth = plotsPerRow * totalPlotSize;
    const totalFarmHeight = plotsPerCol * totalPlotSize;
    const offsetX = (canvas.width - totalFarmWidth) / 2;
    const offsetY = (canvas.height - totalFarmHeight) / 2;
    farmLayout.offsetX = offsetX;
    farmLayout.offsetY = offsetY;
    farmLayout.plotsPerRow = plotsPerRow;
    farmLayout.plotsPerCol = plotsPerCol;
    
    // Draw 3x3 planting plots with animated soil
    for (let plotRow = 0; plotRow < plotsPerCol; plotRow++) {
        for (let plotCol = 0; plotCol < plotsPerRow; plotCol++) {
            const plotX = offsetX + plotCol * totalPlotSize;
            const plotY = offsetY + plotRow * totalPlotSize;
            
            ctx.fillStyle = '#1b1035';
            ctx.fillRect(plotX, plotY, totalPlotSize, totalPlotSize);
            
            // Draw inner plot area with animated soil
            const innerX = plotX + plotSpacing * tileSize / 2;
            const innerY = plotY + plotSpacing * tileSize / 2;
            const innerSize = plotTileSize;
            
            // Create animated soil pattern
            for (let r = 0; r < plotSize; r++) {
                for (let c = 0; c < plotSize; c++) {
                    const tileX = innerX + c * tileSize;
                    const tileY = innerY + r * tileSize;
                    
                    ctx.fillStyle = '#2a1f3c';
                    ctx.fillRect(tileX, tileY, tileSize, tileSize);
                    
                    ctx.fillStyle = 'rgba(0,255,204,0.15)';
                    for (let i = 0; i < 2; i++) {
                        const dotX = tileX + Math.random() * tileSize;
                        const dotY = tileY + Math.random() * tileSize;
                        ctx.beginPath();
                        ctx.arc(dotX, dotY, 1 + Math.random() * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    ctx.strokeStyle = '#00ffcc';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(tileX, tileY, tileSize, tileSize);
                    
                    // Global grid coordinates for this tile
                    const globalRow = plotRow * (plotSize + plotSpacing) + r;
                    const globalCol = plotCol * (plotSize + plotSpacing) + c;
                    
                    // Draw crop if exists (only if within bounds)
                    if (globalRow < FARM_CONFIG.farmMap.rows && globalCol < FARM_CONFIG.farmMap.cols && farmGrid[globalRow][globalCol]) {
                        farmGrid[globalRow][globalCol].drawAtPosition(ctx, tileX, tileY);
                    }
                }
            }
            
            // Draw plot label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Khu ${plotRow * plotsPerRow + plotCol + 1}`, 
                        plotX + totalPlotSize / 2, plotY + totalPlotSize - 5);
        }
    }
    
    // Draw farm UI overlay
    drawFarmUI(ctx);
}

function pixelToFarmCell(x, y) {
    const plotSize = FARM_CONFIG.farmMap.plotSize;
    const plotSpacing = FARM_CONFIG.farmMap.plotSpacing;
    const tileSize = FARM_CONFIG.farmMap.tileSize;
    const totalPlotSize = plotSize * tileSize + (plotSpacing * tileSize);
    const relX = x - farmLayout.offsetX;
    const relY = y - farmLayout.offsetY;
    if (relX < 0 || relY < 0) return null;
    const plotCol = Math.floor(relX / totalPlotSize);
    const plotRow = Math.floor(relY / totalPlotSize);
    if (plotCol < 0 || plotCol >= farmLayout.plotsPerRow || plotRow < 0 || plotRow >= farmLayout.plotsPerCol) return null;
    const innerX = plotCol * totalPlotSize + plotSpacing * tileSize / 2;
    const innerY = plotRow * totalPlotSize + plotSpacing * tileSize / 2;
    const localX = relX - innerX;
    const localY = relY - innerY;
    if (localX < 0 || localY < 0) return null;
    const c = Math.floor(localX / tileSize);
    const r = Math.floor(localY / tileSize);
    if (c < 0 || c >= plotSize || r < 0 || r >= plotSize) return null;
    const globalRow = plotRow * (plotSize + plotSpacing) + r;
    const globalCol = plotCol * (plotSize + plotSpacing) + c;
    if (globalRow < 0 || globalRow >= FARM_CONFIG.farmMap.rows || globalCol < 0 || globalCol >= FARM_CONFIG.farmMap.cols) return null;
    return { row: globalRow, col: globalCol };
}

// Farm game loop
let farmLoopRunning = false;

function farmLoop() {
    if (!farmMode) {
        farmLoopRunning = false;
        return;
    }
    
    farmLoopRunning = true;
    
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update crops
    for (let i = farmCrops.length - 1; i >= 0; i--) {
        const crop = farmCrops[i];
        if (crop.update()) {
            // Crop is ready for harvest
            console.log(`🌾 Crop at (${crop.row}, ${crop.col}) is ready for harvest!`);
        }
    }
    
    // Update farm particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    
    // Check water needs
    checkWaterNeeds();
    
    // Draw farm
    drawFarm(ctx);
    
    // Draw particles
    for (let part of particles) {
        part.draw(ctx);
    }
    
    requestAnimationFrame(farmLoop);
}

// Farm particle system
function createFarmParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 30,
            maxLife: 30,
            color: color,
            size: Math.random() * 3 + 2,
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.1; // Gravity
                this.life--;
            },
            draw: function(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
    }
}

// Planting animation function
function createPlantingAnimation(x, y) {
    // Create seed planting particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * -4 - 2,
            life: 40,
            maxLife: 40,
            color: '#8B4513',
            size: Math.random() * 4 + 2,
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.2; // Gravity
                this.vx *= 0.98; // Air resistance
                this.life--;
            },
            draw: function(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
    }
    
    // Create green growth sparkles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2 - 1,
            life: 25,
            maxLife: 25,
            color: '#00FF00',
            size: Math.random() * 3 + 1,
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy -= 0.1; // Float upward
                this.life--;
            },
            draw: function(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
    }
}