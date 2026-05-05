// ===== AUDIO MANAGER =====
// Handles procedural SFX via Web Audio API and music playback via HTML Audio

class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.6;
        this.musicVolume = 0.4;

        // Music
        this.menuMusic = null;
        this.actionTracks = [];
        this.currentTrackIndex = -1;
        this.shuffledOrder = [];
        this.actionMusicStarted = false;
        this.isMusicPlaying = false;

        // Noise buffer for SFX
        this.noiseBuffer = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._createNoiseBuffer();
            this._loadMusic();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    _createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    _loadMusic() {
        // Menu theme
        this.menuMusic = new Audio('Music/Make Them Bleed Soundtrack - Menu Theme.mp3');
        this.menuMusic.loop = true;
        this.menuMusic.volume = this.musicVolume;

        // Action themes
        for (let i = 1; i <= 4; i++) {
            const track = new Audio(`Music/Make Them Bleed Soundtrack - Action Theme ${i}.mp3`);
            track.volume = this.musicVolume;
            track.addEventListener('ended', () => this._onTrackEnded());
            this.actionTracks.push(track);
        }
    }

    _shuffleActionTracks() {
        this.shuffledOrder = [0, 1, 2, 3];
        for (let i = this.shuffledOrder.length - 1; i > 0; i--) {
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
        const trackIdx = this.shuffledOrder[this.currentTrackIndex];
        this.actionTracks[trackIdx].currentTime = 0;
        this.actionTracks[trackIdx].play().catch(() => {});
    }

    // ===== Music Controls =====
    playMenuMusic() {
        this.stopActionMusic();
        if (this.menuMusic) {
            this.menuMusic.currentTime = 0;
            this.menuMusic.play().catch(() => {});
            this.isMusicPlaying = true;
        }
    }

    stopMenuMusic() {
        if (this.menuMusic) {
            this.menuMusic.pause();
            this.menuMusic.currentTime = 0;
        }
    }

    startActionMusic() {
        if (this.actionMusicStarted) return;
        this.actionMusicStarted = true;
        this.stopMenuMusic();
        this._shuffleActionTracks();
        this.currentTrackIndex = 0;
        const trackIdx = this.shuffledOrder[0];
        this.actionTracks[trackIdx].currentTime = 0;
        this.actionTracks[trackIdx].play().catch(() => {});
    }

    stopActionMusic() {
        this.actionMusicStarted = false;
        this.currentTrackIndex = -1;
        this.actionTracks.forEach(t => {
            t.pause();
            t.currentTime = 0;
        });
    }

    stopAllMusic() {
        this.stopMenuMusic();
        this.stopActionMusic();
    }

    // ===== SFX Generation =====
    _playNoise(duration, frequency, filterType, filterQ, volume, detune) {
        if (!this.ctx) return;
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType || 'bandpass';
        filter.frequency.value = frequency || 1000;
        filter.Q.value = filterQ || 1;

        const gain = this.ctx.createGain();
        const vol = (volume || 0.3) * this.sfxVolume * this.masterVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(this.ctx.currentTime);
        source.stop(this.ctx.currentTime + duration);
    }

    _playTone(frequency, duration, type, volume, pitchEnd) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        if (pitchEnd) {
            osc.frequency.exponentialRampToValueAtTime(pitchEnd, this.ctx.currentTime + duration);
        }

        const gain = this.ctx.createGain();
        const vol = (volume || 0.2) * this.sfxVolume * this.masterVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    // Weapon SFX
    playPistolShot() {
        this._playNoise(0.08, 2500, 'bandpass', 2, 0.35);
        this._playTone(300, 0.05, 'square', 0.1, 100);
    }

    playSMGShot() {
        this._playNoise(0.04, 3000, 'bandpass', 3, 0.2);
        this._playTone(400, 0.03, 'square', 0.08, 200);
    }

    playShotgunBlast() {
        this._playNoise(0.15, 800, 'lowpass', 1, 0.5);
        this._playNoise(0.1, 2000, 'bandpass', 1, 0.3);
        this._playTone(150, 0.1, 'sawtooth', 0.15, 50);
    }

    playAssaultRifleShot() {
        this._playNoise(0.05, 3500, 'bandpass', 2, 0.25);
        this._playTone(350, 0.04, 'square', 0.1, 150);
    }

    playMinigunShot() {
        this._playNoise(0.025, 4000, 'highpass', 2, 0.15);
        this._playTone(500, 0.02, 'square', 0.06, 300);
    }

    playShot(weaponIndex) {
        const shots = [
            () => this.playPistolShot(),
            () => this.playSMGShot(),
            () => this.playShotgunBlast(),
            () => this.playAssaultRifleShot(),
            () => this.playMinigunShot()
        ];
        if (shots[weaponIndex]) shots[weaponIndex]();
    }

    // Enemy SFX
    playEnemyHit() {
        this._playNoise(0.06, 600, 'lowpass', 2, 0.2);
        this._playTone(200, 0.08, 'sine', 0.1, 80);
    }

    playEnemyDeath() {
        this._playNoise(0.2, 400, 'lowpass', 1, 0.35);
        this._playTone(400, 0.3, 'sawtooth', 0.15, 50);
        this._playTone(300, 0.25, 'sine', 0.1, 30);
    }

    // Player SFX
    playPlayerHit() {
        this._playNoise(0.1, 500, 'lowpass', 1, 0.4);
        this._playTone(100, 0.15, 'sine', 0.2, 40);
    }

    // Pickup SFX
    playWeaponPickup() {
        this._playTone(440, 0.1, 'sine', 0.2);
        setTimeout(() => {
            if (this.ctx) this._playTone(880, 0.15, 'sine', 0.25);
        }, 100);
        setTimeout(() => {
            if (this.ctx) this._playTone(1320, 0.2, 'sine', 0.2);
        }, 200);
    }

    // Wave SFX
    playWaveStart() {
        this._playTone(200, 0.4, 'sawtooth', 0.15, 600);
        this._playNoise(0.3, 1000, 'bandpass', 2, 0.1);
    }

    // Boss appear
    playBossAppear() {
        this._playTone(60, 0.8, 'sawtooth', 0.3, 30);
        this._playNoise(0.6, 200, 'lowpass', 1, 0.3);
        this._playTone(80, 0.6, 'square', 0.15, 40);
    }

    // UI SFX
    playUIHover() {
        this._playTone(800, 0.05, 'sine', 0.08);
    }

    playUIClick() {
        this._playTone(600, 0.08, 'square', 0.12);
        this._playTone(900, 0.06, 'sine', 0.08);
    }
}
