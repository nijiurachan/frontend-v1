import { describe, expect, test } from "bun:test";

interface WorkerRoute {
  pattern: string;
  zone_name: string;
}

interface WranglerConfig {
  routes?: WorkerRoute[];
}

const configPath: URL = new URL("../../wrangler.jsonc", import.meta.url);

describe("production Worker routes", () => {
  test("preserves every deployed route and serves bundled Klecks assets", async () => {
    const config = Bun.JSONC.parse(
      await Bun.file(configPath).text(),
    ) as WranglerConfig;
    const routes = new Map(
      (config.routes ?? []).map((route) => [route.pattern, route.zone_name]),
    );
    const expectedRoutes = new Map([
      ["nijiurachan.net/ts", "nijiurachan.net"],
      ["nijiurachan.net/ts/*", "nijiurachan.net"],
      ["nijiurachan.net/manifest.json", "nijiurachan.net"],
      ["test.nijiurachan.net/ts", "nijiurachan.net"],
      ["test.nijiurachan.net/ts/*", "nijiurachan.net"],
      ["nijiurachan.net/assets/klecks/*", "nijiurachan.net"],
    ]);

    expect(config.routes).toHaveLength(expectedRoutes.size);
    expect([...routes.entries()].sort()).toEqual(
      [...expectedRoutes.entries()].sort(),
    );
  });
});
