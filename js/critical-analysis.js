/* =========================================================
   Critical Analysis flowchart arrows
   Reads the rendered positions of the .ca-box elements and
   draws connecting arrows on the .ca-svg overlay.
   Arrows route through the centres of box edges so the
   connections read cleanly.
   Single global: window.CriticalAnalysis.
   ========================================================= */

(function () {
    'use strict';

    window.CriticalAnalysis = window.CriticalAnalysis || {};

    // Arrow colours are tokens in css/critical-analysis.css (--ca-arrow, --ca-arrow-head).
    const ARROW_FALLBACK = '#AFAFAF';
    let ARROW_COLOR = ARROW_FALLBACK;
    let ARROW_HEAD_COLOR = ARROW_FALLBACK;
    const STROKE_WIDTH = 1.75;
    const STACKED_CX_TOLERANCE = 8;
    const LOOP_OUT = 44;

    let section = null;
    let flow = null;
    let svg = null;
    let lastKey = '';

    function measureBox(el, containerRect) {
        const r = el.getBoundingClientRect();
        return {
            left: r.left - containerRect.left,
            right: r.right - containerRect.left,
            top: r.top - containerRect.top,
            bottom: r.bottom - containerRect.top,
            cx: r.left - containerRect.left + r.width / 2,
            cy: r.top - containerRect.top + r.height / 2,
            w: r.width,
            h: r.height
        };
    }

    /* Straight path from one point to another */
    function line(x1, y1, x2, y2) {
        return 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2;
    }

    /* Two-segment elbow path: vertical from source, then bends to target.
       Use for fan-out/fan-in when we want the arrow to leave the box
       perpendicular to its edge. */
    function elbowV(x1, y1, x2, y2) {
        const midY = (y1 + y2) / 2;
        return 'M ' + x1 + ' ' + y1 + ' L ' + x1 + ' ' + midY + ' L ' + x2 + ' ' + midY + ' L ' + x2 + ' ' + y2;
    }

    /* Cubic bezier for the feedback loop on the right side */
    function loopCurve(x0, y0, x1, y1) {
        const c1x = x0 + LOOP_OUT;
        const c1y = y0;
        const c2x = x1 + LOOP_OUT;
        const c2y = y1;
        return 'M ' + x0 + ' ' + y0
             + ' C ' + c1x + ' ' + c1y + ', ' + c2x + ' ' + c2y + ', ' + x1 + ' ' + y1;
    }

    function buildPaths(refs) {
        const { top, m1, m2, m3, pen, bot } = refs;
        const paths = [];

        const stacked = Math.abs(m1.cx - m2.cx) < STACKED_CX_TOLERANCE
                     && Math.abs(m2.cx - m3.cx) < STACKED_CX_TOLERANCE;

        if (stacked) {
            // Mobile: sequential vertical chain top -> m1 -> m2 -> m3 -> pen -> bot
            const seq = [top, m1, m2, m3, pen, bot];
            for (let i = 0; i < seq.length - 1; i++) {
                const a = seq[i];
                const b = seq[i + 1];
                paths.push(line(a.cx, a.bottom, b.cx, b.top));
            }
        } else {
            // Desktop: fan-out from top bottom centre to each middle box top centre.
            // Use clean elbow paths so arrows leave the top box vertically
            // and arrive at the middle boxes vertically too.
            paths.push(elbowV(top.cx, top.bottom, m1.cx, m1.top));
            paths.push(line(top.cx, top.bottom, m2.cx, m2.top));
            paths.push(elbowV(top.cx, top.bottom, m3.cx, m3.top));

            // Fan-in from each middle box to the penultimate box top centre
            paths.push(elbowV(m1.cx, m1.bottom, pen.cx, pen.top));
            paths.push(line(m2.cx, m2.bottom, pen.cx, pen.top));
            paths.push(elbowV(m3.cx, m3.bottom, pen.cx, pen.top));

            // Pen -> bot straight vertical
            paths.push(line(pen.cx, pen.bottom, bot.cx, bot.top));
        }

        return paths;
    }

    function buildLoop(refs) {
        const { top, bot } = refs;
        // Loop starts on the right edge midpoint of the bottom box,
        // arcs out to the right, and lands on the right edge midpoint
        // of the top box.
        return loopCurve(bot.right, bot.cy, top.right, top.cy);
    }

    function measure() {
        if (!flow || !svg) return;

        const fr = flow.getBoundingClientRect();
        if (fr.width === 0 || fr.height === 0) return;

        const key = fr.width + 'x' + fr.height;
        if (key === lastKey) return;
        lastKey = key;

        const W = Math.round(fr.width);
        const H = Math.round(fr.height);

        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.setAttribute('width', W);
        svg.setAttribute('height', H);

        const ids = ['top', 'm1', 'm2', 'm3', 'pen', 'bot'];
        const refs = {};
        for (let i = 0; i < ids.length; i++) {
            const el = flow.querySelector('[data-ca-id="' + ids[i] + '"]');
            if (!el) return;
            refs[ids[i]] = measureBox(el, fr);
        }

        const caStyles = window.getComputedStyle(section);
        ARROW_COLOR = caStyles.getPropertyValue('--ca-arrow').trim() || ARROW_FALLBACK;
        ARROW_HEAD_COLOR = caStyles.getPropertyValue('--ca-arrow-head').trim() || ARROW_FALLBACK;

        const markerId = 'ca-arrow-head';
        const defs =
            '<defs>' +
              '<marker id="' + markerId + '" viewBox="0 0 10 10" refX="9" refY="5" ' +
                     'markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
                '<path d="M 0 0 L 10 5 L 0 10 z" fill="' + ARROW_HEAD_COLOR + '" />' +
              '</marker>' +
            '</defs>';

        const pathStrings = buildPaths(refs);
        let svgInner = defs;
        for (let i = 0; i < pathStrings.length; i++) {
            svgInner += '<path d="' + pathStrings[i] + '" ' +
                        'stroke="' + ARROW_COLOR + '" stroke-width="' + STROKE_WIDTH + '" ' +
                        'stroke-linecap="round" stroke-linejoin="round" ' +
                        'fill="none" marker-end="url(#' + markerId + ')" />';
        }

        // Feedback loop
        svgInner += '<path d="' + buildLoop(refs) + '" ' +
                    'stroke="' + ARROW_COLOR + '" stroke-width="' + STROKE_WIDTH + '" ' +
                    'stroke-linecap="round" fill="none" ' +
                    'marker-end="url(#' + markerId + ')" />';

        svg.innerHTML = svgInner;
    }

    function init() {
        try {
            section = document.getElementById('critical-analysis');
            if (!section) return;

            flow = section.querySelector('.ca-flow');
            svg = section.querySelector('.ca-svg');
            if (!flow || !svg) return;

            // Inline styles as a safety net in case the stylesheet fails
            Object.assign(flow.style, { position: 'relative' });
            Object.assign(svg.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                display: 'block',
                pointerEvents: 'none',
                overflow: 'visible'
            });

            measure();

            if ('ResizeObserver' in window) {
                const ro = new ResizeObserver(function () { measure(); });
                ro.observe(flow);
            } else {
                window.addEventListener('resize', measure);
            }

            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(function () { measure(); });
            }

            window.addEventListener('resize', measure);
        } catch (err) {
            console.error('critical-analysis: setup failed.', err);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.CriticalAnalysis.measure = measure;
})();
