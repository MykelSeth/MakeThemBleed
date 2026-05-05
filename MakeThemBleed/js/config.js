// ===== GAME CONFIGURATION =====
// Change any value below to instantly tune the game.
// This file must be loaded FIRST before all other scripts.

const CONFIG = {

    // ===== PLAYER =====
    PLAYER: {
        radius: 22,
        speed: 220,
        health: 100,
        damageCooldown: 0.5,       // invincibility after being hit (seconds)
        footstepInterval: 0.35,    // seconds between footstep sounds
        backwardSpeedPenalty: 0.4   // 0 = no penalty, 0.4 = 60% speed when moving backward
    },

    // ===== WEAPONS =====
    // Each weapon: name, damage, fireRate (shots/sec), projectileCount, spread (radians),
    // projectileSpeed, bulletSize, bulletColor, trailColor, knockback,
    // magSize, reserveAmmo, reloadTime, gunLength, gunWidth
    WEAPONS: [
        { name: 'Pistol', damage: 15, fireRate: 5, projectileCount: 1, spread: 0, projectileSpeed: 800, bulletSize: 2, bulletColor: '#ffff00', trailColor: '#ffaa00', knockback: 2, magSize: 15, reserveAmmo: 150, reloadTime: 1.2, gunLength: 16, gunWidth: 4 },
        { name: 'SMG', damage: 45, fireRate: 15, projectileCount: 1, spread: 0.09, projectileSpeed: 1000, bulletSize: 3, bulletColor: '#00ff88', trailColor: '#00aa44', knockback: 1, magSize: 60, reserveAmmo: 600, reloadTime: 1.5, gunLength: 20, gunWidth: 4 },
        { name: 'Shotgun', damage: 100, fireRate: 3, projectileCount: 15, spread: 0.6, projectileSpeed: 1250, bulletSize: 5, bulletColor: '#ff8800', trailColor: '#ff4400', knockback: 5, magSize: 10, reserveAmmo: 100, reloadTime: 2, gunLength: 26, gunWidth: 5 },
        { name: 'Assault Rifle', damage: 400, fireRate: 10, projectileCount: 1, spread: 0.04, projectileSpeed: 2500, bulletSize: 4, bulletColor: '#00aaff', trailColor: '#0066ff', knockback: 3, magSize: 40, reserveAmmo: 400, reloadTime: 1.8, gunLength: 35, gunWidth: 5 },
        { name: 'Minigun', damage: 800, fireRate: 75, projectileCount: 1, spread: 0.1, projectileSpeed: 1000, bulletSize: 3.5, bulletColor: '#ff44ff', trailColor: '#aa00ff', knockback: 1, magSize: 250, reserveAmmo: 2500, reloadTime: 3.0, gunLength: 50, gunWidth: 7 }
    ],

    // Wave → weapon index unlocked from elite kill
    WEAPON_DROPS: { 5: 1, 10: 2, 15: 3, 20: 4 },

    // ===== ENEMIES =====
    // baseHP, baseDamage, baseSpeed are BEFORE wave multiplier
    ENEMIES: {
        green: { name: 'Drone', baseHP: 20, baseDamage: 5, baseSpeed: 80, radius: 17, color: '#22cc44', inner: '#118822', eye: '#ccffcc', glow: 'rgba(34,204,68,0.3)', specialChance: 0.20, variants: 5 },
        yellow: { name: 'Stalker', baseHP: 50, baseDamage: 10, baseSpeed: 100, radius: 20, color: '#ddcc22', inner: '#aa9911', eye: '#ffffcc', glow: 'rgba(221,204,34,0.3)', specialChance: 0.15, variants: 5 },
        red: { name: 'Brute', baseHP: 100, baseDamage: 20, baseSpeed: 120, radius: 24, color: '#dd3333', inner: '#991111', eye: '#ffcccc', glow: 'rgba(221,51,51,0.3)', specialChance: 0.10, variants: 5 },
        blue: { name: 'Elite', baseHP: 250, baseDamage: 35, baseSpeed: 140, radius: 26, color: '#3366ff', inner: '#1133aa', eye: '#ccddff', glow: 'rgba(51,102,255,0.3)', specialChance: 0.05, variants: 3 },
        black: { name: 'Overlord', baseHP: 1000, baseDamage: 50, baseSpeed: 60, radius: 42, color: '#333333', inner: '#111111', eye: '#ff4444', glow: 'rgba(80,0,0,0.4)', specialChance: 0.02, variants: 1 }
    },

    // Special effect multipliers
    SPECIAL_EFFECTS: {
        fast: { name: 'Fast', speedMult: 1.5, armorAdd: 0, hpMult: 1, dmgMult: 1 },
        slow: { name: 'Armored', speedMult: 0.7, armorAdd: 0.5, hpMult: 1, dmgMult: 1 },
        moreHP: { name: 'Tough', speedMult: 1, armorAdd: 0, hpMult: 2, dmgMult: 1, radiusMult: 1.15 },
        moreDamage: { name: 'Deadly', speedMult: 1, armorAdd: 0, hpMult: 1, dmgMult: 2 }
    },

    // ===== WAVES =====
    WAVES: {
        difficultyExponent: 1.15,        // wave multiplier = exponent ^ waveNumber
        baseEnemyCount: 5,               // enemies at wave 1
        enemyCountPerWave: 2.5,          // added enemies per wave
        baseSpawnInterval: 0.8,          // seconds between spawns at wave 1
        spawnIntervalReduction: 0.02,    // decrease per wave
        minSpawnInterval: 0.2,
        specialEffectsStartWave: 10,     // no specials before this
        specialEffectsRampEndWave: 20,   // full ramp by this wave
        specialEffectsCommonInterval: 5, // after rampEnd, increases every N waves
        eliteWaves: [5, 10, 15, 20],     // exactly 1 elite spawned at these waves
        bossInterval: 5,                 // after wave 20, boss every N waves
        bossStartWave: 20,
        clearDelay: 3,                   // seconds of pause between waves
        announceTime: 2
    },

    // ===== SCORING =====
    SCORING: {
        pointsPerType: { green: 100, yellow: 250, red: 500, blue: 2000, black: 10000 },
        effectBonus: { fast: 50, slow: 75, moreHP: 100, moreDamage: 150 },
        multiEffectMultiplier: { 2: 1.5, 3: 2, 4: 3, 5: 5 }  // numEffects → bonus multiplier
    },

    // ===== ITEMS & POWER-UPS =====
    ITEMS: {
        dropChance: 0.15,           // chance of any item on enemy kill
        medkitRatio: 0.55,          // within drops, ratio that are medkits
        medkitHeal: 25,
        ammoAmounts: { 0: 45, 1: 300, 2: 50, 3: 200, 4: 1250 },  // weapon index → ammo per pickup
        despawnTime: 15
    },

    POWERUPS: {
        dropChance: 0.03,
        freezeDuration: 5,
        flameDuration: 8,
        unlimitedAmmoDuration: 10,
        nukeFlashDuration: 2,
        despawnTime: 20
    },

    // ===== CAMERA =====
    CAMERA: {
        crosshairFollowRatio: 0.3,    // 0 = no follow, 1 = full follow toward mouse
        maxLookAhead: 180,            // max pixels camera shifts toward crosshair
        smoothSpeed: 6                // camera lerp speed
    },

    // ===== MAP =====
    MAP: {
        width: 3000,
        height: 3000,
        tileSize: 80,
        borderWidth: 40
    },

    // ===== AUDIO =====
    AUDIO: {
        defaultMasterVolume: 0.7,
        defaultSFXVolume: 0.85,
        defaultMusicVolume: 0.3,
        sfxPoolSize: 4   // copies of each SFX for overlapping playback
    }
};
