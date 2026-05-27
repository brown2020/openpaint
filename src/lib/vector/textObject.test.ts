import { describe, expect, it } from "vitest";
import { buildTextObject } from "./textObject";

describe("buildTextObject", () => {
  it("creates a text object at the given point with trimmed content", () => {
    const obj = buildTextObject({
      point: { x: 10, y: 20 },
      content: "  Hello  ",
      textOptions: {
        fontFamily: "Arial",
        fontSize: 18,
        fontWeight: "bold",
        fontStyle: "italic",
        textAlign: "center",
      },
      fillColor: "#ff0000",
      fillEnabled: true,
    });

    expect(obj.type).toBe("text");
    expect(obj.content).toBe("Hello");
    expect(obj.transform.x).toBe(10);
    expect(obj.transform.y).toBe(20);
    expect(obj.fontSize).toBe(18);
    expect(obj.fontWeight).toBe("bold");
    expect(obj.fill?.type).toBe("solid");
    if (obj.fill?.type === "solid") {
      expect(obj.fill.color).toBe("#ff0000");
    }
  });
});
