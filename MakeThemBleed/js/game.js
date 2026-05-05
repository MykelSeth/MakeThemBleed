// ===== MAIN GAME =====
// Game loop, state management, collision detection, input handling

class Game {
    constructor() {
        // Canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Input
        this.keys = {};
        this.mouse = { screenX: 0, screenY: 0, worldX: 0, worldY: 0, down: false };
        this.scrollDelta = 0;

        // Game state
        this.state = 'menu'; // menu, playing, gameover

        // Systems
        this.audio = new AudioManager();
        this.camera = new Camera();
        this.map = new GameMap();
        this.particles = new ParticleSystem();
        this.hud = new HUD();
        this.waveManager = new WaveManager();
        this.menuManager = new MenuManager();

        // Entities
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.pickups = [];

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;

        // Setup
        this._setupInput();
        this._setupMenuCallbacks();

        // Make globally accessible
        window.game = this;

        // Start menu
        this.showMainMenu();

        // Start game loop
        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // ===== INPUT =====
    _setupInput() {
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Initialize audio on first input
            if (!this.audio.initialized) {
                this.audio.init();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.screenX = e.clientX;
            this.mouse.screenY = e.clientY;
            // Update world coordinates
            const world = this.camera.screenToWorld(e.clientX, e.clientY);
            this.mouse.worldX = world.x;
            this.mouse.worldY = world.y;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                // Initialize audio on first click
                if (!this.audio.initialized) {
                    this.audio.init();
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            this.scrollDelta = e.deltaY;
        });

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // ===== MENU CALLBACKS =====
    _setupMenuCallbacks() {
        this.menuManager.onPlay = () => {
            if (!this.audio.initialized) this.audio.init();
            this.startGame();
        };

        this.menuManager.onRestart = () => {
            this.startGame();
        };

        this.menuManager.onMainMenu = () => {
            this.showMainMenu();
        };
    }

    // ===== STATE TRANSITIONS =====
    showMainMenu() {
        this.state = 'menu';
        this.menuManager.showMainMenu();
        this.menuManager.hideGameOver();
        if (this.audio.initialized) {
            this.audio.stopActionMusic();
            this.audio.playMenuMusic();
        }
    }

    startGame() {
        this.state = 'playing';
        this.menuManager.hideMainMenu();
        this.menuManager.hideGameOver();

        // Reset entities
        this.player = new Player(this.map.width / 2, this.map.height / 2);
        this.enemies = [];
        this.projectiles = [];
        this.pickups = [];
        this.particles = new ParticleSystem();

        // Reset wave manager
        this.waveManager = new WaveManager();
        this.waveManager.startGame(this);

        // Stop menu music (action music starts on first kill)
        if (this.audio.initialized) {
            this.audio.stopMenuMusic();
        }

        // Hide boss bar
        const bossBar = document.getElementById('bossHealthBar');
        if (bossBar) bossBar.style.display = 'none';

        document.body.classList.add('playing');
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.stopActionMusic();
        this.menuManager.showGameOver(
            this.waveManager.currentWave,
            this.waveManager.totalKills
        );

        // Hide boss bar
        const bossBar = document.getElementById('bossHealthBar');
        if (bossBar) bossBar.style.display = 'none';

        // Hide wave announce
        const waveEl = document.getElementById('waveAnnounce');
        if (waveEl) waveEl.style.display = 'none';
    }

    // ===== GAME LOOP =====
    loop(timestamp) {
        // Calculate delta time
        if (this.lastTime === 0) this.lastTime = timestamp;
        this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
        this.lastTime = timestamp;

        // Update mouse world coords
        const world = this.camera.screenToWorld(this.mouse.screenX, this.mouse.screenY);
        this.mouse.worldX = world.x;
        this.mouse.worldY = world.y;

        // Update & Render based on state
        if (this.state === 'playing') {
            this.update(this.deltaTime);
        }

        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    // ===== UPDATE =====
    update(dt) {
        // Update player
        this.player.update(dt, this);

        // Check player death
        if (!this.player.alive) {
            this.gameOver();
            return;
        }

        // Update projectiles
        for (const p of this.projectiles) {
            p.update(dt);
            // Out of map bounds
            if (p.x < 0 || p.x > this.map.width || p.y < 0 || p.y > this.map.height) {
                p.alive = false;
            }
        }

        // Update enemies
        for (const e of this.enemies) {
            e.update(dt, this);
        }

        // Projectile-Enemy collision
        for (const p of this.projectiles) {
            if (!p.alive) continue;
            for (const e of this.enemies) {
                if (!e.alive) continue;
                const dx = p.x - e.x;
                const dy = p.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < p.radius + e.drawRadius) {
                    const killed = e.takeDamage(p.damage, this);
                    p.alive = false;

                    // Effects
                    this.particles.spawnBlood(e.x, e.y, 5);
                    this.audio.playEnemyHit();

                    if (killed) {
                        this.particles.spawnDeathBurst(e.x, e.y);
                        this.audio.playEnemyDeath();
                        this.camera.shake(3, 0.1);
                        this.waveManager.onEnemyKilled(e, this);
                    }
                    break;
                }
            }
        }

        // Update pickups
        for (const pk of this.pickups) {
            pk.update(dt);
            // Check pickup collision with player
            const dx = pk.x - this.player.x;
            const dy = pk.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pk.radius + this.player.radius) {
                this.player.addWeapon(pk.weaponIndex);
                pk.collected = true;
                this.particles.spawnPickupEffect(pk.x, pk.y);
                this.audio.playWeaponPickup();
            }
        }

        // Clean up dead entities
        this.projectiles = this.projectiles.filter(p => p.alive);
        this.enemies = this.enemies.filter(e => e.alive);
        this.pickups = this.pickups.filter(pk => !pk.collected);

        // Update wave manager
        this.waveManager.update(dt, this);

        // Update particles
        this.particles.update(dt);

        // Update camera
        this.camera.follow(this.player, this.map.width, this.map.height, this.canvas.width, this.canvas.height);
        this.camera.update(dt);

        // Reset scroll
        this.scrollDelta = 0;
    }

    // ===== RENDER =====
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        if (this.state === 'playing' || this.state === 'gameover') {
            // Apply camera transform
            this.camera.apply(ctx);

            // Draw map
            this.map.draw(ctx, this.camera, w, h);

            // Draw pickups
            for (const pk of this.pickups) {
                pk.draw(ctx);
            }

            // Draw particles (behind entities)
            this.particles.draw(ctx);

            // Draw enemies
            for (const e of this.enemies) {
                e.draw(ctx);
            }

            // Draw player
            if (this.player) {
                this.player.draw(ctx);
            }

            // Draw projectiles (on top)
            for (const p of this.projectiles) {
                p.draw(ctx);
            }

            // Restore camera transform
            this.camera.restore(ctx);

            // Draw HUD (screen space)
            if (this.state === 'playing') {
                this.hud.draw(ctx, this, w, h);
            }
        }
    }
}

// ===== START GAME =====
window.addEventListener('load', () => {
    window.game = new Game();
});
