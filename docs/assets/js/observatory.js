(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const nativeScroll = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');
  const section = document.querySelector('.observatory');
  const stage = document.querySelector('.observatory-stage');
  const scene = document.querySelector('.scene');
  const opening = document.querySelector('.hero-copy');
  const after = document.querySelector('.hero-after');
  const solar = document.querySelector('.solar-motion');
  const city = document.querySelector('.architecture-motion');
  const progressBar = document.querySelector('.reading-progress');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  // Contents remain readable without JavaScript or if observation is unavailable.
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px 30px 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
    reduced.addEventListener('change', () => {
      if (reduced.matches) document.documentElement.classList.remove('motion-ready');
    });
  }

  const clock = document.querySelector('[data-clock]');
  if (clock) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const updateClock = () => { clock.textContent = formatter.format(new Date()); };
    updateClock();
    setInterval(updateClock, 60000);
  }

  if (scene) {
    const xLabel = scene.querySelector('[data-coordinate-x]');
    const yLabel = scene.querySelector('[data-coordinate-y]');
    let pointerFrame = 0;
    let pointer = null;
    const clearPointer = () => {
      pointer = null;
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      scene.style.setProperty('--pointer-x', '0px');
      scene.style.setProperty('--pointer-y', '0px');
    };
    scene.addEventListener('pointermove', event => {
      if (reduced.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!pointer) return;
        const rect = scene.getBoundingClientRect();
        const x = clamp(pointer.x - rect.left, 0, rect.width);
        const y = clamp(pointer.y - rect.top, 0, rect.height);
        scene.style.setProperty('--pointer-x', `${(x / rect.width - 0.5) * 16}px`);
        scene.style.setProperty('--pointer-y', `${(y / rect.height - 0.5) * 10}px`);
        scene.style.setProperty('--cursor-x', `${x - 14}px`);
        scene.style.setProperty('--cursor-y', `${y - 14}px`);
        xLabel.textContent = String(Math.round(x)).padStart(3, '0');
        yLabel.textContent = String(Math.round(y)).padStart(3, '0');
      });
    }, { passive: true });
    scene.addEventListener('pointerleave', clearPointer);
    reduced.addEventListener('change', clearPointer);
  }

  // Native scroll timelines handle supported browsers. A small rAF fallback
  // keeps the color story available elsewhere, without hijacking scrolling.
  if (!nativeScroll) {
    const colors = [
      [[242, 240, 233], [36, 37, 34], [227, 71, 45], [238, 236, 228]],
      [[217, 196, 169], [52, 48, 42], [217, 86, 40], [212, 191, 164]],
      [[34, 44, 50], [229, 225, 207], [225, 183, 131], [40, 52, 58]],
    ];
    const mix = (a, b, t) => `rgb(${a.map((value, i) => Math.round(value + (b[i] - value) * t)).join(',')})`;
    let scrollFrame = 0;
    function update() {
      scrollFrame = 0;
      if (reduced.matches) return;
      const documentRange = document.documentElement.scrollHeight - innerHeight;
      if (progressBar) progressBar.style.transform = `scaleX(${documentRange > 0 ? clamp(scrollY / documentRange) : 0})`;
      if (!section || !stage) return;
      const bounds = section.getBoundingClientRect();
      const p = clamp(-bounds.top / Math.max(1, section.offsetHeight - stage.offsetHeight));
      const interval = p < 0.5 ? 0 : 1;
      const t = (p - interval * 0.5) * 2;
      ['--scene-paper', '--scene-ink', '--scene-sun', '--building-face'].forEach((property, i) => {
        stage.style.setProperty(property, mix(colors[interval][i], colors[interval + 1][i], t));
      });
      solar.style.transform = `translateY(${p * 22}%) scale(${1 - p * 0.12})`;
      city.style.transform = `translateY(${p * 6}%) scale(${1 + p * 0.04})`;
      opening.style.opacity = String(1 - clamp((p - 0.1) / 0.35));
      opening.style.visibility = p >= 0.45 ? 'hidden' : 'visible';
      opening.style.transform = `translateY(${-clamp((p - 0.1) / 0.35) * 30}px)`;
      after.style.opacity = String(clamp((p - 0.4) / 0.35));
      after.style.transform = `translateY(${(1 - clamp((p - 0.4) / 0.35)) * 30}px)`;
    }
    const schedule = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(update);
    };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    reduced.addEventListener('change', () => {
      if (reduced.matches && stage) {
        stage.removeAttribute('style');
        [opening, after, solar, city].forEach(element => element.removeAttribute('style'));
      }
      schedule();
    });
    update();
  }
})();
