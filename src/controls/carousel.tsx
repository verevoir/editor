'use client';

import { useState, useCallback } from 'react';
import { defineBlock, text, richText, array, object } from '@verevoir/schema';
import { markdownToHtml } from '../markdown.js';
import type { ControlDefinition } from './types.js';

// Carousel slides share the hero shape
export const carouselBlock = defineBlock({
  name: 'carousel',
  fields: {
    slides: array(
      'Slides',
      object('Slide', {
        title: text('Title'),
        body: richText('Body'),
        imageUrl: text('Image URL').optional(),
        ctaText: text('CTA Text').optional(),
        ctaUrl: text('CTA URL').optional(),
      }),
    ),
  },
});

export interface CarouselSlide {
  title: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface CarouselData {
  slides: CarouselSlide[];
}

export function CarouselRenderer({ data }: { data: CarouselData }) {
  const [current, setCurrent] = useState(0);
  const total = data.slides?.length ?? 0;

  const prev = useCallback(
    () => setCurrent((i) => (i > 0 ? i - 1 : total - 1)),
    [total],
  );
  const next = useCallback(
    () => setCurrent((i) => (i < total - 1 ? i + 1 : 0)),
    [total],
  );

  if (total === 0) {
    return (
      <section data-control="carousel">
        <p data-control-carousel-empty>No slides</p>
      </section>
    );
  }

  const slide = data.slides[current];

  return (
    <section data-control="carousel">
      <div data-control-carousel-slide>
        {slide.imageUrl && (
          <img data-control-carousel-image src={slide.imageUrl} alt="" />
        )}
        <h2 data-control-carousel-title>{slide.title}</h2>
        {slide.body && (
          <div
            data-control-carousel-body
            dangerouslySetInnerHTML={{ __html: markdownToHtml(slide.body) }}
          />
        )}
        {slide.ctaText && slide.ctaUrl && (
          <a data-control-carousel-cta href={slide.ctaUrl}>
            {slide.ctaText}
          </a>
        )}
      </div>
      {total > 1 && (
        <nav data-control-carousel-nav>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            data-control-carousel-prev
          >
            &larr;
          </button>
          <span data-control-carousel-indicator>
            {current + 1} / {total}
          </span>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            data-control-carousel-next
          >
            &rarr;
          </button>
        </nav>
      )}
    </section>
  );
}

export const carouselControl: ControlDefinition<CarouselData> = {
  type: 'carousel',
  label: 'Carousel',
  block: carouselBlock,
  Renderer: CarouselRenderer,
};
