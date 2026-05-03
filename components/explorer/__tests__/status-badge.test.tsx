import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StatusBadge } from "../status-badge";

describe("StatusBadge", () => {
  it("renderiza estado de artifact active", () => {
    const html = renderToStaticMarkup(<StatusBadge kind="artifact" status="active" />);
    expect(html).toContain("ACTIVE");
  });

  it("renderiza estado de version yanked", () => {
    const html = renderToStaticMarkup(<StatusBadge kind="version" status="yanked" />);
    expect(html).toContain("YANKED");
  });
});
