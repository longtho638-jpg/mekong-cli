import { describe, it, expect } from 'vitest';
import { colors, gradients, animations, transitions, vibeClasses } from './design-tokens';

describe('colors — completeness', () => {
  it('should export all top-level color groups', () => {
    expect(colors).toHaveProperty('primary');
    expect(colors).toHaveProperty('accent');
    expect(colors).toHaveProperty('success');
    expect(colors).toHaveProperty('dark');
  });

  it('primary palette should cover 50, 100, 500, 600, 900 steps', () => {
    const steps = [50, 100, 500, 600, 900] as const;
    for (const step of steps) {
      expect(colors.primary[step]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('all primary shades should be valid 6-digit hex codes', () => {
    for (const value of Object.values(colors.primary)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('accent palette should have 50, 500, 600 entries', () => {
    expect(colors.accent[50]).toBeDefined();
    expect(colors.accent[500]).toBeDefined();
    expect(colors.accent[600]).toBeDefined();
  });

  it('success palette entries should be valid hex', () => {
    expect(colors.success[500]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors.success[600]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('dark mode tokens should have bg, card, border', () => {
    expect(colors.dark.bg).toBeDefined();
    expect(colors.dark.card).toBeDefined();
    expect(colors.dark.border).toBeDefined();
  });

  it('dark.bg should be darker than dark.card (lower hex value)', () => {
    // bg = #0f172a, card = #1e293b — bg is darker
    const bgNum = parseInt(colors.dark.bg.replace('#', ''), 16);
    const cardNum = parseInt(colors.dark.card.replace('#', ''), 16);
    expect(bgNum).toBeLessThan(cardNum);
  });
});

describe('gradients — format and values', () => {
  it('should export exactly 4 named gradients', () => {
    expect(Object.keys(gradients)).toHaveLength(4);
  });

  it('every gradient should be a valid CSS linear-gradient string', () => {
    for (const [name, value] of Object.entries(gradients)) {
      expect(value, `${name} gradient`).toMatch(/^linear-gradient\(\d+deg,/);
    }
  });

  it('every gradient should include percentage stops', () => {
    for (const value of Object.values(gradients)) {
      expect(value).toMatch(/\d+%/);
    }
  });

  it('all gradients should use 135deg direction', () => {
    for (const value of Object.values(gradients)) {
      expect(value).toContain('135deg');
    }
  });
});

describe('animations — structure', () => {
  it('fadeIn should have initial, animate, exit keys', () => {
    expect(Object.keys(animations.fadeIn)).toEqual(
      expect.arrayContaining(['initial', 'animate', 'exit']),
    );
  });

  it('fadeInUp exit should move upward (negative y)', () => {
    expect(animations.fadeInUp.exit.y).toBeLessThan(0);
  });

  it('slideInLeft initial x should be negative (off-screen left)', () => {
    expect(animations.slideInLeft.initial.x).toBeLessThan(0);
  });

  it('slideInLeft animate x should be 0 (on-screen)', () => {
    expect(animations.slideInLeft.animate.x).toBe(0);
  });

  it('scaleIn initial scale should be less than 1', () => {
    expect(animations.scaleIn.initial.scale).toBeLessThan(1);
  });

  it('scaleIn animate scale should be exactly 1', () => {
    expect(animations.scaleIn.animate.scale).toBe(1);
  });

  it('stagger with no argument uses 0.1 default delay', () => {
    const result = animations.stagger();
    expect(result.animate.transition.staggerChildren).toBe(0.1);
  });

  it('stagger with custom delay uses provided value', () => {
    const result = animations.stagger(0.3);
    expect(result.animate.transition.staggerChildren).toBe(0.3);
  });

  it('stagger with 0 delay is valid', () => {
    const result = animations.stagger(0);
    expect(result.animate.transition.staggerChildren).toBe(0);
  });
});

describe('transitions — values', () => {
  it('spring stiffness should be greater than damping', () => {
    expect(transitions.spring.stiffness).toBeGreaterThan(transitions.spring.damping);
  });

  it('bounce should be stiffer than spring', () => {
    expect(transitions.bounce.stiffness).toBeGreaterThan(transitions.spring.stiffness);
  });

  it('smooth duration should be a positive number in seconds', () => {
    expect(transitions.smooth.duration).toBeGreaterThan(0);
    expect(transitions.smooth.duration).toBeLessThan(2);
  });

  it('smooth ease should be a string', () => {
    expect(typeof transitions.smooth.ease).toBe('string');
  });
});

describe('vibeClasses — tailwind utility strings', () => {
  it('glass class should include backdrop-blur', () => {
    expect(vibeClasses.glass).toContain('backdrop-blur');
  });

  it('gradientText class should include bg-clip-text', () => {
    expect(vibeClasses.gradientText).toContain('bg-clip-text');
  });

  it('gradientText class should include text-transparent', () => {
    expect(vibeClasses.gradientText).toContain('text-transparent');
  });

  it('hoverScale class should include hover:scale-', () => {
    expect(vibeClasses.hoverScale).toContain('hover:scale-');
  });

  it('hoverGlow class should include hover:shadow-', () => {
    expect(vibeClasses.hoverGlow).toContain('hover:shadow-');
  });

  it('focusRing class should include focus:ring-', () => {
    expect(vibeClasses.focusRing).toContain('focus:ring-');
  });

  it('all vibeClasses values should be non-empty strings', () => {
    for (const [key, value] of Object.entries(vibeClasses)) {
      expect(typeof value, key).toBe('string');
      expect(value.length, key).toBeGreaterThan(0);
    }
  });
});
