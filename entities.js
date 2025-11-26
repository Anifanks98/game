class Entity {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.markedForDeletion = false;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update(canvasWidth, canvasHeight) {
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 15, '#4a90e2'); // Blueish
        this.speed = 5;
        this.cooldown = 0;
        
        // Boost properties
        this.boostDuration = 120; // 2 seconds at 60fps
        this.boostTimer = 0;
        this.boostCharge = 100; // Start with full charge
        this.maxBoostCharge = 100;
    }

    draw(ctx, mouse) {
        // Draw Player Body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Draw Gun
        // Calculate angle towards mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, 25, 10); // Gun barrel
        ctx.restore();
    }

    update(input, canvasWidth, canvasHeight, projectiles, controlMode) {
        // Apply Boost Speed
        let currentSpeed = this.speed;
        if (this.boostTimer > 0) {
            currentSpeed *= 2; // 2x speed
            this.boostTimer--;
        }

        const mouse = input.getMousePos();
        
        if (controlMode === 'MOUSE') {
            // Move towards mouse
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Stop if close to mouse to prevent jitter
            if (dist > 5) {
                this.x += (dx / dist) * currentSpeed;
                this.y += (dy / dist) * currentSpeed;
            }
        } else if (controlMode === 'WASD') {
            // Move with WASD
            const move = input.getMovementVector();
            this.x += move.x * currentSpeed;
            this.y += move.y * currentSpeed;
        }

        // Boundary checks
        this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
        
        this.cooldown--;
    }
    
    shoot(input, projectiles) {
        if (this.cooldown <= 0) {
            const mouse = input.getMousePos();
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const angle = Math.atan2(dy, dx);
            
            const velocity = {
                x: Math.cos(angle) * 10,
                y: Math.sin(angle) * 10
            };
            
            // Spawn projectile at gun tip
            const spawnX = this.x + Math.cos(angle) * 20;
            const spawnY = this.y + Math.sin(angle) * 20;

            projectiles.push(new Projectile(spawnX, spawnY, velocity, this.color));
            this.cooldown = 15; // Frames between shots
        }
    }

    boost() {
        if (this.boostCharge >= this.maxBoostCharge && this.boostTimer === 0) {
            this.boostTimer = this.boostDuration;
            this.boostCharge = 0;
        }
    }

    refillBoost() {
        this.boostCharge = Math.min(this.boostCharge + 20, this.maxBoostCharge);
    }
}

class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 15, '#e74c3c'); // Reddish
        this.speed = 2 + Math.random() * 2;
        this.angle = Math.random() * Math.PI * 2;
        this.changeDirTimer = 0;
    }

    update(canvasWidth, canvasHeight, player) {
        // Simple AI: Move towards player slowly, but with some randomness
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * 0.5; // Homming
            this.y += (dy / dist) * this.speed * 0.5;
        }

        // Random jitter
        this.x += (Math.random() - 0.5) * 2;
        this.y += (Math.random() - 0.5) * 2;

        // Keep in bounds
        this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
    }
}

class Projectile extends Entity {
    constructor(x, y, velocity, color) {
        super(x, y, 5, color);
        this.velocity = velocity;
    }

    update(canvasWidth, canvasHeight) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.x < 0 || this.x > canvasWidth || this.y < 0 || this.y > canvasHeight) {
            this.markedForDeletion = true;
        }
    }
}
