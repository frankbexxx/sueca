import { Capacitor } from '@capacitor/core';
import {
  Directory,
  Encoding,
  Filesystem,
  type ReadFileResult,
  type StatResult,
  type WriteFileResult
} from '@capacitor/filesystem';

/**
 * Narrow FS adapter so unit tests can inject an in-memory implementation
 * without touching Capacitor or the network.
 */
export type MusicCacheFs = {
  mkdir(path: string): Promise<void>;
  readText(path: string): Promise<string | null>;
  writeText(path: string, data: string): Promise<void>;
  readBinaryBase64(path: string): Promise<string | null>;
  writeBinaryBase64(path: string, data: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  stat(path: string): Promise<{ size: number } | null>;
  rmdirRecursive(path: string): Promise<void>;
  getUri(path: string): Promise<string>;
  convertFileSrc(uri: string): string;
  isNativeFilesystem(): boolean;
};

const DATA = Directory.Data;

async function safeStat(path: string): Promise<StatResult | null> {
  try {
    return await Filesystem.stat({ path, directory: DATA });
  } catch {
    return null;
  }
}

export function createCapacitorMusicCacheFs(): MusicCacheFs {
  return {
    isNativeFilesystem: () => Capacitor.isNativePlatform(),

    async mkdir(path: string): Promise<void> {
      try {
        await Filesystem.mkdir({
          path,
          directory: DATA,
          recursive: true
        });
      } catch {
        /* already exists */
      }
    },

    async readText(path: string): Promise<string | null> {
      try {
        const result: ReadFileResult = await Filesystem.readFile({
          path,
          directory: DATA,
          encoding: Encoding.UTF8
        });
        return typeof result.data === 'string' ? result.data : null;
      } catch {
        return null;
      }
    },

    async writeText(path: string, data: string): Promise<void> {
      await Filesystem.writeFile({
        path,
        data,
        directory: DATA,
        encoding: Encoding.UTF8,
        recursive: true
      });
    },

    async readBinaryBase64(path: string): Promise<string | null> {
      try {
        const result: ReadFileResult = await Filesystem.readFile({
          path,
          directory: DATA
        });
        return typeof result.data === 'string' ? result.data : null;
      } catch {
        return null;
      }
    },

    async writeBinaryBase64(path: string, data: string): Promise<void> {
      const _written: WriteFileResult = await Filesystem.writeFile({
        path,
        data,
        directory: DATA,
        recursive: true
      });
      void _written;
    },

    async deleteFile(path: string): Promise<void> {
      try {
        await Filesystem.deleteFile({ path, directory: DATA });
      } catch {
        /* ignore */
      }
    },

    async rename(from: string, to: string): Promise<void> {
      await Filesystem.rename({
        from,
        to,
        directory: DATA,
        toDirectory: DATA
      });
    },

    async stat(path: string): Promise<{ size: number } | null> {
      const s = await safeStat(path);
      if (!s) return null;
      return { size: s.size };
    },

    async rmdirRecursive(path: string): Promise<void> {
      try {
        await Filesystem.rmdir({
          path,
          directory: DATA,
          recursive: true
        });
      } catch {
        /* ignore */
      }
    },

    async getUri(path: string): Promise<string> {
      const { uri } = await Filesystem.getUri({ path, directory: DATA });
      return uri;
    },

    convertFileSrc(uri: string): string {
      return Capacitor.convertFileSrc(uri);
    }
  };
}

/** In-memory FS for unit tests (no Capacitor / no disk). */
export function createMemoryMusicCacheFs(): MusicCacheFs {
  const files = new Map<string, { kind: 'text' | 'bin'; data: string }>();
  const dirs = new Set<string>(['music']);

  const ensureParent = (path: string) => {
    const parts = path.split('/');
    let cur = '';
    for (let i = 0; i < parts.length - 1; i++) {
      cur = cur ? `${cur}/${parts[i]}` : parts[i]!;
      dirs.add(cur);
    }
  };

  return {
    isNativeFilesystem: () => true,

    async mkdir(path: string): Promise<void> {
      dirs.add(path);
      ensureParent(`${path}/x`);
    },

    async readText(path: string): Promise<string | null> {
      const f = files.get(path);
      return f?.kind === 'text' ? f.data : null;
    },

    async writeText(path: string, data: string): Promise<void> {
      ensureParent(path);
      files.set(path, { kind: 'text', data });
    },

    async readBinaryBase64(path: string): Promise<string | null> {
      const f = files.get(path);
      return f?.kind === 'bin' ? f.data : null;
    },

    async writeBinaryBase64(path: string, data: string): Promise<void> {
      ensureParent(path);
      files.set(path, { kind: 'bin', data });
    },

    async deleteFile(path: string): Promise<void> {
      files.delete(path);
    },

    async rename(from: string, to: string): Promise<void> {
      const f = files.get(from);
      if (!f) throw new Error(`rename missing: ${from}`);
      ensureParent(to);
      files.set(to, f);
      files.delete(from);
    },

    async stat(path: string): Promise<{ size: number } | null> {
      const f = files.get(path);
      if (!f) return null;
      if (f.kind === 'text') {
        return { size: new TextEncoder().encode(f.data).length };
      }
      const bin = atob(f.data);
      return { size: bin.length };
    },

    async rmdirRecursive(path: string): Promise<void> {
      const prefix = path.endsWith('/') ? path : `${path}/`;
      for (const key of [...files.keys()]) {
        if (key === path || key.startsWith(prefix)) files.delete(key);
      }
      for (const d of [...dirs]) {
        if (d === path || d.startsWith(prefix)) dirs.delete(d);
      }
    },

    async getUri(path: string): Promise<string> {
      return `memory://data/${path}`;
    },

    convertFileSrc(uri: string): string {
      return uri.replace('memory://', 'capacitor-memory://');
    }
  };
}
