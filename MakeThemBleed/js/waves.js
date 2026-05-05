// ===== WAVE MANAGER =====
// Balance: specials from wave 10, elites only at 5/10/15/20 then more after 20
class WaveManager {
    constructor() {
        this.currentWave = 0; this.enemiesSpawned = 0; this.totalEnemiesForWave = 0;
        this.spawnTimer = 0; this.spawnInterval = 0.8;
        this.waveState = 'waiting'; this.announceTimer = 0; this.clearTimer = 0;
        this.totalKills = 0; this.firstKillDone = false;
        this.weaponEliteSpawned = false; this.bossSpawned = false;
    }
    getWaveMultiplier() { return Math.pow(CONFIG.WAVES.difficultyExponent, this.currentWave); }
    getEnemyCountForWave() { return Math.floor(CONFIG.WAVES.baseEnemyCount + this.currentWave * CONFIG.WAVES.enemyCountPerWave); }
    getSpawnInterval() { return Math.max(CONFIG.WAVES.minSpawnInterval, CONFIG.WAVES.baseSpawnInterval - this.currentWave * CONFIG.WAVES.spawnIntervalReduction); }

    // Special effect chance based on wave
    getSpecialChance(baseChance) {
        if (this.currentWave < CONFIG.WAVES.specialEffectsStartWave) return 0;
        if (this.currentWave <= CONFIG.WAVES.specialEffectsRampEndWave) {
            // Slowly ramp from 0 to baseChance between wave 10-20
            const t = (this.currentWave - CONFIG.WAVES.specialEffectsStartWave) / (CONFIG.WAVES.specialEffectsRampEndWave - CONFIG.WAVES.specialEffectsStartWave);
            return baseChance * t * 0.5; // half the base at wave 20
        }
        // After wave 20: increases every 5 waves
        const d = Math.floor((this.currentWave - CONFIG.WAVES.specialEffectsRampEndWave) / CONFIG.WAVES.specialEffectsCommonInterval);
        return Math.min(baseChance * (0.5 + d * 0.15), baseChance * 1.5);
    }

    startNextWave(game) {
        this.currentWave++;
        this.enemiesSpawned = 0;
        this.totalEnemiesForWave = this.getEnemyCountForWave();
        this.spawnInterval = this.getSpawnInterval();
        this.spawnTimer = 0;
        this.weaponEliteSpawned = false;
        this.bossSpawned = false;
        this.waveState = 'announcing';
        this.announceTimer = CONFIG.WAVES.announceTime;
        if (game.audio) game.audio.playWaveStart();
        const wEl = document.getElementById('waveAnnounce');
        const wTxt = document.getElementById('waveText');
        if (wEl && wTxt) {
            wTxt.textContent = `WAVE ${this.currentWave}`;
            wEl.style.display = 'block';
            wTxt.style.animation = 'none'; wTxt.offsetHeight; wTxt.style.animation = 'waveIn 0.5s ease-out';
        }
    }

    _getEnemyType() {
        const w = this.currentWave, roll = Math.random();
        // No blue elites in normal spawning at waves 1-20 (only the weapon-drop one)
        if (w <= 5) { return roll < 0.70 ? 'green' : 'yellow'; }
        if (w <= 10) { return roll < 0.25 ? 'green' : roll < 0.65 ? 'yellow' : 'red'; }
        if (w <= 15) { return roll < 0.10 ? 'green' : roll < 0.35 ? 'yellow' : 'red'; }
        if (w <= 20) { return roll < 0.05 ? 'green' : roll < 0.20 ? 'yellow' : 'red'; }
        // After wave 20: elites can spawn normally
        if (roll < 0.03) return 'green';
        if (roll < 0.10) return 'yellow';
        if (roll < 0.40) return 'red';
        if (roll < 0.75) return 'blue';
        return 'blue';
    }

    _getSpawnPos(mw, mh) {
        const s = Math.floor(Math.random() * 4), m = 30;
        switch (s) {
            case 0: return { x: Math.random() * mw, y: m };
            case 1: return { x: mw - m, y: Math.random() * mh };
            case 2: return { x: Math.random() * mw, y: mh - m };
            case 3: return { x: m, y: Math.random() * mh };
        }
    }

    _spawnEnemy(game, typeName, dropsWeapon, dropWeaponIndex) {
        const pos = this._getSpawnPos(game.map.width, game.map.height);
        const mul = this.getWaveMultiplier();
        const enemy = new Enemy(pos.x, pos.y, typeName, mul);
        // Apply special effects based on wave
        const baseChance = ENEMY_TYPES[typeName].specialChance;
        const chance = this.getSpecialChance(baseChance);
        if (chance > 0) enemy.applySpecialEffects(chance);
        if (dropsWeapon) { enemy.dropsWeapon = true; enemy.dropWeaponIndex = dropWeaponIndex; }
        game.enemies.push(enemy);
        this.enemiesSpawned++;
        // Spawn SFX
        if (game.audio) {
            if (typeName === 'blue') game.audio.playEliteSpawn();
            else if (typeName === 'black') game.audio.playBossAppear();
            else if (Math.random() < 0.15) game.audio.playAlienSpawn();
        }
    }

