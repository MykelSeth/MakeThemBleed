// ===== AUDIO MANAGER =====
// Uses real SFX files from SFX/ folder + music from Music/ folder.
// Each SFX has a pool of Audio clones for overlapping playback.

class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.masterVolume = CONFIG.AUDIO.defaultMasterVolume;
        this.sfxVolume = CONFIG.AUDIO.defaultSFXVolume;
        this.musicVolume = CONFIG.AUDIO.defaultMusicVolume;

        // Music (pre-load so menu music can play immediately)
        this.menuMusic = new Audio('Music/Make Them Bleed Soundtrack - Menu Theme.mp3');
        this.menuMusic.loop = true;
        this.menuMusic.volume = this.musicVolume;

        this.actionTracks = [];
        for (let i = 1; i <= 4; i++) {
            const t = new Audio(`Music/Make Them Bleed Soundtrack - Action Theme ${i}.mp3`);
            t.volume = this.musicVolume;
            t.addEventListener('ended', () => this._onTrackEnded());
            this.actionTracks.push(t);
        }
        this.currentTrackIndex = -1;
        this.shuffledOrder = [];
        this.actionMusicStarted = false;

        // Ambient (loops)
        this.ambient = new Audio('SFX/Ambient Environment.mp3');
        this.ambient.loop = true;
        this.ambient.volume = this.sfxVolume * 0.3;

        // SFX pools — each key maps to an array of Audio clones
        this.sfxPools = {};
        this.sfxIndex = {};  // round-robin index per pool
        this._pendingMenuMusic = false;

        this._initSFXPools();
    }

    _initSFXPools() {
        const poolSize = CONFIG.AUDIO.sfxPoolSize;
        const sfxMap = {
            // Weapons
            pistol: 'SFX/Pistol.mp3',
            smg: 'SFX/SMG.mp3',
            shotgun: 'SFX/Shotgun.mp3',
            ar: 'SFX/Assault Rifle.mp3',
            minigun: 'SFX/Minigun.mp3',
            reload: 'SFX/Weapon Reload.mp3',
            // Alien
            alienAttack: 'SFX/Alien Attack.mp3',
            alienDeath: 'SFX/Alien Death.mp3',
            alienSpawn: 'SFX/Alien Spawn.mp3',
            alienElite: 'SFX/Alien Elite.mp3',
            alienBoss: 'SFX/Alien Boss.mp3',
            // Player
            footstep: 'SFX/Footstep.mp3',
            playerDeath: 'SFX/Player Death.mp3',
            // Items & Power-ups
            itemPickup: 'SFX/Item Pickup.mp3',
            freeze: 'SFX/Freeze.mp3',
            inferno: 'SFX/Inferno.mp3',
            fullAmmo: 'SFX/Full Ammo.mp3',
            unlimitedAmmo: 'SFX/Unlimited Ammo.mp3',
            nuke: 'SFX/Nuke.mp3',
            // UI & Environment
            uiSound: 'SFX/UI sound.mp3',
            wave: 'SFX/Wave.mp3'
        };

        for (const [key, path] of Object.entries(sfxMap)) {
            this.sfxPools[key] = [];
            this.sfxIndex[key] = 0;
            for (let i = 0; i < poolSize; i++) {
                const a = new Audio(path);
                a.volume = this.sfxVolume;
                this.sfxPools[key].push(a);
            }
        }
    }

    // Play a SFX from pool (round-robin for overlap)
    _play(key, volumeScale = 1.0) {
        const pool = this.sfxPools[key];
        if (!pool || pool.length === 0) return;
        const idx = this.sfxIndex[key] % pool.length;
        this.sfxIndex[key] = idx + 1;
        const a = pool[idx];
        a.volume = Math.min(1.0, this.sfxVolume * this.masterVolume * volumeScale);
        a.currentTime = 0;
        a.play().catch(() => { });
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            // If menu music was requested before init, play it now
            if (this._pendingMenuMusic) {
                this._pendingMenuMusic = false;
                this.playMenuMusic();
            }
        } catch (e) { console.warn('Audio init failed:', e); }
    }

    // ===== Volume Control =====
    setMusicVolume(v) {
        this.musicVolume = v;
        if (this.menuMusic) this.menuMusic.volume = v;
        this.actionTracks.forEach(t => t.volume = v);
    }
    setSFXVolume(v) {
        this.sfxVolume = v;
        // Update ambient
        if (this.ambient) this.ambient.volume = v * 0.3;
    }

    // ===== Music =====
    playMenuMusic() {
        if (!this.initialized) {
            this._pendingMenuMusic = true;
            // Still try to play — browsers may allow after user gesture
            if (this.menuMusic) {
                this.menuMusic.currentTime = 0;
                this.menuMusic.play().catch(() => { /* will play after init */ });
            }
            return;
        }
        this.stopActionMusic();
        if (this.menuMusic) {
            this.menuMusic.currentTime = 0;
            this.menuMusic.play().catch(() => { });
        }
    }
    stopMenuMusic() {
        if (this.menuMusic) { this.menuMusic.pause(); this.menuMusic.currentTime = 0; }
    }

    _shuffleActionTracks() {
        this.shuffledOrder = [0, 1, 2, 3];
        for (let i = 3; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledOrder[i], this.shuffledOrder[j]] = [this.shuffledOrder[j], this.shuffledOrder[i]];
        }
    }
    _onTrackEnded() {
        this.currentTrackIndex++;
        if (this.currentTrackIndex >= this.shuffledOrder.length) {
            this._shuffleActionTracks();
            this.currentTrackIndex = 0;
        }
        const t = this.actionTracks[this.shuffledOrder[this.currentTrackIndex]];
        t.currentTime = 0;
        t.play().catch(() => { });
    }

    startActionMusic() {
        if (this.actionMusicStarted) return;
        this.actionMusicStarted = true;
        this.stopMenuMusic();
        this._shuffleActionTracks();
        this.currentTrackIndex = 0;
        const t = this.actionTracks[this.shuffledOrder[0]];
        t.currentTime = 0;
        t.play().catch(() => { });
    }
    stopActionMusic() {
        this.actionMusicStarted = false;
        this.currentTrackIndex = -1;
        this.actionTracks.forEach(t => { t.pause(); t.currentTime = 0; });
    }
    stopAllMusic() { this.stopMenuMusic(); this.stopActionMusic(); }

    // ===== Ambient =====
    startWind() {
        if (this.ambient) {
            this.ambient.volume = this.sfxVolume * 0.3;
            this.ambient.currentTime = 0;
            this.ambient.play().catch(() => { });
        }
    }
    stopWind() {
        if (this.ambient) { this.ambient.pause(); this.ambient.currentTime = 0; }
    }

    // ===== Weapon SFX =====
    playShot(weaponIndex) {
        const keys = ['pistol', 'smg', 'shotgun', 'ar', 'minigun'];
        this._play(keys[weaponIndex] || 'pistol');
    }
    playReload() { this._play('reload', 0.8); }

    // ===== Alien SFX =====
    playAlienBite() { this._play('alienAttack', 0.7); }
    playEnemyHit() { this._play('alienAttack', 0.3); }
    playEnemyDeath() { this._play('alienDeath', 0.8); }
    playAlienSpawn() { this._play('alienSpawn', 0.5); }
    playEliteSpawn() { this._play('alienElite', 0.9); }
    playBossAppear() { this._play('alienBoss', 1.0); }

    // ===== Player SFX =====
    playPlayerFootstep() { this._play('footstep', 0.4); }
    playPlayerHit() { this._play('alienAttack', 0.6); }
    playPlayerDeath() { this._play('playerDeath', 1.0); }

    // ===== Item SFX =====
    playItemPickup() { this._play('itemPickup', 0.7); }
    playWeaponPickup() { this._play('itemPickup', 1.0); }
    playPowerUp() { this._play('uiSound', 0.6); }

    // ===== Power-up SFX =====
    playFreeze() { this._play('freeze', 1.0); }
    playInferno() { this._play('inferno', 1.0); }
    playFullAmmo() { this._play('fullAmmo', 1.0); }
    playUnlimitedAmmo() { this._play('unlimitedAmmo', 1.0); }
    playNuke() { this._play('nuke', 1.0); }

    // ===== UI SFX =====
    playUIClick() { this._play('uiSound', 0.5); }
    playUIHover() { this._play('uiSound', 0.2); }
    playWaveStart() { this._play('wave', 0.9); }
}
