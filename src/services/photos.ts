import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/** Photos stay on the phone, copied into the app's private folder so they survive cache clears. */
export const photosSupported = Platform.OS !== 'web';

export type PickResult = { ok: true; uri: string } | { ok: false; reason: 'cancelled' | 'denied' | 'error' };

export async function pickReasonPhoto(): Promise<PickResult> {
  if (!photosSupported) return { ok: false, reason: 'error' };
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets?.[0]) return { ok: false, reason: 'cancelled' };
    const source = new File(result.assets[0].uri);
    const dir = new Directory(Paths.document, 'reasons');
    dir.create({ intermediates: true, idempotent: true });
    const ext = source.extension || '.jpg';
    const target = new File(dir, `${Date.now()}${ext}`);
    await source.copy(target);
    return { ok: true, uri: target.uri };
  } catch (e) {
    const message = e instanceof Error ? e.message.toLowerCase() : '';
    return { ok: false, reason: message.includes('permission') ? 'denied' : 'error' };
  }
}

export function deletePhoto(uri?: string): void {
  if (!photosSupported || !uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // ignore — the file may already be gone
  }
}
