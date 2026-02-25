import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { z } from "zod";
import { text, richText, number, boolean, select, array, object } from "@nextlake/schema";
import { TextField } from "../src/fields/TextField.js";
import { RichTextField } from "../src/fields/RichTextField.js";
import { NumberField } from "../src/fields/NumberField.js";
import { BooleanField } from "../src/fields/BooleanField.js";
import { SelectField } from "../src/fields/SelectField.js";
import { ArrayField } from "../src/fields/ArrayField.js";
import { ObjectField } from "../src/fields/ObjectField.js";

describe("TextField", () => {
  it("renders a text input with label", () => {
    const field = text("Title");
    render(<TextField name="title" field={field} value="Hello" onChange={() => {}} />);
    expect(screen.getByLabelText("Title")).toHaveValue("Hello");
    expect(screen.getByLabelText("Title")).toHaveAttribute("type", "text");
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    const field = text("Title");
    render(<TextField name="title" field={field} value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New" } });
    expect(onChange).toHaveBeenCalledWith("New");
  });

  it("marks required fields", () => {
    const field = text("Title");
    render(<TextField name="title" field={field} value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Title")).toBeRequired();
  });

  it("does not mark optional fields as required", () => {
    const field = text("Title").optional();
    render(<TextField name="title" field={field} value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Title")).not.toBeRequired();
  });
});

describe("RichTextField", () => {
  it("renders a textarea with label", () => {
    const field = richText("Body");
    render(<RichTextField name="body" field={field} value="Content" onChange={() => {}} />);
    expect(screen.getByLabelText("Body")).toHaveValue("Content");
    expect(screen.getByLabelText("Body").tagName).toBe("TEXTAREA");
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    const field = richText("Body");
    render(<RichTextField name="body" field={field} value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "Updated" } });
    expect(onChange).toHaveBeenCalledWith("Updated");
  });
});

describe("NumberField", () => {
  it("renders a number input with label", () => {
    const field = number("Count");
    render(<NumberField name="count" field={field} value={42} onChange={() => {}} />);
    expect(screen.getByLabelText("Count")).toHaveValue(42);
    expect(screen.getByLabelText("Count")).toHaveAttribute("type", "number");
  });

  it("calls onChange with numeric value", () => {
    const onChange = vi.fn();
    const field = number("Count");
    render(<NumberField name="count" field={field} value={0} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Count"), { target: { value: "7", valueAsNumber: 7 } });
    expect(onChange).toHaveBeenCalledWith(7);
  });
});

describe("BooleanField", () => {
  it("renders a checkbox with label", () => {
    const field = boolean("Visible");
    render(<BooleanField name="visible" field={field} value={true} onChange={() => {}} />);
    expect(screen.getByLabelText("Visible")).toBeChecked();
    expect(screen.getByLabelText("Visible")).toHaveAttribute("type", "checkbox");
  });

  it("calls onChange with boolean value", () => {
    const onChange = vi.fn();
    const field = boolean("Visible");
    render(<BooleanField name="visible" field={field} value={false} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Visible"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("SelectField", () => {
  it("renders options from ZodEnum", () => {
    const field = select("Status", ["draft", "published", "archived"]);
    render(<SelectField name="status" field={field} value="published" onChange={() => {}} />);
    expect(screen.getByLabelText("Status")).toHaveValue("published");
    expect(screen.getAllByRole("option")).toHaveLength(4); // 3 options + placeholder
  });

  it("calls onChange with selected value", () => {
    const onChange = vi.fn();
    const field = select("Status", ["draft", "published"]);
    render(<SelectField name="status" field={field} value="draft" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "published" } });
    expect(onChange).toHaveBeenCalledWith("published");
  });

  it("renders placeholder option", () => {
    const field = select("Status", ["draft", "published"]);
    render(<SelectField name="status" field={field} value="" onChange={() => {}} />);
    expect(screen.getByText("Select...")).toBeInTheDocument();
  });
});

describe("ArrayField", () => {
  it("renders items with add and remove buttons", () => {
    const field = array("Tags", text("Tag"));
    render(<ArrayField name="tags" field={field} value={["foo", "bar"]} onChange={() => {}} />);
    expect(screen.getByDisplayValue("foo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("bar")).toBeInTheDocument();
    expect(screen.getByText("Add Tags")).toBeInTheDocument();
    expect(screen.getAllByText("Remove")).toHaveLength(2);
  });

  it("adds a new item when Add is clicked", () => {
    const onChange = vi.fn();
    const field = array("Tags", text("Tag"));
    render(<ArrayField name="tags" field={field} value={["foo"]} onChange={onChange} />);
    fireEvent.click(screen.getByText("Add Tags"));
    expect(onChange).toHaveBeenCalledWith(["foo", ""]);
  });

  it("removes an item when Remove is clicked", () => {
    const onChange = vi.fn();
    const field = array("Tags", text("Tag"));
    render(<ArrayField name="tags" field={field} value={["foo", "bar"]} onChange={onChange} />);
    fireEvent.click(screen.getAllByText("Remove")[0]);
    expect(onChange).toHaveBeenCalledWith(["bar"]);
  });

  it("updates an item value", () => {
    const onChange = vi.fn();
    const field = array("Tags", text("Tag"));
    render(<ArrayField name="tags" field={field} value={["foo", "bar"]} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("foo"), { target: { value: "baz" } });
    expect(onChange).toHaveBeenCalledWith(["baz", "bar"]);
  });

  it("renders empty state with add button", () => {
    const field = array("Tags", text("Tag"));
    render(<ArrayField name="tags" field={field} value={[]} onChange={() => {}} />);
    expect(screen.getByText("Add Tags")).toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });
});

describe("ObjectField", () => {
  it("renders sub-fields from ZodObject shape", () => {
    const field = object("Address", {
      street: text("Street"),
      city: text("City"),
    });
    render(
      <ObjectField
        name="address"
        field={field}
        value={{ street: "123 Main", city: "Portland" }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Main")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Portland")).toBeInTheDocument();
  });

  it("updates a sub-field value", () => {
    const onChange = vi.fn();
    const field = object("Address", {
      street: text("Street"),
      city: text("City"),
    });
    render(
      <ObjectField
        name="address"
        field={field}
        value={{ street: "123 Main", city: "Portland" }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("123 Main"), { target: { value: "456 Oak" } });
    expect(onChange).toHaveBeenCalledWith({ street: "456 Oak", city: "Portland" });
  });
});
