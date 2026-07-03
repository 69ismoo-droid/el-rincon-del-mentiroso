/** Escapes user input for safe use inside MongoDB `$regex` patterns. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
