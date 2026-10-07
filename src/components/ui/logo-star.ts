/**
 * The 4-point star at the centre of the AI Bootcamp mark.
 *
 * Kept in its own module so the logo and the single star that travels the page
 * (`StarJourney`) draw the exact same geometry rather than two lookalikes.
 */
export const LOGO_STAR_VIEWBOX = "0 0 100 100";

/** Drawn inside a 100×100 box, centred on (50, 50). */
export const LOGO_STAR_PATH = "M 50,13 Q 50,42 83,50 Q 50,58 50,87 Q 50,58 17,50 Q 50,42 50,13 Z";
