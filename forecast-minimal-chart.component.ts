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
    selector: 'app-forecast-minimal-chart',
    template: `
        <div class="revenues-minimal-chart-holder" [attr.id]="id">
        </div>
    `,
    styleUrls: ['./forecast.component.scss']
})
export class ForecastMinimalChartComponent implements AfterViewInit, OnChanges {
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
                const svgHolderHeight = svgHolderProps.height;
                svgHolder.innerHTML = svgElem;
                setTimeout(() => {
                    const svg = document.getElementById(this.svgId);
                    if (!svg)
                        return;
                    const svgContainer = d3.select(svg);
                    svgContainer.empty();
                    svgContainer.attr('width', svgHolderWidth);
                    svgContainer.attr('height', svgHolderHeight)
                    const workingHeight = svgHolderHeight - 15;
                    const workingWidth = svgHolderWidth - 15;
                    const yAxisPoints = [
                        [1, 0],
                        [1, workingHeight / 2],
                        [1, workingHeight]
                    ];
                    const xAxisPoints = [
                        [1, workingHeight],
                        [1 + (workingWidth / 2), workingHeight],
                        [workingWidth, workingHeight]
                    ];
                    const xAxis = svgContainer.append('path')
                        .data([xAxisPoints])
                        .attr('d', d3.line().curve(d3.curveLinear))
                        .attr('stroke-width', 1)
                        .attr('stroke', '#C0C0C0')
                        .attr('stroke-dasharray', '4,2')
                        .attr('fill', 'none');
                    const yAxis = svgContainer.append('path')
                        .data([yAxisPoints])
                        .attr('d', d3.line().curve(d3.curveLinear))
                        .attr('stroke-width', 1)
                        .attr('stroke', '#C0C0C0')
                        .attr('stroke-dasharray', '4,2')
                        .attr('fill', 'none');
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
                        const gap = Math.floor(workingWidth / (data.length));
                        const vertGap = workingHeight / max;
                        let i = 0, index = 1;
                        while (i < data.length) {
                            const x = index;
                            const y = max !== 0 ? Math.floor(vertGap * data[i]) : 0;
                            points.push([index, workingHeight - (y * 0.9)]);
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
                    const originMaxYText = svgContainer.append('text')
                        .attr('class', 'minimal-chart-text')
                        .attr('x', yAxisPoints[0][0] + 8)
                        .attr('y', yAxisPoints[0][1] + 15)
                        .attr('fill', '#333333')
                        .attr('text-anchor', 'start')
                        .text(this.currencyDelimitedWithCommaPipe.transform(max));
                    (originMaxYText.node() as HTMLElement).style.fontWeight = 'bold';
                    (originMaxYText.node() as HTMLElement).style.fontSize = '11px';
                    const originMaxXText = svgContainer.append('text')
                        .attr('class', 'minimal-chart-text')
                        .attr('x', workingWidth / 2)
                        .attr('y', yAxisPoints[2][1] + 15)
                        .attr('fill', '#333333')
                        .attr('text-anchor', 'middle')
                        .text(options.title);
                    (originMaxXText.node() as HTMLElement).style.fontWeight = 'bold';
                    (originMaxXText.node() as HTMLElement).style.fontSize = '11px';
                }, 30);
            }
        }, 10);
    }
}