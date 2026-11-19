import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { VideoEntry } from '@/content/videos';
import { useLang, useT } from '@/i18n';
import { radius, space, usePalette } from '@/theme';

import { Icon } from './icons';
import { Button, Panel, Text, pressedStyle } from './ui';

/**
 * A video that costs nothing until the member taps play: first only the thumbnail, title and
 * length are shown. If it can't load, the member is told the exercise works without it.
 * The text summary is always visible, so the content works without sound or video.
 */
export function VideoCard({ video }: { video: VideoEntry }) {
  const t = useT();
  const lang = useLang();
  const p = usePalette();
  const [playing, setPlaying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const text = video.locales[lang];
  if (!text) return null;

  return (
    <Panel>
      {playing ? (
        <Player key={attempt} video={video} onRetry={() => setAttempt((a) => a + 1)} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${text.title}, ${t.surf.videos.duration(video.durationSec)}`}
          onPress={() => setPlaying(true)}
          style={({ pressed }) => [styles.frame, { backgroundColor: p.surfaceAlt }, pressed && pressedStyle]}>
          <Image source={{ uri: video.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
          <View style={[styles.play, { backgroundColor: p.lung }]}>
            <Icon name="play" color={p.onLung} />
          </View>
        </Pressable>
      )}
      <Text variant="bodyStrong">{text.title}</Text>
      <Text variant="small" tone="soft">
        {t.surf.videos.duration(video.durationSec)}
      </Text>
      <Text variant="small">{text.summary}</Text>
    </Panel>
  );
}

function Player({ video, onRetry }: { video: VideoEntry; onRetry: () => void }) {
  const t = useT();
  const lang = useLang();
  const p = usePalette();
  const player = useVideoPlayer({ uri: video.streamUrl, contentType: 'hls' }, (pl) => {
    // Captions on by default, in the member's language when the stream has it.
    pl.addListener('statusChange', ({ status }) => {
      if (status !== 'readyToPlay' || pl.subtitleTrack) return;
      const track = pl.availableSubtitleTracks.find((s) => s.language?.toLowerCase().startsWith(lang));
      if (track) pl.subtitleTrack = track;
    });
    pl.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  if (status === 'error') {
    return (
      <View style={[styles.frame, styles.center, { backgroundColor: p.surfaceAlt }]}>
        <Text style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
          {t.surf.videos.unavailable}
        </Text>
        <Button kind="secondary" label={t.surf.videos.retry} onPress={onRetry} />
      </View>
    );
  }

  // Fixed black/white on purpose, in both themes: video is letterboxed on black, like every player.
  return (
    <View style={[styles.frame, { backgroundColor: '#000' }]}>
      <VideoView player={player} nativeControls contentFit="contain" style={StyleSheet.absoluteFill} />
      {status === 'loading' || status === 'idle' ? (
        <View style={[StyleSheet.absoluteFill, styles.center]} accessibilityLabel={t.surf.videos.loading}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.md },
  play: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
