// ===== GAME MAP =====
// Post-apocalyptic alien invasion setting
class GameMap {
    constructor() {
        this.width = CONFIG.MAP.width;
        this.height = CONFIG.MAP.height;
        this.tileSize = CONFIG.MAP.tileSize;
        this.borderWidth = CONFIG.MAP.borderWidth;
        this.decorations = [];
        this.roads = [
            { x: 0, y: 970, w: 3000, h: 60, dir: 'h' },
            { x: 0, y: 1970, w: 3000, h: 60, dir: 'h' },
            { x: 970, y: 0, w: 60, h: 3000, dir: 'v' },
            { x: 1970, y: 0, w: 60, h: 3000, dir: 'v' }
        ];
        this._generate();
    }
    _rp() { return 100 + Math.random() * 2800; }
    _generate() {
        const d = this.decorations;
        for (let i = 0; i < 15; i++) d.push({ type: 'bld', x: this._rp(), y: this._rp(), w: 60 + Math.random() * 90, h: 50 + Math.random() * 70, dmg: Math.random(), wins: 2 + Math.floor(Math.random() * 3), c: `hsl(${20 + Math.random() * 15},${5 + Math.random() * 10}%,${15 + Math.random() * 10}%)` });
        for (let i = 0; i < 12; i++) d.push({ type: 'car', x: this._rp(), y: this._rp(), w: 30 + Math.random() * 20, h: 15 + Math.random() * 8, a: Math.random() * 6.28, c: ['#4a3030', '#3a3a3a', '#2e3540', '#4a4535', '#3d2828'][Math.floor(Math.random() * 5)], fire: Math.random() < 0.2 });
        for (let i = 0; i < 22; i++) d.push({ type: 'tree', x: this._rp(), y: this._rp(), h: 25 + Math.random() * 35, br: 3 + Math.floor(Math.random() * 4), dead: Math.random() < 0.7, s: Math.random() * 100 });
        for (let i = 0; i < 20; i++) d.push({ type: 'rock', x: this._rp(), y: this._rp(), sz: 8 + Math.random() * 20, sh: 20 + Math.random() * 15, pts: 5 + Math.floor(Math.random() * 4) });
        for (let i = 0; i < 14; i++) d.push({ type: 'crate', x: this._rp(), y: this._rp(), sz: 12 + Math.random() * 10, bk: Math.random() < 0.4, a: Math.random() * 0.3 - 0.15 });
        for (let i = 0; i < 28; i++) d.push({ type: 'deb', x: this._rp(), y: this._rp(), n: 3 + Math.floor(Math.random() * 5), sp: 15 + Math.random() * 20, s: Math.random() * 100 });
        for (let i = 0; i < 35; i++) d.push({ type: 'grass', x: this._rp(), y: this._rp(), n: 5 + Math.floor(Math.random() * 8), sp: 10 + Math.random() * 15, dead: Math.random() < 0.5 });
        for (let i = 0; i < 10; i++) d.push({ type: 'fence', x: this._rp(), y: this._rp(), len: 40 + Math.random() * 80, a: Math.random() < 0.5 ? 0 : 1.57, bk: Math.random() < 0.5 });
        for (let i = 0; i < 18; i++) d.push({ type: 'crater', x: this._rp(), y: this._rp(), r: 15 + Math.random() * 35 });
        d.sort((a, b) => a.y - b.y);
    }
    draw(ctx, camera, cw, ch) {
        const sx = Math.floor(camera.x / this.tileSize), ex = Math.ceil((camera.x + cw) / this.tileSize);
        const sy = Math.floor(camera.y / this.tileSize), ey = Math.ceil((camera.y + ch) / this.tileSize);
        for (let r = sy; r <= ey; r++) for (let c = sx; c <= ex; c++) {
            const x = c * this.tileSize, y = r * this.tileSize;
            ctx.fillStyle = (r + c) % 2 === 0 ? '#1a1a1a' : '#1e1e1e';
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            ctx.strokeStyle = 'rgba(40,35,30,0.3)'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(x + 20, y + 10); ctx.lineTo(x + 50, y + 40); ctx.stroke();
        }
        for (const r of this.roads) {
            ctx.fillStyle = '#2a2a28'; ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.strokeStyle = '#55502a'; ctx.lineWidth = 2; ctx.setLineDash([20, 15]);
            ctx.beginPath();
            if (r.dir === 'h') { ctx.moveTo(r.x, r.y + r.h / 2); ctx.lineTo(r.x + r.w, r.y + r.h / 2); }
            else { ctx.moveTo(r.x + r.w / 2, r.y); ctx.lineTo(r.x + r.w / 2, r.y + r.h); }
            ctx.stroke(); ctx.setLineDash([]);
        }
        for (const d of this.decorations) {
            if (d.x < camera.x - 100 || d.x > camera.x + cw + 100 || d.y < camera.y - 100 || d.y > camera.y + ch + 100) continue;
            this._dd(ctx, d);
        }
        this._drawBorder(ctx);
    }
    _dd(ctx, d) {
        switch (d.type) {
            case 'bld':
                ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(d.x - d.w / 2 + 4, d.y - d.h / 2 + 4, d.w, d.h);
                ctx.fillStyle = d.c; ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
                ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
                for (let i = 0; i < d.wins; i++) { const wx = d.x - d.w / 2 + 10 + i * (d.w - 20) / d.wins; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(wx, d.y - d.h / 2 + 10, 12, 10); }
                if (d.dmg > 0.5) { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(d.x - d.w * 0.2, d.y - d.h / 2); ctx.lineTo(d.x - d.w * 0.2 + 15, d.y - d.h / 2 - 8); ctx.lineTo(d.x - d.w * 0.2 + 30, d.y - d.h / 2); ctx.fill(); }
                break;
            case 'car':
                ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
                ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-d.w / 2 + 2, -d.h / 2 + 2, d.w, d.h);
                ctx.fillStyle = d.c; ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
                ctx.fillStyle = 'rgba(40,50,60,0.7)'; ctx.fillRect(d.w / 4, -d.h / 2 + 2, d.w / 5, d.h - 4);
                ctx.fillStyle = '#111';
                ctx.fillRect(-d.w / 2 - 2, -d.h / 2 - 3, 6, 4); ctx.fillRect(-d.w / 2 - 2, d.h / 2 - 1, 6, 4);
                ctx.fillRect(d.w / 2 - 4, -d.h / 2 - 3, 6, 4); ctx.fillRect(d.w / 2 - 4, d.h / 2 - 1, 6, 4);
                if (d.fire) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(0, 0, d.w * 0.3, 0, 6.28); ctx.fill(); ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(0, 0, d.w * 0.15, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; }
                ctx.restore(); break;
            case 'tree':
                ctx.strokeStyle = d.dead ? '#3a2a1a' : '#4a3a2a'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y - d.h); ctx.stroke();
                for (let i = 0; i < d.br; i++) {
                    const by = d.y - d.h * 0.4 - i * (d.h * 0.5 / d.br), ba = (d.s + i) * 2.5, bl = 10 + Math.sin(ba) * 15, dir = i % 2 === 0 ? 1 : -1;
                    ctx.strokeStyle = d.dead ? '#332211' : '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(d.x, by); ctx.lineTo(d.x + dir * bl, by - 8); ctx.stroke();
                }
                if (!d.dead) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#223318'; ctx.beginPath(); ctx.arc(d.x, d.y - d.h - 5, 12, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; }
                break;
            case 'rock':
                ctx.fillStyle = `hsl(30,5%,${d.sh}%)`; ctx.beginPath();
                for (let i = 0; i < d.pts; i++) { const a = (i / d.pts) * 6.28, r = d.sz * (0.7 + Math.sin(a * 3 + d.sh) * 0.3); if (i === 0) ctx.moveTo(d.x + Math.cos(a) * r, d.y + Math.sin(a) * r); else ctx.lineTo(d.x + Math.cos(a) * r, d.y + Math.sin(a) * r); }
                ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke(); break;
            case 'crate':
                ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a); const s = d.sz;
                ctx.fillStyle = d.bk ? '#3a2a18' : '#4a3a20'; ctx.fillRect(-s / 2, -s / 2, s, s);
                ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1; ctx.strokeRect(-s / 2, -s / 2, s, s);
                ctx.beginPath(); ctx.moveTo(-s / 2, -s / 2); ctx.lineTo(s / 2, s / 2); ctx.moveTo(s / 2, -s / 2); ctx.lineTo(-s / 2, s / 2); ctx.stroke();
                ctx.restore(); break;
            case 'deb':
                for (let i = 0; i < d.n; i++) {
                    const a = (d.s + i * 17) * 5, dx = Math.sin(a) * d.sp, dy = Math.cos(a * 1.3) * d.sp, sz = 2 + Math.sin(a * 2) * 3;
                    ctx.fillStyle = `hsl(${20 + Math.sin(a) * 10},8%,${20 + Math.sin(a * 3) * 8}%)`; ctx.fillRect(d.x + dx, d.y + dy, sz, sz);
                } break;
            case 'grass':
                for (let i = 0; i < d.n; i++) {
                    const a = i * 1.7 + d.x * 0.01, gx = d.x + Math.sin(a * 3) * d.sp, gy = d.y + Math.cos(a * 2) * d.sp;
                    ctx.strokeStyle = d.dead ? 'rgba(80,70,40,0.4)' : 'rgba(40,70,30,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.sin(a) * 4, gy - 5 - Math.random() * 5); ctx.stroke();
                } break;
            case 'fence':
                ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a); const ps = Math.floor(d.len / 20);
                ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1;
                if (!d.bk) { ctx.beginPath(); ctx.moveTo(-d.len / 2, -6); ctx.lineTo(d.len / 2, -6); ctx.moveTo(-d.len / 2, -2); ctx.lineTo(d.len / 2, -2); ctx.stroke(); }
                else { ctx.beginPath(); ctx.moveTo(-d.len / 2, -6); ctx.lineTo(0, -4); ctx.stroke(); }
                ctx.lineWidth = 2; ctx.strokeStyle = '#4a4a4a';
                for (let i = 0; i <= ps; i++) { const px = -d.len / 2 + i * 20; ctx.beginPath(); ctx.moveTo(px, 4); ctx.lineTo(px, -10); ctx.stroke(); }
                ctx.restore(); break;
            case 'crater':
                ctx.fillStyle = 'rgba(8,6,4,0.35)'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.28); ctx.fill();
                ctx.strokeStyle = 'rgba(30,25,20,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.28); ctx.stroke();
                ctx.fillStyle = 'rgba(5,3,2,0.2)'; ctx.beginPath(); ctx.arc(d.x + 2, d.y + 2, d.r * 0.6, 0, 6.28); ctx.fill(); break;
        }
    }
    _drawBorder(ctx) {
        const bw = this.borderWidth, W = this.width, H = this.height;
        let g;
        g = ctx.createLinearGradient(0, 0, 0, bw); g.addColorStop(0, 'rgba(200,20,0,0.5)'); g.addColorStop(1, 'rgba(200,20,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, bw);
        g = ctx.createLinearGradient(0, H - bw, 0, H); g.addColorStop(0, 'rgba(200,20,0,0)'); g.addColorStop(1, 'rgba(200,20,0,0.5)'); ctx.fillStyle = g; ctx.fillRect(0, H - bw, W, bw);
        g = ctx.createLinearGradient(0, 0, bw, 0); g.addColorStop(0, 'rgba(200,20,0,0.5)'); g.addColorStop(1, 'rgba(200,20,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, bw, H);
        g = ctx.createLinearGradient(W - bw, 0, W, 0); g.addColorStop(0, 'rgba(200,20,0,0)'); g.addColorStop(1, 'rgba(200,20,0,0.5)'); ctx.fillStyle = g; ctx.fillRect(W - bw, 0, bw, H);
        ctx.strokeStyle = 'rgba(200,40,0,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, H - 2);
    }
}
