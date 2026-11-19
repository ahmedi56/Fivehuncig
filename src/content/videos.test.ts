import { URGE_SURF_SLOTS, urgeSurfVideos, VIDEOS, videosFor, type VideoEntry } from './videos';

const base: VideoEntry = {
  id: 'surf-intro',
  category: 'act',
  slot: 'ride-the-wave',
  durationSec: 90,
  streamUrl: 'https://cdn.example.org/surf/index.m3u8',
  thumbnailUrl: 'https://cdn.example.org/surf/thumb.webp',
  locales: { en: { title: 'Ride a craving like a wave', summary: '…', captions: true } },
  source: 'Example',
  review: { clinical: 'reviewed' },
  published: true,
};

describe('videos', () => {
  it('ships with no videos until real, reviewed content exists', () => {
    expect(VIDEOS).toEqual([]);
    expect(urgeSurfVideos('en')).toEqual([]);
  });

  it('only offers published, clinically reviewed, captioned videos', () => {
    expect(videosFor('en', [base])).toHaveLength(1);
    expect(videosFor('en', [{ ...base, published: false }])).toHaveLength(0);
    expect(videosFor('en', [{ ...base, review: { clinical: 'pending' } }])).toHaveLength(0);
    expect(videosFor('en', [{ ...base, locales: { en: { ...base.locales.en!, captions: false } } }])).toHaveLength(0);
    expect(videosFor('fr', [base])).toHaveLength(0); // not offered in French
  });

  it('requires language review for French and Arabic', () => {
    const fr = { ...base, locales: { ...base.locales, fr: { title: 't', summary: 's', captions: true } } };
    expect(videosFor('fr', [fr])).toHaveLength(0);
    expect(videosFor('fr', [{ ...fr, review: { clinical: 'reviewed', fr: 'reviewed' } }])).toHaveLength(1);
  });

  it('orders urge-surfing videos by slot', () => {
    const a = { ...base, id: 'a', slot: URGE_SURF_SLOTS[3] };
    const b = { ...base, id: 'b', slot: URGE_SURF_SLOTS[0] };
    expect(urgeSurfVideos('en', [a, b, { ...base, id: 'c', slot: undefined }]).map((v) => v.id)).toEqual(['b', 'a']);
  });
});
