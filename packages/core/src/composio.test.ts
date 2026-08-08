import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getComposioConfigPath,
  isComposioConfigured,
  isComposioConfiguredAsync,
  composioOrgUserId,
  composioUserId,
  loadComposioConfigFile,
  loadComposioSettingsPublic,
  resolveComposioApiKey,
  saveComposioConfig,
} from "./composio-config";
import {
  normalizeEnableComposioToolkitRequest,
  normalizeUpdateProfileComposioToolkitsRequest,
} from "./composio";

describe("composio-config", () => {
  test("isComposioConfigured is false without config file", () => {
    expect(isComposioConfigured(null)).toBe(false);
    expect(isComposioConfigured({ apiKey: "   " })).toBe(false);
  });

  test("isComposioConfigured is true with config file", () => {
    expect(isComposioConfigured({ apiKey: "ck-test" })).toBe(true);
  });

  test("resolveComposioApiKey reads from file config", () => {
    expect(resolveComposioApiKey({ apiKey: "ck-file" })).toBe("ck-file");
    expect(resolveComposioApiKey(null)).toBe("");
  });

  test("composioOrgUserId namespaces org id", () => {
    expect(composioOrgUserId("org_123")).toBe("zoku:org:org_123");
  });

  test("composioUserId namespaces zoku user id", () => {
    expect(composioUserId("usr_123")).toBe("zoku:user:usr_123");
  });

  test("saveComposioConfig writes config.ini", async () => {
    const configDir = await mkdtemp(join(tmpdir(), "zoku-composio-config-"));
    const previous = process.env.ZOKU_CONFIG_DIR;
    process.env.ZOKU_CONFIG_DIR = configDir;

    try {
      const saved = await saveComposioConfig({ apiKey: "ck_test_secret" });
      expect(saved.configured).toBe(true);
      expect(saved.apiKeyMasked).toBeTruthy();

      const loaded = await loadComposioConfigFile();
      expect(loaded?.apiKey).toBe("ck_test_secret");

      const raw = await readFile(getComposioConfigPath(), "utf8");
      expect(raw).toContain("api_key=ck_test_secret");

      expect(await isComposioConfiguredAsync()).toBe(true);
      expect((await loadComposioSettingsPublic()).configured).toBe(true);
    } finally {
      if (previous === undefined) {
        delete process.env.ZOKU_CONFIG_DIR;
      } else {
        process.env.ZOKU_CONFIG_DIR = previous;
      }
    }
  });
});

describe("normalizeEnableComposioToolkitRequest", () => {
  test("accepts valid toolkit slug", () => {
    expect(
      normalizeEnableComposioToolkitRequest({ toolkitSlug: "Gmail" }),
    ).toEqual({ toolkitSlug: "gmail" });
  });

  test("rejects invalid toolkit slug", () => {
    expect(() =>
      normalizeEnableComposioToolkitRequest({ toolkitSlug: "bad slug" }),
    ).toThrow(/toolkitSlug/);
  });
});

describe("normalizeUpdateProfileComposioToolkitsRequest", () => {
  test("accepts toolkit assignment with action allowlist", () => {
    expect(
      normalizeUpdateProfileComposioToolkitsRequest({
        assignments: [
          {
            toolkitId: "ctk_1",
            allowedActions: ["GMAIL_SEND_EMAIL"],
          },
        ],
      }),
    ).toEqual({
      assignments: [
        {
          toolkitId: "ctk_1",
          allowedActions: ["GMAIL_SEND_EMAIL"],
        },
      ],
    });
  });

  test("treats empty allowlist as null", () => {
    expect(
      normalizeUpdateProfileComposioToolkitsRequest({
        assignments: [{ toolkitId: "ctk_1", allowedActions: [] }],
      }),
    ).toEqual({
      assignments: [{ toolkitId: "ctk_1", allowedActions: null }],
    });
  });

  test("rejects invalid action slug", () => {
    expect(() =>
      normalizeUpdateProfileComposioToolkitsRequest({
        assignments: [{ toolkitId: "ctk_1", allowedActions: ["bad-action"] }],
      }),
    ).toThrow(/allowedActions/);
  });
});
