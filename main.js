// Custom orange-arrow cursor (mouse/trackpad only)
const cursor = document.querySelector('.cursor');
if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
  document.documentElement.classList.add('has-cursor');
  let x = -100, y = -100, cx = x, cy = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cursor.classList.add('on'); });
  document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
  (function loop() {
    cx += (x - cx) * 0.35; cy += (y - cy) * 0.35;
    cursor.style.transform = `translate(${cx - 2}px, ${cy - 2}px)`;
    requestAnimationFrame(loop);
  })();

}

// Hero parts fade up once half of each is in view (as in the Framer original)
const appear = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); appear.unobserve(en.target); }
}), { threshold: 0.5 });
document.querySelectorAll('.appear, .slide-x').forEach(el => appear.observe(el));

// Scroll reveal (project cards, About page sections)
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  if (el.classList.contains('reveal')) el.style.transitionDelay = `${(i % 2) * 0.12}s`;
  io.observe(el);
});

// Figma-style size label under a selected frame (About page photo): shows the frame's real rendered size
document.querySelectorAll('[data-dims]').forEach(label => {
  new ResizeObserver(([e]) => {
    label.textContent = `${Math.round(e.contentRect.width)} × ${Math.round(e.contentRect.height)}`;
  }).observe(label.parentElement);
});

// Reduced motion: don't autoplay looping videos; give them controls so they can still be played
if (matchMedia('(prefers-reduced-motion:reduce)').matches) {
  document.querySelectorAll('video[autoplay]').forEach(v => { v.autoplay = false; v.pause(); v.controls = true; });
}
