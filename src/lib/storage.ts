import fs from "node:fs/promises";
import path from "node:path";

// F-01: file storage abstraction. Local disk today (TF_UPLOAD_DIR, Docker
// volume /data/uploads); the interface stays S3-compatible for a later driver.
// Keys are always relative paths — resolveSafe rejects traversal/absolute keys
// so a corrupted DB row can never read or delete outside the upload root.

const ROOT = process.env.TF_UPLOAD_DIR ?? "./data/uploads";

function resolveSafe(key: string): string {
  if (!key || key.includes("..") || path.isAbsolute(key)) {
    throw new Error("Invalid storage key");
  }
  return path.join(ROOT, key);
}

export interface StorageDriver {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>; // throws if missing
  delete(key: string): Promise<void>; // no-op if missing
}

class LocalDriver implements StorageDriver {
  async put(key: string, data: Buffer): Promise<void> {
    const file = resolveSafe(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(resolveSafe(key));
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(resolveSafe(key)).catch(() => {});
  }
}

export function getStorage(): StorageDriver {
  return new LocalDriver();
}
