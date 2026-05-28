/* ===================================================
   GATI NODE TRANSPORT — INTERACTIONS & ANIMATIONS
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ---- JS ready ---- */
  document.body.classList.add('js-loaded');

  /* ---- DOM Refs ---- */
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const backToTop = document.getElementById('backToTop');
  const navLinks  = document.querySelectorAll('.nav-links a, .mobile-nav a:not(.btn)');
  const toast     = document.getElementById('toast');

  /* ================================================
     SECURITY UTILITIES
     ================================================ */

  /* 1. Input Sanitizer — strips XSS vectors */
  function sanitize(str, maxLen) {
    if (str === null || str === undefined) return '';
    return String(str)
      .slice(0, maxLen || 2000)
      .replace(/[<>]/g, '')                    // strip HTML tags
      .replace(/javascript\s*:/gi, '')         // strip JS protocol
      .replace(/on\w+\s*=/gi, '')              // strip event handlers
      .replace(/data\s*:\s*text\/html/gi, '')  // strip data URIs
      .replace(/&#/g, '')                      // strip HTML entities
      .replace(/\\\//g, '/')                   // normalize slashes
      .trim();
  }

  /* 2. Rate Limiter — max 3 submissions per 10 minutes */
  const RATE_WINDOW  = 10 * 60 * 1000; // 10 min
  const RATE_MAX     = 3;
  function checkRateLimit() {
    try {
      const now  = Date.now();
      const key  = 'gn_sub_times';
      const prev = JSON.parse(localStorage.getItem(key) || '[]')
                       .filter(t => now - t < RATE_WINDOW);
      if (prev.length >= RATE_MAX) return false;
      prev.push(now);
      localStorage.setItem(key, JSON.stringify(prev));
      return true;
    } catch { return true; } // fail open if localStorage blocked
  }

  /* 3. Honeypot Checker — bots fill hidden fields */
  function isBot(form) {
    const hp = form.querySelector('input[name="website"]');
    return hp && hp.value.trim() !== '';
  }

  /* 4. Min-fill-time Check — bots submit instantly (< 3 sec) */
  function tooFast(startTimestamp) {
    return startTimestamp && (Date.now() - parseInt(startTimestamp, 10)) < 3000;
  }

  /* 5. Field Validators */
  const VALIDATORS = {
    email: v => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(v),
    phone: v => /^[+]?[\d\s\-().]{7,20}$/.test(v),
    name:  v => v.length >= 2 && v.length <= 150,
    text:  v => v.length >= 5,
  };

  /* 6. Set form load timestamps (for bot timing check) */
  const tsReview  = document.getElementById('reviewTimestamp');
  const tsContact = document.getElementById('contactTimestamp');
  if (tsReview)  tsReview.value  = Date.now();
  if (tsContact) tsContact.value = Date.now();

  /* ================================================
     1. HERO FLOATING PARTICLES
     ================================================ */
  const particleContainer = document.getElementById('heroParticles');
  if (particleContainer) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size     = Math.random() * 4 + 2;
      const left     = Math.random() * 100;
      const bottom   = Math.random() * 40;
      const duration = Math.random() * 8 + 6;
      const delay    = Math.random() * 8;
      const opacity  = Math.random() * 0.4 + 0.2;
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${left}%; bottom:${bottom}%;
        opacity:${opacity};
        animation-duration:${duration}s;
        animation-delay:-${delay}s;
      `;
      particleContainer.appendChild(p);
    }
  }

  /* ================================================
     2. NAVBAR — scroll + active link
     ================================================ */
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    const scrollY = window.scrollY;
    if (navbar)    navbar.classList.toggle('scrolled', scrollY > 60);
    if (backToTop) backToTop.classList.toggle('visible', scrollY > 600);

    let current = '';
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) link.classList.toggle('active', href === '#' + current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ================================================
     3. MOBILE NAV
     ================================================ */
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ================================================
     4. HEADING SLIDE — direction-aware on every scroll
     Every section heading slides in from bottom (scroll down)
     or from top (scroll up), and resets when it leaves view
     so the animation repeats every time you pass it.
     ================================================ */
  const headings = document.querySelectorAll('.section-heading, .hero-title');
  let lastScrollY = window.scrollY;

  headings.forEach(h => h.classList.add('heading-anim'));

  if ('IntersectionObserver' in window) {
    const headingObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const scrollingDown = window.scrollY >= lastScrollY;

        if (entry.isIntersecting) {
          entry.target.classList.remove('slide-from-bottom', 'slide-from-top');
          requestAnimationFrame(() => {
            entry.target.classList.add('heading-visible');
          });
        } else {
          entry.target.classList.remove('heading-visible');
          if (scrollingDown) {
            entry.target.classList.add('slide-from-bottom');
            entry.target.classList.remove('slide-from-top');
          } else {
            entry.target.classList.add('slide-from-top');
            entry.target.classList.remove('slide-from-bottom');
          }
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    window.addEventListener('scroll', () => {
      lastScrollY = window.scrollY;
    }, { passive: true });

    headings.forEach(h => {
      h.classList.add('slide-from-bottom');
      headingObserver.observe(h);
    });
  }

  /* ================================================
     5. GENERAL SCROLL ANIMATIONS (fade-up / left / right)
     ================================================ */
  const animEls = document.querySelectorAll('.fade-up, .fade-left, .fade-right');

  if ('IntersectionObserver' in window && animEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    animEls.forEach(el => observer.observe(el));
  } else {
    animEls.forEach(el => el.classList.add('visible'));
  }

  /* ================================================
     6. STATS COUNT-UP
     ================================================ */
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  let statsCounted  = false;

  function countUp(el) {
    const target = parseInt(el.dataset.target, 10);
    const steps  = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      el.textContent = Math.min(Math.round((target / steps) * step), target) + '+';
      if (step >= steps) { clearInterval(timer); el.textContent = target + '+'; }
    }, 2000 / steps);
  }

  if ('IntersectionObserver' in window && statNumbers.length > 0) {
    const statsObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsCounted) {
          statsCounted = true;
          statNumbers.forEach(el => countUp(el));
          statsObs.disconnect();
        }
      });
    }, { threshold: 0.2 });
    const statsSection = document.getElementById('stats');
    if (statsSection) statsObs.observe(statsSection);
  }

  /* ================================================
     7. STAR RATING
     ================================================ */
  const starContainer = document.getElementById('starRating');
  const ratingInput   = document.getElementById('ratingValue');

  if (starContainer && ratingInput) {
    const stars = starContainer.querySelectorAll('.star');
    const setStars = (val, cls) => stars.forEach((s, i) => s.classList.toggle(cls, i < val));

    stars.forEach(star => {
      star.addEventListener('mouseenter', () => setStars(+star.dataset.value, 'hover'));
      star.addEventListener('click', () => {
        ratingInput.value = +star.dataset.value;
        setStars(+star.dataset.value, 'active');
      });
    });
    starContainer.addEventListener('mouseleave', () => stars.forEach(s => s.classList.remove('hover')));
  }

  /* ================================================
     8. TOAST
     ================================================ */
  function showToast(msg, dur) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), dur || 3000);
  }

  /* ================================================
     9. FORM SUBMISSIONS — Secured + Web3Forms
     Security checks: honeypot → timing → rate limit
     → validation → sanitize → send
     ================================================ */
  const WEB3FORMS_KEY = '1b0ca1e8-22ba-44af-80d9-69cc3ceab881';

  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async e => {
      e.preventDefault();

      /* --- Security Gate 1: Honeypot --- */
      if (isBot(reviewForm)) { reviewForm.reset(); return; }

      /* --- Security Gate 2: Too fast (bot) --- */
      if (tooFast(document.getElementById('reviewTimestamp')?.value)) {
        showToast('⚠️ Please take a moment to fill the form.');
        return;
      }

      /* --- Security Gate 3: Rating required --- */
      if (ratingInput && ratingInput.value === '0') {
        showToast('⭐ Please select a star rating');
        return;
      }

      /* --- Security Gate 4: Rate limit --- */
      if (!checkRateLimit()) {
        showToast('⚠️ Too many submissions. Please wait 10 minutes.');
        return;
      }

      /* --- Security Gate 5: Validate fields --- */
      const rawName   = document.getElementById('reviewName')?.value   || '';
      const rawDesig  = document.getElementById('reviewDesignation')?.value || '';
      const rawEmail  = document.getElementById('reviewEmail')?.value  || '';
      const rawReview = document.getElementById('reviewText')?.value   || '';

      if (!VALIDATORS.name(rawName)) {
        showToast('⚠️ Please enter a valid full name (2–150 characters).');
        return;
      }
      if (!VALIDATORS.email(rawEmail)) {
        showToast('⚠️ Please enter a valid email address.');
        return;
      }
      if (!VALIDATORS.text(rawReview)) {
        showToast('⚠️ Please write at least 5 characters in your review.');
        return;
      }

      /* --- Sanitize inputs --- */
      const name   = sanitize(rawName,   100);
      const desig  = sanitize(rawDesig,  150);
      const email  = sanitize(rawEmail,  200);
      const review = sanitize(rawReview, 2000);
      const starLabels = ['','⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'];
      const rating = starLabels[ratingInput.value] + ' (' + ratingInput.value + '/5)';

      const btn = reviewForm.querySelector('button[type="submit"]');
      btn.textContent = 'Sending...';
      btn.disabled = true;

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: 'New Client Review from ' + name,
            from_name: 'Gati Node Website',
            replyto: email,
            'Reviewer Name': name,
            'Designation / Company': desig,
            'Email': email,
            'Rating': rating,
            'Review': review,
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast('✅ Thank you! Your review has been submitted.');
          reviewForm.reset();
          if (tsReview) tsReview.value = Date.now(); // reset timestamp
          if (ratingInput) ratingInput.value = '0';
          if (starContainer) starContainer.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
        } else { throw new Error(data.message); }
      } catch (err) {
        console.error('Submission error:', err);
        showToast('❌ Could not send. Please try again.');
      } finally {
        btn.textContent = 'Submit Review →';
        btn.disabled = false;
      }
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();

      /* --- Security Gate 1: Honeypot --- */
      if (isBot(contactForm)) { contactForm.reset(); return; }

      /* --- Security Gate 2: Too fast (bot) --- */
      if (tooFast(document.getElementById('contactTimestamp')?.value)) {
        showToast('⚠️ Please take a moment to fill the form.');
        return;
      }

      /* --- Security Gate 3: Rate limit --- */
      if (!checkRateLimit()) {
        showToast('⚠️ Too many submissions. Please wait 10 minutes.');
        return;
      }

      /* --- Security Gate 4: Validate fields --- */
      const rawName    = document.getElementById('contactName')?.value    || '';
      const rawPhone   = document.getElementById('contactPhone')?.value   || '';
      const rawEmail   = document.getElementById('contactEmail')?.value   || '';
      const rawService = document.getElementById('contactService')?.value || '';
      const rawDetails = document.getElementById('contactDetails')?.value || '';

      if (!VALIDATORS.name(rawName)) {
        showToast('⚠️ Please enter a valid name (2–150 characters).');
        return;
      }
      if (!VALIDATORS.phone(rawPhone)) {
        showToast('⚠️ Please enter a valid phone number.');
        return;
      }
      if (!VALIDATORS.email(rawEmail)) {
        showToast('⚠️ Please enter a valid email address.');
        return;
      }
      if (!rawService) {
        showToast('⚠️ Please select a service.');
        return;
      }

      /* --- Sanitize inputs --- */
      const name    = sanitize(rawName,    150);
      const phone   = sanitize(rawPhone,    20);
      const email   = sanitize(rawEmail,   200);
      const service = sanitize(rawService, 100);
      const details = sanitize(rawDetails, 2000) || 'N/A';

      const btn = contactForm.querySelector('button[type="submit"]');
      btn.textContent = 'Sending...';
      btn.disabled = true;

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: 'New Enquiry from ' + name + ' - ' + service,
            from_name: 'Gati Node Website',
            replyto: email,
            'Name / Company': name,
            'Phone': phone,
            'Email': email,
            'Service Required': service,
            'Additional Details': details,
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast('✅ Message sent!');
          contactForm.reset();
          if (tsContact) tsContact.value = Date.now(); // reset timestamp
        } else { throw new Error(data.message); }
      } catch (err) {
        console.error('Submission error:', err);
        showToast('❌ Could not send. Please try again.');
      } finally {
        btn.textContent = 'Send Message →';
        btn.disabled = false;
      }
    });
  }


  /* ================================================
     10. SMOOTH SCROLL
     ================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = navbar ? navbar.offsetHeight + 10 : 80;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });

  /* ================================================
     11. HERO MOUSE PARALLAX ON ORBS
     ================================================ */
  const heroSection = document.getElementById('home');
  const orbs = document.querySelectorAll('.orb');

  if (heroSection && orbs.length) {
    heroSection.addEventListener('mousemove', e => {
      const { left, top, width, height } = heroSection.getBoundingClientRect();
      const x = ((e.clientX - left) / width  - 0.5) * 30;
      const y = ((e.clientY - top)  / height - 0.5) * 30;
      orbs.forEach((orb, i) => {
        const f = (i + 1) * 0.5;
        orb.style.transform = `translate(${x * f}px, ${y * f}px)`;
      });
    });
    heroSection.addEventListener('mouseleave', () => {
      orbs.forEach(orb => { orb.style.transform = ''; });
    });
  }

});
