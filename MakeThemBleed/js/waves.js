// ===== WAVE MANAGER =====
// Handles wave progression, enemy spawning, difficulty scaling

class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.enemiesSpawned = 0;
        this.totalEnemiesForWave = 0;
        this.enemiesAlive = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 0.8; // seconds between spawns
        this.waveState = 'waiting'; // waiting, announcing, spawning, fighting, cleared
        this.announceTimer = 0;
        this.clearTimer = 0;
        this.totalKills = 0;
        this.firstKillDone = false;

        // Track weapon drop elite spawned for current wave
        this.weaponEliteSpawned = false;
        this.bossSpawned = false;
    }

    getWaveMultiplier() {
        return Math.pow(1.15, this.currentWave);
    }

    getEnemyCountForWave() {
        return Math.floor(5 + this.currentWave * 2.5);
    }

    getSpawnInterval() {
        // Faster spawns at higher waves
        return Math.max(0.2, 0.8 - this.currentWave * 0.02);
    }

    startNextWave(game) {
        this.currentWave++;
        this.enemiesSpawned = 0;
        this.totalEnemiesForWave = this.getEnemyCountForWave();
        this.spawnInterval = this.getSpawnInterval();
        this.spawnTimer = 0;
        this.weaponEliteSpawned = false;
        this.bossSpawned = false;

        // Show announcement
        this.waveState = 'announcing';
        this.announceTimer = 2;

        // Play wave start sound
        if (game.audio) game.audio.playWaveStart();

        // Show wave text
        const waveEl = document.getElementById('waveAnnounce');
        const waveTextEl = document.getElementById('waveText');
        if (waveEl && waveTextEl) {
            waveTextEl.textContent = `WAVE ${this.currentWave}`;
            waveEl.style.display = 'block';
            // Re-trigger animation
            waveTextEl.style.animation = 'none';
            waveTextEl.offsetHeight; // force reflow
            waveTextEl.style.animation = 'waveIn 0.5s ease-out';
        }
    }

    _getEnemyType() {
        const wave = this.currentWave;
        const roll = Math.random();

        if (wave <= 5) {
            if (roll < 0.70) return 'green';
            return 'yellow';
        } else if (wave <= 10) {
            if (roll < 0.25) return 'green';
            if (roll < 0.60) return 'yellow';
            if (roll < 0.90) return 'red';
            return 'blue';
        } else if (wave <= 15) {
            if (roll < 0.10) return 'green';
            if (roll < 0.30) return 'yellow';
            if (roll < 0.65) return 'red';
            if (roll < 0.92) return 'blue';
            return 'blue';
        } else if (wave <= 20) {
            if (roll < 0.05) return 'green';
            if (roll < 0.15) return 'yellow';
            if (roll < 0.45) return 'red';
            return 'blue';
        } else {
            // Post wave 20 - intense mix
            if (roll < 0.03) return 'green';
            if (roll < 0.10) return 'yellow';
            if (roll < 0.40) return 'red';
            return 'blue';
        }
    }

    _getSpawnPosition(mapWidth, mapHeight) {
        const side = Math.floor(Math.random() * 4);
        const margin = 30; // spawn just outside the visible edges
        switch (side) {
            case 0: return { x: Math.random() * mapWidth, y: margin }; // top
            case 1: return { x: mapWidth - margin, y: Math.random() * mapHeight }; // right
            case 2: return { x: Math.random() * mapWidth, y: mapHeight - margin }; // bottom
            case 3: return { x: margin, y: Math.random() * mapHeight }; // left
        }
    }

    _spawnEnemy(game, typeName, dropsWeapon, dropWeaponIndex) {
        const pos = this._getSpawnPosition(game.map.width, game.map.height);
        const multiplier = this.getWaveMultiplier();
        const enemy = new Enemy(pos.x, pos.y, typeName, multiplier);

        if (dropsWeapon) {
            enemy.dropsWeapon = true;
            enemy.dropWeaponIndex = dropWeaponIndex;
        }

        game.enemies.push(enemy);
        this.enemiesSpawned++;
    }

    _spawnBoss(game) {
        const pos = this._getSpawnPosition(game.map.width, game.map.height);
        const multiplier = this.getWaveMultiplier();
        const boss = new Enemy(pos.x, pos.y, 'black', multiplier);
        game.enemies.push(boss);
        this.bossSpawned = true;
        this.enemiesSpawned++;

        // Show boss health bar
        const bossBar = document.getElementById('bossHealthBar');
        if (bossBar) bossBar.style.display = 'block';

        // Sound
        if (game.audio) game.audio.playBossAppear();

        // Camera shake
        game.camera.shake(8, 0.5);
    }

    onEnemyKilled(enemy, game) {
        this.totalKills++;

        // Start action music on first kill
        if (!this.firstKillDone && game.audio) {
            this.firstKillDone = true;
            game.audio.startActionMusic();
        }

        // Handle weapon drops
        if (enemy.dropsWeapon && enemy.dropWeaponIndex >= 0) {
            const pickup = new WeaponPickup(enemy.x, enemy.y, enemy.dropWeaponIndex);
            game.pickups.push(pickup);
        }

        // Hide boss bar if boss died
        if (enemy.isBoss) {
            const bossBar = document.getElementById('bossHealthBar');
            if (bossBar) bossBar.style.display = 'none';
        }
    }

    update(dt, game) {
        switch (this.waveState) {
            case 'waiting':
                // Start first wave or wait after clear
                this.clearTimer -= dt;
                if (this.clearTimer <= 0) {
                    this.startNextWave(game);
                }
                break;

            case 'announcing':
                this.announceTimer -= dt;
                if (this.announceTimer <= 0) {
                    this.waveState = 'spawning';
                    // Hide announcement
                    const waveEl = document.getElementById('waveAnnounce');
                    if (waveEl) waveEl.style.display = 'none';
                }
                break;

            case 'spawning':
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0 && this.enemiesSpawned < this.totalEnemiesForWave) {
                    this.spawnTimer = this.spawnInterval;

                    // Check if we need to spawn weapon-drop elite
                    const weaponDropIdx = WEAPON_DROPS[this.currentWave];
                    if (weaponDropIdx !== undefined && !this.weaponEliteSpawned) {
                        // Spawn weapon-drop elite as one of the last few enemies
                        if (this.enemiesSpawned >= this.totalEnemiesForWave - 3) {
                            this._spawnEnemy(game, 'blue', true, weaponDropIdx);
                            this.weaponEliteSpawned = true;
                            return;
                        }
                    }

                    // Check if we need to spawn a boss
                    if (this.currentWave > 20 && this.currentWave % 5 === 0 && !this.bossSpawned) {
                        if (this.enemiesSpawned >= this.totalEnemiesForWave - 2) {
                            this._spawnBoss(game);
                            return;
                        }
                    }

                    // Normal enemy spawn
                    const typeName = this._getEnemyType();
                    this._spawnEnemy(game, typeName, false, -1);
                }

                // If all enemies spawned, switch to fighting
                if (this.enemiesSpawned >= this.totalEnemiesForWave) {
                    this.waveState = 'fighting';
                }
                break;

            case 'fighting':
                // Also keep spawning weapon drop elite if not yet
                const weaponDropIdx = WEAPON_DROPS[this.currentWave];
                if (weaponDropIdx !== undefined && !this.weaponEliteSpawned) {
                    this._spawnEnemy(game, 'blue', true, weaponDropIdx);
                    this.weaponEliteSpawned = true;
                }

                // Check if boss needs to spawn
                if (this.currentWave > 20 && this.currentWave % 5 === 0 && !this.bossSpawned) {
                    this._spawnBoss(game);
                }

                // Check if all enemies are dead
                const aliveCount = game.enemies.filter(e => e.alive).length;
                if (aliveCount === 0 && game.pickups.length === 0) {
                    this.waveState = 'cleared';
                    this.clearTimer = 3; // 3 second break between waves
                }
                break;

            case 'cleared':
                this.clearTimer -= dt;
                if (this.clearTimer <= 0) {
                    this.waveState = 'waiting';
                    this.clearTimer = 0;
                }
                break;
        }

        // Update boss health bar
        this._updateBossBar(game);
    }

    _updateBossBar(game) {
        const boss = game.enemies.find(e => e.isBoss && e.alive);
        const bossBar = document.getElementById('bossHealthBar');
        if (!bossBar) return;

        if (boss) {
            bossBar.style.display = 'block';
            const hpPercent = (boss.health / boss.maxHealth) * 100;
            const fill = document.getElementById('bossHpFill');
            const text = document.getElementById('bossHpText');
            if (fill) fill.style.width = hpPercent + '%';
            if (text) text.textContent = `${Math.ceil(boss.health)} / ${Math.ceil(boss.maxHealth)}`;
        } else {
            bossBar.style.display = 'none';
        }
    }

    startGame(game) {
        this.currentWave = 0;
        this.totalKills = 0;
        this.firstKillDone = false;
        this.waveState = 'waiting';
        this.clearTimer = 1; // 1 second before first wave
    }
}
