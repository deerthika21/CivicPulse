import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useEffect } from 'react';
import { Highlights } from './Highlights';
import { Journey } from './Journey';
import { LiveSimulation } from './LiveSimulation';
import { NumbersBand } from './NumbersBand';
import { ScrollStory } from './ScrollStory';

gsap.registerPlugin(ScrollTrigger);

/** Smooth scrolling for the showcase page only (skipped for reduced motion). */
function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ duration: 1.05, anchors: { offset: -80 } });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}

/** Everything below the hero — split into its own chunk so the hero paints fast. */
export default function BelowFold() {
  useSmoothScroll();
  return (
    <>
      <div id="story">
        <ScrollStory />
      </div>
      <LiveSimulation />
      <Highlights />
      <NumbersBand />
      <Journey />
    </>
  );
}
