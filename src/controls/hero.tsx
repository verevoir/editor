import { defineBlock, text, richText } from '@verevoir/schema';
import { markdownToHtml } from '../markdown.js';
import type { ControlDefinition } from './types.js';

export const heroBlock = defineBlock({
  name: 'hero',
  fields: {
    title: text('Title'),
    body: richText('Body'),
    imageUrl: text('Image URL').optional(),
    ctaText: text('CTA Text').optional(),
    ctaUrl: text('CTA URL').optional(),
  },
});

export interface HeroData {
  title: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function HeroRenderer({ data }: { data: HeroData }) {
  return (
    <section data-control="hero">
      {data.imageUrl && (
        <img data-control-hero-image src={data.imageUrl} alt="" />
      )}
      <h1 data-control-hero-title>{data.title}</h1>
      {data.body && (
        <div
          data-control-hero-body
          dangerouslySetInnerHTML={{ __html: markdownToHtml(data.body) }}
        />
      )}
      {data.ctaText && data.ctaUrl && (
        <a data-control-hero-cta href={data.ctaUrl}>
          {data.ctaText}
        </a>
      )}
    </section>
  );
}

export const heroControl: ControlDefinition<HeroData> = {
  type: 'hero',
  label: 'Hero',
  block: heroBlock,
  Renderer: HeroRenderer,
};
