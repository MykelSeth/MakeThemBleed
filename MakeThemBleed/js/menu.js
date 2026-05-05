// ===== MENU MANAGER =====
// Handles main menu and game over screen transitions

class MenuManager {
    constructor() {
        this.mainMenu = document.getElementById('mainMenu');
        this.gameOver = document.getElementById('gameOver');
        this.playBtn = document.getElementById('playBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.menuBtn = document.getElementById('menuBtn');

        this.onPlay = null;
        this.onRestart = null;
        this.onMainMenu = null;

        this._setupButtons();
        this._setupMenuParticles();
    }

    _setupButtons() {
        // Add hover sounds
        const buttons = document.querySelectorAll('.menu-btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (window.game && window.game.audio) {
                    window.game.audio.playUIHover();
                }
            });
        });

        this.playBtn.addEventListener('click', () => {
            if (window.game && window.game.audio) {
                window.game.audio.playUIClick();
            }
            if (this.onPlay) this.onPlay();
        });

        this.restartBtn.addEventListener('click', () => {
            if (window.game && window.game.audio) {
                window.game.audio.playUIClick();
            }
            if (this.onRestart) this.onRestart();
        });

        this.menuBtn.addEventListener('click', () => {
            if (window.game && window.game.audio) {
                window.game.audio.playUIClick();
            }
            if (this.onMainMenu) this.onMainMenu();
        });
    }

    _setupMenuParticles() {
        const container = document.getElementById('menuParticles');
        if (!container) return;

        // Create floating particle elements
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            const size = 2 + Math.random() * 4;
            const duration = 8 + Math.random() * 12;
            const delay = Math.random() * duration;
            const startX = Math.random() * 100;

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${Math.random() > 0.5 ? 'rgba(255, 30, 0, 0.3)' : 'rgba(255, 100, 0, 0.2)'};
                border-radius: 50%;
                left: ${startX}%;
                bottom: -10px;
                animation: floatUp ${duration}s linear ${delay}s infinite;
                pointer-events: none;
            `;
            container.appendChild(particle);
        }

        // Add the float animation dynamically
        if (!document.getElementById('menuParticleStyle')) {
            const style = document.createElement('style');
            style.id = 'menuParticleStyle';
            style.textContent = `
                @keyframes floatUp {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-100vh) translateX(${(Math.random() - 0.5) * 100}px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showMainMenu() {
        this.mainMenu.style.display = 'flex';
        this.gameOver.style.display = 'none';
        document.body.classList.remove('playing');
    }

    hideMainMenu() {
        this.mainMenu.style.display = 'none';
        document.body.classList.add('playing');
    }

    showGameOver(wave, kills) {
        document.getElementById('finalWave').textContent = wave;
        document.getElementById('finalKills').textContent = kills;
        this.gameOver.style.display = 'flex';
        document.body.classList.remove('playing');
    }

    hideGameOver() {
        this.gameOver.style.display = 'none';
        document.body.classList.add('playing');
    }
}
