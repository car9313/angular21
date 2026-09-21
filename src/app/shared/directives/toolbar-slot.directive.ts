// toolbar-slot.directive.ts
import { Directive } from '@angular/core';

@Directive({
    selector: '[appToolbarSlot]', // structural marker consumed by the toolbar
    standalone: true
})
export class ToolbarSlotDirective {}
