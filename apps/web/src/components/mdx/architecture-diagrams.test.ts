import { describe, expect, test } from "vitest";
import { architectureDiagrams } from "./architecture-diagrams";

describe("architectureDiagrams", () => {
  test.each(Object.entries(architectureDiagrams))(
    "%s has unique nodes and connected edges",
    (_id, diagram) => {
      const nodeIds = diagram.nodes.map((node) => node.id);
      const knownNodes = new Set(nodeIds);

      expect(knownNodes.size).toBe(nodeIds.length);
      expect(diagram.nodes.length).toBeGreaterThanOrEqual(2);
      expect(diagram.title).not.toBe("");
      expect(diagram.description).not.toBe("");

      for (const edge of diagram.edges) {
        expect(knownNodes.has(edge.source)).toBe(true);
        expect(knownNodes.has(edge.target)).toBe(true);
      }
    },
  );
});
