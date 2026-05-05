// ===== MENU MANAGER =====
// Main menu, game over, pause, options with volume sliders
class MenuManager {
    constructor() {
        this.mainMenu = document.getElementById('mainMenu');
        this.gameOver = document.getElementById('gameOver');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.optionsMenu = document.getElementById('optionsMenu');
        this.onPlay = null; this.onRestart = null; this.onMainMenu = null; this.onResume = null;
        this._setupButtons();
        this._setupMenuParticles();
    }
    _setupButtons() {
        const btns = document.querySelectorAll('.menu-btn');
        btns.forEach(b => b.addEventListener('mouseenter', () => { if (window.game && window.game.audio) window.game.audio.playUIHover(); }));

        document.getElementById('playBtn')?.addEventListener('click', () => { this._click(); if (this.onPlay) this.onPlay(); });
        document.getElementById('restartBtn')?.addEventListener('click', () => { this._click(); if (this.onRestart) this.onRestart(); });
        document.getElementById('menuBtn')?.addEventListener('click', () => { this._click(); if (this.onMainMenu) this.onMainMenu(); });
        document.getElementById('resumeBtn')?.addEventListener('click', () => { this._click(); if (this.onResume) this.onResume(); });
        document.getElementById('pauseOptionsBtn')?.addEventListener('click', () => { this._click(); this.showOptions(); });
        document.getElementById('pauseMenuBtn')?.addEventListener('click', () => { this._click(); if (this.onMainMenu) this.onMainMenu(); });
        document.getElementById('optionsBackBtn')?.addEventListener('click', () => { this._click(); this.hideOptions(); });
        document.getElementById('gameOverOptionsBtn')?.addEventListener('click', () => { this._click(); this.showOptions(); });
        document.getElementById('mainMenuOptionsBtn')?.addEventListener('click', () => { this._click(); this.showOptions(); });

        // Volume sliders
        const musicSlider = document.getElementById('musicVolume');
        const sfxSlider = document.getElementById('sfxVolume');
        if (musicSlider) musicSlider.addEventListener('input', (e) => { if (window.game && window.game.audio) window.game.audio.setMusicVolume(parseFloat(e.target.value)); });
        if (sfxSlider) sfxSlider.addEventListener('input', (e) => { if (window.game && window.game.audio) window.game.audio.setSFXVolume(parseFloat(e.target.value)); });
    }
    _click() { if (window.game && window.game.audio) window.game.audio.playUIClick(); }
    _setupMenuParticles() {
        const c = document.getElementById('menuParticles');
        if (!c) return;
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div'), sz = 2 + Math.random() * 4, dur = 8 + Math.random() * 12, del = Math.random() * dur, sx = Math.random() * 100;
            p.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;background:${Math.random() > 0.5 ? 'rgba(255,30,0,0.3)' : 'rgba(255,100,0,0.2)'};border-radius:50%;left:${sx}%;bottom:-10px;animation:floatUp ${dur}s linear ${del}s infinite;pointer-events:none;`;
            c.appendChild(p);
        }
        if (!document.getElementById('menuParticleStyle')) {
            const s = document.createElement('style'); s.id = 'menuParticleStyle';
            s.textContent = `@keyframes floatUp{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100vh) translateX(${(Math.random() - 0.5) * 100}px);opacity:0}}`;
            document.head.appendChild(s);
        }
    }
    showMainMenu() { this.mainMenu.style.display = 'flex'; this.gameOver.style.display = 'none'; if (this.pauseMenu) this.pauseMenu.style.display = 'none'; document.body.classList.remove('playing'); }
    hideMainMenu() { this.mainMenu.style.display = 'none'; document.body.classList.add('playing'); }
    showGameOver(wave, kills, scoring) {
        document.getElementById('finalWave').textContent = wave;
        document.getElementById('finalKills').textContent = kills;
        document.getElementById('finalScore').textContent = scoring ? scoring.totalScore : 0;
        // Build score breakdown
        const tbody = document.getElementById('scoreBreakdown');
        if (tbody && scoring) {
            tbody.innerHTML = '';
            const rows = scoring.getBreakdown();
            const colors = { green: '#22cc44', yellow: '#ddcc22', red: '#dd3333', blue: '#3366ff', black: '#888' };
            for (const r of rows) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="color:${colors[r.type] || '#fff'}">${r.name}</td><td>${r.kills}</td><td>${r.points}</td>`;
                tbody.appendChild(tr);
            }
            if (scoring.specialKills > 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="color:#ffaa00">Special Bonus</td><td>${scoring.specialKills}</td><td>${scoring.specialPoints}</td>`;
                tbody.appendChild(tr);
            }
        }
        this.gameOver.style.display = 'flex'; document.body.classList.remove('playing');
    }
    hideGameOver() { this.gameOver.style.display = 'none'; document.body.classList.add('playing'); }
    showPause() { if (this.pauseMenu) this.pauseMenu.style.display = 'flex'; document.body.classList.remove('playing'); }
    hidePause() { if (this.pauseMenu) this.pauseMenu.style.display = 'none'; document.body.classList.add('playing'); }
    showOptions() { if (this.optionsMenu) this.optionsMenu.style.display = 'flex'; }
    hideOptions() { if (this.optionsMenu) this.optionsMenu.style.display = 'none'; }
}
