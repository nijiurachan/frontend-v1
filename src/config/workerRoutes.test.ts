import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

interface WorkerRoute {
  pattern: string;
  zone_name: string;
}

interface WranglerConfig {
  routes?: WorkerRoute[];
}

const configPath: URL = new URL("../../wrangler.jsonc", import.meta.url);

describe("production Worker routes", () => {
  test("serves the app and bundled Klecks assets from nijiurachan.net", async () => {
    const config = JSON.parse(
      await readFile(configPath, "utf8"),
    ) as WranglerConfig;
    const routes = new Map(
      (config.routes ?? []).map((route) => [route.pattern, route.zone_name]),
    );

    expect(routes.get("nijiurachan.net/ts/*")).toBe("nijiurachan.net");
    expect(routes.get("nijiurachan.net/assets/klecks/*")).toBe(
      "nijiurachan.net",
    );
  });
});
