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

  // Pixelate rendering of logo.png image into a canvas
  app.pixelateLogo = function({canvasId='logoCanvas',duration=1200,logoSrc='logo.png'}={}){
    return new Promise((resolve)=>{
      const canvas = document.getElementById(canvasId);
      if(!canvas){ resolve(); return; }
      const ctx = canvas.getContext('2d');
      const w = canvas.width; const h = canvas.height;
      ctx.fillStyle = '#031021'; ctx.fillRect(0,0,w,h);
      
      // Load the actual logo image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function(){
        function drawBase(){
          ctx.clearRect(0,0,w,h);
          const glow = ctx.createRadialGradient(w/2,h/2,w*0.08,w/2,h/2,w*0.5);
          glow.addColorStop(0,'rgba(255,255,255,0.34)');
          glow.addColorStop(0.45,'rgba(255,255,255,0.16)');
          glow.addColorStop(1,'rgba(255,255,255,0)');
          ctx.fillStyle = '#05080c'; ctx.fillRect(0,0,w,h);
          ctx.fillStyle = glow; ctx.fillRect(0,0,w,h);
          
          // Draw the logo image centered in the canvas
          ctx.save();
          ctx.translate(w/2,h/2);
          const scale = Math.min(w,h) / Math.max(img.width,img.height) * 0.8;
          ctx.scale(scale, scale);
          ctx.drawImage(img,-img.width/2,-img.height/2);
          ctx.restore();
        }
        drawBase();
        
        // pixelate by drawing to small canvas then backscaled
        const temp = document.createElement('canvas'); const tctx = temp.getContext('2d');
        let start = performance.now();
        function frame(now){
          const elapsed = now - start; const p = Math.min(1, elapsed/duration);
          // pixel size reduces from 28 -> 1 with a slightly slower cinematic reveal
          const px = Math.max(1, Math.floor(30*(1-p) + 1*(p)));
          temp.width = Math.max(2, Math.floor(w/px)); temp.height = Math.max(2, Math.floor(h/px));
          tctx.clearRect(0,0,temp.width,temp.height); tctx.drawImage(canvas,0,0,temp.width,temp.height);
          ctx.imageSmoothingEnabled = false; ctx.clearRect(0,0,w,h);
          ctx.fillStyle = 'rgba(2,5,10,0.2)'; ctx.fillRect(0,0,w,h);
          ctx.drawImage(temp,0,0,temp.width,temp.height,0,0,w,h);
          ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 0.12 - p * 0.12)})`;
          ctx.fillRect(0, Math.floor((h * 0.2) + (Math.sin(now / 180) * 8)), w, 2);
          if(p<1) requestAnimationFrame(frame); else resolve();
        }
        requestAnimationFrame(frame);
      };
      img.onerror = function(){
        console.warn('Failed to load logo image, using fallback');
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

  app.slugify = function(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  global.app = app;
})(window);
