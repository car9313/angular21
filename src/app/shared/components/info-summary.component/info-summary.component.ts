import { ChangeDetectionStrategy, Component, input, Input } from '@angular/core';
import { DevolucionObservation } from '../../../modules/devolution/devoluciones/domain/dtos/devolucion-observation.dto';
import { formatDateForDisplay, formatDateTimeForDisplay, formatTimeForDisplay } from '../../../core/helpers/date-mapper.helper';
@Component({
    selector: 'app-info-summary',
    standalone: true,
    templateUrl: './info-summary.component.html',
    styleUrl: './info-summary.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoSummaryComponent {
    observations = input<DevolucionObservation[]>([]);

    formatDate = formatDateForDisplay;
    formatDateTime = formatDateTimeForDisplay;
    formatTime = formatTimeForDisplay;

    prueba(dateTimeStr: string | null | undefined) {
        return formatDateTimeForDisplay(dateTimeStr);
    }
}
