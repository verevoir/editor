import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { defineBlock, text, number, boolean } from '@verevoir/schema';
import { useBlockForm } from '../src/hooks/useBlockForm.js';

const hero = defineBlock({
  name: 'hero',
  fields: {
    title: text('Title'),
    count: number('Count'),
    visible: boolean('Visible'),
  },
});

const validData = { title: 'Hello', count: 42, visible: true };

describe('useBlockForm', () => {
  it('initialises with provided data', () => {
    const { result } = renderHook(() => useBlockForm(hero, validData));
    const [state] = result.current;
    expect(state.value).toEqual(validData);
    expect(state.errors).toEqual({});
    expect(state.dirty).toBe(false);
    expect(state.valid).toBe(true);
  });

  it('updates value and marks dirty on onChange', () => {
    const { result } = renderHook(() => useBlockForm(hero, validData));
    act(() => {
      result.current[1].onChange({ ...validData, title: 'Updated' });
    });
    const [state] = result.current;
    expect(state.value.title).toBe('Updated');
    expect(state.dirty).toBe(true);
  });

  it('clears errors on onChange', () => {
    const { result } = renderHook(() => useBlockForm(hero, validData));
    // Trigger validation failure first
    act(() => {
      result.current[1].onChange({
        title: 123 as any,
        count: 'bad' as any,
        visible: true,
      });
    });
    act(() => {
      result.current[1].validate();
    });
    expect(Object.keys(result.current[0].errors).length).toBeGreaterThan(0);
    // onChange should clear errors
    act(() => {
      result.current[1].onChange(validData);
    });
    expect(result.current[0].errors).toEqual({});
  });

  it('validate() returns true for valid data', () => {
    const { result } = renderHook(() => useBlockForm(hero, validData));
    let isValid: boolean;
    act(() => {
      isValid = result.current[1].validate();
    });
    expect(isValid!).toBe(true);
    expect(result.current[0].errors).toEqual({});
    expect(result.current[0].valid).toBe(true);
  });

  it('validate() returns false and populates errors for invalid data', () => {
    const { result } = renderHook(() => useBlockForm(hero, validData));
    act(() => {
      result.current[1].onChange({
        title: 123 as any,
        count: 'bad' as any,
        visible: true,
      });
    });
    let isValid: boolean;
    act(() => {
      isValid = result.current[1].validate();
    });
    expect(isValid!).toBe(false);
    expect(result.current[0].errors.title).toBeDefined();
    expect(result.current[0].errors.count).toBeDefined();
    expect(result.current[0].valid).toBe(false);
  });

  it('reset() restores initial data and clears state', () => {
    const { result } = renderHook(() => useBlockForm(hero, validData));
    act(() => {
      result.current[1].onChange({
        title: 'Changed',
        count: 0,
        visible: false,
      });
    });
    expect(result.current[0].dirty).toBe(true);
    act(() => {
      result.current[1].reset();
    });
    const [state] = result.current;
    expect(state.value).toEqual(validData);
    expect(state.dirty).toBe(false);
    expect(state.errors).toEqual({});
  });
});
