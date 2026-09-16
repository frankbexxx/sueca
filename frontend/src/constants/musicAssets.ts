import { publicUrl } from '../config/runtimeEnv';

const musicBase = `${publicUrl()}/assets/music`;
const coreBase = `${musicBase}/core`;

export function coreTrackPath(fileName: string): string {
  return `${coreBase}/${fileName}`;
}
