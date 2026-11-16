/* =========================================================
   Camera artwork, drawn on a coarse pixel grid (32 x 20 "pixels")
   in the style of early digital art. Each part is a block of
   pixels: [colour key, x, y, width, height].
   Both cameras are SIDE VIEWS facing left: the bullet is a long
   dome camera with a sunshade, the box is a boxy housing with a
   visor and a protruding lens barrel. Both turn about their rear
   mount to aim, so every camera rests facing outward (left cams
   left, right cams right) and visibly turns toward the cursor.

   The lens is NOT part of the pixel art. cctv-scene.js paints the
   eye over the lens area each frame (glow, iris, pupil, lids), so
   the lens is only described here as a centre and radius.

   Each type has a size (w, h), a pivot where the arm joins, a cable
   point, a lens point (where the laser starts) and a lens (the eye).
   Values are in pixel-grid units.
   ========================================================= */

(function () {
    'use strict';

    window.Surveillance = window.Surveillance || {};

    // Reference width. The scene scales every camera by camCss / REF_W.
    // One unit here is one pixel of the art.
    const REF_W = 32;

    const PAL = {
        K: '#262931',   // outline
        L: '#c9ccd4',   // highlight
        M: '#8d919c',   // body
        S: '#5d616c',   // shade
        D: '#1b1e26',   // dark panel
        R: '#3d0710'    // lens glass, dark red
    };

    /* ----- Bullet camera: faces left, rear mount on the right ----- */
    const BULLET_PARTS = [
        // outlines
        ['K', 4, 1, 22, 4],   // sunshade
        ['K', 0, 3, 9, 13],   // hood
        ['K', 6, 4, 22, 12],  // body
        ['K', 26, 5, 6, 10],  // rear cap
        ['K', 21, 15, 8, 5],  // mount
        // sunshade
        ['L', 5, 2, 20, 1],
        ['M', 5, 3, 20, 1],
        // hood
        ['M', 1, 4, 7, 11],
        ['L', 1, 4, 7, 2],
        ['S', 1, 13, 7, 2],
        // body
        ['M', 7, 5, 20, 10],
        ['L', 7, 5, 20, 2],
        ['S', 7, 13, 20, 2],
        // rear cap
        ['S', 27, 6, 4, 8],
        ['M', 27, 6, 4, 1],
        // mount
        ['S', 22, 16, 6, 3],
        ['L', 24, 15, 3, 1],
        // lens glass (the eye is painted over it)
        ['R', 0, 6, 2, 7]
    ];

    /* ----- Box camera, side view: boxy housing, visor on top,
       protruding lens barrel. Rotates about its rear mount. ----- */
    const BOX_PARTS = [
        // outlines
        ['K', 6, 0, 19, 4],   // visor
        ['K', 4, 2, 24, 13],  // housing
        ['K', 0, 5, 6, 10],   // lens barrel
        ['K', 22, 15, 7, 6],  // mount
        // visor
        ['L', 7, 1, 17, 1],
        ['M', 7, 2, 17, 1],
        // housing
        ['M', 5, 3, 22, 11],
        ['L', 5, 3, 22, 2],
        ['S', 5, 12, 22, 2],
        // lens barrel
        ['S', 1, 6, 4, 8],
        ['R', 0, 7, 2, 6],    // lens glass (the eye is painted over it)
        // side panel and vents
        ['D', 13, 6, 7, 5],
        ['L', 14, 7, 2, 1],
        ['S', 21, 7, 5, 1],
        ['S', 21, 9, 5, 1],
        ['S', 21, 11, 5, 1],
        // mount
        ['S', 23, 16, 5, 3],
        ['L', 24, 15, 3, 1]
    ];

    function toSvg(parts) {
        const rects = parts.map(function (p) {
            return '<rect x="' + p[1] + '" y="' + p[2] +
                '" width="' + p[3] + '" height="' + p[4] +
                '" fill="' + PAL[p[0]] + '"/>';
        }).join('');
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20" ' +
            'width="32" height="20" shape-rendering="crispEdges">' + rects + '</svg>';
    }

    /* Per-type settings. Values are in pixel-grid units. */
    const TYPES = {
        bullet: {
            kind: 'bullet',
            base: toSvg(BULLET_PARTS),
            overlay: null,
            w: 32,
            h: 20,
            pivot: { x: 25, y: 15 },      // rear mount, where the arm joins
            cable: { x: 25, y: 20 },      // underside of the mount
            lensPoint: { x: 0, y: 9 },    // front centre of the lens
            lens: { x: 1.2, y: 9, r: 2.5 }  // the eye: centre and radius
        },
        box: {
            kind: 'box',
            base: toSvg(BOX_PARTS),
            overlay: null,
            w: 32,
            h: 20,
            pivot: { x: 24, y: 15 },
            cable: { x: 24, y: 20 },
            lensPoint: { x: 0, y: 9.5 },
            lens: { x: 1, y: 9.5, r: 2.4 }
        }
    };

    /* Each SVG is loaded once as an Image. The data URL keeps the file
       working when the page is opened directly from disk. */
    const images = {};

    function load(svg) {
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        return img;
    }

    function get(kind) {
        const def = TYPES[kind] || TYPES.bullet;
        if (!images[kind]) {
            images[kind] = {
                def: def,
                base: load(def.base),
                overlay: def.overlay ? load(def.overlay) : null
            };
        }
        return images[kind];
    }

    window.Surveillance.sprites = {
        refWidth: REF_W,
        get: get
    };
})();