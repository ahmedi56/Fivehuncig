import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, Platform, Pressable, StyleSheet, Text as RNText, useWindowDimensions, View } from 'react-native';

import { LanguagePicker } from '@/components/language-picker';
import { ModePicker } from '@/components/mode-picker';
import { Button, Field, Gap, Screen, Text } from '@/components/ui';
import type { Mode } from '@/domain/types';
import { validateProfileForm, type FormErrors, type ProfileForm } from '@/domain/validate';
import { deviceCurrency, useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';
import { radius, space, usePalette } from '@/theme';

// Generated from assets/brand/logo-source.webp by scripts/brand-assets.py.
const LOGO = require('../../assets/images/logo.webp');

/**
 * Only four questions: mode, cigarettes a day, pack price, one reason (under a minute). Pack size,
 * waking hours and currency start from defaults and can be changed in Settings; plans are offered
 * after the first craving on the SOS screen.
 */
type Step = 'welcome' | 'mode' | 'numbers' | 'reason';
const ORDER: Step[] = ['welcome', 'mode', 'numbers', 'reason'];

/**
 * Progress so far, kept until onboarding finishes: if the app is closed halfway (the member goes to
 * check a pack's price, the system frees memory), it reopens on the same step with the same answers.
 */
const DRAFT_KEY = 'fivehuncig-onboarding';
type Draft = { step: Step; form: ProfileForm; mode: Mode; reason?: string; consent?: boolean };

export default function Onboarding() {
  const t = useT();
  const p = usePalette();
  // Short phones (iPhone SE, 640 px): a smaller halo keeps "Let's start" on screen without scrolling.
  const compact = useWindowDimensions().height < 720;
  const [step, setStep] = useState<Step>('welcome');
  const [form, setForm] = useState<ProfileForm>(() => ({
    cigsPerDay: '',
    pricePerPack: '',
    cigsPerPack: '20',
    currency: deviceCurrency(),
    wakeHours: '16',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [mode, setMode] = useState<Mode>('cutdown');
  // Saved on the last step, together with the profile.
  const [reason, setReason] = useState('');
  // 18+ and "saved on this phone": one box on the welcome screen, required to start.
  const [consent, setConsent] = useState(false);
  const [consentMissing, setConsentMissing] = useState(false);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [finishing, setFinishing] = useState(false);
  const restored = useRef(false);
  const title = useRef<RNText>(null);

  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => {
        const draft = raw ? (JSON.parse(raw) as Partial<Draft>) : undefined;
        if (draft?.step && ORDER.includes(draft.step) && draft.form) {
          setStep(draft.step);
          setForm(draft.form);
          if (draft.mode) setMode(draft.mode);
          setReason(draft.reason ?? '');
          setConsent(!!draft.consent);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        restored.current = true;
      });
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    const draft: Draft = { step, form, mode, reason, consent };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => undefined);
  }, [step, form, mode, reason, consent]);

  // Each step starts at its title: for screen readers (focus) and on screen (the Screen below is
  // keyed by step, so it opens scrolled to the top rather than where the last step was left).
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    const node = title.current;
    if (!node) return;
    if (Platform.OS === 'web') (node as unknown as HTMLElement).focus?.({ preventScroll: true });
    else {
      const handle = findNodeHandle(node);
      if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
    }
  }, [step]);

  const set = (key: keyof ProfileForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const stepNumber = ORDER.indexOf(step);
  const error = (key: keyof ProfileForm) => (errors[key] ? t.validation[errors[key]] : undefined);

  const finish = async () => {
    // A second tap while finishing would save the reason twice.
    if (finishing) return;
    const parsed = validateProfileForm(form);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setStep('numbers');
      return;
    }
    setFinishing(true);
    await AsyncStorage.removeItem(DRAFT_KEY).catch(() => undefined);
    completeOnboarding(parsed.value, mode);
    useAppStore.getState().setConsentedAt(Date.now());
    const text = reason.trim();
    if (text) useAppStore.getState().addReason({ text });
  };

  return (
    <Screen key={step} edges={['top', 'bottom']}>
      {step !== 'welcome' ? (
        <Text variant="small" tone="soft" accessibilityRole="text">
          {t.onboarding.step(stepNumber, ORDER.length - 1)}
        </Text>
      ) : null}

      {step === 'welcome' && (
        // Centred and calm, framed by the same soft ring as the home screen's craving button.
        <View style={[styles.welcome, compact && { gap: space.sm, paddingTop: space.sm }]}>
          <LanguagePicker centered />
          <View style={[styles.halo, compact && styles.haloCompact, { backgroundColor: p.lungSoft }]}>
            {/* The badge carries the app name, shown nowhere else on this screen: announce it. */}
            <Image source={LOGO} style={compact ? styles.logoCompact : styles.logo} contentFit="contain" priority="high" accessible accessibilityRole="image" accessibilityLabel="FivehunCig" />
          </View>
          <Text variant="title" accessibilityRole="header" style={styles.center}>
            {t.onboarding.welcomeTitle}
          </Text>
          <View>
            {t.onboarding.tagline.map((line) => (
              <Text key={line} variant="heading" tone="lung" style={styles.center}>
                {line}
              </Text>
            ))}
          </View>
          <Text tone="soft" style={[styles.center, styles.body]}>
            {t.onboarding.welcomeBody}
          </Text>
          <Gap size="sm" />
          <Pressable
            accessibilityRole="checkbox"
            aria-checked={consent}
            accessibilityLabel={t.onboarding.consent}
            onPress={() => {
              setConsent(!consent);
              setConsentMissing(false);
            }}
            style={styles.consent}>
            <View style={[styles.box, { borderColor: consentMissing ? p.ember : p.control, backgroundColor: consent ? p.lung : p.surface }]}>
              {consent ? (
                <Text tone="onLung" variant="bodyStrong">
                  ✓
                </Text>
              ) : null}
            </View>
            <Text variant="small" style={{ flexShrink: 1 }}>
              {t.onboarding.consent}
            </Text>
          </Pressable>
          {consentMissing ? (
            <Text variant="small" tone="ember" accessibilityLiveRegion="polite">
              {t.onboarding.consentNeeded}
            </Text>
          ) : null}
          <Button big label={t.onboarding.start} onPress={() => (consent ? setStep('mode') : setConsentMissing(true))} style={styles.start} />
          <Text variant="small" tone="soft" style={[styles.center, styles.body]}>
            {t.onboarding.under18}
          </Text>
          {/* Separate elements: inside one string the emoji is bidi-neutral and lands at the end in Arabic. */}
          <View style={styles.privacy}>
            <Text variant="small" accessibilityElementsHidden importantForAccessibility="no">
              🔒
            </Text>
            <Text variant="small" tone="soft" style={{ flexShrink: 1 }}>
              {t.onboarding.privacy}
            </Text>
          </View>
        </View>
      )}

      {step === 'numbers' && (
        <View style={{ gap: space.md }}>
          <Text ref={title} tabIndex={-1} variant="title" accessibilityRole="header">
            {t.onboarding.numbersTitle}
          </Text>
          <Text tone="soft">{t.onboarding.numbersBody}</Text>
          <Field
            label={t.onboarding.cigsPerDay}
            keyboardType="number-pad"
            value={form.cigsPerDay}
            onChangeText={set('cigsPerDay')}
            placeholder={t.onboarding.cigsPerDayExample}
            error={error('cigsPerDay')}
          />
          <Field
            label={form.currency ? `${t.onboarding.pricePerPack} (${form.currency})` : t.onboarding.pricePerPack}
            keyboardType="decimal-pad"
            value={form.pricePerPack}
            onChangeText={set('pricePerPack')}
            placeholder={t.onboarding.priceExample}
            error={error('pricePerPack')}
          />
          <Button
            label={t.common.next}
            onPress={() => {
              const r = validateProfileForm(form);
              if (!r.ok) return setErrors(r.errors);
              setErrors({});
              setStep('reason');
            }}
          />
          <Button kind="quiet" label={t.common.back} onPress={() => setStep('mode')} />
        </View>
      )}

      {step === 'mode' && (
        <View style={{ gap: space.md }}>
          <Text ref={title} tabIndex={-1} variant="title" accessibilityRole="header">
            {t.onboarding.modeTitle}
          </Text>
          <Text tone="soft">{t.onboarding.modeBody}</Text>
          <ModePicker value={mode} onChange={setMode} />
          <Button label={t.common.next} onPress={() => setStep('numbers')} />
          <Button kind="quiet" label={t.common.back} onPress={() => setStep('welcome')} />
        </View>
      )}

      {step === 'reason' && (
        <View style={{ gap: space.md }}>
          <Text ref={title} tabIndex={-1} variant="title" accessibilityRole="header">
            {t.onboarding.reasonTitle}
          </Text>
          <Text tone="soft">{t.onboarding.reasonBody}</Text>
          <Field label={t.reasons.label} value={reason} onChangeText={setReason} maxLength={100} placeholder={t.reasons.example} />
          <Text variant="small" tone="soft">
            {t.onboarding.medsTip}
          </Text>
          <Button big label={t.onboarding.letsGo} onPress={finish} loading={finishing} />
          {reason.trim() ? null : <Button kind="quiet" label={t.onboarding.skip} onPress={finish} />}
          <Button kind="quiet" label={t.common.back} onPress={() => setStep('numbers')} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // The badge is 600×617.
  welcome: { gap: space.md, paddingTop: space.lg, alignItems: 'center' },
  // Same proportions as the craving button's halo on Today (172 inside 216).
  halo: { width: 168, height: 168, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  haloCompact: { width: 120, height: 120, marginTop: 0 },
  logo: { width: 112, height: 116 },
  logoCompact: { width: 80, height: 83 },
  center: { textAlign: 'center' },
  body: { maxWidth: 360 },
  start: { alignSelf: 'stretch' },
  privacy: { flexDirection: 'row', gap: space.sm, maxWidth: 360 },
  // A 48 px row to tap, with a 28 px box drawn inside it.
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, alignSelf: 'stretch', minHeight: 48, paddingVertical: space.xs },
  box: { width: 28, height: 28, borderWidth: 2, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' },
});
