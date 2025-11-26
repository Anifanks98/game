const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const mainMenu = document.getElementById('main-menu');
const settingsMenu = document.getElementById('settings-menu');
const gameOverScreen = document.getElementById('game-over');
const playBtn = document.getElementById('play-btn');
const settingsBtn = document.getElementById('settings-btn');
const toggleControlsBtn = document.getElementById('toggle-controls-btn');
const backBtn = document.getElementById('back-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const gameOverScore = document.getElementById('game-over-score');
const scoreHud = document.getElementById('score-hud');
const boostHud = document.getElementById('boost-hud');
const boostBar = document.getElementById('boost-bar');
const boostText = document.getElementById('boost-text');

// Game State
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let animationId;
let lastTime = 0;
let score = 0;

// Game Objects
const input = new InputHandler();
let player;
let enemies = [];
let projectiles = [];
let particles = []; // For simple explosion effects

// Resize Canvas
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Settings
let controlMode = 'WASD'; // 'MOUSE' or 'WASD'

// --- Game Logic ---

function initGame() {
    player = new Player(canvas.width / 2, canvas.height / 2);
    enemies = [];
    projectiles = [];
    particles = [];
    score = 0;
    scoreHud.textContent = `SCORE: ${score}`;
    scoreHud.classList.remove('hidden');
    boostHud.classList.remove('hidden');
    
    const tipId = controlMode === 'MOUSE' ? 'controls-tip-mouse' : 'controls-tip';
    const tipEl = document.getElementById(tipId);
    tipEl.classList.remove('hidden');
    setTimeout(() => {
        tipEl.classList.add('hidden');
    }, 2000);
    
    // Spawn 9 enemies (total 10 players including user) // CHANGED TO 7  
    for (let i = 0; i < 7; i++) {
        spawnEnemy();
    }
}

function spawnEnemy() {
    const radius = 25;
    let x, y;
    // Spawn away from player
    do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
    } while (Math.hypot(x - player.x, y - player.y) < 200); // Minimum distance

    enemies.push(new Enemy(x, y));
}

function update(deltaTime) {
    if (gameState !== 'PLAYING') return;

    // Player
    player.update(input, canvas.width, canvas.height, projectiles, controlMode);
    
    // Update Boost HUD
    if (player.boostTimer > 0) {
        const pct = (player.boostTimer / player.boostDuration) * 100;
        boostBar.style.width = `${pct}%`;
        boostBar.style.backgroundColor = '#e74c3c'; // Red/Orange when burning
        boostText.textContent = "BOOSTING AF!";
    } else {
        const pct = (player.boostCharge / player.maxBoostCharge) * 100;
        boostBar.style.width = `${pct}%`;
        
        if (player.boostCharge >= player.maxBoostCharge) {
            boostBar.style.backgroundColor = '#4a90e2'; // Blue when ready
            boostText.textContent = "BOOST READY MF (Right Click)";
            boostText.style.fontSize = '0.7rem';
        } else {
            boostBar.style.backgroundColor = '#555'; // Grey/Charging
            boostText.textContent = `CHARGING `; //${Math.floor(pct)}%
            boostText.style.fontSize = '0.7rem';
        }
    }

    // Handle Shooting
    if (input.shootPressed) {
        player.shoot(input, projectiles);
    }

    //handle boost
    if (input.boostPressed) {
        player.boost();
    }

    // Projectiles
    projectiles.forEach((p, index) => {
        p.update(canvas.width, canvas.height);
        if (p.markedForDeletion) projectiles.splice(index, 1);
    });

    // Enemies
    enemies.forEach((enemy, index) => {
        enemy.update(canvas.width, canvas.height, player);
        
        // Collision: Enemy touches Player
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1) {
            endGame();
        }

        // Collision: Projectile hits Enemy
        projectiles.forEach((proj, pIndex) => {
            const pDist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            if (pDist - enemy.radius - proj.radius < 1) {
                // Enemy Hit
                createParticles(enemy.x, enemy.y, enemy.color);
                enemies.splice(index, 1);
                projectiles.splice(pIndex, 1);
                score++;
                scoreHud.textContent = `SCORE: ${score}`;
                player.refillBoost();
                // Endless Mode: Respawn enemy
                spawnEnemy();
            }
        });
    });

    // Particles
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });
}

function draw() {
    // Clear with trail effect for "moody" feel? Or just clear?
    // ctx.fillStyle = 'rgba(26, 26, 26, 0.3)'; // Trails
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING') {
        player.draw(ctx, input.getMousePos());
        projectiles.forEach(p => p.draw(ctx));
        enemies.forEach(e => e.draw(ctx));
        particles.forEach(p => p.draw(ctx));
    }
}

function loop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();
    animationId = requestAnimationFrame(loop);
}

// --- Helper Functions ---

function endGame(win = false) {
    gameState = 'GAMEOVER';
    scoreHud.classList.add('hidden');
    boostHud.classList.add('hidden');
    document.getElementById('controls-tip').classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    gameOverScore.textContent = `Defeated! \n Score: ${score}`;
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(x, y, Math.random() * 3, color, {
            x: (Math.random() - 0.5) * 5,
            y: (Math.random() - 0.5) * 5
        }));
    }
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
    }
}

// --- Event Listeners ---

playBtn.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    gameState = 'PLAYING';
    initGame();
});

settingsBtn.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    settingsMenu.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

toggleControlsBtn.addEventListener('click', () => {
    if (controlMode === 'MOUSE') {
        controlMode = 'WASD';
    } else {
        controlMode = 'MOUSE';
    }
    toggleControlsBtn.textContent = controlMode;
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    gameState = 'PLAYING';
    initGame();
});

menuBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
});

// Start Loop
loop(0);
