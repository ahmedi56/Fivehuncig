import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Share, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { ConfirmButton } from '@/components/confirm-button';
import { LanguagePicker } from '@/components/language-picker';
import { Button, Chip, Field, Panel, Screen, Text } from '@/components/ui';
import { validateProfileForm, type FormErrors, type ProfileForm } from '@/domain/validate';
import { useT } from '@/i18n';
import { community } from '@/services/community';
import { REMINDER_TIMES, type ReminderKey } from '@/domain/notify';
import { setNotificationsMuted, syncReminder } from '@/services/actions';
import { cancelAll, notificationsSupported } from '@/services/notifications';
import { deletePhoto } from '@/services/photos';
import { useAppStore } from '@/store/app-store';
import { useSosSession } from '@/store/sos-session';
import { space } from '@/theme';

export default function Settings() {
  const t = useT();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const aiConsent = useAppStore((s) => s.aiConsent);
  const hapticsOff = useAppStore((s) => s.hapticsOff);
  const soundsOff = useAppStore((s) => s.soundsOff);
  const wavesOn = useAppStore((s) => s.wavesOn);
  const reminder = useAppStore((s) => s.reminder);
  const muted = useAppStore((s) => !!s.notificationsMuted);
  const showProgress = useAppStore((s) => !!s.showReminderProgress);
  const pickReminder = async (key?: ReminderKey) => {
    useAppStore.getState().setReminder(key);
    await syncReminder();
  };
  const [form, setForm] = useState<ProfileForm>(() => ({
    cigsPerDay: String(profile?.cigsPerDay ?? ''),
    pricePerPack: String(profile?.pricePerPack ?? ''),
    cigsPerPack: String(profile?.cigsPerPack ?? ''),
    currency: profile?.currency ?? '',
    wakeHours: String(profile?.wakeHours ?? ''),
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const set = (key: keyof ProfileForm) => (value: string) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const error = (key: keyof ProfileForm) => (errors[key] ? t.validation[errors[key]] : undefined);

  const save = () => {
    const r = validateProfileForm(form);
    if (!r.ok) return setErrors(r.errors);
    setErrors({});
    useAppStore.getState().updateProfile(r.value);
    setSaved(true);
  };

  const exportData = async () => {
    // Every list the app stores, so "Export my data" is all of it. Photos stay on the phone.
    const { profile: p, smokes, cravings, plans, reasons, surfs, ratings, lessons, challenges, supports, language, country, aiConsent } =
      useAppStore.getState();
    const json = JSON.stringify(
      {
        app: 'FivehunCig',
        exportedAt: new Date().toISOString(),
        profile: p,
        smokes,
        cravings,
        plans,
        reasons: reasons.map((r) => ({ text: r.text })),
        surfs,
        ratings: ratings.map(({ followUpId: _id, ...r }) => r),
        lessons,
        challenges,
        supports,
        settings: { language, country, aiConsent },
      },
      null,
      2,
    );
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fivehuncig-data.json';
      a.click();
      // Revoking at once makes some browsers (Safari, Firefox) cancel the download.
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      return;
    }
    await Share.share({ message: json, title: 'FivehunCig data' }).catch(() => undefined);
  };

  const deleteEverything = async () => {
    // Community posts live on the server: delete them too. If the member never joined (or the
    // community isn't set up) there is nothing to delete there.
    // If that fails (offline), stop: wiping the phone would leave the posts on the server with
    // nothing left on the phone to delete them from.
    if (community.configured()) {
      const r = await community.deleteMyData();
      if (!r.ok) return setDeleteFailed(true);
    }
    setDeleteFailed(false);
    await cancelAll();
    useSosSession.getState().end();
    useAppStore.getState().reasons.forEach((r) => deletePhoto(r.photoUri));
    useAppStore.getState().resetAll();
  };

  return (
    <Screen edges={['bottom']}>
      <Panel>
        <Text variant="heading">{t.language.title}</Text>
        <LanguagePicker />
        <Text variant="small" tone="soft">
          {t.language.note}
        </Text>
      </Panel>

      <Panel>
        <Text variant="heading">{t.settings.tourTitle}</Text>
        <Text tone="soft">{t.settings.tourBody}</Text>
        <Button kind="secondary" label={t.settings.tourButton} onPress={() => router.push('/tour')} />
      </Panel>

      {FEATURES.chat ? (
        <Panel>
          <Text variant="heading">{t.chat.settingsTitle}</Text>
          <Text tone="soft">{aiConsent ? t.chat.settingsOn : t.chat.settingsOff}</Text>
          <Button
            kind="secondary"
            label={aiConsent ? t.chat.turnOff : t.chat.turnOn}
            onPress={() => useAppStore.getState().setAiConsent(!aiConsent)}
          />
        </Panel>
      ) : null}

      {notificationsSupported ? (
        <Panel>
          <Text variant="heading">{t.settings.notificationsTitle}</Text>
          <Text tone="soft">{muted ? t.settings.muted : t.settings.notificationsBody}</Text>
          <Button kind="secondary" label={muted ? t.settings.unmute : t.settings.mute} onPress={() => setNotificationsMuted(!muted)} />
          {muted ? null : (
            <>
              <Text variant="bodyStrong">{t.plan.remindHeading}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} accessibilityRole="radiogroup">
                <Chip role="radio" label={t.settings.reminderNone} selected={!reminder} onPress={() => pickReminder(undefined)} />
                {REMINDER_TIMES.map((x) => (
                  <Chip role="radio" key={x.key} label={t.plan.times[x.key]} selected={reminder === x.key} onPress={() => pickReminder(x.key)} />
                ))}
              </View>
              {reminder ? (
                <>
                  <Text variant="small" tone="soft">
                    {showProgress ? t.settings.progressOn : t.settings.progressOff}
                  </Text>
                  <Button
                    kind="secondary"
                    label={showProgress ? t.settings.hideProgress : t.settings.showProgress}
                    onPress={async () => {
                      useAppStore.getState().setShowReminderProgress(!showProgress);
                      await syncReminder();
                    }}
                  />
                </>
              ) : null}
            </>
          )}
        </Panel>
      ) : null}

      <Panel>
        <Text variant="heading">{t.settings.vibrationTitle}</Text>
        <Text tone="soft">{hapticsOff ? t.settings.vibrationOff : t.settings.vibrationOn}</Text>
        <Button
          kind="secondary"
          label={hapticsOff ? t.settings.turnVibrationOn : t.settings.turnVibrationOff}
          onPress={() => useAppStore.getState().setHapticsOff(!hapticsOff)}
        />
      </Panel>

      <Panel>
        <Text variant="heading">{t.settings.soundsTitle}</Text>
        <Text tone="soft">{soundsOff ? t.settings.gameSoundsOff : t.settings.gameSoundsOn}</Text>
        <Button
          kind="secondary"
          label={soundsOff ? t.settings.turnGameSoundsOn : t.settings.turnGameSoundsOff}
          onPress={() => useAppStore.getState().setSoundsOff(!soundsOff)}
        />
        <Text tone="soft">{wavesOn ? t.settings.wavesOn : t.settings.wavesOff}</Text>
        <Button
          kind="secondary"
          label={wavesOn ? t.settings.turnWavesOff : t.settings.turnWavesOn}
          onPress={() => useAppStore.getState().setWavesOn(!wavesOn)}
        />
        <Text variant="small" tone="soft">
          {t.settings.soundsNote}
        </Text>
      </Panel>

      <Text variant="heading">{t.settings.numbers}</Text>
      <Field
        label={t.settings.usualPerDay}
        keyboardType="number-pad"
        value={form.cigsPerDay}
        onChangeText={set('cigsPerDay')}
        error={error('cigsPerDay')}
      />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 2 }}>
          <Field
            label={t.onboarding.pricePerPack}
            keyboardType="decimal-pad"
            value={form.pricePerPack}
            onChangeText={set('pricePerPack')}
            error={error('pricePerPack')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t.onboarding.currency} value={form.currency} onChangeText={set('currency')} maxLength={4} placeholder={t.onboarding.currencyExample} />
        </View>
      </View>
      <Field
        label={t.onboarding.cigsPerPack}
        keyboardType="number-pad"
        value={form.cigsPerPack}
        onChangeText={set('cigsPerPack')}
        error={error('cigsPerPack')}
      />
      <Field
        label={t.onboarding.wakeHours}
        keyboardType="number-pad"
        value={form.wakeHours}
        onChangeText={set('wakeHours')}
        error={error('wakeHours')}
      />
      <Button label={saved ? t.common.saved : t.settings.saveNumbers} onPress={save} disabled={saved} />

      <Panel>
        <Text variant="heading">{t.settings.data}</Text>
        <Text tone="soft">{t.settings.dataBody}</Text>
        <Button kind="secondary" label={t.settings.export} onPress={exportData} />
        <ConfirmButton label={t.settings.delete} confirmLabel={t.settings.deleteConfirm} onConfirm={deleteEverything} />
        {deleteFailed ? (
          <Text tone="ember" accessibilityLiveRegion="assertive" aria-live="assertive">
            {t.settings.deleteFailed}
          </Text>
        ) : null}
      </Panel>
    </Screen>
  );
}
