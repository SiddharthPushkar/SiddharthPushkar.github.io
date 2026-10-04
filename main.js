// Custom orange-arrow cursor (mouse/trackpad only)
const cursor = document.querySelector('.cursor');
if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
  document.documentElement.classList.add('has-cursor');
  let x = -100, y = -100, cx = x, cy = y;
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; cursor.classList.add('on'); });
  document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
  (function loop() {
    cx += (x - cx) * 0.35; cy += (y - cy) * 0.35;
    cursor.style.transform = `translate(${cx - 2}px, ${cy - 2}px)`;
    requestAnimationFrame(loop);
  })();

  // subtle parallax on the floating hero stickers
  const hero = document.querySelector('.hero');
  const floaters = document.querySelectorAll('.keys, .avatar');
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    const dx = (e.clientX - r.width / 2) / r.width, dy = (e.clientY - r.height / 2) / r.height;
    floaters.forEach((el, i) => {
      const k = i ? -14 : 18;
      el.style.setProperty('--px', `${dx * k}px`);
      el.style.setProperty('--py', `${dy * k}px`);
    });
  });
}

// Toolbar: clicking a tool makes it the active one
document.querySelectorAll('.tool').forEach(t => t.addEventListener('click', () => {
  document.querySelector('.tool.active')?.classList.remove('active');
  t.classList.add('active');
}));

// Scroll reveal for cards and footer contact info
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: 0.15 });
document.querySelectorAll('.reveal, .slide-in').forEach((el, i) => {
  if (el.classList.contains('reveal')) el.style.transitionDelay = `${(i % 2) * 0.12}s`;
  io.observe(el);
});
