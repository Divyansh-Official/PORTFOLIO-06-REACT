import { type MutableRefObject, type RefObject, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── types ────────────────────────────────────────────────────────────────────

export interface DOMRefs {
  sectionRef    : RefObject<HTMLElement>;
  canvasRef     : RefObject<HTMLCanvasElement>;
  nameRef       : RefObject<HTMLHeadingElement>;
  roleRef       : RefObject<HTMLParagraphElement>;
  aboutRef      : RefObject<HTMLParagraphElement>;
  socialsRef    : RefObject<HTMLDivElement>;
  scrollHintRef : RefObject<HTMLDivElement>;
}

export interface FrameState {
  framesRef  : MutableRefObject<HTMLImageElement[]>;
  frameCount : number;
  loaded     : boolean;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Returns the ref's current value only if it is a mounted DOM node. */
function el<T extends Element>(ref: RefObject<T>): T | null {
  return ref.current ?? null;
}

/** Collect non-null elements from a list of refs. */
function els<T extends Element>(...refs: RefObject<T>[]): T[] {
  return refs.map(r => r.current).filter((n): n is T => n !== null);
}

// ─── draw helper ──────────────────────────────────────────────────────────────

export function drawFrame(
  index  : number,
  canvas : HTMLCanvasElement,
  frames : HTMLImageElement[]
): void {
  const img = frames[index];
  if (!img) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
  const x = (canvas.width  - img.width  * scale) / 2;
  const y = (canvas.height - img.height * scale) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useHeroAnimations(domRefs: DOMRefs, frameState: FrameState): void {
  const {
    sectionRef, canvasRef,
    nameRef, roleRef, aboutRef, socialsRef, scrollHintRef,
  } = domRefs;
  const { framesRef, frameCount, loaded } = frameState;
  const currentIdx = useRef(0);

  // ── entrance animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;

    // Collect only refs that have actually mounted — never pass null to GSAP
    const name      = el(nameRef);
    const role      = el(roleRef);
    const about     = el(aboutRef);
    const socials   = el(socialsRef);
    const hint      = el(scrollHintRef);

    const tl = gsap.timeline({ delay: 0.25 });

    if (name)    tl.from(name,    { opacity: 0, y: 38, duration: 1,   ease: 'power3.out' });
    if (role)    tl.from(role,    { opacity: 0, y: -8, duration: 0.7, ease: 'power3.out' }, '<0.2');
    if (about)   tl.from(about,   { opacity: 0, y: 22, duration: 0.8, ease: 'power3.out' }, '-=0.6');
    if (socials) tl.from(socials, { opacity: 0, y: 22, duration: 0.7, ease: 'power3.out' }, '-=0.5');
    if (hint)    tl.from(hint,    { opacity: 0,        duration: 0.5                     }, '-=0.3');

    return () => { tl.kill(); };
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── scroll-driven animations ────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !frameCount) return;

    const section = el(sectionRef);
    const canvas  = el(canvasRef);
    const frames  = framesRef.current;

    if (!section || !canvas || !frames.length) return;

    drawFrame(0, canvas, frames);
    currentIdx.current = 0;

    ScrollTrigger.getAll().forEach(t => t.kill());

    const STORY_PX = window.innerHeight * 4;

    // pin
    ScrollTrigger.create({
      trigger: section, start: 'top top', end: `+=${STORY_PX}`,
      pin: true, pinSpacing: true, anticipatePin: 1,
    });

    // frame scrub
    const obj = { f: 0 };
    gsap.to(obj, {
      f: frameCount - 1, ease: 'none',
      scrollTrigger: {
        trigger: section, start: 'top top', end: `+=${STORY_PX}`,
        scrub: 0.5, invalidateOnRefresh: true,
        onUpdate() {
          const idx = Math.round(obj.f);
          if (idx !== currentIdx.current) {
            currentIdx.current = idx;
            drawFrame(idx, canvas, frames);
          }
        },
      },
    });

    // text fade-out — only animate refs that are non-null
    const textEls = els(nameRef, roleRef, aboutRef, socialsRef);
    if (textEls.length) {
      gsap.fromTo(
        textEls,
        { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' },
        {
          opacity: 0, scale: 0.78, y: -55, filter: 'blur(8px)',
          ease: 'power2.in', stagger: 0.06,
          scrollTrigger: {
            trigger: section, start: 'top top', end: `+=${STORY_PX * 0.28}`,
            scrub: 1, invalidateOnRefresh: true,
          },
        }
      );
    }

    // scroll-hint fade
    const hint = el(scrollHintRef);
    if (hint) {
      gsap.fromTo(hint, { opacity: 1 }, {
        opacity: 0,
        scrollTrigger: {
          trigger: section, start: 'top top', end: `+=${STORY_PX * 0.12}`,
          scrub: 0.8, invalidateOnRefresh: true,
        },
      });
    }

    // canvas zoom
    gsap.fromTo(canvas, { scale: 1 }, {
      scale: 1.07, ease: 'none',
      scrollTrigger: {
        trigger: section, start: 'top top', end: `+=${STORY_PX * 0.6}`,
        scrub: 1.2, invalidateOnRefresh: true,
      },
    });

    // canvas fade-out
    gsap.to(canvas, {
      opacity: 0, ease: 'power2.in',
      scrollTrigger: {
        trigger: section, start: `+=${STORY_PX * 0.83}`, end: `+=${STORY_PX}`,
        scrub: 1, invalidateOnRefresh: true,
      },
    });

    // defer one rAF — pin spacer must be in DOM before GSAP measures
    const rafId = requestAnimationFrame(() => ScrollTrigger.refresh());

    const onResize = () => {
      drawFrame(currentIdx.current, canvas, frames);
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      ScrollTrigger.getAll().forEach(t => t.kill());
      window.removeEventListener('resize', onResize);
    };
  }, [loaded, frameCount]); // eslint-disable-line react-hooks/exhaustive-deps
}