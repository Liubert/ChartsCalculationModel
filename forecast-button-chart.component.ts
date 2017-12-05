import { Component, Input, OnInit, OnDestroy, AfterViewInit, OnChanges } from '@angular/core';
import { PeriodType } from './forecast.models';
import * as d3 from 'd3';
import { CurrencyDelimitedWithCommaPipe } from '../pipes/currency-delimited.pipe';

interface ChartOptions {
    xAxisLabelEnabled: boolean;
    yAxisLabelEnabled: boolean;
    dataLabelEnabled: boolean;
    exportingEnabled: boolean;
    creditsEnabled: boolean;
    yAxisTitle: string;
    series: any;
    title: any;
}

@Component({
    selector: 'app-forecast-button-chart',
    template: `
        <div class="revenues-button-chart-holder" [attr.id]="id">
        </div>
    `,
    styleUrls: ['./forecast.component.scss']
})
export class ForecastButtonChartComponent implements AfterViewInit, OnChanges {
    @Input() viewSelected: PeriodType = null;
    @Input() monthlyOptions: ChartOptions = null;
    @Input() yearlyOptions: ChartOptions = null;
    @Input() quaterlyOptions: ChartOptions = null;
    private currencyDelimitedWithCommaPipe: CurrencyDelimitedWithCommaPipe = new CurrencyDelimitedWithCommaPipe();
    PERIOD_TYPE_OPTIONS = PeriodType;
    id: string = '';
    svgId: string = '';
    constructor() {
        this.id = Math.floor(Math.random() * 10000).toString() + '_chartHolder';
    }
    ngOnChanges() {
        this.draw();
    }
    ngAfterViewInit() {
        this.draw();
    }
    draw() {
        setTimeout(() => {
            this.svgId = Math.floor(Math.random() * 10000).toString() + '_svg';
            const svgElem = '<svg xmlns="http://www.w3.org/2000/svg" id="' + this.svgId + '"></svg>';
            const svgHolder = document.getElementById(this.id);
            if (svgHolder) {
                const svgHolderProps: ClientRect = svgHolder.getBoundingClientRect();
                const svgHolderWidth = svgHolderProps.width;
                const svgHolderHeight = svgHolderProps.height - 6;
                svgHolder.innerHTML = svgElem;
                setTimeout(() => {
                    const svg = document.getElementById(this.svgId);
                    if (!svg)
                        return;
                    const svgContainer = d3.select(svg);
                    svgContainer.empty();
                    svgContainer.attr('width', svgHolderWidth);
                    svgContainer.attr('height', svgHolderHeight)
                    const workingHeight = svgHolderHeight;
                    const workingWidth = svgHolderWidth;
                    const svgProps: ClientRect = svg.getBoundingClientRect();
                    const points: any[] = [];
                    let options: ChartOptions = null;
                    if (this.viewSelected === PeriodType.MONTHLY) {
                        options = this.monthlyOptions;
                    } else if (this.viewSelected === PeriodType.QUARTERLY) {
                        options = this.quaterlyOptions;
                    } else if (this.viewSelected === PeriodType.YEARLY) {
                        options = this.yearlyOptions;
                    }
                    const data = options.series[0].data;
                    const max = Math.max.call(this, ...data);
                    if (data.length > 0) {
                        const gap = Math.floor(workingWidth / (data.length - 2));
                        const vertGap = workingHeight / max;
                        let i = 0, index = 10;
                        while (i < data.length) {
                            const x = index;
                            const y = max !== 0 ? Math.floor(vertGap * data[i]) : 0;
                            points.push([index, workingHeight - (y * 1)]);
                            index = index + gap;
                            i = i + 1;
                        }
                    }
                    const curve = svgContainer.append('path')
                        .data([points])
                        .attr('d', d3.line().curve(d3.curveNatural))
                        .attr('stroke-width', 2)
                        .attr('stroke', '#7cb5ec')
                        .attr('fill', 'none')
                }, 30);
            }
        }, 10);
    }
}