/* Shared lightweight app functions: star field, simple pixelate logo */
(function(global){
  const app = {};

  app.initStars = async function(selector){
    try{
      const container = document.querySelector(selector);
      if(!container) return;
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display='block';
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
      resize(); window.addEventListener('resize', resize);
      const stars = Array.from({length: Math.max(150, Math.floor((innerWidth*innerHeight)/18000))}).map(()=>({
        x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*1.8+0.4, alpha: Math.random()*0.95+0.05, dx:(Math.random()-0.5)*0.03, dy:(Math.random()-0.5)*0.01
      }));
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); for(const s of stars){ s.x += s.dx; if(s.x<0) s.x = canvas.width; if(s.x>canvas.width) s.x=0; const g = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*6); g.addColorStop(0, `rgba(255,255,255,${s.alpha})`); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }
        for(const s of stars){ s.y += reducedMotion ? 0 : s.dy; if(s.y<0) s.y = canvas.height; if(s.y>canvas.height) s.y=0; }
        if(!reducedMotion) requestAnimationFrame(draw);
      }
      draw();
    }catch(e){ console.warn('stars init failed',e); }
  };

  // Enhanced logo reveal with glow effect (no pixelation)
  app.pixelateLogo = function({canvasId='logoCanvas',duration=2000,logoSrc='logo.png'}={}){
    return new Promise((resolve)=>{
      const canvas = document.getElementById(canvasId);
      if(!canvas){ resolve(); return; }
      const ctx = canvas.getContext('2d');
      const w = canvas.width; const h = canvas.height;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function(){
        let start = performance.now();
        function frame(now){
          const elapsed = now - start;
          const p = Math.min(1, elapsed / duration);
          
          ctx.clearRect(0, 0, w, h);
          
          // Animated background with radial gradient
          const glow = ctx.createRadialGradient(w/2, h/2, w*0.05, w/2, h/2, w*0.55);
          glow.addColorStop(0, `rgba(103,169,255,${0.25 * p})`);
          glow.addColorStop(0.5, `rgba(49,208,198,${0.12 * p})`);
          glow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, w, h);
          
          // Scale and fade in the logo smoothly
          ctx.save();
          ctx.globalAlpha = Math.min(1, p * 1.2);
          const scale = 0.7 + (p * 0.3);
          ctx.translate(w/2, h/2);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -img.width/2, -img.height/2);
          ctx.restore();
          
          // Add subtle glow ring that pulses
          ctx.strokeStyle = `rgba(103,169,255,${Math.max(0, (0.3 - p*0.3) * (1 + Math.sin(elapsed/200)*0.2))})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(w/2, h/2, (w*0.35) + (Math.sin(elapsed/300)*8), 0, Math.PI*2);
          ctx.stroke();
          
          if(p < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      };
      img.onerror = function(){
        console.warn('Failed to load logo image');
        resolve();
      };
      img.src = logoSrc;
    });
  };

  app.storage = {
    get(key, fallback = null){
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value){
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  // Handle card selection with visual feedback
  app.initCardSelection = function(selector, storageKey, callback) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const value = card.getAttribute('data-path') || card.getAttribute('data-value');
        app.storage.set(storageKey, value);
        
        if (callback) callback(value, card);
        
        // Highlight and scroll to button
        const nextButton = document.querySelector('[role="button"][href], button');
        if (nextButton) {
          nextButton.style.animation = 'none';
          setTimeout(() => {
            nextButton.style.animation = 'pulse 1.5s ease-in-out 3';
            nextButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      });
      
      // Restore previously selected
      const saved = app.storage.get(storageKey);
      const cardValue = card.getAttribute('data-path') || card.getAttribute('data-value');
      if (saved === cardValue) {
        card.classList.add('selected');
      }
    });
  };

  app.slugify = function(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  global.app = app;
})(window);
