import { describe, expect, it } from "vitest";
import { findHardcodedStrings } from "../../scripts/check-hardcoded.mjs";

describe("hard-coded copy", () => {
  it("keeps user-visible strings in the message files", () => {
    expect(findHardcodedStrings()).toEqual([]);
  });
});
