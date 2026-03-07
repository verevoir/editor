import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  heroBlock,
  HeroRenderer,
  heroControl,
  contentBlock,
  ContentRenderer,
  contentControl,
  carouselBlock,
  CarouselRenderer,
  carouselControl,
} from '../src/controls/index.js';

// --- Hero ---

describe('heroBlock', () => {
  it('validates complete hero data', () => {
    const result = heroBlock.validate({
      title: 'Welcome',
      body: '**bold** text',
      imageUrl: 'https://example.com/img.jpg',
      ctaText: 'Learn more',
      ctaUrl: 'https://example.com',
    });
    expect(result.title).toBe('Welcome');
    expect(result.body).toBe('**bold** text');
  });

  it('validates hero with only required fields', () => {
    const result = heroBlock.validate({
      title: 'Minimal',
      body: 'Just text',
    });
    expect(result.title).toBe('Minimal');
  });

  it('rejects hero without title', () => {
    expect(() => heroBlock.validate({ body: 'No title' })).toThrow();
  });

  it('rejects hero without body', () => {
    expect(() => heroBlock.validate({ title: 'No body' })).toThrow();
  });
});

describe('HeroRenderer', () => {
  it('renders title and body', () => {
    render(<HeroRenderer data={{ title: 'Hello', body: 'World' }} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('renders markdown body as HTML', () => {
    const { container } = render(
      <HeroRenderer data={{ title: 'Test', body: '**bold**' }} />,
    );
    expect(container.querySelector('strong')).toHaveTextContent('bold');
  });

  it('renders image when imageUrl provided', () => {
    const { container } = render(
      <HeroRenderer
        data={{
          title: 'Test',
          body: 'Body',
          imageUrl: 'https://example.com/img.jpg',
        }}
      />,
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
  });

  it('does not render image when imageUrl absent', () => {
    const { container } = render(
      <HeroRenderer data={{ title: 'Test', body: 'Body' }} />,
    );
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders CTA link when both text and url provided', () => {
    render(
      <HeroRenderer
        data={{
          title: 'Test',
          body: 'Body',
          ctaText: 'Click me',
          ctaUrl: 'https://example.com',
        }}
      />,
    );
    const link = screen.getByText('Click me');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('does not render CTA when text or url missing', () => {
    render(
      <HeroRenderer
        data={{ title: 'Test', body: 'Body', ctaText: 'Click me' }}
      />,
    );
    expect(screen.queryByText('Click me')).not.toBeInTheDocument();
  });

  it('has data-control attribute', () => {
    const { container } = render(
      <HeroRenderer data={{ title: 'Test', body: 'Body' }} />,
    );
    expect(
      container.querySelector("[data-control='hero']"),
    ).toBeInTheDocument();
  });
});

describe('heroControl', () => {
  it('has correct type and label', () => {
    expect(heroControl.type).toBe('hero');
    expect(heroControl.label).toBe('Hero');
  });

  it('has block and Renderer', () => {
    expect(heroControl.block).toBe(heroBlock);
    expect(heroControl.Renderer).toBe(HeroRenderer);
  });
});

// --- Content ---

describe('contentBlock', () => {
  it('validates content with heading and body', () => {
    const result = contentBlock.validate({
      heading: 'Section',
      body: 'Paragraph text',
    });
    expect(result.heading).toBe('Section');
    expect(result.body).toBe('Paragraph text');
  });

  it('validates content without heading', () => {
    const result = contentBlock.validate({ body: 'Just body' });
    expect(result.body).toBe('Just body');
  });

  it('rejects content without body', () => {
    expect(() => contentBlock.validate({ heading: 'No body' })).toThrow();
  });
});

describe('ContentRenderer', () => {
  it('renders heading and body', () => {
    render(<ContentRenderer data={{ heading: 'Title', body: 'Text' }} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('renders body without heading', () => {
    render(<ContentRenderer data={{ body: 'Just text' }} />);
    expect(screen.getByText('Just text')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('renders markdown body as HTML', () => {
    const { container } = render(
      <ContentRenderer data={{ body: '*italic* text' }} />,
    );
    expect(container.querySelector('em')).toHaveTextContent('italic');
  });

  it('has data-control attribute', () => {
    const { container } = render(<ContentRenderer data={{ body: 'Body' }} />);
    expect(
      container.querySelector("[data-control='content']"),
    ).toBeInTheDocument();
  });
});

describe('contentControl', () => {
  it('has correct type and label', () => {
    expect(contentControl.type).toBe('content');
    expect(contentControl.label).toBe('Content');
  });
});

// --- Carousel ---

describe('carouselBlock', () => {
  it('validates carousel with slides', () => {
    const result = carouselBlock.validate({
      slides: [
        { title: 'Slide 1', body: 'First' },
        { title: 'Slide 2', body: 'Second', imageUrl: 'https://img.com/2.jpg' },
      ],
    });
    expect(result.slides).toHaveLength(2);
    expect(result.slides[0].title).toBe('Slide 1');
  });

  it('validates carousel with empty slides', () => {
    const result = carouselBlock.validate({ slides: [] });
    expect(result.slides).toHaveLength(0);
  });

  it('rejects slide without title', () => {
    expect(() =>
      carouselBlock.validate({ slides: [{ body: 'No title' }] }),
    ).toThrow();
  });

  it('rejects slide without body', () => {
    expect(() =>
      carouselBlock.validate({ slides: [{ title: 'No body' }] }),
    ).toThrow();
  });
});

describe('CarouselRenderer', () => {
  const slides = [
    { title: 'First', body: 'Slide one' },
    { title: 'Second', body: 'Slide two' },
    { title: 'Third', body: 'Slide three' },
  ];

  it('renders the first slide by default', () => {
    render(<CarouselRenderer data={{ slides }} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Slide one')).toBeInTheDocument();
  });

  it('shows slide indicator', () => {
    render(<CarouselRenderer data={{ slides }} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('navigates to next slide', () => {
    render(<CarouselRenderer data={{ slides }} />);
    fireEvent.click(screen.getByLabelText('Next slide'));
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('navigates to previous slide', () => {
    render(<CarouselRenderer data={{ slides }} />);
    fireEvent.click(screen.getByLabelText('Next slide'));
    fireEvent.click(screen.getByLabelText('Previous slide'));
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('wraps around from last to first', () => {
    render(<CarouselRenderer data={{ slides }} />);
    fireEvent.click(screen.getByLabelText('Next slide'));
    fireEvent.click(screen.getByLabelText('Next slide'));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Next slide'));
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('wraps around from first to last', () => {
    render(<CarouselRenderer data={{ slides }} />);
    fireEvent.click(screen.getByLabelText('Previous slide'));
    expect(screen.getByText('Third')).toBeInTheDocument();
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('hides navigation for single slide', () => {
    render(<CarouselRenderer data={{ slides: [slides[0]] }} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.queryByLabelText('Next slide')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Previous slide')).not.toBeInTheDocument();
  });

  it('shows empty state for no slides', () => {
    render(<CarouselRenderer data={{ slides: [] }} />);
    expect(screen.getByText('No slides')).toBeInTheDocument();
  });

  it('renders markdown body in slides', () => {
    const { container } = render(
      <CarouselRenderer
        data={{ slides: [{ title: 'Test', body: '**bold**' }] }}
      />,
    );
    expect(container.querySelector('strong')).toHaveTextContent('bold');
  });

  it('renders slide image when provided', () => {
    const { container } = render(
      <CarouselRenderer
        data={{
          slides: [
            { title: 'Test', body: 'Body', imageUrl: 'https://img.com/1.jpg' },
          ],
        }}
      />,
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://img.com/1.jpg');
  });

  it('renders slide CTA when provided', () => {
    render(
      <CarouselRenderer
        data={{
          slides: [
            {
              title: 'Test',
              body: 'Body',
              ctaText: 'Go',
              ctaUrl: 'https://example.com',
            },
          ],
        }}
      />,
    );
    const link = screen.getByText('Go');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('has data-control attribute', () => {
    const { container } = render(
      <CarouselRenderer data={{ slides: [{ title: 'T', body: 'B' }] }} />,
    );
    expect(
      container.querySelector("[data-control='carousel']"),
    ).toBeInTheDocument();
  });
});

describe('carouselControl', () => {
  it('has correct type and label', () => {
    expect(carouselControl.type).toBe('carousel');
    expect(carouselControl.label).toBe('Carousel');
  });

  it('has block and Renderer', () => {
    expect(carouselControl.block).toBe(carouselBlock);
    expect(carouselControl.Renderer).toBe(CarouselRenderer);
  });
});

// --- Composability ---

describe('carousel composes hero shape', () => {
  it('carousel slides have the same required fields as hero', () => {
    // Both should accept title + body as minimum
    const heroData = { title: 'Hello', body: 'World' };
    const carouselData = { slides: [heroData] };

    expect(() => heroBlock.validate(heroData)).not.toThrow();
    expect(() => carouselBlock.validate(carouselData)).not.toThrow();
  });

  it('carousel slides accept the same optional fields as hero', () => {
    const slideData = {
      title: 'Test',
      body: 'Body',
      imageUrl: 'https://img.com/1.jpg',
      ctaText: 'Click',
      ctaUrl: 'https://example.com',
    };

    expect(() => heroBlock.validate(slideData)).not.toThrow();
    expect(() => carouselBlock.validate({ slides: [slideData] })).not.toThrow();
  });
});
