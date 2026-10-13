(function(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w=0,h=0,ratio=1;
  let stars = [];
  // Ajustes adaptativos según pantalla
  function getStarCount(){
    if(window.innerWidth <= 420) return 50;
    if(window.innerWidth <= 800) return 90;
    return 140;
  }
  function getShadowBlurBase(){
    return window.innerWidth <= 420 ? 2 : (window.innerWidth <= 800 ? 4 : 6);
  }
  const pointer = {x: null, y: null, vx:0, vy:0};

  function resize(){
    ratio = window.devicePixelRatio || 1;
    w = canvas.width = Math.floor(window.innerWidth * ratio);
    h = canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(ratio,0,0,ratio,0,0);
    initStars();
  }

  function rand(min,max){return Math.random()*(max-min)+min}

  function initStars(){
    stars = [];
    const STAR_COUNT = getStarCount();
    for(let i=0;i<STAR_COUNT;i++){
      // reducir tamaño máximo en móviles
      const rMax = window.innerWidth <= 420 ? 1.2 : 1.8;
      stars.push({
        x: Math.random()*w/ratio,
        y: Math.random()*h/ratio,
        z: rand(0.2,1),
        r: rand(0.5,rMax),
        vx: rand(-0.02,0.02),
        vy: rand(-0.02,0.02),
        baseAlpha: rand(0.25,0.95),
        twinkle: Math.random()*Math.PI*2
      });
    }
  }

  function draw(){
    ctx.clearRect(0,0,w/ratio,h/ratio);
    // subtle tint layer behind stars
    // draw stars
    for(const s of stars){
      // parallax offset by pointer
      const px = pointer.x!=null ? (pointer.x - w/(2*ratio)) / (w/ratio) * 30 * s.z : 0;
      const py = pointer.y!=null ? (pointer.y - h/(2*ratio)) / (h/ratio) * 30 * s.z : 0;
      const x = s.x + px;
      const y = s.y + py;
      // twinkle (alpha)
      const a = s.baseAlpha * (0.6 + 0.4 * Math.sin(s.twinkle + performance.now()*0.0006));
      // draw sharp core
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a)})`;
      // use integer coords for crisper pixels
      const ix = Math.round(x);
      const iy = Math.round(y);
      const coreR = Math.max(0.5, s.r * 0.85);
      ctx.beginPath();
      ctx.arc(ix, iy, coreR, 0, Math.PI * 2);
      // slight glow using shadow for a subtle halo, adapt blur to device width
      const blurBase = getShadowBlurBase();
      ctx.shadowColor = `rgba(255,255,255,${Math.min(0.9, a)})`;
      ctx.shadowBlur = blurBase * s.z;
      ctx.fill();
      // small soft halo for brighter/deeper stars (lighter on small screens)
      ctx.shadowBlur = 0;
      if(s.z > 0.6 && window.innerWidth > 420){
        const haloR = s.r * 5;
        const grad = ctx.createRadialGradient(ix, iy, 0, ix, iy, haloR);
        grad.addColorStop(0, `rgba(200,220,255,${a * 0.25})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(ix - haloR, iy - haloR, haloR * 2, haloR * 2);
      }
      ctx.restore();
    }
    // optional gentle nebula overlay
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.06;
    const g = ctx.createRadialGradient(w/(2*ratio), h/(3*ratio), 0, w/(2*ratio), h/(3*ratio), Math.max(w,h)/ratio);
    g.addColorStop(0, 'rgba(107,91,250,0.25)');
    g.addColorStop(0.5, 'rgba(255,90,120,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w/ratio,h/ratio);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function update(dt){
    for(const s of stars){
      s.x += s.vx * dt * 0.06 * (1+s.z);
      s.y += s.vy * dt * 0.06 * (1+s.z);
      s.twinkle += 0.02 * (1+s.z);
      // wrap
      if(s.x < -20) s.x = w/ratio + 20;
      if(s.x > w/ratio + 20) s.x = -20;
      if(s.y < -20) s.y = h/ratio + 20;
      if(s.y > h/ratio + 20) s.y = -20;
      // pointer influence (gentle attraction)
      if(pointer.x!=null){
        const dx = pointer.x - s.x;
        const dy = pointer.y - s.y;
        const dist2 = dx*dx + dy*dy;
        const max = 20000;
        if(dist2 < max){
          const f = (1 - dist2 / max) * 0.001 * (1/s.z);
          s.vx += dx * f;
          s.vy += dy * f;
        }
      }
      // damp velocities
      s.vx *= 0.995;
      s.vy *= 0.995;
    }
  }

  let last = performance.now();
  function loop(t){
    const dt = t - last; last = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // events
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', function(e){
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  });
  window.addEventListener('touchmove', function(e){
    if(e.touches && e.touches[0]){
      pointer.x = e.touches[0].clientX;
      pointer.y = e.touches[0].clientY;
    }
  }, {passive:true});
  window.addEventListener('mouseout', function(){ pointer.x = null; pointer.y=null });

  // init
  resize();
  requestAnimationFrame(loop);
})();
