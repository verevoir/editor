import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewFrame } from '../src/PreviewFrame.js';

describe('PreviewFrame', () => {
  it('renders children inside preview surface', () => {
    render(
      <PreviewFrame>
        <p>Hello world</p>
      </PreviewFrame>,
    );
    expect(screen.getByText('Hello world')).toBeDefined();
  });

  it('renders default viewport buttons', () => {
    render(
      <PreviewFrame>
        <p>Content</p>
      </PreviewFrame>,
    );
    expect(screen.getByText('Mobile (375px)')).toBeDefined();
    expect(screen.getByText('Tablet (768px)')).toBeDefined();
    expect(screen.getByText('Desktop (1200px)')).toBeDefined();
  });

  it('starts with the default viewport active', () => {
    render(
      <PreviewFrame>
        <p>Content</p>
      </PreviewFrame>,
    );
    const desktopBtn = screen.getByText('Desktop (1200px)');
    expect(desktopBtn.dataset.active).toBe('');
    const mobileBtn = screen.getByText('Mobile (375px)');
    expect(mobileBtn.dataset.active).toBeUndefined();
  });

  it('switches viewport on button click', () => {
    render(
      <PreviewFrame>
        <p>Content</p>
      </PreviewFrame>,
    );
    const mobileBtn = screen.getByText('Mobile (375px)');
    fireEvent.click(mobileBtn);
    expect(mobileBtn.dataset.active).toBe('');

    const surface = document.querySelector(
      '[data-preview-surface]',
    ) as HTMLElement;
    expect(surface.style.width).toBe('375px');
  });

  it('applies zoom via transform scale', () => {
    render(
      <PreviewFrame>
        <p>Content</p>
      </PreviewFrame>,
    );
    const slider = document.querySelector(
      '[data-preview-zoom-slider]',
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '50' } });

    const surface = document.querySelector(
      '[data-preview-surface]',
    ) as HTMLElement;
    expect(surface.style.transform).toBe('scale(0.5)');
    expect(screen.getByText('50%')).toBeDefined();
  });

  it('accepts custom viewports', () => {
    const viewports = [
      { label: 'Small', width: 320 },
      { label: 'Large', width: 1440 },
    ];
    render(
      <PreviewFrame viewports={viewports} defaultViewport="Large">
        <p>Content</p>
      </PreviewFrame>,
    );
    expect(screen.getByText('Small (320px)')).toBeDefined();
    expect(screen.getByText('Large (1440px)')).toBeDefined();
    const largeBtn = screen.getByText('Large (1440px)');
    expect(largeBtn.dataset.active).toBe('');
  });

  it('renders data attributes for styling', () => {
    render(
      <PreviewFrame>
        <p>Content</p>
      </PreviewFrame>,
    );
    expect(document.querySelector('[data-preview-frame]')).toBeDefined();
    expect(document.querySelector('[data-preview-bar]')).toBeDefined();
    expect(document.querySelector('[data-preview-viewport]')).toBeDefined();
    expect(document.querySelector('[data-preview-surface]')).toBeDefined();
  });

  it('passes className to wrapper', () => {
    render(
      <PreviewFrame className="custom-class">
        <p>Content</p>
      </PreviewFrame>,
    );
    const wrapper = document.querySelector(
      '[data-preview-frame]',
    ) as HTMLElement;
    expect(wrapper.className).toBe('custom-class');
  });
});
