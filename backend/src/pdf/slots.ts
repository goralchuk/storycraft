/**
 * Replaces `{{token}}` placeholders with their slot values.
 * Unknown tokens are left intact so missing data is visible rather than silently dropped.
 */
export function resolveSlots(
  text: string,
  slots: Record<string, string>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in slots ? slots[key] : `{{${key}}}`,
  );
}
