// --- Shared Utilities ---

// Tower icons mapping
const TOWER_ICONS = {
    'basic': '🏹',
    'ice': '❄️',
    'poison': '🧪',
    'sniper': '🔭',
    'tesla': '⚡',
    'laser': '🔴',
    'rocket': '🚀',
    'support': '✨'
};

// Update damage statistics display
function updateDamageStats() {
    const statsDiv = document.getElementById('damage-stats');
    if (!statsDiv) return;
    
    let html = '<h3>📊 THỐNG KÊ SÁT THƯƠNG</h3>';
    
    const towerTypes = ['basic', 'ice', 'poison', 'sniper', 'tesla', 'laser', 'rocket', 'support'];
    
    let hasData = false;
    for (let type of towerTypes) {
        const damage = damageStats[type] || 0;
        if (damage > 0) {
            hasData = true;
            const config = TOWER_CONFIG[type];
            const icon = TOWER_ICONS[type];
            html += `<div class="damage-stat-row">
                <span>${icon} ${config.name}</span>
                <span style="color: ${config.color}; font-weight: bold;">${damage.toFixed(0)}</span>
            </div>`;
        }
    }
    
    if (hasData) {
        html += `<div class="damage-stat-row" style="border-top: 2px solid #f1c40f; padding-top: 8px;">
            <strong>Tổng</strong>
            <span style="color: #f1c40f; font-weight: bold;">${damageStats.total.toFixed(0)}</span>
        </div>`;
    } else {
        html += '<p style="text-align: center; color: #bdc3c7; font-size: 0.9rem;">Chưa gây sát thương</p>';
    }
    
    statsDiv.innerHTML = html;
}

// Initialize damage stats
function initializeDamageStats() {
    damageStats = {
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
    updateDamageStats();
}

// Format tower selection display
function selectTower(type) {
    selectedTowerType = type;
    
    // Update UI - remove previous selection
    document.querySelectorAll('.tower-select').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Highlight selected tower
    const btn = document.getElementById(`btn-${type}`);
    if (btn) {
        btn.classList.add('selected');
    }
}

// Reset tower selection
function deselectTower() {
    selectedTowerType = null;
    document.querySelectorAll('.tower-select').forEach(btn => {
        btn.classList.remove('selected');
    });
}

// Get tower name with icon
function getTowerDisplayName(type) {
    const icon = TOWER_ICONS[type];
    const config = TOWER_CONFIG[type];
    return `${icon} ${config.name}`;
}

// Get tower color
function getTowerColor(type) {
    return TOWER_CONFIG[type]?.color || '#ffffff';
}

// Calculate total damage by type
function getTotalDamageByType(type) {
    return damageStats[type] || 0;
}

// Get total damage across all types
function getTotalDamage() {
    return damageStats.total || 0;
}

// Reset damage stats for new wave
function resetDamageStats() {
    for (let type in damageStats) {
        if (type !== 'total') {
            damageStats[type] = 0;
        }
    }
    damageStats.total = 0;
    updateDamageStats();
}
