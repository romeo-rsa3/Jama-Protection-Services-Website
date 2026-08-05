/* ============================================================
   MAIN.JS — navigation, scroll effects, reveal animations
   ============================================================ */
(function(){
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- mobile nav toggle ---------- */
  var toggle = document.getElementById('navToggle');
  var links  = document.getElementById('navLinks');
  var scrim  = document.querySelector('.nav-scrim');

  function closeNav(){
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    document.body.classList.remove('nav-open');
  }
  function openNav(){
    links.classList.add('open');
    toggle.setAttribute('aria-expanded','true');
    document.body.classList.add('nav-open');
  }
  toggle.addEventListener('click', function(){
    links.classList.contains('open') ? closeNav() : openNav();
  });
  scrim.addEventListener('click', closeNav);
  links.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeNav);
  });
  window.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeNav();
  });

  /* ---------- scroll-spy active link ---------- */
  var navA = document.querySelectorAll('[data-nav]');
  var sections = Array.prototype.slice.call(document.querySelectorAll('section[id], header[id]'));

  function onScrollSpy(){
    var pos = window.scrollY + 140;
    var current = sections[0] && sections[0].id;
    sections.forEach(function(s){
      if(pos >= s.offsetTop) current = s.id;
    });
    navA.forEach(function(a){
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  /* ---------- patrol line scroll progress ---------- */
  var patrol = document.getElementById('patrolLine');
  function onScrollProgress(){
    var h = document.documentElement;
    var scrollTop = h.scrollTop || document.body.scrollTop;
    var scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    patrol.style.setProperty('--progress', pct + '%');
  }

  var ticking = false;
  window.addEventListener('scroll', function(){
    if(!ticking){
      window.requestAnimationFrame(function(){
        onScrollSpy();
        onScrollProgress();
        ticking = false;
      });
      ticking = true;
    }
  });
  onScrollSpy();
  onScrollProgress();

  /* ---------- sticky nav shadow on scroll ---------- */
  var nav = document.querySelector('.site-nav');
  window.addEventListener('scroll', function(){
    nav.style.boxShadow = window.scrollY > 20 ? '0 10px 30px rgba(0,0,0,.25)' : 'none';
  });

  /* ---------- reveal-on-scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- star picker (reviews form) ---------- */
  var picker = document.getElementById('starPicker');
  var ratingInput = document.getElementById('rvRating');
  if(picker){
    var starBtns = picker.querySelectorAll('button');
    function paint(val){
      starBtns.forEach(function(b){
        var svg = b.querySelector('svg');
        svg.classList.toggle('on', parseInt(b.dataset.star,10) <= val);
      });
    }
    starBtns.forEach(function(b){
      b.addEventListener('click', function(){
        ratingInput.value = b.dataset.star;
        paint(parseInt(b.dataset.star,10));
      });
      b.addEventListener('mouseenter', function(){ paint(parseInt(b.dataset.star,10)); });
    });
    picker.addEventListener('mouseleave', function(){ paint(parseInt(ratingInput.value,10) || 0); });
  }
})();
