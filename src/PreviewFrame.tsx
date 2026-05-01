'use client';

import { useState } from 'react';

export interface Viewport {
  label: string;
  width: number;
}

const defaultViewports: Viewport[] = [
  { label: 'Mobile', width: 375 },
  { label: 'Tablet', width: 768 },
  { label: 'Desktop', width: 1200 },
];

export interface PreviewFrameProps {
  children: React.ReactNode;
  viewports?: Viewport[];
  defaultViewport?: string;
  /** Initial zoom percentage (25–100). Defaults to 100. */
  defaultZoom?: number;
  className?: string;
}

export function PreviewFrame({
  children,
  viewports = defaultViewports,
  defaultViewport = 'Desktop',
  defaultZoom = 100,
  className,
}: PreviewFrameProps) {
  const initial =
    viewports.find((v) => v.label === defaultViewport) || viewports[0];
  const [viewport, setViewport] = useState<Viewport>(initial);
  const [zoom, setZoom] = useState(defaultZoom);

  const scale = zoom / 100;

  return (
    <div data-preview-frame="" className={className}>
      <div data-preview-bar="">
        {viewports.map((vp) => (
          <button
            key={vp.label}
            data-preview-btn=""
            data-active={viewport.label === vp.label ? '' : undefined}
            onClick={() => setViewport(vp)}
          >
            {vp.label} ({vp.width}px)
          </button>
        ))}
        <span data-preview-zoom-label="">{zoom}%</span>
        <input
          type="range"
          data-preview-zoom-slider=""
          min={33}
          max={100}
          step={5}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </div>

      <div data-preview-viewport="">
        <div
          style={{
            width: viewport.width * scale,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div
            data-preview-surface=""
            style={
              {
                width: viewport.width,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                // Exposed so descendants (e.g. the editor-premium
                // ControlOverlay toolbar) can divide their layout
                // sizes by it and remain a constant size in screen
                // pixels regardless of zoom.
                '--preview-zoom': scale,
              } as React.CSSProperties
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
