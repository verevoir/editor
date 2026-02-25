import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { text, richText, number, boolean, select } from "@nextlake/schema";
import { FieldRenderer } from "../src/FieldRenderer.js";
import type { FieldEditorProps } from "../src/types.js";

describe("FieldRenderer", () => {
  it("renders TextField for text UIHint", () => {
    const field = text("Title");
    render(<FieldRenderer name="title" field={field} value="Hello" onChange={() => {}} />);
    expect(screen.getByLabelText("Title")).toHaveAttribute("type", "text");
  });

  it("renders RichTextField for rich-text UIHint", () => {
    const field = richText("Body");
    render(<FieldRenderer name="body" field={field} value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Body").tagName).toBe("TEXTAREA");
  });

  it("renders NumberField for number UIHint", () => {
    const field = number("Count");
    render(<FieldRenderer name="count" field={field} value={0} onChange={() => {}} />);
    expect(screen.getByLabelText("Count")).toHaveAttribute("type", "number");
  });

  it("renders BooleanField for boolean UIHint", () => {
    const field = boolean("Active");
    render(<FieldRenderer name="active" field={field} value={false} onChange={() => {}} />);
    expect(screen.getByLabelText("Active")).toHaveAttribute("type", "checkbox");
  });

  it("renders SelectField for select UIHint", () => {
    const field = select("Status", ["draft", "published"]);
    render(<FieldRenderer name="status" field={field} value="draft" onChange={() => {}} />);
    expect(screen.getByLabelText("Status").tagName).toBe("SELECT");
  });

  it("shows fallback for unknown UIHint", () => {
    const field = {
      schema: {} as any,
      meta: { label: "Custom", ui: "unknown-type" as any, required: false },
    };
    render(<FieldRenderer name="custom" field={field} value="" onChange={() => {}} />);
    expect(screen.getByText("Unknown field type: unknown-type")).toBeInTheDocument();
  });

  describe("overrides", () => {
    function CustomField({ name, field, value }: FieldEditorProps<string>) {
      return <div data-testid="custom-override">{field.meta.label}: {value}</div>;
    }

    it("uses field-name override when provided", () => {
      const field = text("Title");
      render(
        <FieldRenderer
          name="title"
          field={field}
          value="Hello"
          onChange={() => {}}
          overrides={{ title: CustomField }}
        />,
      );
      expect(screen.getByTestId("custom-override")).toHaveTextContent("Title: Hello");
    });

    it("uses UIHint override when provided", () => {
      const field = text("Title");
      render(
        <FieldRenderer
          name="title"
          field={field}
          value="Hello"
          onChange={() => {}}
          overrides={{ text: CustomField }}
        />,
      );
      expect(screen.getByTestId("custom-override")).toHaveTextContent("Title: Hello");
    });

    it("prefers field-name override over UIHint override", () => {
      function NameOverride({ field, value }: FieldEditorProps<string>) {
        return <div data-testid="name-override">{value}</div>;
      }
      function HintOverride({ field, value }: FieldEditorProps<string>) {
        return <div data-testid="hint-override">{value}</div>;
      }
      const field = text("Title");
      render(
        <FieldRenderer
          name="title"
          field={field}
          value="Hello"
          onChange={() => {}}
          overrides={{ title: NameOverride, text: HintOverride }}
        />,
      );
      expect(screen.getByTestId("name-override")).toBeInTheDocument();
      expect(screen.queryByTestId("hint-override")).not.toBeInTheDocument();
    });
  });
});
