import { describe, it, expect } from 'vitest';
import { CORPORATE_PRIMARY, CORPORATE_TOKENS, CorporatePreset } from './corporate.preset';

describe('CorporatePreset', () => {
    it('tightens the radius scale once for every component', () => {
        expect(CORPORATE_TOKENS.primitive.borderRadius.md).toBe('4px');
        expect(CORPORATE_TOKENS.primitive.borderRadius.lg).toBe('6px');
        expect(CORPORATE_TOKENS.primitive.borderRadius.xl).toBe('8px');
    });

    it('maps CORPORATE_PRIMARY onto the Aura palette stops', () => {
        expect(CORPORATE_TOKENS.semantic.primary[500]).toBe(`{${CORPORATE_PRIMARY}.500}`);
        expect(CORPORATE_TOKENS.semantic.primary[950]).toBe(`{${CORPORATE_PRIMARY}.950}`);
    });

    it('merges the corporate tokens over Aura', () => {
        const preset = CorporatePreset as { primitive?: { borderRadius?: { md?: string } } };

        expect(preset.primitive?.borderRadius?.md).toBe('4px');
    });
});
