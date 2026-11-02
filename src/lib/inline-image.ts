// Build-time helpers that turn a file in src/assets into a data URI.
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const cache = new Map<string, Promise<InlineImage>>();

export interface InlineImage {
  uri: string;
  bytes: number;
  width: number;
  height: number;
  mime: string;
}

const assetPath = (file: string): string => path.resolve(process.cwd(), "src/assets", file);

export interface HeroOptions {
  width: number;
  quality?: number;
  cropAspect?: number;
  cropY?: number;
}

/** One AVIF data URI for the hero. No second mobile file and no preload. */
export function heroImage(file: string, opts: HeroOptions): Promise<InlineImage> {
  const key = `hero:${file}:${JSON.stringify(opts)}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = (async () => {
      const input = await readFile(assetPath(file));
      let img = sharp(input);
      const meta = await img.metadata();
      const srcW = meta.width ?? opts.width;
      const srcH = meta.height ?? opts.width;
      if (opts.cropAspect) {
        const wantH = Math.round(srcW / opts.cropAspect);
        if (wantH < srcH) {
          const top = Math.max(0, Math.min(srcH - wantH, Math.round((srcH - wantH) * (opts.cropY ?? 0.45))));
          img = img.extract({ left: 0, top, width: srcW, height: wantH });
        }
      }
      const out = await img
        .resize({ width: Math.min(opts.width, srcW), withoutEnlargement: true })
        .avif({ quality: opts.quality ?? 40, effort: 6, chromaSubsampling: "4:2:0" })
        .toBuffer({ resolveWithObject: true });
      return {
        uri: `data:image/avif;base64,${out.data.toString("base64")}`,
        bytes: out.data.length,
        width: out.info.width,
        height: out.info.height,
        mime: "image/avif",
      };
    })();
    cache.set(key, hit);
  }
  return hit;
}

export function logoImage(file: string, width: number): Promise<InlineImage> {
  const key = `logo:${file}:${width}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = (async () => {
      const input = await readFile(assetPath(file));
      const out = await sharp(input)
        .resize({ width })
        .png({ palette: true, colors: 24, compressionLevel: 9, effort: 10 })
        .toBuffer({ resolveWithObject: true });
      return {
        uri: `data:image/png;base64,${out.data.toString("base64")}`,
        bytes: out.data.length,
        width: out.info.width,
        height: out.info.height,
        mime: "image/png",
      };
    })();
    cache.set(key, hit);
  }
  return hit;
}
