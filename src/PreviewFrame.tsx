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
  className?: string;
}

export function PreviewFrame({
  children,
  viewports = defaultViewports,
  defaultViewport = 'Desktop',
  className,
}: PreviewFrameProps) {
  const initial =
    viewports.find((v) => v.label === defaultViewport) || viewports[0];
  const [viewport, setViewport] = useState<Viewport>(initial);
  const [zoom, setZoom] = useState(100);

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
          min={25}
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
            style={{
              width: viewport.width,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
