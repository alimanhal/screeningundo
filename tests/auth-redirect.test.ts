import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/redirect";

describe("safeNextPath", () => {
  it("allows simple internal paths", () => {
    expect(safeNextPath("/submit")).toBe("/submit");
    expect(safeNextPath("/venues/abc?x=1")).toBe("/venues/abc?x=1");
  });

  it("defaults to / when missing", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it("rejects absolute URLs and protocol-relative URLs (open redirect)", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
  });
});
