import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Corporate design tokens — single source of truth for the brand look.
 *
 * Overrides follow Aura's own structure (a token only takes effect when it
 * lives at the same path as the base preset):
 *
 * - `primitive.borderRadius` is the scale every component chains back to:
 *   `semantic.content.borderRadius`, `semantic.formField.borderRadius` and
 *   the component refs `{border.radius.*}` all resolve to it. One override
 *   retunes cards, inputs, buttons, menus, popovers and modals together.
 * - `semantic.primary` maps CORPORATE_PRIMARY onto the Aura palette stops,
 *   so the whole light/dark color scheme follows the chosen palette.
 *
 * To change the brand color tomorrow: edit CORPORATE_PRIMARY (any Aura
 * palette name: emerald, blue, indigo, teal, ...) and restart; for a custom
 * hex brand, replace `semantic.primary` with a full 50..950 palette object.
 * Note: a primary picked at runtime from the topbar configurator is
 * persisted in localStorage and wins over this default until reset there.
 *
 * The configurator also merges CORPORATE_TOKENS on every runtime theme
 * change (see app.configurator.ts), so switching preset/primary there never
 * drops the corporate radius scale.
 */
export const CORPORATE_PRIMARY = 'emerald';

const PALETTE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Structural tokens shared by boot (`CorporatePreset`) and runtime updates. */
export const CORPORATE_TOKENS = {
    primitive: {
        // Enterprise-tight radius scale (Aura: 2/4/6/8/12 -> 2/4/4/6/8).
        borderRadius: {
            none: '0',
            xs: '2px',
            sm: '4px',
            md: '4px',
            lg: '6px',
            xl: '8px'
        }
    },
    semantic: {
        primary: Object.fromEntries(PALETTE_STOPS.map((stop) => [stop, `{${CORPORATE_PRIMARY}.${stop}}`]))
    }
};

/** Aura + corporate tokens, applied at boot via providePrimeNG. */
export const CorporatePreset = definePreset(Aura, CORPORATE_TOKENS);
