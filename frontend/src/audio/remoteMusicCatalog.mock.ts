import type { MusicFamily } from '../constants/musicCatalog';
import type { RemoteMusicCatalog, RemoteMusicTrack } from './remoteMusicTypes';

/** Predictable mock CDN base — never fetch in this phase. */
export const MOCK_MUSIC_CDN_ORIGIN = 'https://music.example.invalid';

export function mockRemoteTrackUrl(id: string, version = 1): string {
  return `${MOCK_MUSIC_CDN_ORIGIN}/music/v1/tracks/${id}/${version}/${id}.ogg`;
}

/**
 * MOCK PLACEHOLDER SHA-256 (valid hex length/format only — not a real digest).
 * Pattern: 56× `a` + 8 hex digits from a simple string hash of `id`.
 */
export function mockSha256Placeholder(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  const tail = (h >>> 0).toString(16).padStart(8, '0');
  return `${'a'.repeat(56)}${tail}`;
}

function mibToBytes(mib: number): number {
  return Math.round(mib * 1024 * 1024);
}

function track(
  id: string,
  title: string,
  artist: string,
  family: MusicFamily,
  duration: number,
  q4Mib: number,
  contentId: boolean
): RemoteMusicTrack {
  const version = 1;
  return {
    id,
    title,
    artist,
    family,
    url: mockRemoteTrackUrl(id, version),
    duration,
    size: mibToBytes(q4Mib),
    sha256: mockSha256Placeholder(id),
    streamingSafe: !contentId,
    contentId,
    bundled: false,
    version
  };
}

/**
 * MUSIC-REMOTE-MOCK-01 — 23 RELEASE OK non-core candidates.
 * URLs are fake; do not fetch.
 */
export const MOCK_REMOTE_MUSIC_CATALOG: RemoteMusicCatalog = {
  catalogVersion: 1,
  tracks: [
    track(
      'jazz-orchestra',
      'Jazz Orchestra Groove',
      'LP Studio',
      'Casino Jazz / Lounge',
      153.6,
      1.76,
      false
    ),
    track(
      'whiskey-jazz',
      'Whiskey Jazz Lounge',
      'Maksym Malko',
      'Casino Jazz / Lounge',
      75.0,
      0.86,
      true
    ),
    track(
      'northern-glow',
      'Northern Glow',
      'Digicompo',
      'Nordic / Arctic',
      239.8,
      2.74,
      true
    ),
    track(
      'celtic-traveler',
      'Old Celtic Traveler',
      'Sounova Music',
      'Celtic',
      165.6,
      1.9,
      false
    ),
    track(
      'celtic-nature',
      'Nature Celtic Folk Instrumental',
      'EchoGate Studios',
      'Forest / Organic',
      207.9,
      2.38,
      false
    ),
    track(
      'sahara-sunset',
      'Sahara Sunset',
      'Djovan',
      'Maghreb / Middle Eastern',
      233.8,
      2.68,
      false
    ),
    track(
      'andalusian-dreams',
      'Andalusian Oud Dreams',
      'Djovan',
      'Maghreb / Middle Eastern',
      240.0,
      2.75,
      false
    ),
    track(
      'ancient-temple',
      'Ancient Temple',
      'Alex Morgan',
      'Mediterranean / Aegean',
      193.4,
      2.21,
      false
    ),
    track(
      'andalusian-perc',
      'Andalusian Oud & Percussions Soft',
      'Djovan',
      'Mediterranean / Aegean',
      240.0,
      2.75,
      false
    ),
    track(
      'ancient-echoes',
      'Ancient Echoes',
      'Vifoto Free Sounds',
      'Indus / South Asian ancient',
      183.6,
      2.1,
      false
    ),
    track(
      'ethiopia-groove',
      'Ethiopia Groove',
      'Pixabay',
      'Horn of Africa / Ethiopic',
      109.3,
      1.25,
      false
    ),
    track(
      'southern-mara',
      'Dusk Over Mara',
      'Savannah Frames',
      'Southern African',
      284.9,
      3.26,
      false
    ),
    track(
      'mongolia-atlas',
      'Atlas Mongolia',
      'Vadim Makes Sound',
      'Central Asian / Mongolia',
      208.6,
      2.39,
      false
    ),
    track(
      'tibet-ocean',
      'Tibet',
      'Oceani Profondi',
      'Himalayan / Tibet',
      172.1,
      1.97,
      false
    ),
    track(
      'kathmandu',
      'Modern Kathmandu',
      'Khemraj',
      'Himalayan / Tibet',
      129.7,
      1.48,
      false
    ),
    track(
      'yamatai-shizima4',
      'Shizima4 Piano',
      'PeriTune',
      'Japanese / Yamatai',
      278.0,
      3.18,
      false
    ),
    track(
      'yamatai-oboro',
      'Oboro',
      'PeriTune',
      'Japanese / Yamatai',
      287.1,
      3.29,
      false
    ),
    track(
      'khmer-roneat',
      'Khmer Instrument Roneat',
      'Nhimhor',
      'Khmer / SE Asian temple',
      87.4,
      1.0,
      false
    ),
    track(
      'royal-angkor',
      'Royal of Angkor',
      'Chheng Flim',
      'Khmer / SE Asian temple',
      194.4,
      2.23,
      false
    ),
    track(
      'angkor-dawn',
      'Angkor Dawn',
      'Vadim Makes Sound',
      'Khmer / SE Asian temple',
      268.6,
      3.07,
      false
    ),
    track(
      'andes-patagonia',
      'Andes Patagonia',
      'Austral Music',
      'Andes / Latin',
      270.0,
      3.09,
      false
    ),
    track(
      'atlas-ecuador',
      'Atlas Ecuador',
      'Vadim Makes Sound',
      'Andes / Latin',
      134.6,
      1.54,
      false
    ),
    track(
      'hawaii-relax',
      'Hawaii Relax Loop',
      'Evolving Vibes',
      'Polynesian / Pacific',
      48.0,
      0.55,
      true
    )
  ]
};
