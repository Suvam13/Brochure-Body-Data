/* =========================================================
   Input handling. This file is the only writer of the aim state.
   The top-level assignments below run immediately so cctv-scene.js can read them.
   ========================================================= */

window.Surveillance = window.Surveillance || {};
window.Surveillance.aim = { x: 0, y: 0, mode: 'idle', active: false };
window.Surveillance.hover = null;
window.Surveillance.scroll = { time: -1e9, dir: 0, speed: 0 };

(function () {
    'use strict';

    const S = window.Surveillance;
    const PASSIVE = { passive: true };
    const POINTER_HOLD_MS = 2000;
    const TOUCH_HOLD_MS = 1500;

    let pointerTimer = 0;
    let touchTimer = 0;
    let hoverEl = null;   // card under the mouse or pen
    let focusEl = null;   // card focused with the keyboard
    let lastScrollY = 0;
    let lastScrollT = 0;

    function setAim(x, y, mode) {
        S.aim.x = x;
        S.aim.y = y;
        S.aim.mode = mode;
        S.aim.active = true;
    }

    function holdPointer() {
        clearTimeout(pointerTimer);
        pointerTimer = setTimeout(function () {
            if (S.aim.mode === 'pointer') S.aim.active = false;
        }, POINTER_HOLD_MS);
    }

    function releaseTouch() {
        clearTimeout(touchTimer);
        touchTimer = setTimeout(function () {
            if (S.aim.mode === 'touch') S.aim.active = false;
        }, TOUCH_HOLD_MS);
    }

    function publishHover() {
        S.hover = hoverEl || focusEl || null;
    }

    function cardFrom(node) {
        if (!node || !node.closest) return null;
        return node.closest('.sv-card');
    }

    /* ----- Mouse, pen, and touch ----- */

    function onPointerMove(e) {
        if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
            setAim(e.clientX, e.clientY, 'pointer');
            holdPointer();
        } else if (e.pointerType === 'touch') {
            setAim(e.clientX, e.clientY, 'touch');
            clearTimeout(touchTimer);
        }
    }

    function onPointerDown(e) {
        if (e.pointerType !== 'touch') return;
        setAim(e.clientX, e.clientY, 'touch');
        clearTimeout(touchTimer);
    }

    /* pointerup and pointercancel both count as a release.
       The browser sends pointercancel when it starts a scroll, so the last
       position is held and the cameras do not reset. */
    function onPointerRelease(e) {
        if (e.pointerType !== 'touch') return;
        releaseTouch();
    }

    function onMouseOut(e) {
        // Mouse left the window: start the pointer timeout
        if (!e.relatedTarget && S.aim.mode === 'pointer') holdPointer();
    }

    /* ----- Cards: hover and keyboard focus (event delegation) ----- */

    function attachCardListeners(grid) {
        grid.addEventListener('pointerover', function (e) {
            if (e.pointerType === 'touch') return;
            const card = cardFrom(e.target);
            if (card) {
                hoverEl = card;
                publishHover();
            }
        }, PASSIVE);

        grid.addEventListener('pointerout', function (e) {
            if (e.pointerType === 'touch') return;
            const card = cardFrom(e.target);
            if (!card) return;
            if (e.relatedTarget && card.contains(e.relatedTarget)) return;
            if (hoverEl === card) {
                hoverEl = null;
                publishHover();
            }
        }, PASSIVE);

        grid.addEventListener('focusin', function (e) {
            const card = cardFrom(e.target);
            if (!card) return;
            let keyboard = false;
            try {
                keyboard = card.matches(':focus-visible');
            } catch (err) {
                keyboard = true;
            }
            if (keyboard) {
                focusEl = card;
                publishHover();
            }
        }, PASSIVE);

        grid.addEventListener('focusout', function (e) {
            const card = cardFrom(e.target);
            if (card && focusEl === card) {
                focusEl = null;
                publishHover();
            }
        }, PASSIVE);
    }

    /* ----- Scroll ----- */

    function onScroll() {
        const now = performance.now();
        const y = window.scrollY;
        const dy = y - lastScrollY;
        let dt = (now - lastScrollT) / 1000;
        if (dt < 0.001 || dt > 0.1) dt = 1 / 60;

        lastScrollY = y;
        lastScrollT = now;

        S.scroll.time = now;
        if (dy !== 0) {
            S.scroll.dir = dy > 0 ? 1 : -1;
            S.scroll.speed = Math.abs(dy) / dt;
        }
    }

    /* ----- Init ----- */

    function init() {
        const grid = document.querySelector('#surveillance .sv-grid');

        lastScrollY = window.scrollY;
        lastScrollT = performance.now();

        window.addEventListener('pointermove', onPointerMove, PASSIVE);
        window.addEventListener('pointerdown', onPointerDown, PASSIVE);
        window.addEventListener('pointerup', onPointerRelease, PASSIVE);
        window.addEventListener('pointercancel', onPointerRelease, PASSIVE);
        document.addEventListener('mouseout', onMouseOut, PASSIVE);
        window.addEventListener('scroll', onScroll, PASSIVE);

        if (grid) attachCardListeners(grid);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
