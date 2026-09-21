import * as echarts from 'echarts/core';

import { BarChart, PieChart } from 'echarts/charts';

import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';

import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
    // Charts
    PieChart,
    BarChart,

    // Components
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    GridComponent,

    // Features
    LabelLayout,

    // Renderer
    CanvasRenderer
]);

export default echarts;
