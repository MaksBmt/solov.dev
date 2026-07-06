import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class FaviconAnimatorService {
  private link: HTMLLinkElement | null = null;
  private svgUrl: string = '';
  private svgText: string = '';
  private parser: DOMParser | null = null;
  private serializer: XMLSerializer | null = null;
  private animationFrame: number | null = null;
  private startTime: number | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object, private ngZone: NgZone) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.link = document.querySelector('link[rel*="icon"]');
      if (this.link) {
        this.svgUrl = this.link.getAttribute('href')?.split('?')[0] || '';
        this.parser = new DOMParser();
        this.serializer = new XMLSerializer();
      }
    }
  }

  async init() {
    if (!this.isBrowser || !this.link || !this.svgUrl) return;

    try {
      const response = await fetch(this.svgUrl);
      if (!response.ok) return;
      this.svgText = await response.text();
      this.ngZone.runOutsideAngular(() => {
        this.start();
      });
    } catch (e) {
      console.warn('Failed to initialize favicon animator:', e);
    }
  }

  private start() {
    if (!this.parser || !this.serializer) return;

    const doc = this.parser.parseFromString(this.svgText, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    if (!svgElement) return;

    const codeTag = doc.querySelector('.code-tag');
    const labDot = doc.querySelector('.lab-dot');
    const orbit = doc.querySelector('.orbit');

    if (codeTag) codeTag.setAttribute('transform-origin', '16 16');
    if (labDot) labDot.setAttribute('transform-origin', '16 16');
    if (orbit) orbit.setAttribute('transform-origin', '16 16');

    const styleTag = doc.querySelector('style');
    if (styleTag) {
      styleTag.textContent += `
        .code-tag, .lab-dot, .orbit {
          animation: none !important;
        }
      `;
    }

    this.startTime = performance.now();
    let lastTime = 0;
    const fps = 15;
    const interval = 1000 / fps;

    const animate = (time: number) => {
      this.animationFrame = requestAnimationFrame(animate);

      const delta = time - lastTime;
      if (delta < interval) return;

      lastTime = time - (delta % interval);
      const elapsed = (time - (this.startTime || 0)) / 1000;

      if (orbit) {
        const angle = (elapsed * 45) % 360;
        orbit.setAttribute('transform', `rotate(${angle})`);
      }

      if (codeTag) {
        const cycle = (elapsed * Math.PI * 2) / 3;
        const breath = Math.sin(cycle);
        const scale = 1 + (breath + 1) * 0.025;
        const opacity = 0.85 + (breath + 1) * 0.075;
        codeTag.setAttribute('transform', `scale(${scale})`);
        codeTag.setAttribute('opacity', opacity.toString());
      }

      if (labDot) {
        const cycle = (elapsed * Math.PI * 2) / 1.5;
        const blink = Math.sin(cycle);
        const scale = 1 + blink * 0.2;
        const opacity = 0.7 + blink * 0.3;
        labDot.setAttribute('transform', `scale(${scale})`);
        labDot.setAttribute('opacity', opacity.toString());
      }

      const serialized = this.serializer!.serializeToString(doc);
      const base64 = btoa(unescape(encodeURIComponent(serialized)));

      if (this.link) {
        const newLink = this.link.cloneNode(true) as HTMLLinkElement;
        newLink.setAttribute('href', `data:image/svg+xml;base64,${base64}`);
        if (this.link.parentNode) {
          this.link.parentNode.replaceChild(newLink, this.link);
          this.link = newLink;
        }
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}
