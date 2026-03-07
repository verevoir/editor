import { defineBlock, text, richText } from '@verevoir/schema';
import { markdownToHtml } from '../markdown.js';
import type { ControlDefinition } from './types.js';

export const contentBlock = defineBlock({
  name: 'content',
  fields: {
    heading: text('Heading').optional(),
    body: richText('Body'),
  },
});

export interface ContentData {
  heading?: string;
  body: string;
}

export function ContentRenderer({ data }: { data: ContentData }) {
  return (
    <section data-control="content">
      {data.heading && <h2 data-control-content-heading>{data.heading}</h2>}
      <div
        data-control-content-body
        dangerouslySetInnerHTML={{ __html: markdownToHtml(data.body) }}
      />
    </section>
  );
}

export const contentControl: ControlDefinition<ContentData> = {
  type: 'content',
  label: 'Content',
  block: contentBlock,
  Renderer: ContentRenderer,
};
