/**
 * Card grids are 1 column on phones, 2 on tablets and 3 on desktop.
 * In the 2-column layout a final odd card would sit alone on the left,
 * so it spans both columns and is centred at single-card width instead.
 */
export const CARD_GRID = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch";

export function orphanCardClass(index: number, total: number): string {
  const isOrphan = total % 2 === 1 && index === total - 1 && total > 1;
  return isOrphan
    ? "md:col-span-2 md:justify-self-center md:w-[calc(50%-0.75rem)] lg:col-span-1 lg:w-auto lg:justify-self-stretch"
    : "";
}
