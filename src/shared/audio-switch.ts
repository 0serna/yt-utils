let pending = false;

export function markAudioSwitchPending(): void {
  pending = true;
}

export function clearAudioSwitchPending(): void {
  pending = false;
}

export function isAudioSwitchPending(): boolean {
  return pending;
}
