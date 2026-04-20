import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * Tracks how deeply a field is nested inside its parent block.
 * Top-level fields are depth 0; fields rendered through an
 * `ObjectField` body bump the depth so the inner shell can drop
 * its own border (and use a left rule instead) to avoid the
 * "fieldset within fieldset" visual heaviness.
 */
const NestingContext = createContext(0);

export interface FieldShellProps {
  /** Field name (used as the data-field attribute hook). */
  name: string;
  /** Display label rendered in the legend. */
  label: string;
  /** Optional hint text — if provided, a `?` icon appears top-right. */
  hint?: string;
  /** Field's UI hint, surfaced as `data-field-ui` for theming. */
  ui?: string;
  /**
   * If false, the shell renders only its children (no fieldset, no
   * legend). The boolean field uses this so its checkbox renders
   * inline beside the label without an empty fieldset around it.
   */
  bare?: boolean;
  children: ReactNode;
}

/**
 * Compact field wrapper. All field components in the editor render
 * their body inside a `<FieldShell>`, which provides:
 *
 * - A `<fieldset>` + `<legend>` so the label sits in the top-left
 *   of the field's outline (Material-outlined style). Saves a
 *   significant amount of vertical space vs the previous
 *   label-above-input layout.
 * - A `?` button top-right that opens a click-to-toggle popover
 *   containing the field's hint. Replaces the always-visible hint
 *   line that used to live below the field.
 * - Depth-aware styling: nested shells (anything rendered inside an
 *   ObjectField body) drop the border and use a left rule, so a
 *   tree of nested objects doesn't look like a stack of boxes.
 *
 * The shell is intentionally markup-only; theming lives in CSS,
 * keyed off the data-* attributes.
 */
export function FieldShell({
  name,
  label,
  hint,
  ui,
  bare,
  children,
}: FieldShellProps) {
  const depth = useContext(NestingContext);

  if (bare) {
    return (
      <NestingContext.Provider value={depth + 1}>
        <div
          data-field={name}
          data-field-ui={ui}
          data-field-bare="true"
          data-field-depth={depth}
        >
          {children}
          {hint && <FieldHelp name={name} hint={hint} />}
        </div>
      </NestingContext.Provider>
    );
  }

  return (
    <NestingContext.Provider value={depth + 1}>
      <fieldset
        data-field={name}
        data-field-ui={ui}
        data-field-depth={depth}
        data-field-nested={depth > 0 ? 'true' : undefined}
      >
        {/*
          Help wrapper sits before the legend in source order so it
          reads naturally to assistive tech ("help: <hint> — <label>"),
          and the absolute positioning lifts it onto the top border to
          line up visually with the legend text.
        */}
        {hint && <FieldHelp name={name} hint={hint} />}
        <legend data-field-label>{label}</legend>
        {/*
          Visually-hidden <label htmlFor> sits next to the legend so
          screen readers and testing-library both see an explicit
          label-input association. The legend already names the
          fieldset visually; this label keeps the input itself
          discoverable via accessible name, which fieldset/legend
          alone doesn't guarantee for the inner control. Field
          components must use `id={name}` on their primary input
          for the htmlFor to match.
        */}
        <label htmlFor={name} data-field-sr-label>
          {label}
        </label>
        <div data-field-body>{children}</div>
      </fieldset>
    </NestingContext.Provider>
  );
}

interface FieldHelpProps {
  name: string;
  hint: string;
}

/**
 * Click-to-toggle help button. Lives in the field's top-right
 * corner. Closes when the user clicks anywhere outside the
 * popover or presses Escape.
 */
function FieldHelp({ name, hint }: FieldHelpProps) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span data-field-help-wrapper ref={wrapperRef}>
      <button
        type="button"
        data-field-help-button
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={`Help for ${name}`}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <span data-field-help-popover id={popoverId} role="tooltip">
          {hint}
        </span>
      )}
    </span>
  );
}
