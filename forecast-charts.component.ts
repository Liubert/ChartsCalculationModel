import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { PeriodType } from './forecast.models';

interface ChartOptions {
    xAxisLabelEnabled: boolean;
    yAxisLabelEnabled: boolean;
    dataLabelEnabled: boolean;
    exportingEnabled: boolean;
    creditsEnabled: boolean;
    yAxisTitle: string;
}

@Component({
    selector: 'app-forecast-charts',
    template:`
        <div class="revenues-actuals-chart-holder" *ngIf="showCharts">
            <app-forecast-minimal-chart class="minimal-chart-wrapper"
            *ngIf="showMinimalChart"
                [viewSelected]="chartViewSelected"
                [monthlyOptions]="chartOptionsForMonthlyView"
                [yearlyOptions]="chartOptionsForYearlyView"
                [quaterlyOptions]="chartOptionsForQuaterlyView">
            </app-forecast-minimal-chart>
            <app-forecast-button-chart
                (click)="onButtonChartClick($event)"
                class="button-chart-wrapper"
                *ngIf="showButtonChart"
                [viewSelected]="chartViewSelected"
                [monthlyOptions]="chartOptionsForMonthlyView"
                [yearlyOptions]="chartOptionsForYearlyView"
                [quaterlyOptions]="chartOptionsForQuaterlyView"
            ></app-forecast-button-chart>
            <chart *ngIf="!showMinimalChart && !showButtonChart" style="width:100%;" [options]="chartOptionsForMonthlyView" [hidden]="chartViewSelected !== PERIOD_TYPE_OPTIONS.MONTHLY"></chart>
            <chart *ngIf="!showMinimalChart && !showButtonChart" style="width:100%;" [options]="chartOptionsForQuaterlyView" [hidden]="chartViewSelected !== PERIOD_TYPE_OPTIONS.QUARTERLY"></chart>
            <chart *ngIf="!showMinimalChart && !showButtonChart" style="width:100%;" [options]="chartOptionsForYearlyView" [hidden]="chartViewSelected !== PERIOD_TYPE_OPTIONS.YEARLY"></chart>
        </div>
    `,
    styleUrls: ['./forecast.component.scss']
})
export class ForecastChartsComponent implements OnInit {
    @Input() config: any = {};
    @Input() chartOptions: ChartOptions = null
    @Input() showMinimalChart: Boolean = false;
    @Input() showButtonChart: Boolean = false;
    @Output() click = new EventEmitter<MouseEvent>();
    showCharts: Boolean = false;
    chartOptionsForMonthlyView: any;
    chartOptionsForQuaterlyView: any;
    chartOptionsForYearlyView: any;
    chartViewSelected: PeriodType;
    PERIOD_TYPE_OPTIONS = PeriodType;
    constructor(){
    }
    onButtonChartClick($event: MouseEvent) {
        this.click.emit($event);
    }
    ngOnInit() {
        if (this.config.initialConfig) {
            this.showCharts = this.config.initialConfig.showCharts;
            this.chartOptionsForMonthlyView = this.config.initialConfig.chartOptionsForMonthlyView;
            this.chartOptionsForQuaterlyView = this.config.initialConfig.chartOptionsForQuaterlyView;
            this.chartOptionsForYearlyView = this.config.initialConfig.chartOptionsForYearlyView;
            this.chartViewSelected = this.config.initialConfig.chartViewSelected;
            this.fillOptions();
        }
        if (!this.config) {
            return;
        }
        this.config.loadConfig = (initialConfig:any) => {
            this.showCharts = initialConfig.showCharts;
            if (!this.showCharts)
                return;
            this.chartOptionsForMonthlyView = initialConfig.chartOptionsForMonthlyView;
            this.chartOptionsForQuaterlyView = initialConfig.chartOptionsForQuaterlyView;
            this.chartOptionsForYearlyView = initialConfig.chartOptionsForYearlyView;
            this.chartViewSelected = initialConfig.chartViewSelected;
            this.fillOptions();
        }
    }
    fillOptions() {
        if (this.chartOptions) {
            this.chartOptionsForMonthlyView.yAxis.labels.enabled = this.chartOptions.yAxisLabelEnabled;
            this.chartOptionsForMonthlyView.xAxis.labels.enabled = this.chartOptions.xAxisLabelEnabled;
            this.chartOptionsForMonthlyView.plotOptions.line.dataLabels.enabled = this.chartOptions.dataLabelEnabled;
            this.chartOptionsForMonthlyView.exporting.enabled = this.chartOptions.exportingEnabled;
            this.chartOptionsForMonthlyView.credits.enabled = this.chartOptions.creditsEnabled;
            this.chartOptionsForMonthlyView.yAxis.title = this.chartOptions.yAxisTitle == null ? {
                enabled: false
            } : this.chartOptionsForMonthlyView.yAxis.title;

            this.chartOptionsForQuaterlyView.yAxis.labels.enabled = this.chartOptions.yAxisLabelEnabled;
            this.chartOptionsForQuaterlyView.xAxis.labels.enabled = this.chartOptions.xAxisLabelEnabled;
            this.chartOptionsForQuaterlyView.plotOptions.line.dataLabels.enabled = this.chartOptions.dataLabelEnabled;
            this.chartOptionsForQuaterlyView.exporting.enabled = this.chartOptions.exportingEnabled;
            this.chartOptionsForQuaterlyView.credits.enabled = this.chartOptions.creditsEnabled;
            this.chartOptionsForQuaterlyView.yAxis.title = this.chartOptions.yAxisTitle == null ? {
                enabled: false
            } : this.chartOptionsForQuaterlyView.yAxis.title;

            this.chartOptionsForYearlyView.yAxis.labels.enabled = this.chartOptions.yAxisLabelEnabled;
            this.chartOptionsForYearlyView.xAxis.labels.enabled = this.chartOptions.xAxisLabelEnabled;
            this.chartOptionsForYearlyView.plotOptions.line.dataLabels.enabled = this.chartOptions.dataLabelEnabled;
            this.chartOptionsForYearlyView.exporting.enabled = this.chartOptions.exportingEnabled;
            this.chartOptionsForYearlyView.credits.enabled = this.chartOptions.creditsEnabled;
            this.chartOptionsForYearlyView.yAxis.title = this.chartOptions.yAxisTitle == null ? {
                enabled: false
            } : this.chartOptionsForYearlyView.yAxis.title;
        }
    }
}