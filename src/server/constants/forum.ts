/** Must stay in sync with `PostSchema.category.enum` in Forum model. */
export const POST_CATEGORIES = [
  "General",
  "Matemática (Bachillerato)",
  "Literatura",
  "Vida Escolar",
  "Consejos ExCOAR",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export function isPostCategory(v: string): v is PostCategory {
  return (POST_CATEGORIES as readonly string[]).includes(v);
}
