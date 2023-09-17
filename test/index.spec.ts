import { describe, it, expect } from "vitest";
import sri from "../src/index";

describe("basic functionality", () => {
  const plugin = sri();

  it("Plugin name is as expected", () => {
    expect(plugin.name).toBe("vite-plugin-sri");
  });

  it("Plugin applies to build tasks only", () => {
    expect(plugin.apply).toBe("build");
  });

  it("Plugin is enforced to run during post stage", () => {
    expect(plugin.enforce).toBe("post");
  });
});
