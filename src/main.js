import './style.css'

import { preloadImages } from './utils.js'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

/*
Beat ranges (scroll progress):
- 0.00 - 0.25: value prop + who we are
- 0.25 - 0.55: mechanic analogy
- 0.55 - 0.85: Brand Health Assessment + outcomes
- 0.85 - 1.00: CTA repeat + contact links

Tweak pacing here:
- Scroll distance in ScrollTrigger `end`
- Zoom speed in `animate()` durations
- Message timing in each beat data-start/data-end in index.html
*/
class LandingAnimation {
  constructor() {
    this.dom = document.querySelector('.section')
    this.frontImages = this.dom.querySelectorAll('.section__media__front')
    this.smallImages = this.dom.querySelectorAll('.section__images img')
    this.beats = this.dom.querySelectorAll('.beat')
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.onReducedMotionChange = this.handleReducedMotionChange.bind(this)
    this.smoother = null
    this.timeline = null
    this.prefersReducedMotion.addEventListener('change', this.onReducedMotionChange)
  }

  init() {
    if (this.prefersReducedMotion.matches) {
      this.enableReducedMotion()
      return
    }

    this.smoother = ScrollSmoother.create({
      wrapper: '.wrapper',
      content: '.content',
      smooth: 1.1,
      effects: false,
      normalizeScroll: true
    })

    this.timeline = gsap.timeline({
      scrollTrigger: {
        trigger: this.dom,
        start: 'top top',
        end: '+=360%',
        scrub: 1.1,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const easedProgress = gsap.parseEase('power1.inOut')(self.progress)
          this.dom.style.setProperty('--progress', easedProgress)
          this.updateBeatStates(self.progress)
        }
      }
    })

    this.updateBeatStates(0)
    this.animate()
    document.body.classList.remove('loading')
  }

  animate() {
    gsap.set(this.smallImages, {
      transformStyle: 'preserve-3d',
      backfaceVisibility: 'hidden',
      force3D: true
    })

    this.timeline
      .to(
        this.smallImages,
        {
          z: '125vh',
          duration: 1.25,
          ease: 'power1.inOut',
          stagger: {
            amount: 0.22,
            from: 'center'
          }
        },
        0
      )
      .to(
        this.frontImages,
        {
          scale: 1,
          duration: 1.2,
          ease: 'power1.inOut',
          stagger: {
            amount: 0.16,
            from: 'end'
          }
        },
        0.18
      )
      .to(
        this.frontImages,
        {
          filter: 'blur(0px)',
          duration: 0.95,
          ease: 'power1.inOut',
          stagger: {
            amount: 0.16,
            from: 'end'
          }
        },
        0.3
      )
  }

  updateBeatStates(progress) {
    let dominantBeat = null
    let maxVisibility = -1

    this.beats.forEach((beat) => {
      const start = parseFloat(beat.dataset.start)
      const end = parseFloat(beat.dataset.end)
      const visibility = this.computeRangeVisibility(progress, start, end)

      beat.style.setProperty('--visibility', visibility.toFixed(3))

      if (visibility > maxVisibility) {
        maxVisibility = visibility
        dominantBeat = beat
      }
    })

    this.beats.forEach((beat) => {
      beat.classList.toggle('is-active', beat === dominantBeat)
      beat.setAttribute('aria-hidden', beat === dominantBeat ? 'false' : 'true')
    })
  }

  computeRangeVisibility(progress, start, end) {
    if (progress < start || progress > end) {
      return 0
    }

    const range = end - start
    const fadeWindow = Math.max(range * 0.22, 0.04)
    // Keep beat 1 fully readable at load, then only fade it out near its end.
    if (start === 0) {
      const fadeOutStart = end - fadeWindow
      if (progress <= fadeOutStart) {
        return 1
      }
      return (end - progress) / fadeWindow
    }

    // Keep the final beat visible at the end of the scroll.
    if (end === 1) {
      const fadeInEnd = start + fadeWindow
      if (progress < fadeInEnd) {
        return (progress - start) / fadeWindow
      }
      return 1
    }

    const fadeInEnd = start + fadeWindow
    const fadeOutStart = end - fadeWindow

    if (progress < fadeInEnd) {
      return (progress - start) / fadeWindow
    }

    if (progress > fadeOutStart) {
      return (end - progress) / fadeWindow
    }

    return 1
  }

  enableReducedMotion() {
    document.documentElement.classList.add('reduced-motion')
    this.dom.style.setProperty('--progress', 1)

    this.beats.forEach((beat) => {
      beat.style.setProperty('--visibility', 1)
      beat.classList.remove('is-active')
      beat.setAttribute('aria-hidden', 'false')
    })

    document.body.classList.remove('loading')
  }

  cleanupAnimation() {
    if (this.timeline?.scrollTrigger) {
      this.timeline.scrollTrigger.kill()
    }

    if (this.timeline) {
      this.timeline.kill()
      this.timeline = null
    }

    if (this.smoother) {
      this.smoother.kill()
      this.smoother = null
    }

    ScrollTrigger.refresh()
  }

  handleReducedMotionChange(event) {
    if (event.matches) {
      this.cleanupAnimation()
      this.enableReducedMotion()
      return
    }

    document.documentElement.classList.remove('reduced-motion')
    this.init()
  }
}

const animation = new LandingAnimation()

preloadImages('.wrapper img').then(() => {
  animation.init()
})
