import fs from "node:fs/promises";
import path from "node:path";

export type ScreenshotStorageAsset = {
  url: string;
  storagePath: string;
};

export type ScreenshotStorage = {
  save(buffer: Buffer, key: string): Promise<ScreenshotStorageAsset>;
};

type LocalScreenshotStorageOptions = {
  rootDirectory?: string;
  publicBaseUrl?: string;
};

function isVercelRuntime() {
  return process.env.VERCEL === "1";
}

function normalizePublicBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function sanitizeScreenshotKey(key: string) {
  return key
    .split(/[\\/]+/)
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .filter(Boolean)
    .join("/");
}

export class LocalScreenshotStorage implements ScreenshotStorage {
  private readonly rootDirectory: string;
  private readonly publicBaseUrl: string;

  constructor(options: LocalScreenshotStorageOptions = {}) {
    if (!options.rootDirectory && isVercelRuntime()) {
      throw new Error(
        "Local screenshot storage is disabled on Vercel. Configure an object-storage ScreenshotStorage adapter before persisting screenshots in production."
      );
    }

    this.rootDirectory =
      options.rootDirectory ??
      path.join(process.cwd(), "public", "storage", "screenshots");
    this.publicBaseUrl = normalizePublicBaseUrl(
      options.publicBaseUrl ?? "/storage/screenshots"
    );
  }

  async save(buffer: Buffer, key: string): Promise<ScreenshotStorageAsset> {
    const safeKey = sanitizeScreenshotKey(key);

    if (!safeKey) {
      throw new Error("Screenshot storage key cannot be empty.");
    }

    const rootPath = path.resolve(this.rootDirectory);
    const targetPath = path.resolve(rootPath, safeKey);

    if (!targetPath.startsWith(`${rootPath}${path.sep}`)) {
      throw new Error("Screenshot storage path is outside the storage folder.");
    }

    await fs.mkdir(path.dirname(targetPath), {
      recursive: true,
    });
    await fs.writeFile(targetPath, buffer);

    return {
      url: `${this.publicBaseUrl}/${safeKey}`,
      storagePath: targetPath,
    };
  }
}

export function createLocalScreenshotStorage(options?: LocalScreenshotStorageOptions) {
  return new LocalScreenshotStorage(options);
}
