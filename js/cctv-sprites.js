/* =========================================================
   Camera artwork, taken from the supplied SVG.
   Both cameras are SIDE VIEWS facing left: the bullet is a rounded
   dome camera, the box is a boxy housing with a top visor and a
   protruding lens barrel. Both turn about their rear mount to aim,
   so every camera rests facing outward (left cams left, right cams
   right) and visibly turns toward the cursor.
   Each type has a size (w, h), a pivot where the arm joins, a cable point,
   and a lens point. All values are in the SVG's own units.
   ========================================================= */

(function () {
    'use strict';

    window.Surveillance = window.Surveillance || {};

    // Reference width. The scene scales every camera by camCss / REF_W.
    const REF_W = 73;

    /* ----- Bullet camera: faces left, rear on the right ----- */
    const BULLET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 73 43" width="73" height="43" shape-rendering="crispEdges">
  <g transform="translate(-13 -8)">
    <rect x="22" y="8" width="64" height="32" rx="8" fill="#b9bbc1"/>
    <path d="M30 8 H76 Q86 8 86 18 V28 Q86 40 76 40 H30Z" fill="#d9dadd"/>
    <path d="M29 8 H75 Q83 8 83 15 H29Z" fill="#eeeeef"/>
    <path d="M30 33 H78 Q83 33 83 29 V34 Q83 40 75 40 H30Z" fill="#999ba2"/>
    <path d="M22 8 H35 V40 H22 Q13 40 13 31 V17 Q13 8 22 8Z" fill="#858890"/>
    <rect x="15" y="11" width="18" height="26" rx="5" fill="#535760"/>
    <rect x="18" y="14" width="12" height="20" rx="3" fill="#151922"/>
    <rect x="20" y="16" width="7" height="7" fill="#353c49"/>
    <rect x="21" y="17" width="3" height="3" fill="#858c99"/>
    <rect x="52" y="39" width="13" height="7" fill="#92949b"/>
    <rect x="55" y="44" width="7" height="7" fill="#777a83"/>
  </g>
</svg>`;

    /* ----- Box camera, side view: faces left like the bullet, with a
       boxy housing, a sun visor on top, and a protruding lens barrel.
       Rotates about its rear foot, same as the bullet. ----- */
    const BOX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 73 43" width="73" height="43" shape-rendering="crispEdges">
  <rect x="8" y="5" width="58" height="4" fill="#999ba2"/>
  <rect x="8" y="5" width="58" height="2" fill="#c6c8cd"/>
  <rect x="12" y="9" width="56" height="24" fill="#a4a6ad"/>
  <rect x="12" y="9" width="56" height="5" fill="#d9dadd"/>
  <rect x="12" y="28" width="56" height="5" fill="#858890"/>
  <rect x="34" y="14" width="22" height="14" fill="#555962"/>
  <rect x="37" y="17" width="8" height="8" fill="#222630"/>
  <rect x="38" y="18" width="3" height="3" fill="#858c99"/>
  <rect x="2" y="12" width="12" height="16" fill="#777a83"/>
  <rect x="0" y="14" width="6" height="12" fill="#222630"/>
  <rect x="1" y="16" width="3" height="4" fill="#858c99"/>
  <rect x="56" y="33" width="12" height="5" fill="#92949b"/>
  <rect x="60" y="38" width="8" height="5" fill="#777a83"/>
</svg>`;

    /* Per-type settings. Values are in SVG units. */
    const TYPES = {
        bullet: {
            kind: 'bullet',
            base: BULLET_SVG,
            overlay: null,
            w: 73,
            h: 43,
            pivot: { x: 63, y: 28 },      // rear mount, where the arm joins
            cable: { x: 45, y: 43 },      // underside of the rear foot
            lensPoint: { x: 0, y: 16 }    // front centre of the hood
        },
        box: {
            kind: 'box',
            base: BOX_SVG,
            overlay: null,
            w: 73,
            h: 43,
            pivot: { x: 64, y: 36 },      // rear foot, where the arm joins
            cable: { x: 64, y: 43 },      // underside of the foot
            lensPoint: { x: 0, y: 20 }    // front of the lens barrel
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
