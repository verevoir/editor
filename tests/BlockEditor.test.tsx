import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  defineBlock,
  text,
  richText,
  number,
  boolean,
  select,
  array,
  object,
  reference,
} from '@nextlake/schema';
import { BlockEditor } from '../src/BlockEditor.js';
import { ReferenceOptionsProvider } from '../src/ReferenceOptionsContext.js';
import type { FieldEditorProps } from '../src/types.js';

const hero = defineBlock({
  name: 'hero',
  fields: {
    title: text('Title').max(100),
    subtitle: text('Subtitle').optional(),
    body: richText('Body'),
    order: number('Order').int(),
    visible: boolean('Visible'),
    status: select('Status', ['draft', 'published', 'archived']),
  },
});

const heroData = {
  title: 'Welcome',
  subtitle: 'Hello world',
  body: '<p>Content</p>',
  order: 1,
  visible: true,
  status: 'draft',
};

describe('BlockEditor', () => {
  it('renders all fields from a block definition', () => {
    render(<BlockEditor block={hero} value={heroData} onChange={() => {}} />);
    expect(screen.getByLabelText('Title')).toHaveValue('Welcome');
    expect(screen.getByLabelText('Subtitle')).toHaveValue('Hello world');
    expect(screen.getByLabelText('Body')).toHaveValue('<p>Content</p>');
    expect(screen.getByLabelText('Order')).toHaveValue(1);
    expect(screen.getByLabelText('Visible')).toBeChecked();
    expect(screen.getByLabelText('Status')).toHaveValue('draft');
  });

  it('sets data-block attribute with block name', () => {
    const { container } = render(
      <BlockEditor block={hero} value={heroData} onChange={() => {}} />,
    );
    expect(container.querySelector("[data-block='hero']")).toBeInTheDocument();
  });

  it('calls onChange with updated data when a field changes', () => {
    const onChange = vi.fn();
    render(<BlockEditor block={hero} value={heroData} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Updated' },
    });
    expect(onChange).toHaveBeenCalledWith({ ...heroData, title: 'Updated' });
  });

  it('renders correct input types for each UIHint', () => {
    render(<BlockEditor block={hero} value={heroData} onChange={() => {}} />);
    expect(screen.getByLabelText('Title')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Body').tagName).toBe('TEXTAREA');
    expect(screen.getByLabelText('Order')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Visible')).toHaveAttribute(
      'type',
      'checkbox',
    );
    expect(screen.getByLabelText('Status').tagName).toBe('SELECT');
  });

  it('supports field overrides by field name', () => {
    function CustomTitle({ value }: FieldEditorProps<string>) {
      return <div data-testid="custom-title">{value}</div>;
    }
    render(
      <BlockEditor
        block={hero}
        value={heroData}
        onChange={() => {}}
        overrides={{ title: CustomTitle }}
      />,
    );
    expect(screen.getByTestId('custom-title')).toHaveTextContent('Welcome');
    // Other fields still render normally
    expect(screen.getByLabelText('Body')).toBeInTheDocument();
  });

  it('supports field overrides by UIHint', () => {
    function CustomRichText({ value }: FieldEditorProps<string>) {
      return <div data-testid="custom-rich">{value}</div>;
    }
    render(
      <BlockEditor
        block={hero}
        value={heroData}
        onChange={() => {}}
        overrides={{ 'rich-text': CustomRichText }}
      />,
    );
    expect(screen.getByTestId('custom-rich')).toHaveTextContent(
      '<p>Content</p>',
    );
  });

  it('renders a block with reference field and provider', () => {
    const article = defineBlock({
      name: 'article',
      fields: {
        title: text('Title'),
        author: reference('Author', 'author'),
      },
    });

    render(
      <ReferenceOptionsProvider
        options={{
          author: [
            { id: 'uuid-1', label: 'Alice' },
            { id: 'uuid-2', label: 'Bob' },
          ],
        }}
      >
        <BlockEditor
          block={article}
          value={{ title: 'My Article', author: 'uuid-1' }}
          onChange={() => {}}
        />
      </ReferenceOptionsProvider>,
    );

    expect(screen.getByLabelText('Title')).toHaveValue('My Article');
    expect(screen.getByLabelText('Author')).toHaveValue('uuid-1');
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders a block with array of references', () => {
    const article = defineBlock({
      name: 'article',
      fields: {
        title: text('Title'),
        reviewers: array('Reviewers', reference('Reviewer', 'author')),
      },
    });

    render(
      <ReferenceOptionsProvider
        options={{
          author: [
            { id: 'uuid-1', label: 'Alice' },
            { id: 'uuid-2', label: 'Bob' },
          ],
        }}
      >
        <BlockEditor
          block={article}
          value={{ title: 'My Article', reviewers: ['uuid-2'] }}
          onChange={() => {}}
        />
      </ReferenceOptionsProvider>,
    );

    expect(screen.getByLabelText('Title')).toHaveValue('My Article');
    // Array of references: the item should render as a select with the value uuid-2
    const reviewerSelect = screen.getByLabelText('Reviewers 1');
    expect(reviewerSelect.tagName).toBe('SELECT');
    expect(reviewerSelect).toHaveValue('uuid-2');
  });

  it('renders a block with array and object fields', () => {
    const page = defineBlock({
      name: 'page',
      fields: {
        title: text('Title'),
        tags: array('Tags', text('Tag')),
        meta: object('Metadata', {
          author: text('Author'),
          year: number('Year'),
        }),
      },
    });

    render(
      <BlockEditor
        block={page}
        value={{
          title: 'My Page',
          tags: ['react', 'nextlake'],
          meta: { author: 'Alice', year: 2025 },
        }}
        onChange={() => {}}
      />,
    );

    expect(screen.getByLabelText('Title')).toHaveValue('My Page');
    expect(screen.getByDisplayValue('react')).toBeInTheDocument();
    expect(screen.getByDisplayValue('nextlake')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025')).toBeInTheDocument();
  });
});
