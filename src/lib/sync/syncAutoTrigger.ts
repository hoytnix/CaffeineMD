/**
 * Lightweight, safe helper to trigger background auto-sync to Google Drive.
 * Dynamically imports googleDriveSync to avoid circular dependencies with storage repositories.
 */
export function triggerBackgroundAutoSync(debounceMs = 1500): void {
  // Fire and forget, catching any environment or import errors silently
  import('./googleDriveSync')
    .then(({ triggerAutoSync }) => {
      triggerAutoSync(debounceMs);
    })
    .catch((err) => {
      console.warn('Background auto-sync trigger skipped:', err);
    });
}
