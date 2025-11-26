class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.shootPressed = false;
        this.boostPressed = false;

        // Prevent context menu
        window.addEventListener('contextmenu', e => e.preventDefault());

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left Click
                this.shootPressed = true;
            }
            if (e.button === 2) { // Right Click
                this.boostPressed = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.shootPressed = false;
            }
            if (e.button === 2) {
                this.boostPressed = false;
            }
        });
    }

    getMousePos() {
        return this.mouse;
    }

    getMovementVector() {
        let dx = 0;
        let dy = 0;

        if (this.keys['KeyW']) dy -= 1;
        if (this.keys['KeyS']) dy += 1;
        if (this.keys['KeyA']) dx -= 1;
        if (this.keys['KeyD']) dx += 1;

        // Normalize vector if moving diagonally
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        return { x: dx, y: dy };
    }
    
    setControlScheme(useWASD) {
        // No-op
    }
}
