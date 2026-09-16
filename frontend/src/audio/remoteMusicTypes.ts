import type { MusicFamily } from '../constants/musicCatalog';

/** Remote (non-bundled) track metadata — R2 / mock catalog. */
export type RemoteMusicTrack = {
  id: string;
  title: string;
  artist: string;
  family: MusicFamily;
  url: string;
  duration: number;
  size: number;
  sha256: string;
  streamingSafe: boolean;
  contentId: boolean;
  bundled: false;
  version: number;
};

export type RemoteMusicCatalog = {
  catalogVersion: number;
  tracks: RemoteMusicTrack[];
};