    _spawnBoss(game) {
        const pos = this._getSpawnPos(game.map.width, game.map.height);
        const boss = new Enemy(pos.x, pos.y, 'black', this.getWaveMultiplier());
        game.enemies.push(boss); this.bossSpawned = true; this.enemiesSpawned++;
        const bb = document.getElementById('bossHealthBar');
        if (bb) bb.style.display = 'block';
        if (game.audio) game.audio.playBossAppear();
        game.camera.shake(10, 0.5);
    }

    onEnemyKilled(enemy, game) {
        this.totalKills++;
        if (!this.firstKillDone && game.audio) { this.firstKillDone = true; game.audio.startActionMusic(); }
        if (enemy.dropsWeapon && enemy.dropWeaponIndex >= 0) {
            game.pickups.push(new WeaponPickup(enemy.x, enemy.y, enemy.dropWeaponIndex));
        }
        if (enemy.isBoss) { const bb = document.getElementById('bossHealthBar'); if (bb) bb.style.display = 'none'; }
        // Score
        if (game.scoring) game.scoring.onEnemyKilled(enemy);
        // Item drops
        const drops = rollEnemyDrops(enemy, game);
        for (const d of drops) game.droppedItems.push(d);
    }

    update(dt, game) {
        switch (this.waveState) {
            case 'waiting':
                this.clearTimer -= dt;
                if (this.clearTimer <= 0) this.startNextWave(game);
                break;
            case 'announcing':
                this.announceTimer -= dt;
                if (this.announceTimer <= 0) {
                    this.waveState = 'spawning';
                    const wEl = document.getElementById('waveAnnounce'); if (wEl) wEl.style.display = 'none';
                }
                break;
            case 'spawning':
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0 && this.enemiesSpawned < this.totalEnemiesForWave) {
                    this.spawnTimer = this.spawnInterval;
                    const wdi = WEAPON_DROPS[this.currentWave];
                    if (wdi !== undefined && !this.weaponEliteSpawned && this.enemiesSpawned >= this.totalEnemiesForWave - 3) {
                        this._spawnEnemy(game, 'blue', true, wdi); this.weaponEliteSpawned = true; return;
                    }
                    if (this.currentWave > CONFIG.WAVES.bossStartWave && this.currentWave % CONFIG.WAVES.bossInterval === 0 && !this.bossSpawned && this.enemiesSpawned >= this.totalEnemiesForWave - 2) {
                        this._spawnBoss(game); return;
                    }
                    this._spawnEnemy(game, this._getEnemyType(), false, -1);
                }
                if (this.enemiesSpawned >= this.totalEnemiesForWave) this.waveState = 'fighting';
                break;
            case 'fighting':
                const wdi = WEAPON_DROPS[this.currentWave];
                if (wdi !== undefined && !this.weaponEliteSpawned) { this._spawnEnemy(game, 'blue', true, wdi); this.weaponEliteSpawned = true; }
                if (this.currentWave > CONFIG.WAVES.bossStartWave && this.currentWave % CONFIG.WAVES.bossInterval === 0 && !this.bossSpawned) this._spawnBoss(game);
                if (game.enemies.filter(e => e.alive).length === 0 && game.pickups.length === 0) {
                    this.waveState = 'cleared'; this.clearTimer = CONFIG.WAVES.clearDelay;
                }
                break;
            case 'cleared':
                this.clearTimer -= dt;
                if (this.clearTimer <= 0) { this.waveState = 'waiting'; this.clearTimer = 0; }
                break;
        }
        // Boss HP bar
        const boss = game.enemies.find(e => e.isBoss && e.alive);
        const bb = document.getElementById('bossHealthBar');
        if (bb) {
            if (boss) {
                bb.style.display = 'block';
                const hp = (boss.health / boss.maxHealth) * 100;
                const fill = document.getElementById('bossHpFill');
                const txt = document.getElementById('bossHpText');
                if (fill) fill.style.width = hp + '%';
                if (txt) txt.textContent = `${Math.ceil(boss.health)} / ${Math.ceil(boss.maxHealth)}`;
            } else { bb.style.display = 'none'; }
        }
    }
    startGame(game) {
        this.currentWave = 0; this.totalKills = 0; this.firstKillDone = false;
        this.waveState = 'waiting'; this.clearTimer = 1;
    }
}
