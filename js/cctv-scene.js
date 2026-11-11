/* =========================================================
   Scene: builds the cards, lays out the pole and cameras, and runs the
   animation loop. Reads aim state from window.Surveillance.aim (set by
   cctv-input.js) and sprite art from window.Surveillance.sprites.
   ========================================================= */

(function () {
    'use strict';

    const S = window.Surveillance;

    const SCROLL_WINDOW_MS = 800;
    const AIM_LIMIT = 1.22;        // about 70 degrees either side of rest
    let LASER_LENGTH = 260;       // css px, rescaled in layout() to match camCss

    // Scene colours are tokens in css/surveillance.css (on #surveillance).
    // readSceneColours() copies them into COL once per layout, so the
    // draw loop never has to touch the DOM.
    const COLOUR_FALLBACK = {
        arm: '#8c90a6',
        armTop: '#c8cbd9',
        bracket: '#5c5e6b',
        bracketTop: '#9aa0b4',
        cable: '#0d0b1a',
        laser: '#FFF7C5'
    };
    let COL = Object.assign({}, COLOUR_FALLBACK);

    function readSceneColours() {
        if (!stage) return;
        const cs = window.getComputedStyle(stage);
        const read = function (name, fallback) {
            return cs.getPropertyValue(name).trim() || fallback;
        };
        COL = {
            arm: read('--sv-arm', COLOUR_FALLBACK.arm),
            armTop: read('--sv-arm-top', COLOUR_FALLBACK.armTop),
            bracket: read('--sv-bracket', COLOUR_FALLBACK.bracket),
            bracketTop: read('--sv-bracket-top', COLOUR_FALLBACK.bracketTop),
            cable: read('--sv-cable', COLOUR_FALLBACK.cable),
            laser: read('--sv-laser', COLOUR_FALLBACK.laser)
        };
    }

    const mqWide = window.matchMedia('(min-width: 900px)');
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let section = null;
    let stage = null;
    let canvas = null;
    let grid = null;
    let ctx = null;
    let poleCanvas = null;

    let W = 0, H = 0, dpr = 1, cx = 0;
    let wide = true, reduced = false;
    let poleW = 26, camCss = 70, armT = 10;
    let cssPix = 1, camSpr = null, camW = 0, camH = 0;
    let hubPx = 1, hubSpr = null, hubW = 0, hubH = 0;

    let cams = [];
    let running = false;
    let inView = false;
    let rafId = 0;
    let lastNow = 0;

    /* ----- Helpers ----- */

    function clamp(v, lo, hi) {
        return v < lo ? lo : (v > hi ? hi : v);
    }

    function wrapAngle(a) {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function cardHtml(item) {
        const text = item.text;
        if (!item.emphasis) return escapeHtml(text);
        const i = text.indexOf(item.emphasis);
        if (i < 0) return escapeHtml(text);
        return escapeHtml(text.slice(0, i))
            + '<strong>' + escapeHtml(item.emphasis) + '</strong>'
            + escapeHtml(text.slice(i + item.emphasis.length));
    }

    function makeCam(el, dir, index) {
        return {
            el: el,
            dir: dir,                                   // -1 = left side, 1 = right side
            kind: index % 2 === 0 ? 'box' : 'bullet',   // alternate camera types
            rest: dir < 0 ? Math.PI : 0,                // outward direction
            angle: dir < 0 ? Math.PI : 0,               // current angle
            speed: 0.35 + 0.25 * ((index * 0.618) % 1), // idle sweep speed, rad/s
            phase: index * 1.3,                         // idle sweep phase
            laser: 0,                                   // 0..1 laser visibility
            mountX: 0, mountY: 0,
            swivelX: 0, swivelY: 0
        };
    }

    /* ----- Cards ----- */

    function buildCards() {
        grid.innerHTML = '';
        cams = [];
        let leftRow = 0;
        let rightRow = 0;

        surveillanceData.forEach(function (item) {
            const el = document.createElement('article');
            el.className = 'sv-card sv-card--' + item.tone + ' sv-card--' + item.side
                + (item.italic ? ' sv-card--italic' : '');
            el.dataset.id = item.id;
            el.tabIndex = 0;

            // Desktop rows: left and right are counted separately
            const row = item.side === 'left' ? ++leftRow : ++rightRow;
            el.style.setProperty('--sv-row', String(row));

            const p = document.createElement('p');
            p.className = 'sv-card__text';
            p.innerHTML = cardHtml(item);
            el.appendChild(p);
            grid.appendChild(el);

            if (item.camera) {
                cams.push(makeCam(el, item.side === 'left' ? -1 : 1, cams.length));
            }
        });
    }

    /* ----- Pole ----- */

    function poleColours() {
        const cs = window.getComputedStyle(stage);
        return {
            body: cs.getPropertyValue('--sv-pole').trim() || '#b5b8c9',
            dark: cs.getPropertyValue('--sv-pole-dark').trim() || '#5c5e6b'
        };
    }

    
    /* Static pole, drawn once per layout into an offscreen canvas */
    function buildPole() {
        const pc = poleCanvas.getContext('2d');
        const colours = poleColours();

        pc.setTransform(dpr, 0, 0, dpr, 0, 0);
        pc.globalCompositeOperation = 'source-over';
        pc.clearRect(0, 0, W, H);

        const left = cx - poleW / 2;

        // Dark outline
        pc.fillStyle = colours.dark;
        pc.fillRect(left - 1.5, 0, poleW + 3, H);

        // Cylinder shading: dark edges, bright specular band in the centre
        const body = pc.createLinearGradient(left, 0, left + poleW, 0);
        body.addColorStop(0, colours.dark);
        body.addColorStop(0.22, colours.body);
        body.addColorStop(0.42, '#ffffff');
        body.addColorStop(0.6, colours.body);
        body.addColorStop(0.85, colours.dark);
        body.addColorStop(1, colours.dark);
        pc.fillStyle = body;
        pc.fillRect(left, 0, poleW, H);

        // Cap: dark block with a lighter top edge
        pc.fillStyle = colours.dark;
        pc.fillRect(left - 4, 0, poleW + 8, 14);
        const capShade = pc.createLinearGradient(left - 4, 0, left + poleW + 4, 0);
        capShade.addColorStop(0, colours.dark);
        capShade.addColorStop(0.5, colours.body);
        capShade.addColorStop(1, colours.dark);
        pc.fillStyle = capShade;
        pc.fillRect(left - 2, 2, poleW + 4, 4);

        // Fade the base out over the last 80px
        const fadeH = Math.min(80, H);
        pc.globalCompositeOperation = 'destination-out';
        const fade = pc.createLinearGradient(0, H - fadeH, 0, H);
        fade.addColorStop(0, 'rgba(0, 0, 0, 0)');
        fade.addColorStop(1, 'rgba(0, 0, 0, 1)');
        pc.fillStyle = fade;
        pc.fillRect(0, H - fadeH, W, fadeH);
        pc.globalCompositeOperation = 'source-over';
    }

    /* ----- Layout: sizes, sprites, and mount points ----- */

    function measureCams(sr) {
        // Even distribution along the whole pole: left and right cameras
        // alternate in slots running from just below the pole cap to just
        // above the base fade, so the cameras span the full length of the
        // pole instead of clustering where the cards happen to sit.
        const yTop = 44;
        const yBottom = H - 96;
        const span = Math.max(1, yBottom - yTop);

        let leftCount = 0;
        let rightCount = 0;
        for (let i = 0; i < cams.length; i++) {
            if (cams[i].dir < 0) leftCount++; else rightCount++;
        }
        const slots = Math.max(2 * leftCount, 2 * rightCount, 1);

        let leftIdx = 0;
        let rightIdx = 0;

        for (let i = 0; i < cams.length; i++) {
            const cam = cams[i];
            const r = cam.el.getBoundingClientRect();

            // Inner edge = the card edge nearest the pole
            const inner = cam.dir < 0 ? (r.right - sr.left) : (r.left - sr.left);
            // Reach is 50% of the gap from pole to card inner edge. Bigger cameras
            // need a touch more room, so this was trimmed from the original 0.55.
            const reach = Math.max(Math.abs(inner - cx) * 0.50, poleW / 2 + 14);

            let mountY;
            if (wide) {
                // Slot ladder: left cameras get slots 0, 2, 4... and right
                // cameras 1, 3, 5..., so the two sides zigzag down the pole.
                const slot = cam.dir < 0 ? 2 * leftIdx++ : 2 * rightIdx++ + 1;
                mountY = yTop + (slot + 0.5) * (span / slots);
            } else {
                // Phone: cards are stacked, so park each camera in the gap
                // above its card where it is not hidden behind the card.
                const prev = cam.el.previousElementSibling;
                if (prev) {
                    const pr = prev.getBoundingClientRect();
                    mountY = (pr.bottom + r.top) / 2 - sr.top;   // centre of the gap above
                } else {
                    mountY = r.top - sr.top - 24;
                }
            }

            cam.mountY = clamp(mountY, armT, H - armT);
            cam.mountX = cx + cam.dir * poleW / 2;
            cam.swivelX = cx + cam.dir * reach;
            cam.swivelY = cam.mountY;
        }
    }

    

    let lastLayoutKey = '';

    function layout() {
        if (!stage || !canvas || !ctx) return;

        readSceneColours();

        const sr = stage.getBoundingClientRect();
        const newDpr = Math.min(window.devicePixelRatio || 1, 2);

        const key = sr.width + 'x' + sr.height + '@' + newDpr;
        if (key === lastLayoutKey) return;
        lastLayoutKey = key;

        W = sr.width;
        H = sr.height;
        dpr = newDpr;

        canvas.width = Math.max(1, Math.round(W * dpr));
        canvas.height = Math.max(1, Math.round(H * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        poleCanvas.width = canvas.width;
        poleCanvas.height = canvas.height;

        wide = mqWide.matches;
        poleW = wide ? 26 : 20;
        // Camera size caps: desktop 80..105, phone 56..76. Bumped up from the
        // original 56..70 / 40..52 so the cameras read clearly on both layouts.
        camCss = wide ? clamp(W * 0.10, 80, 105) : clamp(W * 0.20, 56, 76);
        armT = Math.max(4, camCss * 0.14);
        cx = W / 2;

        // One scale for all camera types: the reference width maps to camCss
        cssPix = camCss / S.sprites.refWidth;

        // Keep the laser length proportional to the camera size.
        LASER_LENGTH = Math.round(camCss * 3.5);

        buildPole();
        measureCams(stage.getBoundingClientRect());
    }



    /* ----- Drawing ----- */

    /* Reused every frame to avoid creating objects in the loop */
    const SCRATCH = { x: 0, y: 0 };

    /* Converts an SVG point to screen coordinates, relative to the camera's pivot.
    Mirrors first (right-side cameras are mirrored), then rotates. */
    function artToScreen(cam, def, lx, ly, rot, mirror) {
        let dx = (lx - def.pivot.x) * cssPix;
        const dy = (ly - def.pivot.y) * cssPix;
        if (mirror) dx = -dx;
        const rc = Math.cos(rot);
        const rs = Math.sin(rot);
        SCRATCH.x = cam.swivelX + dx * rc - dy * rs;
        SCRATCH.y = cam.swivelY + dx * rs + dy * rc;
    }

    function drawCam(cam) {
        const asset = S.sprites.get(cam.kind);

        // Skip the camera until its SVG has loaded. The frame loop retries each frame.
        if (!asset.base.complete || asset.base.naturalWidth === 0) return;

        const def = asset.def;

        // Both camera types are side views in their art. Every camera turns
        // about its rear mount to aim, and right-side cameras are mirrored,
        // so each camera rests facing outward (left cams left, right cams
        // right) and visibly turns toward the cursor as it tracks.
        const mirror = cam.dir > 0;
        const rot = cam.angle - cam.rest;
        const a = cam.angle;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const c = cssPix;
        const w = def.w * c;
        const h = def.h * c;
        const ox = -def.pivot.x * c;
        const oy = -def.pivot.y * c;

        // Cable: from the underside of the camera (it moves with the camera) down to the bracket
        artToScreen(cam, def, def.cable.x, def.cable.y, rot, mirror);
        const x0 = SCRATCH.x;
        const y0 = SCRATCH.y;
        const x1 = cam.mountX;
        const y1 = cam.mountY + armT * 0.4;
        ctx.strokeStyle = COL.cable;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 14, x1, y1);
        ctx.stroke();

        // Arm: from the bracket out to the pivot
        const armX = Math.min(cam.mountX, cam.swivelX);
        const armW = Math.abs(cam.swivelX - cam.mountX);
        ctx.fillStyle = COL.arm;
        ctx.fillRect(armX, cam.mountY - armT / 2, armW, armT);
        ctx.fillStyle = COL.armTop;
        ctx.fillRect(armX, cam.mountY - armT / 2, armW, Math.max(1, armT * 0.25));

        // Bracket: clamped across the pole edge
        ctx.fillStyle = COL.bracket;
        ctx.fillRect(cam.mountX - 4, cam.mountY - armT * 0.9, 8, armT * 1.8);
        ctx.fillStyle = COL.bracketTop;
        ctx.fillRect(cam.mountX - 4, cam.mountY - armT * 0.9, 8, Math.max(1, armT * 0.3));

        // Camera
        ctx.save();
        ctx.translate(cam.swivelX, cam.swivelY);
        ctx.rotate(rot);
        if (mirror) ctx.scale(-1, 1);
        ctx.drawImage(asset.base, ox, oy, w, h);
        ctx.restore();

        // Laser: dashed line from the lens, visible only while tracking
        if (cam.laser > 0.01) {
            artToScreen(cam, def, def.lensPoint.x, def.lensPoint.y, rot, mirror);
            const lensX = SCRATCH.x;
            const lensY = SCRATCH.y;

            ctx.save();
            ctx.globalAlpha = cam.laser * 0.7;
            ctx.strokeStyle = COL.laser;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(lensX, lensY);
            ctx.lineTo(lensX + ca * LASER_LENGTH, lensY + sa * LASER_LENGTH);
            ctx.stroke();
            ctx.restore();
        }
    }

    /* ----- Frame step ----- */

    function step(now, dt) {
        const sr = stage.getBoundingClientRect();
        const sx = sr.left;
        const sy = sr.top;
        const aim = S.aim;

        const touchOn = aim.active && aim.mode === 'touch';
        const pointerOn = aim.active && aim.mode === 'pointer';
        const scrollOn = !reduced && (now - S.scroll.time) < SCROLL_WINDOW_MS;

        // Global source for all cameras: touch, then pointer, then scroll, then idle
        let gSource = reduced ? 'rest' : 'idle';
        let gx = 0;
        let gy = 0;

        if (touchOn) {
            gSource = 'touch';
            gx = aim.x;
            gy = aim.y;
        } else if (pointerOn) {
            gSource = 'pointer';
            gx = aim.x;
            gy = aim.y;
        } else if (scrollOn) {
            const age = clamp((now - S.scroll.time) / SCROLL_WINDOW_MS, 0, 1);
            const fade = Math.sin(Math.PI * age);                 // eases in and out
            const mag = clamp(S.scroll.speed / 1500, 0.25, 1);
            const vh = window.innerHeight;
            gSource = 'scroll';
            gx = window.innerWidth / 2;
            gy = vh / 2 + S.scroll.dir * mag * fade * vh * 0.35;
        }

        // Hovered card: only the camera assigned to it aims at it (unless touch is active)
        let hoverCam = null;
        let hx = 0;
        let hy = 0;
        if (S.hover && !touchOn) {
            for (let i = 0; i < cams.length; i++) {
                if (cams[i].el === S.hover) {
                    hoverCam = cams[i];
                    break;
                }
            }
            if (hoverCam) {
                const hr = S.hover.getBoundingClientRect();
                hx = hr.left + hr.width / 2;
                hy = hr.top + hr.height / 2;
            }
        }

        const rate = reduced ? 0.04 : 0.1;
        const frac = 1 - Math.pow(1 - rate, dt * 60);
        const laserStep = dt / 0.3;

        for (let i = 0; i < cams.length; i++) {
            const cam = cams[i];
            let src = gSource;
            let ax = gx;
            let ay = gy;

            if (cam === hoverCam) {
                src = 'hover';
                ax = hx;
                ay = hy;
            }

            let target;
            if (src === 'idle') {
                target = cam.rest + 0.9 * Math.sin((now / 1000) * cam.speed + cam.phase);
            } else if (src === 'rest') {
                target = cam.rest;
            } else {
                const desired = Math.atan2(ay - (sy + cam.swivelY), ax - (sx + cam.swivelX));
                target = cam.rest + clamp(wrapAngle(desired - cam.rest), -AIM_LIMIT, AIM_LIMIT);
            }

            cam.angle += wrapAngle(target - cam.angle) * frac;

            const tracking = src !== 'idle' && src !== 'rest';
            cam.laser += clamp((tracking ? 1 : 0) - cam.laser, -laserStep, laserStep);
        }

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(poleCanvas, 0, 0, W, H);
        for (let i = 0; i < cams.length; i++) {
            drawCam(cams[i]);
        }
    }

    /* ----- Loop and lifecycle ----- */

    function frame(now) {
        if (!running) return;
        rafId = requestAnimationFrame(frame);
        const dt = clamp((now - lastNow) / 1000, 0, 0.05);
        lastNow = now;
        step(now, dt);
    }

    function start() {
        if (running) return;
        running = true;
        lastNow = performance.now();
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
    }

    function updateRunning() {
        if (inView && !document.hidden) {
            start();
        } else {
            stop();
        }
    }

    /* ----- Init ----- */

    function init() {
        try {
            if (typeof surveillanceData === 'undefined') {
                console.error('cctv-scene: surveillanceData is not defined. Check js/data.js for a syntax error.');
                return;
            }

            section = document.getElementById('surveillance');
            if (!section) return;

            stage = section.querySelector('.sv-stage');
            canvas = section.querySelector('.sv-canvas');
            grid = section.querySelector('.sv-grid');
            if (!stage || !canvas || !grid) return;

            // Force the canvas out of normal flow, whatever the stylesheet says
            Object.assign(stage.style, { position: 'relative' });
            Object.assign(canvas.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                display: 'block',
                pointerEvents: 'none'
            });

            ctx = canvas.getContext('2d');
            poleCanvas = document.createElement('canvas');

            reduced = mqReduced.matches;
            mqReduced.addEventListener('change', function (e) {
                reduced = e.matches;
            });

            buildCards();
            layout();

            // Observe the card grid, not the stage. The grid's size doesn't depend on the canvas.
            if ('ResizeObserver' in window) {
                const ro = new ResizeObserver(function () { layout(); });
                ro.observe(grid);
            } else {
                window.addEventListener('resize', layout);
            }

            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(layout);
            }

            if ('IntersectionObserver' in window) {
                const io = new IntersectionObserver(function (entries) {
                    inView = entries[entries.length - 1].isIntersecting;
                    updateRunning();
                }, { threshold: 0 });
                io.observe(section);
            } else {
                inView = true;
            }

            document.addEventListener('visibilitychange', updateRunning);
            updateRunning();
        } catch (err) {
            console.error('cctv-scene: setup failed.', err);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
