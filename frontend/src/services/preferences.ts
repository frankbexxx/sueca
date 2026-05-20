/**
 * Settings storage — localStorage on web; extend with @capacitor/preferences on native.
 */
export async function getPreference(key: string): Promise<string | null> {
  return localStorage.getItem(key);
}

export async function setPreference(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value);
}
