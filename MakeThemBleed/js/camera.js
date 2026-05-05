// ===== CAMERA =====
// Follows player with crosshair look-ahead, clamped to map bounds

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        // Smooth camera
        this.targetX = 0;
        this.targetY = 0;
        this.smoothSpeed = CONFIG.CAMERA.smoothSpeed;
    }

    follow(player, mouse, mapWidth, mapHeight, canvasWidth, canvasHeight) {
        // Calculate look-ahead toward mouse (30% of screen offset)
        const lookX = (mouse.screenX - canvasWidth / 2) * CONFIG.CAMERA.crosshairFollowRatio;
        const lookY = (mouse.screenY - canvasHeight / 2) * CONFIG.CAMERA.crosshairFollowRatio;

        const maxLook = CONFIG.CAMERA.maxLookAhead;
        const lookDist = Math.sqrt(lookX * lookX + lookY * lookY);
        let clX = lookX, clY = lookY;
        if (lookDist > maxLook) {
            clX = (lookX / lookDist) * maxLook;
            clY = (lookY / lookDist) * maxLook;
        }

        // Camera target = player + look offset, placed at top-left
        this.targetX = player.x + clX - canvasWidth / 2;
        this.targetY = player.y + clY - canvasHeight / 2;

        // Clamp to map bounds
        this.targetX = Math.max(0, Math.min(this.targetX, mapWidth - canvasWidth));
        this.targetY = Math.max(0, Math.min(this.targetY, mapHeight - canvasHeight));
    }

    shake(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    update(dt) {
        // Smooth follow
        this.x += (this.targetX - this.x) * this.smoothSpeed * dt;
        this.y += (this.targetY - this.y) * this.smoothSpeed * dt;

        // Screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeIntensity *= 0.92;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-this.x + this.shakeX, -this.y + this.shakeY);
    }

    restore(ctx) {
        ctx.restore();
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x - this.shakeX,
            y: screenY + this.y - this.shakeY
        };
    }
}
