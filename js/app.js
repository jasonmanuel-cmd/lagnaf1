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

  // Pixelate rendering of a simple logo text into a canvas
  app.pixelateLogo = function({canvasId='logoCanvas',duration=1200}={}){
    return new Promise((resolve)=>{
      const canvas = document.getElementById(canvasId);
      if(!canvas){ resolve(); return; }
      const ctx = canvas.getContext('2d');
      const w = canvas.width; const h = canvas.height;
      ctx.fillStyle = '#031021'; ctx.fillRect(0,0,w,h);
      // render a stylized mask-like mark inspired by the supplied artwork
      function drawBase(){
        ctx.clearRect(0,0,w,h);
        const glow = ctx.createRadialGradient(w/2,h/2,w*0.08,w/2,h/2,w*0.5);
        glow.addColorStop(0,'rgba(255,255,255,0.34)');
        glow.addColorStop(0.45,'rgba(255,255,255,0.16)');
        glow.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle = '#05080c'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle = glow; ctx.fillRect(0,0,w,h);

        ctx.save();
        ctx.translate(w/2,h*0.46);
        ctx.fillStyle = '#cfd2d7';
        ctx.beginPath();
        ctx.ellipse(0, 0, w*0.24, h*0.28, 0, 0, Math.PI*2);
        ctx.fill();

        const faceShadow = ctx.createLinearGradient(-w*0.1,-h*0.2,w*0.15,h*0.2);
        faceShadow.addColorStop(0,'rgba(0,0,0,0.35)');
        faceShadow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = faceShadow;
        ctx.beginPath();
        ctx.ellipse(0, 0, w*0.24, h*0.28, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#101114';
        ctx.beginPath();
        ctx.ellipse(-w*0.085, -h*0.03, w*0.03, h*0.013, 0, 0, Math.PI*2);
        ctx.ellipse(w*0.085, -h*0.03, w*0.03, h*0.013, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.strokeStyle = '#111'; ctx.lineWidth = w*0.01; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-w*0.02, h*0.01); ctx.lineTo(w*0.015, h*0.01); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-w*0.03, h*0.085); ctx.quadraticCurveTo(0, h*0.105, w*0.03, h*0.085); ctx.stroke();

        ctx.fillStyle = '#d7d7d7';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-w*0.115, h*0.06, w*0.06, h*0.27, w*0.025);
        } else {
          ctx.rect(-w*0.115, h*0.06, w*0.06, h*0.27);
        }
        ctx.fill();
        ctx.fillStyle = '#b7bcc5';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-w*0.09, h*0.11, w*0.06, h*0.24, w*0.02);
        } else {
          ctx.rect(-w*0.09, h*0.11, w*0.06, h*0.24);
        }
        ctx.fill();
        ctx.fillStyle = '#ececec';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-w*0.045, h*0.16, w*0.09, h*0.05, w*0.02);
        } else {
          ctx.rect(-w*0.045, h*0.16, w*0.09, h*0.05);
        }
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(w/2,h*0.86);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = `${Math.floor(w*0.09)}px sans-serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('OWNERSHIP', 0, 0);
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
