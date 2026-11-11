(function() {
  'use strict';
  
  const NS = window.Surveillance || (window.Surveillance = {});
  
  NS.aim = {
    x: 0,
    y: 0,
    mode: 'idle',
    active: false
  };
  
  let lastPointerMove = 0;
  let lastTouchRelease = 0;
  let touchActive = false;
  let lastScrollTime = 0;
  let lastScrollY = 0;
  
  function init() {
    const stage = document.querySelector('#surveillance .sv-stage');
    const cards = stage ? stage.querySelectorAll('.sv-card') : [];
    
    // Pointer move (mouse/pen)
    window.addEventListener('pointermove', function(e) {
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        NS.aim.x = e.clientX;
        NS.aim.y = e.clientY;
        NS.aim.mode = 'pointer';
        NS.aim.active = true;
        lastPointerMove = performance.now();
      }
    }, { passive: true });
    
    // Pointer leave window
    document.addEventListener('pointerleave', function() {
      // pointerleave on document means pointer left the window
      // start the 2-second timeout (handled by scene checking lastPointerMove)
    }, { passive: true });
    
    document.addEventListener('mouseout', function(e) {
      if (!e.relatedTarget) {
        // pointer left the window
      }
    }, { passive: true });
    
    // Touch
    window.addEventListener('pointerdown', function(e) {
      if (e.pointerType === 'touch') {
        NS.aim.x = e.clientX;
        NS.aim.y = e.clientY;
        NS.aim.mode = 'touch';
        NS.aim.active = true;
        touchActive = true;
      }
    }, { passive: true });
    
    window.addEventListener('pointermove', function(e) {
      if (e.pointerType === 'touch' && touchActive) {
        NS.aim.x = e.clientX;
        NS.aim.y = e.clientY;
        NS.aim.mode = 'touch';
        NS.aim.active = true;
      }
    }, { passive: true });
    
    window.addEventListener('pointerup', function(e) {
      if (e.pointerType === 'touch') {
        touchActive = false;
        lastTouchRelease = performance.now();
      }
    }, { passive: true });
    
    window.addEventListener('pointercancel', function(e) {
      if (e.pointerType === 'touch') {
        touchActive = false;
        lastTouchRelease = performance.now();
        // do not reset to idle, hold position for 1.5s
      }
    }, { passive: true });
    
    // Hover and focus on cards
    cards.forEach(function(card) {
      card.addEventListener('pointerenter', function(e) {
        if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
          NS.aim.hoverTarget = card;
          NS.aim.mode = 'hover';
          NS.aim.active = true;
        }
      }, { passive: true });
      
      card.addEventListener('pointerleave', function(e) {
        if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
          if (NS.aim.hoverTarget === card) {
            NS.aim.hoverTarget = null;
          }
        }
      }, { passive: true });
      
      card.addEventListener('focus', function() {
        NS.aim.hoverTarget = card;
        NS.aim.mode = 'hover';
        NS.aim.active = true;
      });
      
      card.addEventListener('blur', function() {
        if (NS.aim.hoverTarget === card) {
          NS.aim.hoverTarget = null;
        }
      });
    });
    
    // Scroll
    window.addEventListener('scroll', function() {
      lastScrollTime = performance.now();
      lastScrollY = window.scrollY;
    }, { passive: true });
    
    // Expose timing helpers for the scene
    NS.input = {
      getLastPointerMove: function() { return lastPointerMove; },
      getLastTouchRelease: function() { return lastTouchRelease; },
      isTouchActive: function() { return touchActive; },
      getLastScrollTime: function() { return lastScrollTime; },
      getLastScrollY: function() { return lastScrollY; }
    };
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

function buildCards() {
  const grid = document.querySelector('#surveillance .sv-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  // Desktop row assignments
  let leftRow = 1;
  let rightRow = 1;
  
  surveillanceData.forEach(function(item) {
    const card = document.createElement('article');
    card.className = 'sv-card sv-card--' + item.tone + ' sv-card--' + item.side;
    if (item.italic) card.classList.add('sv-card--italic');
    card.setAttribute('data-id', item.id);
    card.setAttribute('tabindex', '0');
    
    const p = document.createElement('p');
    p.className = 'sv-card__text';
    if (item.emphasis) {
      const idx = item.text.indexOf(item.emphasis);
      if (idx >= 0) {
        const before = item.text.substring(0, idx);
        const after = item.text.substring(idx + item.emphasis.length);
        p.innerHTML = escapeHtml(before) + '<strong>' + escapeHtml(item.emphasis) + '</strong>' + escapeHtml(after);
      } else {
        p.textContent = item.text;
      }
    } else {
      p.textContent = item.text;
    }
    card.appendChild(p);
    
    // Set row for desktop grid
    if (item.side === 'left') {
      card.style.setProperty('--sv-row', leftRow);
      leftRow++;
    } else {
      card.style.setProperty('--sv-row', rightRow);
      rightRow++;
    }
    
    grid.appendChild(card);
  });
}

(function() {
  'use strict';
  
  const NS = window.Surveillance || (window.Surveillance = {});
  
  // Internal state
  const state = {
    canvas: null,
    ctx: null,
    stage: null,
    dpr: 1,
    cssWidth: 0,
    cssHeight: 0,
    poleCanvas: null,
    cameras: [],
    cardRects: [],
    rafId: 0,
    lastTime: 0,
    running: false,
    isVisible: true,
    reducedMotion: false,
    scrollOffset: 0,
    targetScrollOffset: 0,
    lastScrollY: 0
  };
  
  // Reusable objects (avoid GC in frame loop)
  const tmpRect = { x: 0, y: 0, w: 0, h: 0 };
  const tmpAim = { x: 0, y: 0 };
  
  function init() {
    state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    buildCards();
    setupCanvas();
    setupObservers();
    if (NS.input && NS.input.attachCardListeners) {
      NS.input.attachCardListeners();
    }
    start();
  }
  
  // ... functions ...
  
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  
  onReady(init);
})();

function buildPoleCanvas() {
  const w = state.cssWidth;
  const h = state.cssHeight;
  const dpr = state.dpr;
  const poleW = w < 900 ? 20 : 26;
  state.poleWidth = poleW;
  
  const canvas = document.createElement('canvas');
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
  const cx = w / 2;
  const px = cx - poleW / 2;
  
  // Get CSS values from custom properties
  const styles = getComputedStyle(document.querySelector('#surveillance'));
  const poleColor = styles.getPropertyValue('--sv-pole').trim() || '#9a93a8';
  const poleDark = styles.getPropertyValue('--sv-pole-dark').trim() || '#5a5470';
  
  // Pole body
  ctx.fillStyle = poleColor;
  ctx.fillRect(px, 0, poleW, h);
  
  // Highlight stripe (left third)
  const hlW = Math.max(2, poleW / 3);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(px, 0, hlW, h);
  
  // Shadow (right third)
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(px + poleW - hlW, 0, hlW, h);
  
  // Outline
  ctx.strokeStyle = poleDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, 0, poleW - 1, h);
  
  // Cap at top
  const capH = 16;
  ctx.fillStyle = poleDark;
  ctx.fillRect(px - 4, 0, poleW + 8, capH);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(px - 4, 0, poleW + 8, 4);
  
  // Base fade (last 80px)
  const fadeH = Math.min(80, h);
  const grad = ctx.createLinearGradient(0, h - fadeH, 0, h);
  grad.addColorStop(0, poleColor);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(px, h - fadeH, poleW, fadeH);
  
  state.poleCanvas = canvas;
}
