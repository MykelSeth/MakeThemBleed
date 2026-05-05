// ===== SCORING SYSTEM =====
// Tracks points, kills by type, special effect bonuses

const SCORE_VALUES = CONFIG.SCORING.pointsPerType;

const EFFECT_SCORE_VALUES = CONFIG.SCORING.effectBonus;

class ScoringSystem {
    constructor() {
        this.reset();
    }

    reset() {
        this.totalScore = 0;
        this.killsByType = { green: 0, yellow: 0, red: 0, blue: 0, black: 0 };
        this.pointsByType = { green: 0, yellow: 0, red: 0, blue: 0, black: 0 };
        this.specialKills = 0;
        this.specialPoints = 0;
        this.effectKills = { fast: 0, slow: 0, moreHP: 0, moreDamage: 0 };
    }

    onEnemyKilled(enemy) {
        const basePoints = SCORE_VALUES[enemy.typeName] || 0;
        let effectBonus = 0;

        // Count special effect kills and bonus points
        for (const eff of enemy.specialEffects) {
            effectBonus += EFFECT_SCORE_VALUES[eff] || 0;
            this.effectKills[eff] = (this.effectKills[eff] || 0) + 1;
        }

        // Multi-effect multiplier from config
        const mm = CONFIG.SCORING.multiEffectMultiplier;
        const numEff = enemy.specialEffects.length;
        if (mm[numEff]) effectBonus *= mm[numEff];
        else if (numEff >= 5 && mm[5]) effectBonus *= mm[5];
        else if (numEff >= 4 && mm[4]) effectBonus *= mm[4];
        else if (numEff >= 3 && mm[3]) effectBonus *= mm[3];
        else if (numEff >= 2 && mm[2]) effectBonus *= mm[2];

        if (enemy.specialEffects.length > 0) this.specialKills++;

        this.killsByType[enemy.typeName] = (this.killsByType[enemy.typeName] || 0) + 1;
        this.pointsByType[enemy.typeName] = (this.pointsByType[enemy.typeName] || 0) + basePoints;
        this.specialPoints += Math.floor(effectBonus);
        this.totalScore += basePoints + Math.floor(effectBonus);

        return basePoints + Math.floor(effectBonus);
    }

    getTotalKills() {
        let total = 0;
        for (const type in this.killsByType) total += this.killsByType[type];
        return total;
    }

    getBreakdown() {
        const types = ['green', 'yellow', 'red', 'blue', 'black'];
        const names = {};
        for (const t of types) names[t] = CONFIG.ENEMIES[t] ? CONFIG.ENEMIES[t].name : t;
        const rows = [];
        for (const t of types) {
            if (this.killsByType[t] > 0) {
                rows.push({
                    type: t,
                    name: names[t],
                    kills: this.killsByType[t],
                    points: this.pointsByType[t]
                });
            }
        }
        return rows;
    }
}
