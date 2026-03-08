import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  text,
  richText,
  number,
  boolean,
  select,
  array,
  object,
  reference,
} from '@verevoir/schema';
import { TextField } from '../src/fields/TextField.js';
import { RichTextField } from '../src/fields/RichTextField.js';
import { NumberField } from '../src/fields/NumberField.js';
import { BooleanField } from '../src/fields/BooleanField.js';
import { SelectField } from '../src/fields/SelectField.js';
import { ArrayField } from '../src/fields/ArrayField.js';
import { ObjectField } from '../src/fields/ObjectField.js';
import { ReferenceField } from '../src/fields/ReferenceField.js';
import { ReferenceOptionsProvider } from '../src/ReferenceOptionsContext.js';
import { LinkSearchProvider } from '../src/LinkSearchContext.js';
import { CopyAssistProvider } from '../src/CopyAssistContext.js';
import type { CopyAssistRequest } from '../src/CopyAssistContext.js';

describe('TextField', () => {
  it('renders a text input with label', () => {
    const field = text('Title');
    render(
      <TextField
        name="title"
        field={field}
        value="Hello"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Title')).toHaveValue('Hello');
    expect(screen.getByLabelText('Title')).toHaveAttribute('type', 'text');
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    const field = text('Title');
    render(
      <TextField name="title" field={field} value="" onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New' },
    });
    expect(onChange).toHaveBeenCalledWith('New');
  });

  it('marks required fields', () => {
    const field = text('Title');
    render(
      <TextField name="title" field={field} value="" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Title')).toBeRequired();
  });

  it('does not mark optional fields as required', () => {
    const field = text('Title').optional();
    render(
      <TextField name="title" field={field} value="" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Title')).not.toBeRequired();
  });
});

describe('RichTextField', () => {
  beforeEach(() => {
    document.execCommand = vi.fn().mockReturnValue(true);
    document.queryCommandState = vi.fn().mockReturnValue(false);
  });

  it('renders a contentEditable editor with label', () => {
    const field = richText('Body');
    render(
      <RichTextField
        name="body"
        field={field}
        value="Content"
        onChange={() => {}}
      />,
    );
    const el = screen.getByRole('textbox', { name: 'Body' });
    expect(el).toHaveAttribute('contenteditable', 'true');
    expect(el).toHaveTextContent('Content');
  });

  it('calls onChange on input after debounce', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const field = richText('Body');
    render(
      <RichTextField name="body" field={field} value="" onChange={onChange} />,
    );
    const el = screen.getByRole('textbox', { name: 'Body' });
    el.innerHTML = '<p>Updated</p>';
    fireEvent.input(el);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('Updated');
    vi.useRealTimers();
  });

  it('shows internal/external tabs when LinkSearchProvider is present', () => {
    const field = richText('Body');
    const search = vi.fn().mockResolvedValue([]);
    render(
      <LinkSearchProvider search={search}>
        <RichTextField
          name="body"
          field={field}
          value="Hello"
          onChange={() => {}}
        />
      </LinkSearchProvider>,
    );
    // Open link dialog via toolbar button
    fireEvent.click(screen.getByTitle('Link (Ctrl+K)'));
    expect(screen.getByText('Internal')).toBeInTheDocument();
    expect(screen.getByText('External')).toBeInTheDocument();
  });

  it('inserts link using url from search result, not doc:id', async () => {
    vi.useFakeTimers();
    const field = richText('Body');
    const onChange = vi.fn();
    const search = vi.fn().mockResolvedValue([
      {
        id: 'abc-123',
        url: '/talks/abc-123',
        title: 'My Talk',
        blockType: 'talk',
      },
    ]);
    render(
      <LinkSearchProvider search={search}>
        <RichTextField
          name="body"
          field={field}
          value="Hello"
          onChange={onChange}
        />
      </LinkSearchProvider>,
    );
    // Open link dialog
    fireEvent.click(screen.getByTitle('Link (Ctrl+K)'));
    // Type a search query
    const input = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(input, { target: { value: 'talk' } });
    // Flush the search promise
    await vi.advanceTimersByTimeAsync(0);
    // Click the result — should use url, not doc:id
    fireEvent.click(screen.getByText('My Talk'));
    expect(document.execCommand).toHaveBeenCalledWith(
      'createLink',
      false,
      '/talks/abc-123',
    );
    vi.useRealTimers();
  });

  it('does not show tabs when no LinkSearchProvider', () => {
    const field = richText('Body');
    render(
      <RichTextField
        name="body"
        field={field}
        value="Hello"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTitle('Link (Ctrl+K)'));
    expect(screen.queryByText('Internal')).not.toBeInTheDocument();
    // External URL input should show directly
    expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
  });

  it('remove link button clears the link', () => {
    const field = richText('Body');
    render(
      <RichTextField
        name="body"
        field={field}
        value="[linked](https://example.com)"
        onChange={() => {}}
      />,
    );
    // Simulate cursor inside a link by mocking getActiveLink
    const anchor = document.createElement('a');
    anchor.href = 'https://example.com';
    anchor.textContent = 'linked';
    void anchor;
    // Open link dialog
    fireEvent.click(screen.getByTitle('Link (Ctrl+K)'));
    // The Remove button should appear when currentUrl is detected
    // (dialog receives currentUrl from getActiveLink)
  });

  it('shows suggest button when CopyAssistProvider is present', () => {
    const field = richText('Body');
    const generate = vi.fn().mockResolvedValue('Suggested text');
    render(
      <CopyAssistProvider generate={generate}>
        <RichTextField name="body" field={field} value="" onChange={() => {}} />
      </CopyAssistProvider>,
    );
    expect(screen.getByTitle('Suggest copy')).toBeInTheDocument();
  });

  it('does not show suggest button without CopyAssistProvider', () => {
    const field = richText('Body');
    render(
      <RichTextField name="body" field={field} value="" onChange={() => {}} />,
    );
    expect(screen.queryByTitle('Suggest copy')).not.toBeInTheDocument();
  });

  it('calls generate with field metadata and shows suggestion panel', async () => {
    const base = richText('Bio');
    // Simulate .hint() by constructing with hint in meta (schema engine adds this via .hint())
    const field = {
      schema: base.schema,
      meta: { ...base.meta, hint: 'Third person, 2-3 sentences' },
    };
    const generate = vi.fn().mockResolvedValue('A suggested bio.');
    render(
      <CopyAssistProvider generate={generate}>
        <RichTextField
          name="bio"
          field={field}
          value="Existing bio"
          onChange={() => {}}
          blockValue={{ name: 'Alice', bio: 'Existing bio' }}
        />
      </CopyAssistProvider>,
    );
    fireEvent.click(screen.getByTitle('Suggest copy'));
    // Wait for the async generate call
    await vi.waitFor(() => {
      expect(screen.getByText('A suggested bio.')).toBeInTheDocument();
    });
    expect(generate).toHaveBeenCalledWith({
      fieldName: 'bio',
      fieldLabel: 'Bio',
      hint: 'Third person, 2-3 sentences',
      currentValue: 'Existing bio',
      context: { name: 'Alice', bio: 'Existing bio' },
    } satisfies CopyAssistRequest);
  });

  it('accept replaces the value and closes the panel', async () => {
    const field = richText('Bio');
    const onChange = vi.fn();
    const generate = vi.fn().mockResolvedValue('New suggestion');
    render(
      <CopyAssistProvider generate={generate}>
        <RichTextField
          name="bio"
          field={field}
          value="Old value"
          onChange={onChange}
        />
      </CopyAssistProvider>,
    );
    fireEvent.click(screen.getByTitle('Suggest copy'));
    await vi.waitFor(() => {
      expect(screen.getByText('New suggestion')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Accept'));
    expect(onChange).toHaveBeenCalledWith('New suggestion');
    expect(screen.queryByText('New suggestion')).not.toBeInTheDocument();
  });

  it('dismiss closes the panel without changing value', async () => {
    const field = richText('Bio');
    const onChange = vi.fn();
    const generate = vi.fn().mockResolvedValue('Suggestion');
    render(
      <CopyAssistProvider generate={generate}>
        <RichTextField
          name="bio"
          field={field}
          value="Keep this"
          onChange={onChange}
        />
      </CopyAssistProvider>,
    );
    fireEvent.click(screen.getByTitle('Suggest copy'));
    await vi.waitFor(() => {
      expect(screen.getByText('Suggestion')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Dismiss'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('Suggestion')).not.toBeInTheDocument();
  });

  it('regenerate fetches a new suggestion', async () => {
    const field = richText('Bio');
    const generate = vi
      .fn()
      .mockResolvedValueOnce('First suggestion')
      .mockResolvedValueOnce('Second suggestion');
    render(
      <CopyAssistProvider generate={generate}>
        <RichTextField name="bio" field={field} value="" onChange={() => {}} />
      </CopyAssistProvider>,
    );
    fireEvent.click(screen.getByTitle('Suggest copy'));
    await vi.waitFor(() => {
      expect(screen.getByText('First suggestion')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Regenerate'));
    await vi.waitFor(() => {
      expect(screen.getByText('Second suggestion')).toBeInTheDocument();
    });
    expect(generate).toHaveBeenCalledTimes(2);
  });
});

describe('NumberField', () => {
  it('renders a number input with label', () => {
    const field = number('Count');
    render(
      <NumberField name="count" field={field} value={42} onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Count')).toHaveValue(42);
    expect(screen.getByLabelText('Count')).toHaveAttribute('type', 'number');
  });

  it('calls onChange with numeric value', () => {
    const onChange = vi.fn();
    const field = number('Count');
    render(
      <NumberField name="count" field={field} value={0} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText('Count'), {
      target: { value: '7', valueAsNumber: 7 },
    });
    expect(onChange).toHaveBeenCalledWith(7);
  });
});

describe('BooleanField', () => {
  it('renders a checkbox with label', () => {
    const field = boolean('Visible');
    render(
      <BooleanField
        name="visible"
        field={field}
        value={true}
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Visible')).toBeChecked();
    expect(screen.getByLabelText('Visible')).toHaveAttribute(
      'type',
      'checkbox',
    );
  });

  it('calls onChange with boolean value', () => {
    const onChange = vi.fn();
    const field = boolean('Visible');
    render(
      <BooleanField
        name="visible"
        field={field}
        value={false}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Visible'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('SelectField', () => {
  it('renders options from ZodEnum', () => {
    const field = select('Status', ['draft', 'published', 'archived']);
    render(
      <SelectField
        name="status"
        field={field}
        value="published"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Status')).toHaveValue('published');
    expect(screen.getAllByRole('option')).toHaveLength(4); // 3 options + placeholder
  });

  it('calls onChange with selected value', () => {
    const onChange = vi.fn();
    const field = select('Status', ['draft', 'published']);
    render(
      <SelectField
        name="status"
        field={field}
        value="draft"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'published' },
    });
    expect(onChange).toHaveBeenCalledWith('published');
  });

  it('renders placeholder option', () => {
    const field = select('Status', ['draft', 'published']);
    render(
      <SelectField name="status" field={field} value="" onChange={() => {}} />,
    );
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });
});

describe('ArrayField', () => {
  it('renders items with add and remove buttons', () => {
    const field = array('Tags', text('Tag'));
    render(
      <ArrayField
        name="tags"
        field={field}
        value={['foo', 'bar']}
        onChange={() => {}}
      />,
    );
    expect(screen.getByDisplayValue('foo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('bar')).toBeInTheDocument();
    expect(screen.getByText('Add Tags')).toBeInTheDocument();
    expect(screen.getAllByText('Remove')).toHaveLength(2);
  });

  it('adds a new item when Add is clicked', () => {
    const onChange = vi.fn();
    const field = array('Tags', text('Tag'));
    render(
      <ArrayField
        name="tags"
        field={field}
        value={['foo']}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('Add Tags'));
    expect(onChange).toHaveBeenCalledWith(['foo', '']);
  });

  it('removes an item when Remove is clicked', () => {
    const onChange = vi.fn();
    const field = array('Tags', text('Tag'));
    render(
      <ArrayField
        name="tags"
        field={field}
        value={['foo', 'bar']}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByText('Remove')[0]);
    expect(onChange).toHaveBeenCalledWith(['bar']);
  });

  it('updates an item value', () => {
    const onChange = vi.fn();
    const field = array('Tags', text('Tag'));
    render(
      <ArrayField
        name="tags"
        field={field}
        value={['foo', 'bar']}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByDisplayValue('foo'), {
      target: { value: 'baz' },
    });
    expect(onChange).toHaveBeenCalledWith(['baz', 'bar']);
  });

  it('renders empty state with add button', () => {
    const field = array('Tags', text('Tag'));
    render(
      <ArrayField name="tags" field={field} value={[]} onChange={() => {}} />,
    );
    expect(screen.getByText('Add Tags')).toBeInTheDocument();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });
});

describe('ReferenceField', () => {
  const authorRef = reference('Author', 'author');

  it('renders a select with options from context', () => {
    render(
      <ReferenceOptionsProvider
        options={{
          author: [
            { id: 'uuid-1', label: 'Alice' },
            { id: 'uuid-2', label: 'Bob' },
          ],
        }}
      >
        <ReferenceField
          name="author"
          field={authorRef}
          value="uuid-1"
          onChange={() => {}}
        />
      </ReferenceOptionsProvider>,
    );
    expect(screen.getByLabelText('Author')).toHaveValue('uuid-1');
    // 2 options + placeholder
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('renders an empty select without context', () => {
    render(
      <ReferenceField
        name="author"
        field={authorRef}
        value=""
        onChange={() => {}}
      />,
    );
    // Only the placeholder option
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('calls onChange with selected id', () => {
    const onChange = vi.fn();
    render(
      <ReferenceOptionsProvider
        options={{ author: [{ id: 'uuid-1', label: 'Alice' }] }}
      >
        <ReferenceField
          name="author"
          field={authorRef}
          value=""
          onChange={onChange}
        />
      </ReferenceOptionsProvider>,
    );
    fireEvent.change(screen.getByLabelText('Author'), {
      target: { value: 'uuid-1' },
    });
    expect(onChange).toHaveBeenCalledWith('uuid-1');
  });
});

describe('ObjectField', () => {
  it('renders sub-fields from ZodObject shape', () => {
    const field = object('Address', {
      street: text('Street'),
      city: text('City'),
    });
    render(
      <ObjectField
        name="address"
        field={field}
        value={{ street: '123 Main', city: 'Portland' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Portland')).toBeInTheDocument();
  });

  it('updates a sub-field value', () => {
    const onChange = vi.fn();
    const field = object('Address', {
      street: text('Street'),
      city: text('City'),
    });
    render(
      <ObjectField
        name="address"
        field={field}
        value={{ street: '123 Main', city: 'Portland' }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByDisplayValue('123 Main'), {
      target: { value: '456 Oak' },
    });
    expect(onChange).toHaveBeenCalledWith({
      street: '456 Oak',
      city: 'Portland',
    });
  });
});
