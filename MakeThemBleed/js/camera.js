// ===== CAMERA =====
// Follows player, clamped to map bounds

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
    }

    follow(target, mapWidth, mapHeight, canvasWidth, canvasHeight) {
        // Center camera on target
        let tx = target.x - canvasWidth / 2;
        let ty = target.y - canvasHeight / 2;

        // Clamp to map bounds
        this.x = Math.max(0, Math.min(tx, mapWidth - canvasWidth));
        this.y = Math.max(0, Math.min(ty, mapHeight - canvasHeight));
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    update(dt) {
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeIntensity *= 0.95;
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
