import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../../..");

describe("firebase deploy config", () => {
  it("declares the projects userId + modifiedAt composite index", () => {
    const indexes = JSON.parse(
      readFileSync(resolve(repoRoot, "firestore.indexes.json"), "utf8"),
    ) as {
      indexes: {
        collectionGroup: string;
        fields: { fieldPath: string; order: string }[];
      }[];
    };

    expect(indexes.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          collectionGroup: "projects",
          fields: [
            { fieldPath: "userId", order: "ASCENDING" },
            { fieldPath: "modifiedAt", order: "DESCENDING" },
          ],
        }),
      ]),
    );
  });

  it("requires an exact image/png content type", () => {
    const rules = readFileSync(resolve(repoRoot, "storage.rules"), "utf8");
    expect(rules).toContain("request.resource.contentType == 'image/png'");
    expect(rules).not.toContain("contentType.matches(");
  });

  it("allows browser upload and canvas readback from any app origin", () => {
    const cors = JSON.parse(
      readFileSync(resolve(repoRoot, "cors.json"), "utf8"),
    ) as { origin: string[]; method: string[] }[];

    expect(cors[0]?.origin).toContain("*");
    expect(cors[0]?.method).toEqual(
      expect.arrayContaining(["GET", "POST", "OPTIONS"]),
    );
  });
});
