// generic-chart.component.ts
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsCoreOption } from 'echarts/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

type ChartType = 'pie' | 'bar';

@Component({
    selector: 'app-generic-chart',
    standalone: true,
    imports: [NgxEchartsDirective, SelectModule, FormsModule],
    template: `
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-base font-semibold text-surface-900 dark:text-surface-0">{{ title }}</h3>
                    <p class="text-sm text-surface-500">{{ subtitle }}</p>
                </div>
                <p-select [options]="chartTypes" [(ngModel)]="selectedChartType" optionLabel="label" optionValue="value" [style]="{ width: '130px' }" (ngModelChange)="onChartTypeChange($event)" />
            </div>
            <div echarts [options]="chartOptions" class="solicitudes-chart"></div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericChartComponent implements OnChanges {
    // ----- Inputs de configuración -----
    @Input({ required: true }) data: unknown[] = [];
    @Input() labelKey = 'label';
    @Input() valueKey = 'value';
    @Input() colorMap: Record<string, string> = {};
    @Input() title = '';
    @Input() subtitle = '';
    @Input() tooltipLabel = 'Total';
    @Input() emptyMessage = 'Sin datos en el período seleccionado';

    // ----- Estado interno -----
    chartOptions: EChartsCoreOption = {};
    selectedChartType: ChartType = 'pie';

    readonly chartTypes: { label: string; value: ChartType }[] = [
        { label: 'Dona', value: 'pie' },
        { label: 'Barras', value: 'bar' }
    ];

    // ----- Ciclo de vida -----
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data']) {
            this.buildChart();
        }
    }

    onChartTypeChange(type: ChartType): void {
        this.selectedChartType = type;
        this.buildChart();
    }

    // ----- Lógica de construcción (parametrizada) -----
    private buildChart(): void {
        if (this.selectedChartType === 'bar') {
            this.buildBarChart();
        } else {
            this.buildPieChart();
        }
    }

    private buildPieChart(): void {
        const total = this.data.reduce((sum, item) => sum + this.getValue(item), 0);

        if (total === 0) {
            this.chartOptions = {
                title: {
                    text: this.emptyMessage,
                    left: 'center',
                    top: 'center',
                    textStyle: { fontSize: 13, fontWeight: 'normal', color: '#9CA3AF' }
                },
                series: [
                    {
                        name: this.tooltipLabel,
                        type: 'pie',
                        radius: ['45%', '72%'],
                        center: ['38%', '50%'],
                        data: [],
                        itemStyle: { color: '#F3F4F6' }
                    }
                ]
            };
            return;
        }

        const dataConValores = this.data.filter((item) => this.getValue(item) > 0);

        this.chartOptions = {
            title: {
                text: `${total}`,
                subtext: 'Total',
                left: '38%',
                top: 'center',
                textAlign: 'center',
                textStyle: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
                subtextStyle: { fontSize: 12, color: '#9CA3AF' },
                itemGap: 4
            },
            tooltip: {
                trigger: 'item',
                formatter: (params: unknown) => {
                    const p = params as { name: string; value: number; percent: number };
                    return `
          <strong>${p.name}</strong><br />
          ${this.tooltipLabel}: ${p.value}<br />
          Porcentaje: ${p.percent}%
        `;
                }
            },
            legend: {
                orient: 'vertical',
                right: 0,
                top: 'center',
                icon: 'circle',
                itemWidth: 10,
                itemHeight: 10,
                itemGap: 12,
                textStyle: { fontSize: 12 }
            },
            series: [
                {
                    name: this.tooltipLabel,
                    type: 'pie',
                    radius: ['45%', '72%'],
                    center: ['38%', '50%'],
                    selectedMode: 'single',
                    selectedOffset: 14,
                    avoidLabelOverlap: true,
                    data: dataConValores.map((item, index) => ({
                        value: this.getValue(item),
                        name: this.getLabel(item),
                        selected: index === 0,
                        itemStyle: { color: this.getColor(this.getLabel(item)) }
                    })),
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: (params: unknown) => {
                            const p = params as { value: number; percent: number };
                            return `{value|${p.value}}\n{percent|${p.percent}%}`;
                        },
                        rich: {
                            value: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', lineHeight: 18 },
                            percent: { color: '#ffffff', fontSize: 11, lineHeight: 14 }
                        }
                    },
                    labelLine: { show: false },
                    itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
                    emphasis: {
                        scale: true,
                        scaleSize: 8,
                        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' }
                    },
                    animationType: 'scale',
                    animationEasing: 'elasticOut',
                    animationDuration: 800
                }
            ]
        };
    }

    private buildBarChart(): void {
        const data = this.data.filter((item) => this.getValue(item) > 0);

        // Si no hay datos, mostrar mensaje
        if (data.length === 0) {
            this.chartOptions = {
                title: {
                    text: this.emptyMessage,
                    left: 'center',
                    top: 'center',
                    textStyle: { fontSize: 13, fontWeight: 'normal', color: '#9CA3AF' }
                },
                // Opcional: configurar ejes vacíos para evitar errores
                xAxis: { type: 'category', data: [] },
                yAxis: { type: 'value' },
                series: [{ type: 'bar', data: [] }]
            };
            return;
        }

        this.chartOptions = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params: unknown) => {
                    const items = params as { name: string; value: number }[];
                    const item = items[0];
                    return `<strong>${item.name}</strong><br />${this.tooltipLabel}: ${item.value}`;
                }
            },
            grid: {
                left: 20,
                right: 20,
                top: 30,
                bottom: 70,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map((item) => this.getLabel(item)),
                axisLabel: { interval: 0, rotate: 25, fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                minInterval: 1,
                name: this.tooltipLabel
            },
            series: [
                {
                    name: this.tooltipLabel,
                    type: 'bar',
                    data: data.map((item) => ({
                        value: this.getValue(item),
                        itemStyle: {
                            color: this.getColor(this.getLabel(item)),
                            borderRadius: [6, 6, 0, 0]
                        }
                    })),
                    barMaxWidth: 45,
                    label: {
                        show: true,
                        position: 'top',
                        fontSize: 12,
                        fontWeight: 'bold'
                    },
                    emphasis: { focus: 'series' },
                    animationDuration: 800
                }
            ]
        };
    }

    // ----- Métodos auxiliares (usando los inputs) -----
    private getValue(item: unknown): number {
        const value = (item as Record<string, unknown>)[this.valueKey];

        return typeof value === 'number' ? value : 0;
    }

    private getLabel(item: unknown): string {
        const label = (item as Record<string, unknown>)[this.labelKey];

        return typeof label === 'string' ? label : '';
    }

    private getColor(label: string): string {
        return this.colorMap[label] ?? '#9CA3AF';
    }
}
