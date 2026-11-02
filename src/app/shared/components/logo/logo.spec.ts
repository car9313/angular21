import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { Logo } from './logo';

describe('Logo', () => {
    let fixture: ComponentFixture<Logo>;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [Logo] });
        fixture = TestBed.createComponent(Logo);
        fixture.detectChanges();
    });

    it('renders the brand svg', () => {
        const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

        expect(svg).toBeTruthy();
        expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
    });
});
