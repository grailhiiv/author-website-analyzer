export function parsePracticalActions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (action): action is string =>
      typeof action === "string" && action.trim().length > 0,
  );
}
