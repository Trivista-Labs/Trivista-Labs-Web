import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Hook to setup all GSAP scroll-driven animations
export function useScrollAnimations(loaded) {
  const ctxRef = useRef(null);

  useEffect(() => {
    if (!loaded) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Show everything immediately
      document.querySelectorAll('.gsap-fade').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    // Small delay so DOM is ready
    const timeout = setTimeout(() => {
      ctxRef.current = gsap.context(() => {

        // ── HERO PARALLAX ──
        const heroHeadline = document.querySelector('.hero-headline');
        const heroSub = document.querySelector('.hero-sub');
        const hero3D = document.querySelector('.hero-3d-canvas');
        const heroBg = document.querySelector('.hero-bg-layer');

        if (heroHeadline) {
          gsap.to(heroHeadline, {
            yPercent: -30,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 },
          });
        }
        if (heroSub) {
          gsap.to(heroSub, {
            yPercent: -18,
            opacity: 0.3,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
          });
        }
        if (hero3D) {
          gsap.to(hero3D, {
            scale: 0.5,
            opacity: 0,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
          });
        }
        if (heroBg) {
          gsap.to(heroBg, {
            yPercent: -8,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 2 },
          });
        }

        // ── SECTION LABELS ──
        gsap.utils.toArray('.section-label').forEach(el => {
          gsap.from(el, {
            opacity: 0, y: 24,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 78%', toggleActions: 'play none none none' },
          });
        });

        // ── SECTION TITLES - mask reveal ──
        gsap.utils.toArray('.section-title').forEach(title => {
          // Wrap each text node in overflow hidden for mask effect
          const text = title.textContent;
          title.innerHTML = '';
          const wrapper = document.createElement('div');
          wrapper.style.overflow = 'hidden';
          const inner = document.createElement('div');
          inner.textContent = text;
          inner.style.willChange = 'transform';
          wrapper.appendChild(inner);
          title.appendChild(wrapper);

          gsap.from(inner, {
            y: '100%',
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: title, start: 'top 78%', toggleActions: 'play none none none' },
          });
        });

        // ── SECTION BODY TEXT ──
        gsap.utils.toArray('.section-body').forEach(el => {
          gsap.from(el, {
            opacity: 0, y: 20,
            duration: 0.7,
            ease: 'power2.out',
            delay: 0.25,
            scrollTrigger: { trigger: el, start: 'top 78%', toggleActions: 'play none none none' },
          });
        });

        // ── SERVICE CARDS ──
        gsap.utils.toArray('.service-card').forEach((card, i) => {
          gsap.from(card, {
            opacity: 0, y: 60, scale: 0.96,
            duration: 0.7,
            ease: 'power2.out',
            delay: i * 0.15,
            scrollTrigger: { trigger: card, start: 'top 78%', toggleActions: 'play none none none' },
          });
        });

        // ── TEAM CARDS ──
        gsap.utils.toArray('.team-card').forEach((card, i) => {
          gsap.from(card, {
            opacity: 0, y: 60, scale: 0.96,
            duration: 0.7,
            ease: 'power2.out',
            delay: i * 0.15,
            scrollTrigger: { trigger: card, start: 'top 78%', toggleActions: 'play none none none' },
          });
        });

        // NOTE: Stat cards have their own React IntersectionObserver animation
        // in the StatCard component — no GSAP animation needed here.

        // ── ABOUT PILLS ──
        gsap.utils.toArray('.about-pill').forEach((pill, i) => {
          gsap.from(pill, {
            opacity: 0, x: -30,
            duration: 0.6,
            ease: 'power2.out',
            delay: 0.3 + i * 0.12,
            scrollTrigger: { trigger: pill, start: 'top 85%', toggleActions: 'play none none none' },
          });
        });

        // ── CONTACT CARD ──
        const contactCard = document.querySelector('.contact-card');
        if (contactCard) {
          gsap.from(contactCard, {
            opacity: 0, y: 60, scale: 0.98,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: contactCard, start: 'top 78%', toggleActions: 'play none none none' },
          });
        }

        // ── HERO ENTRANCE after load ──
        const heroBadge = document.querySelector('.hero-badge');
        const heroBtns = document.querySelector('.hero-btns');

        const heroTl = gsap.timeline({ delay: 0.1 });
        if (heroBadge) {
          heroTl.from(heroBadge, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' });
        }
        if (heroHeadline) {
          heroTl.from(heroHeadline, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out' }, '-=0.2');
        }
        if (heroSub) {
          heroTl.from(heroSub, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' }, '-=0.4');
        }
        if (heroBtns) {
          heroTl.from(heroBtns, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' }, '-=0.3');
        }

      });
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (ctxRef.current) ctxRef.current.revert();
    };
  }, [loaded]);
}

// Hook for active section detection via IntersectionObserver
export function useActiveSection(setActiveSection) {
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [setActiveSection]);
}
