import { isMusicTrackId } from '../constants/musicCatalog';
import { isRemoteMusicTrackId } from './remoteMusicCatalog';

/** Local / remote availability for a track id (no downloader yet). */
export type MusicAvailability =
  | 'AVAILABLE_LOCAL'
  | 'REMOTE_AVAILABLE'
  | 'UNAVAILABLE';

/**
 * Phase MOCK: core → local; known remote mock → REMOTE_AVAILABLE; else UNAVAILABLE.
 * Does not imply download or playability on device.
 */
export function getMusicAvailability(trackId: string | null | undefined): MusicAvailability {
  if (!trackId) return 'UNAVAILABLE';
  if (isMusicTrackId(trackId)) return 'AVAILABLE_LOCAL';
  if (isRemoteMusicTrackId(trackId)) return 'REMOTE_AVAILABLE';
  return 'UNAVAILABLE';
}
