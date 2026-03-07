import { useCallback, useEffect, useRef, useState } from 'react';
import { markdownToHtml, htmlToMarkdown } from '../markdown.js';

export interface RichTextActions {
  format: (command: string) => void;
  openLinkDialog: () => void;
  insertLink: (url: string) => void;
  removeLink: () => void;
  closeLinkDialog: () => void;
}

export interface RichTextState {
  activeFormats: Set<string>;
  showLinkDialog: boolean;
  getActiveLink: () => string | null;
}

export interface RichTextHandlers {
  onInput: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
}

export function useRichText(
  value: string,
  onChange: (markdown: string) => void,
): {
  editorRef: React.RefObject<HTMLDivElement | null>;
  handlers: RichTextHandlers;
  actions: RichTextActions;
  state: RichTextState;
} {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const internalValueRef = useRef<string>(value);

  // Sync external value into contentEditable (only when it differs)
  useEffect(() => {
    if (!editorRef.current) return;
    if (value === internalValueRef.current) return;
    internalValueRef.current = value;
    editorRef.current.innerHTML = markdownToHtml(value);
  }, [value]);

  // Initial render
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = markdownToHtml(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const md = htmlToMarkdown(editorRef.current);
    internalValueRef.current = md;
    onChange(md);
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(emitChange, 300);
  }, [emitChange]);

  const handleBlur = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    emitChange();
  }, [emitChange]);

  // Track active formats for toolbar state
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('strikeThrough'))
      formats.add('strikethrough');
    if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
    if (document.queryCommandState('insertOrderedList')) formats.add('ol');
    setActiveFormats(formats);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveFormats);
    return () =>
      document.removeEventListener('selectionchange', updateActiveFormats);
  }, [updateActiveFormats]);

  // Formatting
  const execFormat = useCallback(
    (command: string) => {
      document.execCommand(command, false);
      editorRef.current?.focus();
      emitChange();
      updateActiveFormats();
    },
    [emitChange, updateActiveFormats],
  );

  // Link management
  const openLinkDialog = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
    setShowLinkDialog(true);
  }, []);

  const insertLink = useCallback(
    (url: string) => {
      if (savedSelectionRef.current) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedSelectionRef.current);
      }
      document.execCommand('createLink', false, url);
      setShowLinkDialog(false);
      savedSelectionRef.current = null;
      emitChange();
    },
    [emitChange],
  );

  const removeLink = useCallback(() => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelectionRef.current);
    }
    document.execCommand('unlink', false);
    setShowLinkDialog(false);
    savedSelectionRef.current = null;
    emitChange();
  }, [emitChange]);

  const closeLinkDialog = useCallback(() => {
    setShowLinkDialog(false);
    savedSelectionRef.current = null;
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          execFormat('italic');
          break;
        case 'k':
          e.preventDefault();
          openLinkDialog();
          break;
      }
    },
    [execFormat, openLinkDialog],
  );

  // Paste as plain text
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      emitChange();
    },
    [emitChange],
  );

  // Check if cursor is inside a link
  const getActiveLink = useCallback((): string | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as Element).tagName === 'A'
      ) {
        return (node as Element).getAttribute('href');
      }
      node = node.parentNode;
    }
    return null;
  }, []);

  return {
    editorRef,
    handlers: {
      onInput: handleInput,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      onPaste: handlePaste,
    },
    actions: {
      format: execFormat,
      openLinkDialog,
      insertLink,
      removeLink,
      closeLinkDialog,
    },
    state: {
      activeFormats,
      showLinkDialog,
      getActiveLink,
    },
  };
}
