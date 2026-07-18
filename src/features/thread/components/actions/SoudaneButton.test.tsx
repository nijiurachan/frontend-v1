import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SoudaneButton } from "./SoudaneButton";

describe("SoudaneButton accessibility", () => {
  test("count_zero_renders_a_sized_button_with_an_accessible_name", () => {
    const markup = renderToStaticMarkup(
      createElement(SoudaneButton, { count: 0, onClick: (): void => {} }),
    );

    expect(markup).toContain('<button type="button"');
    expect(markup).toContain("min-h-11");
    expect(markup).toContain("min-w-11");
    expect(markup).toContain('aria-label="そうだね"');
    expect(markup).toContain(">+</button>");
    expect(markup).not.toContain("<label");
  });
});
