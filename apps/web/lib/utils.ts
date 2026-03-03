/**
 * Returns the character to display in the avatar circle.
 * Uses displayName when available and meaningful, otherwise avatarSeed.
 */
export function getAvatarInitial(
  displayName?: string,
  avatarSeed?: string
): string {
  if (displayName && displayName !== 'Anonymous' && displayName !== 'ผู้ใช้') {
    return displayName.charAt(0).toUpperCase();
  }
  return avatarSeed?.charAt(0).toUpperCase() || '?';
}
