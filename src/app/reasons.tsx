import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CharsLeft } from '@/components/chars-left';
import { ConfirmButton } from '@/components/confirm-button';
import { Button, Chip, Field, Panel, Screen, Text } from '@/components/ui';
import { cleanText } from '@/domain/validate';
import { useT } from '@/i18n';
import { deletePhoto, photosSupported, pickReasonPhoto } from '@/services/photos';
import { MAX_REASONS, useAppStore } from '@/store/app-store';
import { radius, space, usePalette } from '@/theme';

export default function Reasons() {
  const t = useT();
  const p = usePalette();
  const reasons = useAppStore((s) => s.reasons);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [message, setMessage] = useState<string>();

  const choosePhoto = async () => {
    const r = await pickReasonPhoto();
    if (r.ok) {
      setPhoto(r.uri);
      setMessage(undefined);
    } else if (r.reason === 'denied') setMessage(t.reasons.photoDenied);
    else if (r.reason === 'error') setMessage(t.reasons.photoError);
  };

  const save = () => {
    const clean = cleanText(text, 100);
    if (!clean) return setMessage(t.validation.reasonEmpty);
    if (reasons.some((r) => r.text.toLowerCase() === clean.toLowerCase())) return setMessage(t.reasons.duplicate);
    if (!useAppStore.getState().addReason({ text: clean, photoUri: photo })) return setMessage(t.reasons.full(MAX_REASONS));
    setText('');
    setPhoto(undefined);
    setMessage(undefined);
  };

  return (
    <Screen edges={['bottom']}>
      <Text tone="soft">{t.reasons.intro}</Text>

      {reasons.length === 0 ? (
        <Panel tone="sky">
          <Text>{t.reasons.empty}</Text>
        </Panel>
      ) : (
        <View style={{ gap: space.sm }}>
          {reasons.map((r) => (
            <Panel key={r.id}>
              {r.photoUri ? (
                <Image
                  source={{ uri: r.photoUri }}
                  // The whole photo, never cropped: a portrait shot would lose the face to a 4:3 crop.
                  style={[styles.photo, { backgroundColor: p.surfaceAlt }]}
                  contentFit="contain"
                  accessibilityLabel={t.reasons.photoFor(r.text)}
                />
              ) : null}
              <Text variant="heading" followContent>
                {r.text}
              </Text>
              <ConfirmButton
                label={t.common.remove}
                confirmLabel={t.common.removeConfirm}
                onConfirm={() => {
                  deletePhoto(r.photoUri);
                  useAppStore.getState().removeReason(r.id);
                }}
              />
            </Panel>
          ))}
        </View>
      )}

      {reasons.length >= MAX_REASONS ? (
        <Panel tone="sky">
          <Text>{t.reasons.full(MAX_REASONS)}</Text>
        </Panel>
      ) : (
        <>
          <Text variant="title">{t.reasons.add}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {t.reasons.ideas.map((idea) => (
              <Chip key={idea} label={idea} selected={text === idea} onPress={() => setText(idea)} />
            ))}
          </View>
          <Field label={t.reasons.label} value={text} onChangeText={setText} maxLength={100} placeholder={t.reasons.example} />
          <CharsLeft value={text} max={100} showAt={20} warnAt={10} />
          {photo ? (
            <Image source={{ uri: photo }} style={[styles.photo, { backgroundColor: p.surfaceAlt }]} contentFit="contain" accessibilityLabel={t.reasons.chosenPhoto} />
          ) : null}
          {photosSupported ? (
            <Button kind="secondary" label={photo ? t.reasons.changePhoto : t.reasons.addPhoto} onPress={choosePhoto} />
          ) : null}
          {message ? (
            <Text variant="small" tone="ember" accessibilityLiveRegion="polite">
              {message}
            </Text>
          ) : null}
          <Button label={t.reasons.save} onPress={save} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.sm },
});
