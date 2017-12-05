import { Component, AfterViewInit, Input, HostListener, OnInit, Output, EventEmitter } from '@angular/core';
import {
    SAMPLE,
    GrowthType,
    PeriodType,
    ForecastYear,
    ForecastUnitModel,
    ViewOption,
    MONTHNAMES
} from './forecast.models';
import { ChartsHelper } from './forecast.helper';
import { NewGuid } from '../shared/common-types.component';
import { BrowserDetect } from '../shared/common-methods.component';

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

@Component({
    selector: 'app-forecast',
    templateUrl: './forecast.component.html',
    styleUrls: ['./forecast.component.scss']
})
export class ForecastComponent implements AfterViewInit, OnInit {

    isManual = false;
    rows: any[] = SAMPLE;
    startDateStr: string;
    endDateStr: string;
    forecastStartDateStr: string;
    forecastEndDateStr: string;
    startValue: number;
    growth: number;
    growthType: GrowthType;
    growthPeriod: PeriodType;
    containerId: string;
    splitSideBySide = false;

    manualStartValue: number;
    manualGrowthType: GrowthType;
    manualGrowth: number;
    manualApplyAcross: PeriodType = PeriodType.MONTHLY;
    manualCurrentRowYear: number;
    manualYearsAvailable: { label: string, value: number }[];
    manualYearOptionSelected: number;
    manualStartMonthValue: number;
    manualStartYearValue: number;
    manualEndMonthValue: number;
    manualEndYearValue: number;

    showSliderMenu = false;
    chartOptionsForMonthlyView = null;
    chartOptionsForQuaterlyView = null;
    chartOptionsForYearlyView = null;

    showCharts = false;
    showChartsNow = false;
    disableCharts = false;
    chartsConfig: any = {};
    isSafariBrowser:Boolean = false;

    showMsg: Boolean = false;
    forecastAlertMsg = 'Your changes have been commited locally.';

    @Input() hideManual = false;
    @Input() config: any = {};
    @Input() waitForInitialData = false;
    @Input() loadInManualMode = false;
    @Input() dataEntryMode = false;
    @Output() dataForSave = new EventEmitter(false);
    @Input() enableAltLabels: Boolean = false;

    viewOptions = [
        {
            value: ViewOption.RESULTS,
            label: 'Values'
        }, {
            value: ViewOption.INCREMENTS,
            label: 'Increments'
        }, {
            value: ViewOption.PERCENT,
            label: 'Percent'
        }
    ];
    editViewOptions = this.viewOptions;
    growthPeriodOptions = [
        {
            value: PeriodType.MONTHLY,
            label: 'Monthly'
        }, {
            value: PeriodType.QUARTERLY,
            label: 'Quarterly'
        }, {
            value: PeriodType.YEARLY,
            label: 'Yearly'
        }
    ];
    growthTypeOptions = [
        {
            value: GrowthType.ABSOLUTE,
            label: 'Absolute'
        }, {
            value: GrowthType.PERCENT,
            label: 'Percent'
        }
    ];

    viewSelected = ViewOption.RESULTS;
    chartViewSelected = PeriodType.MONTHLY;
    editViewSelected = ViewOption.RESULTS;

    VIEW_OPTIONS = ViewOption;
    PERIOD_TYPE_OPTIONS = PeriodType;
    GROWTH_TYPE_OPTIONS = GrowthType;

    private startDate: Date;
    private endDate: Date;

    private forecastStartDate: Date;
    private forecastEndDate: Date;

    forecastYears: ForecastYear[] = [];

    constructor() {
        this.isSafariBrowser = BrowserDetect.isSafari();
        this.forecastYears = [];
        this.startValue = 0;
        this.startDateStr = '2016/01/15';
        this.endDateStr = '2021/12/15';
        this.forecastStartDateStr = '2017/01/15';
        this.forecastEndDateStr = '2022/01/15';
        this.growth = 0;
        this.growthType = GrowthType.PERCENT;
        this.growthPeriod = PeriodType.MONTHLY;
        this.manualGrowth = 0;
        this.manualGrowthType = GrowthType.ABSOLUTE;
        this.manualStartValue = 0;
        this.containerId = NewGuid();
    }
    // temp comment for prod build
    @HostListener('window:resize')
    resizeComponent() {
        setTimeout(() => {
            let elem = document.getElementById(this.containerId);
            if (elem) {
                let props: ClientRect = elem.getBoundingClientRect();
                if (props.width > 1200) {
                    this.splitSideBySide = this.disableCharts === false ? true : false;
                } else {
                    this.splitSideBySide = false;
                }
            }
            this.processForMaps();
        }, 500);
    }

    ngAfterViewInit() {
        this.resizeComponent();
    }

    ngOnInit() {
        this.showCharts = false;
        this.isManual = this.loadInManualMode;
        this.editViewSelected = ViewOption.RESULTS;
        this.manualStartMonthValue = 1;
        this.manualEndMonthValue = 12;
        if (this.config.initialConfig) {
            this.manualStartValue = this.startValue = this.config.initialConfig.startValue || 0;
            this.manualGrowth = this.growth = this.config.initialConfig.growth || 0;
            this.manualGrowthType = this.growthType = this.config.initialConfig.growthType || GrowthType.ABSOLUTE;
            this.chartViewSelected = this.growthPeriod = this.config.initialConfig.growthPeriod || PeriodType.MONTHLY;
            this.startDateStr = this.config.initialConfig.startDate || this.getDefaultStartDateStr();
            this.endDateStr = this.config.initialConfig.endDate || this.getDefaultEndDateStr();
            this.forecastStartDateStr = this.config.initialConfig.forecastStartDate || this.getDefaultStartDateStr();
            this.forecastEndDateStr = this.config.initialConfig.forecastEndDate || this.getDefaultEndDateStr();
            this.chartViewSelected = PeriodType.MONTHLY;
            this.disableCharts = this.config.initialConfig.disableCharts || false;
            // Adding the below line to be default load manual mode withoyt any data
            // as loadInManualModeWidget could not be used because of line 266
            this.isManual = this.config.initialConfig.manual;
        } else {
            this.chartViewSelected = PeriodType.MONTHLY;
        }
        if (this.hideManual) {
            this.isManual = false;
        } else {
            this.isManual = this.loadInManualMode;
            // Adding the below snippet to be default load manual mode withoyt any data
            // as loadInManualModeWidget could not be used because of line 266
            if (this.config.initialConfig) {
                this.isManual = this.config.initialConfig.manual;
            }
        }
        this.process(false);
        setTimeout(() => {
            this.showChartsNow = this.showCharts || true;
        }, 100);
        if (!this.config) {
            return;
        }
        this.config.loadInitialManualConfig = (initialConfig: any) => {
            this.manualStartValue = this.startValue = initialConfig.startValue || 0;
            this.manualGrowth = this.growth = initialConfig.growth || 0;
            this.manualGrowthType = this.growthType = initialConfig.growthType || GrowthType.ABSOLUTE;
            this.chartViewSelected = this.growthPeriod = initialConfig.growthPeriod || PeriodType.MONTHLY;
            this.startDateStr = initialConfig.startDate || this.getDefaultStartDateStr();
            this.endDateStr = initialConfig.endDate || this.getDefaultEndDateStr();
            this.forecastStartDateStr = initialConfig.forecastStartDate || this.getDefaultStartDateStr();
            this.forecastEndDateStr = initialConfig.forecastEndDate || this.getDefaultEndDateStr();
            this.disableCharts = initialConfig.disableCharts || false;
            this.process(false);
            this.chartViewSelected = PeriodType.MONTHLY;
        }
        this.config.loadPeriod = (period: PeriodType) => {
            this.chartViewSelected = period;
        }
        this.config.loadView = (view: ViewOption) => {
            this.viewSelected = view;
        }
        this.config.showCharts = () => {
            if (this.disableCharts)
                return;
            this.showCharts = true;
            setTimeout(() => {
                this.showChartsNow = this.showCharts;
            }, 100);
        }
        this.config.enableManualMode = () => {
            this.isManual = true;
        }
        this.config.disableManualMode = () => {
            this.isManual = false;
        }
        this.config.loadManualData = (SAMPLE) => {
            this.onXlsDataAvailable(SAMPLE);
            this.saveManualData();
            this.processForMaps();
        }
        this.config.getManualDataEntry = () => {
            let manualData = [];
            this.forecastYears.forEach((year: ForecastYear) => {
                let data = { 'year': year.YEAR, data: [] };
                data.data = year.MONTHS.map((model: ForecastUnitModel) => {
                    return model.MANUAL_VALUE;
                });
                manualData.push(data);
            });
            return manualData;
        };

        this.config.getDataEntryForSave = (convertToPercent?) => {
            let manualData = {};
            this.forecastYears.forEach((year: ForecastYear) => {
                year.MONTHS.forEach((model: ForecastUnitModel, index) => {
                    let month;
                    let currentIndex = Number(index) + 1;
                    if (currentIndex < 10) {
                        month = '0' + currentIndex;
                    } else {
                        month = currentIndex.toString();
                    }
                  if(convertToPercent){
                    manualData[year.YEAR + "/" + month] = (Number(model.MANUAL_VALUE) / 100).toString();
                   }else {
                    manualData[year.YEAR + "/" + month] = model.MANUAL_VALUE;
                  }
                  });
            });
            return manualData;
        };


      this.config.getGenericMonthDataEntryForSave = (convertToPercent?) => {
        let manualData = {};
        let month:number = 1;
        this.forecastYears.forEach((year: ForecastYear) => {
          year.MONTHS.forEach((model: ForecastUnitModel) => {
            if(convertToPercent){
              manualData[`MONTH${month}`] = Number(model.MANUAL_VALUE) / 100;
            }else {
              manualData[`MONTH${month}`] = model.MANUAL_VALUE;
            }
            month++
          });
        });
        return manualData;
      };


        this.config.getManualDataEntryForQuarter = () => {
            let manualData = {};
            this.forecastYears.forEach((year: ForecastYear) => {
                manualData[year.YEAR] = {};
                year.QUARTERS.forEach((model: ForecastUnitModel, index) => {
                    manualData[year.YEAR]['QUARTER' + (Number(index) + 1)] = model.MANUAL_VALUE;
                });
            });
            return manualData;
        };

        this.config.getManualDataEntryForYear = () => {
            let manualData = {};
            this.forecastYears.forEach((year: ForecastYear) => {
                manualData[year.YEAR] = year.MANUAL_VALUE;
            });
            return manualData;
        };

        if (this.loadInManualMode) {
            this.config.loadManualData(this.config.initialConfig.revenues)
        }

    }

    init() {
        this.forecastYears = [];
        this.startDate = new Date(this.startDateStr);
        this.endDate = new Date(this.endDateStr);
        this.forecastStartDate = new Date(this.forecastStartDateStr);
        this.forecastStartDate.setMonth(0);
        this.forecastStartDate.setDate(1);
        this.forecastEndDate = new Date(this.forecastEndDateStr);
        this.forecastEndDate.setMonth(11);
        this.forecastEndDate.setDate(15);
        this.manualStartMonthValue = 1;
        this.manualStartYearValue = this.forecastStartDate.getFullYear();
        this.manualEndMonthValue = 12;
        this.manualEndYearValue = this.forecastEndDate.getFullYear();
    }

    processForTimePeriod() {
        let proceed = true;
        const start: Date = new Date(this.forecastStartDate);
        const monthModels: ForecastUnitModel[] = [];
        while (proceed) {
            const model = new ForecastUnitModel(start.getMonth(), start.getFullYear());
            monthModels.push(model);
            start.setMonth(start.getMonth() + 1);
            if (start < this.forecastEndDate) {
                proceed = true;
            } else {
                proceed = false;
            }
        }
        const years = monthModels.map((item: ForecastUnitModel) => {
            return item.YEAR;
        }).filter(onlyUnique);
        let MONTH_INDEXER: number = 0;
        let QUARTER_INDEXER: number = 0;
        let START_QUARTER_INCREMENT = false;
        let YEAR_INDEXER: number = 0;
        let START_YEAR_INCREMENT = false;
        years.forEach((year: number, yearIndex: number) => {
            const fy = new ForecastYear();
            fy.ALT_LABEL = 'YEAR ' + (yearIndex + 1);
            fy.YEAR = year;
            fy.MONTHS = monthModels.filter((item: ForecastUnitModel) => {
                return item.YEAR === year;
            });
            fy
                .MONTHS
                .sort((a: ForecastUnitModel, b: ForecastUnitModel) => {
                    return a.MONTH - b.MONTH;
                });
            fy
                .MONTHS
                .forEach((month: ForecastUnitModel) => {
                    month.ITER_INDEX_MONTH = MONTH_INDEXER;
                    month.ITER_INDEX_YEAR = Math.ceil((MONTH_INDEXER + 1) / 12);
                    MONTH_INDEXER++;
                    if (month.MONTH === this.startDate.getMonth() && month.YEAR === this.startDate.getFullYear()) {
                        START_QUARTER_INCREMENT = true;
                        START_YEAR_INCREMENT = true;
                    }
                    if (START_QUARTER_INCREMENT) {
                        month.ITER_INDEX_QUARTER = Math.ceil((QUARTER_INDEXER + 1) / 3);
                        QUARTER_INDEXER++;
                    }
                    if (START_YEAR_INCREMENT) {
                        month.ITER_INDEX_YEAR = Math.ceil((YEAR_INDEXER + 1) / 12);
                        YEAR_INDEXER++;
                    }
                });
            this
                .forecastYears
                .push(fy);
        });
    }

    calculate() {
        let monthModels: ForecastUnitModel[] = [];
        this
            .forecastYears
            .forEach((year: ForecastYear) => {
                monthModels = monthModels.concat(year.MONTHS);
            });
        let lastValue: number = 0;
        let startCursor = monthModels.find((model: ForecastUnitModel) => {
            return model.MONTH === this.startDate.getMonth() && model.YEAR === this.startDate.getFullYear();
        });
        if (!startCursor && monthModels.length > 0) {
            if (this.startDate.getFullYear() < monthModels[0].YEAR
                || (this.startDate.getFullYear() === monthModels[0].YEAR && this.startDate.getMonth() < monthModels[0].MONTH)) {
                startCursor = monthModels[0];
            }
        }
        let endCursor = monthModels.find((model: ForecastUnitModel) => {
            return model.MONTH === this.endDate.getMonth() && model.YEAR === this.endDate.getFullYear();
        });
        if (!endCursor && monthModels.length > 0) {
            if (this.endDate.getFullYear() > monthModels[monthModels.length - 1].YEAR
                || (this.endDate.getFullYear() === monthModels[monthModels.length - 1].YEAR && this.endDate.getMonth() > monthModels[monthModels.length - 1].MONTH)) {
                endCursor = monthModels[monthModels.length - 1];
            }
        }
        if (!startCursor || !endCursor) {
            return;
        }
        if (this.growthPeriod === PeriodType.MONTHLY) {
            let cursor = startCursor.ITER_INDEX_MONTH;
            let lastIncrement = 0;
            while (cursor < monthModels.length) {
                if (cursor === startCursor.ITER_INDEX_MONTH) {
                    monthModels[cursor].VALUE = this.startValue;
                    lastValue = monthModels[cursor].VALUE;
                } else {
                    if (cursor > startCursor.ITER_INDEX_MONTH && cursor <= endCursor.ITER_INDEX_MONTH) {
                        if (this.growthType === GrowthType.ABSOLUTE) {
                            monthModels[cursor].INCREMENT = this.growth;
                        } else {
                            monthModels[cursor].INCREMENT = ((lastValue * this.growth) / 100);
                        }
                        // monthModels[cursor].INCREMENT_PERCENT = this.growth;
                    }
                    let aggregate = true;
                    if (this.config && this.config.initialConfig && this.config.initialConfig.stopAggregationAfterEndDate) {
                        if (cursor > endCursor.ITER_INDEX_MONTH) {
                            aggregate = false;
                        }
                    }
                    if (aggregate) {
                        monthModels[cursor].VALUE = lastValue + monthModels[cursor].INCREMENT;
                        monthModels[cursor].INCREMENT_PERCENT = lastValue === 0 ? 0 : ((monthModels[cursor].VALUE / lastValue) - 1) * 100;
                        monthModels[cursor].VALUE = this.roundValue(monthModels[cursor].VALUE);
                        monthModels[cursor].INCREMENT = this.roundValue(monthModels[cursor].INCREMENT);
                        monthModels[cursor].INCREMENT_PERCENT = this.roundValue(monthModels[cursor].INCREMENT_PERCENT);
                        lastValue = monthModels[cursor].VALUE;
                        lastIncrement = monthModels[cursor].INCREMENT;
                    }
                }
                cursor = cursor + 1;
            }
        } else if (this.growthPeriod === PeriodType.QUARTERLY) {
            let cursor = startCursor.ITER_INDEX_MONTH;
            while (cursor < monthModels.length) {
                const currentModel = monthModels[cursor];
                if (currentModel.ITER_INDEX_QUARTER === startCursor.ITER_INDEX_QUARTER) {
                    monthModels[cursor].VALUE = currentModel.ITER_INDEX_MONTH >= startCursor.ITER_INDEX_MONTH
                        ? this.startValue
                        : monthModels[cursor].VALUE;
                    lastValue = monthModels[cursor].VALUE;
                } else {
                    if (currentModel.ITER_INDEX_QUARTER > startCursor.ITER_INDEX_QUARTER && currentModel.ITER_INDEX_QUARTER <= endCursor.ITER_INDEX_QUARTER) {
                        if (currentModel.ITER_INDEX_MONTH <= endCursor.ITER_INDEX_MONTH) {
                            if ((monthModels[cursor].ITER_INDEX_MONTH) % 3 === (this.startDate.getMonth() % 3)) {
                                if (this.growthType === GrowthType.ABSOLUTE) {
                                    monthModels[cursor].INCREMENT = this.growth;
                                } else {
                                    monthModels[cursor].INCREMENT = ((lastValue * this.growth) / 100);
                                }
                            }
                        }
                    }
                    monthModels[cursor].VALUE = lastValue + monthModels[cursor].INCREMENT;
                    monthModels[cursor].INCREMENT_PERCENT = ((monthModels[cursor].VALUE - lastValue) / lastValue) * 100;
                    monthModels[cursor].VALUE = this.roundValue(monthModels[cursor].VALUE);
                    monthModels[cursor].INCREMENT = this.roundValue(monthModels[cursor].INCREMENT);
                    monthModels[cursor].INCREMENT_PERCENT = this.roundValue(monthModels[cursor].INCREMENT_PERCENT);
                    lastValue = monthModels[cursor].VALUE;
                }
                cursor = cursor + 1;
            }
        } else {
            let cursor = startCursor.ITER_INDEX_MONTH;
            while (cursor < monthModels.length) {
                const currentModel = monthModels[cursor];
                if (currentModel.ITER_INDEX_YEAR === startCursor.ITER_INDEX_YEAR) {
                    monthModels[cursor].VALUE = currentModel.ITER_INDEX_YEAR >= startCursor.ITER_INDEX_YEAR
                        ? this.startValue
                        : monthModels[cursor].VALUE;
                    lastValue = monthModels[cursor].VALUE;
                } else {
                    if (currentModel.ITER_INDEX_YEAR > startCursor.ITER_INDEX_YEAR && currentModel.ITER_INDEX_YEAR <= endCursor.ITER_INDEX_YEAR) {
                        if (currentModel.ITER_INDEX_MONTH <= endCursor.ITER_INDEX_MONTH) {
                            if ((monthModels[cursor].ITER_INDEX_MONTH) % 12 === (this.startDate.getMonth() % 12)) {
                                if (this.growthType === GrowthType.ABSOLUTE) {
                                    monthModels[cursor].INCREMENT = this.growth;
                                } else {
                                    monthModels[cursor].INCREMENT = ((lastValue * this.growth) / 100);
                                }
                            }
                        }
                    }
                    monthModels[cursor].VALUE = lastValue + monthModels[cursor].INCREMENT;
                    monthModels[cursor].INCREMENT_PERCENT = ((monthModels[cursor].VALUE - lastValue) / lastValue) * 100;
                    monthModels[cursor].INCREMENT_PERCENT = this.roundValue(monthModels[cursor].INCREMENT_PERCENT);
                    monthModels[cursor].VALUE = this.roundValue(monthModels[cursor].VALUE);
                    monthModels[cursor].INCREMENT = this.roundValue(monthModels[cursor].INCREMENT);
                    lastValue = monthModels[cursor].VALUE;
                }
                cursor = cursor + 1;
            }
        }
    }

    processForQuarterData() {
        let lastValue = 0;
        this
            .forecastYears
            .forEach((year: ForecastYear) => {
                year.QUARTERS = [];
                [1, 2, 3, 4].forEach((quarter: number, index: number) => {
                    const model = new ForecastUnitModel(quarter, year.YEAR);
                    model.LABEL = 'Q' + (index + 1);
                    let quarterMultiplier = 3;
                    model.VALUE = year
                        .MONTHS
                        .filter((monthModel: ForecastUnitModel) => {
                            return monthModel.MONTH >= ((quarter - 1) * 3) && monthModel.MONTH < (quarter * 3);
                        })
                        .reduce((previousValue: number, currentValue: ForecastUnitModel): number => {
                            return previousValue + currentValue.VALUE;
                        }, 0);
                    model.INCREMENT = model.VALUE - lastValue;
                    model.INCREMENT_PERCENT = year
                        .MONTHS
                        .filter((monthModel: ForecastUnitModel) => {
                            return monthModel.MONTH >= ((quarter - 1) * 3) && monthModel.MONTH < (quarter * 3);
                        })
                        .reduce((previousValue: number, currentValue: ForecastUnitModel): number => {
                            return previousValue * (1 + (currentValue.INCREMENT_PERCENT / 100));
                        }, 1);
                    model.INCREMENT_PERCENT = (model.INCREMENT_PERCENT - 1) * 100;
                    model.INCREMENT_PERCENT = this.roundValue(model.INCREMENT_PERCENT);
                    model.INCREMENT = this.roundValue(model.INCREMENT);
                    model.VALUE = this.roundValue(model.VALUE);
                    lastValue = model.VALUE;
                    year
                        .QUARTERS
                        .push(model);
                });
            });
    }

    processForYearlyData() {
        this.startValue = this.manualStartValue;
        let lastValue = 0;
        this
            .forecastYears
            .forEach((year: ForecastYear) => {
                year.VALUE = year
                    .MONTHS
                    .reduce((previousValue: number, currentValue: ForecastUnitModel): number => {
                        return previousValue + currentValue.VALUE;
                    }, 0);
                year.INCREMENT = year.VALUE - lastValue;
                year.INCREMENT_PERCENT = year
                    .MONTHS
                    .reduce((previousValue: number, currentValue: ForecastUnitModel): number => {
                        return previousValue * (1 + (currentValue.INCREMENT_PERCENT / 100));
                    }, 1);
                year.INCREMENT_PERCENT = (year.INCREMENT_PERCENT - 1) * 100;
                year.INCREMENT_PERCENT = this.roundValue(year.INCREMENT_PERCENT);
                year.INCREMENT = this.roundValue(year.INCREMENT);
                year.VALUE = this.roundValue(year.VALUE);
                lastValue = year.VALUE;
            });
        this.forecastYears.forEach((year: ForecastYear) => {
            year.MANUAL_INCREMENT = year.INCREMENT;
            year.MANUAL_INCREMENT_PERCENT = year.INCREMENT_PERCENT;
            year.MANUAL_VALUE = year.VALUE;
            year.MONTHS.forEach((model: ForecastUnitModel) => {
                model.MANUAL_INCREMENT = model.INCREMENT;
                model.MANUAL_INCREMENT_PERCENT = model.INCREMENT_PERCENT;
                model.MANUAL_VALUE = model.VALUE;
            });
            year.QUARTERS.forEach((model: ForecastUnitModel) => {
                model.MANUAL_INCREMENT = model.INCREMENT;
                model.MANUAL_INCREMENT_PERCENT = model.INCREMENT_PERCENT;
                model.MANUAL_VALUE = model.VALUE;
            });
            this.manualStartValue = this.startValue;
        });
    }

    onXlsFileContentUpdate($event) {
        const rows: any[] = $event[0].data;
        this.onXlsDataAvailable(rows);
    }

    onXlsDataAvailable(rows: any) {
        if (rows) {
            // let lastValue = rows[0]['JAN'] || 0;
            let lastValue;
           if(rows.length > 0) {
             for (let i = 0; i < MONTHNAMES.length; i++) {
               if (rows[0][MONTHNAMES[i]]) {
                 lastValue = rows[0][MONTHNAMES[i]];
                 break;
               }
             }
           }else{
             lastValue = 0;
           }
          (rows as Array<any>).forEach((row: any) => {
                MONTHNAMES.forEach((_month) => {
                    if (typeof row[_month] !== 'number') {
                        row[_month] = row[_month] ?  parseFloat(row[_month]) : 0;
                    }
                });
            });
            if (this.editViewSelected === ViewOption.RESULTS) {
                this.manualStartValue = lastValue;
            }
            this
                .forecastYears
                .forEach((year: ForecastYear) => {
                    const row = rows.find((item: any) => {
                        return parseInt(item.YEAR) === year.YEAR;
                    });
                    if (row) {
                        year
                            .MONTHS
                            .forEach((model: ForecastUnitModel) => {
                                if (this.editViewSelected === ViewOption.RESULTS) {
                                    model.MANUAL_VALUE = parseFloat(row[MONTHNAMES[model.MONTH]]);
                                } else if (this.editViewSelected === ViewOption.INCREMENTS) {
                                    model.MANUAL_INCREMENT = parseFloat(row[MONTHNAMES[model.MONTH]]);
                                } else {
                                    model.MANUAL_INCREMENT_PERCENT = parseFloat(row[MONTHNAMES[model.MONTH]]);
                                }
                            });
                    }
                });
        }
        this.saveManualData();
        this.processForMaps();
    }

    saveManualData() {
        if (this.chartViewSelected === PeriodType.MONTHLY) {
            if (typeof this.manualStartValue !== 'number') {
                this.manualStartValue = parseFloat(this.manualStartValue);
            }
            let lastValue = this.manualStartValue;
            this
                .forecastYears
                .forEach((year: ForecastYear, yearIndex: number) => {
                    year
                        .MONTHS
                        .forEach((model: ForecastUnitModel, monthIndex: number) => {
                            if (this.editViewSelected === ViewOption.RESULTS) {
                                if (typeof model.MANUAL_VALUE !== 'number') {
                                    model.MANUAL_VALUE = parseFloat(model.MANUAL_VALUE);
                                }
                                model.MANUAL_INCREMENT = model.MANUAL_VALUE - lastValue;
                                model.MANUAL_INCREMENT_PERCENT = (model.MANUAL_INCREMENT / lastValue) * 100;
                            } else if (this.editViewSelected === ViewOption.INCREMENTS) {
                                if (typeof model.MANUAL_INCREMENT !== 'number') {
                                    model.MANUAL_INCREMENT = parseFloat(model.MANUAL_INCREMENT);
                                }
                                model.MANUAL_VALUE = lastValue + model.MANUAL_INCREMENT;
                                model.MANUAL_INCREMENT_PERCENT = ((model.MANUAL_VALUE - lastValue) / lastValue) * 100;
                            } else if (this.editViewSelected === ViewOption.PERCENT) {
                                if (typeof model.MANUAL_INCREMENT_PERCENT !== 'number') {
                                    model.MANUAL_INCREMENT_PERCENT = parseFloat(model.MANUAL_INCREMENT_PERCENT);
                                }
                                model.MANUAL_INCREMENT = (lastValue * model.MANUAL_INCREMENT_PERCENT) * 0.01;
                                model.MANUAL_VALUE = lastValue + model.MANUAL_INCREMENT;
                            }
                            model.MANUAL_INCREMENT = this.roundValue(model.MANUAL_INCREMENT);
                            model.MANUAL_INCREMENT_PERCENT = this.roundValue(model.MANUAL_INCREMENT_PERCENT);
                            model.MANUAL_VALUE = this.roundValue(model.MANUAL_VALUE);
                            model.INCREMENT_PERCENT = model.MANUAL_INCREMENT_PERCENT;
                            model.INCREMENT = model.MANUAL_INCREMENT;
                            model.VALUE = model.MANUAL_VALUE;
                            lastValue = model.MANUAL_VALUE;
                        });
                });
        } else if (this.chartViewSelected === PeriodType.QUARTERLY) {
            let lastValue = this.manualStartValue;
            this
                .forecastYears
                .forEach((year: ForecastYear, yearIndex: number) => {
                    year.QUARTERS
                        .forEach((model: ForecastUnitModel, monthIndex: number) => {
                            if (this.editViewSelected === ViewOption.RESULTS) {
                                model.MANUAL_VALUE = this.roundValue(model.MANUAL_VALUE);
                                model.VALUE = model.MANUAL_VALUE;
                            }
                        });
                    year
                        .MONTHS
                        .forEach((model: ForecastUnitModel, monthIndex: number) => {
                            const corresponidngQuarter = year.QUARTERS[Math.floor(monthIndex / 3)];
                            if (this.editViewSelected === ViewOption.RESULTS) {
                                model.MANUAL_VALUE = corresponidngQuarter.MANUAL_VALUE / 3;
                                model.MANUAL_INCREMENT = model.MANUAL_VALUE - lastValue;
                                model.MANUAL_INCREMENT_PERCENT = lastValue === 0 ? 0 : (model.MANUAL_INCREMENT / lastValue) * 100;
                            }
                            model.MANUAL_INCREMENT = this.roundValue(model.MANUAL_INCREMENT);
                            model.MANUAL_INCREMENT_PERCENT = this.roundValue(model.MANUAL_INCREMENT_PERCENT);
                            model.MANUAL_VALUE = this.roundValue(model.MANUAL_VALUE);
                            model.INCREMENT_PERCENT = model.MANUAL_INCREMENT_PERCENT;
                            model.INCREMENT = model.MANUAL_INCREMENT;
                            model.VALUE = model.MANUAL_VALUE;
                            lastValue = model.MANUAL_VALUE;
                        });
                });
        } else {
            if (this.editViewSelected === ViewOption.RESULTS) {
                this.manualStartValue = this.forecastYears[0].MANUAL_VALUE / 12;
            }
            let lastValue = this.manualStartValue;
            this
                .forecastYears
                .forEach((year: ForecastYear, yearIndex: number) => {
                    year.MANUAL_VALUE = this.roundValue(year.MANUAL_VALUE);
                    year.VALUE = year.MANUAL_VALUE;
                    year.QUARTERS
                        .forEach((model: ForecastUnitModel, monthIndex: number) => {
                            if (this.editViewSelected === ViewOption.RESULTS) {
                                model.MANUAL_VALUE = year.MANUAL_VALUE / 4;
                                model.MANUAL_VALUE = this.roundValue(model.MANUAL_VALUE);
                                model.VALUE = model.MANUAL_VALUE;
                            }
                        });
                    year
                        .MONTHS
                        .forEach((model: ForecastUnitModel, monthIndex: number) => {
                            const corresponidngQuarter = year.QUARTERS[Math.floor(monthIndex / 3)];
                            if (this.editViewSelected === ViewOption.RESULTS) {
                                model.MANUAL_VALUE = corresponidngQuarter.MANUAL_VALUE / 3;
                                model.MANUAL_INCREMENT = model.MANUAL_VALUE - lastValue;
                                model.MANUAL_INCREMENT_PERCENT = lastValue === 0 ? 0 : (model.MANUAL_INCREMENT / lastValue) * 100;
                            }
                            model.MANUAL_INCREMENT = this.roundValue(model.MANUAL_INCREMENT);
                            model.MANUAL_INCREMENT_PERCENT = this.roundValue(model.MANUAL_INCREMENT_PERCENT);
                            model.MANUAL_VALUE = this.roundValue(model.MANUAL_VALUE);
                            model.INCREMENT_PERCENT = model.MANUAL_INCREMENT_PERCENT;
                            model.INCREMENT = model.MANUAL_INCREMENT;
                            model.VALUE = model.MANUAL_VALUE;
                            lastValue = model.MANUAL_VALUE;
                        });
                });
        }
        this.viewSelected = this.editViewSelected;
        this.processForQuarterData();
        this.processForYearlyData();
        this.showMsg = true;
        this.processForMaps();
        setTimeout(() => {
            this.showMsg = false;
        }, 2000);
    }

    process(maps = true) {
        this.init();
        this.processForTimePeriod();
        this.calculate();
        this.processForQuarterData();
        this.processForYearlyData();
        if (maps) {
            this.processForMaps();
        }
        this.showSliderMenu = false;
    }

    processForMaps() {
        this.chartOptionsForMonthlyView = ChartsHelper.GetDataMapForMonthly(this.forecastYears, this.startDate, this.endDate, this.viewSelected, this.growthPeriod);
        this.chartOptionsForQuaterlyView = ChartsHelper.GetDataMapForQuaterly(this.forecastYears, this.startDate, this.endDate, this.viewSelected, this.growthPeriod);
        this.chartOptionsForYearlyView = ChartsHelper.GetDataMapForYearly(this.forecastYears, this.startDate, this.endDate, this.viewSelected, this.growthPeriod);
        this.processForMapsLoadToComponent();
    }

    processForMapsLoadToComponent() {
        const config: any = {
            showCharts: this.showChartsNow,
            chartOptionsForMonthlyView: this.chartOptionsForMonthlyView,
            chartOptionsForQuaterlyView: this.chartOptionsForQuaterlyView,
            chartOptionsForYearlyView: this.chartOptionsForYearlyView,
            chartViewSelected: this.chartViewSelected
        };
        if (this.config) {
            if (typeof this.config.chartsConfigCallback !== 'undefined' && typeof this.config.chartsConfigCallback === 'function') {
                this.config.chartsConfigCallback(config);
            }
        }
        if (this.disableCharts)
            return;
        if (this.chartsConfig) {
            if (typeof this.chartsConfig.loadConfig !== 'undefined' && typeof this.chartsConfig.loadConfig === 'function') {
                this.chartsConfig.loadConfig(config);

            }
        }
    }

    onEditDataViewChange() {
        this.viewSelected = this.editViewSelected;
        this.processForMaps();
    }

    onDataViewChange() {
        this.processForMaps();
    }

    onDataTypeViewChange() {
        console.log(this);
    }

    selectView(period: PeriodType) {
        this.chartViewSelected = period;
        this.editViewOptions = this.viewOptions;
        if (this.isManual === true) {
            if (this.chartViewSelected === PeriodType.QUARTERLY || this.chartViewSelected === PeriodType.YEARLY) {
                this.editViewOptions = this.viewOptions.filter((option: any) => {
                    return option.value === ViewOption.RESULTS;
                });
                if (this.editViewSelected === ViewOption.PERCENT || this.editViewSelected === ViewOption.INCREMENTS) {
                    this.editViewSelected = ViewOption.RESULTS;
                }
            }
        }
        this.processForMaps();
    }

    onManualModeChange() {
        if (this.chartViewSelected === PeriodType.QUARTERLY || this.chartViewSelected === PeriodType.YEARLY) {
            this.editViewOptions = this.viewOptions.filter((option: any) => {
                return option.value === ViewOption.RESULTS;
            });
        }
        this.growthPeriod = PeriodType.MONTHLY;
    }

    applyManualProps() {
        let viewSelected = this.editViewSelected;
        if (this.manualGrowthType === GrowthType.ABSOLUTE) {
            this.editViewSelected = ViewOption.INCREMENTS;
        } else if (this.manualGrowthType === GrowthType.PERCENT) {
            this.editViewSelected = ViewOption.PERCENT;
        }
        let stDate: Date, edDate: Date;
        if (this.manualYearOptionSelected === null) {
            if (this.manualStartMonthValue && this.manualStartYearValue) {
                stDate = new Date();
                stDate.setDate(1);
                stDate.setMonth(this.manualStartMonthValue - 1);
                stDate.setFullYear(this.manualStartYearValue);
                stDate.setHours(0); stDate.setMilliseconds(0); stDate.setMinutes(0); stDate.setSeconds(0);
            }
            if (this.manualEndMonthValue && this.manualEndYearValue) {
                edDate = new Date();
                edDate.setDate(28);
                edDate.setMonth(this.manualEndMonthValue - 1);
                edDate.setFullYear(this.manualEndYearValue);
                edDate.setHours(0); edDate.setMilliseconds(0); edDate.setMinutes(0); edDate.setSeconds(0);
            }
        }
        this
            .forecastYears
            .forEach((year: ForecastYear) => {
                year
                    .MONTHS
                    .forEach((model: ForecastUnitModel, index: number) => {
                        let proceed = false;
                        if (this.manualYearOptionSelected === null) {
                            const dt = new Date();
                            dt.setDate(1);
                            dt.setFullYear(model.YEAR);
                            dt.setMonth(model.MONTH);
                            dt.setHours(0); dt.setMilliseconds(0); dt.setMinutes(0); dt.setSeconds(0);
                            if (dt >= stDate && dt <= edDate) {
                                proceed = true;
                            }
                        }
                        else if (this.manualYearOptionSelected === 0 || (this.manualYearOptionSelected === year.YEAR)) {
                            proceed = true;
                        }
                        if (proceed) {
                            if (this.manualGrowthType === GrowthType.ABSOLUTE) {
                                if (this.manualApplyAcross === PeriodType.MONTHLY) {
                                    model.MANUAL_INCREMENT = this.manualGrowth;
                                } else if (this.manualApplyAcross === PeriodType.QUARTERLY) {
                                    model.MANUAL_INCREMENT = model.MONTH % 3 === 0 ? this.manualGrowth: 0;
                                }  else if (this.manualApplyAcross === PeriodType.YEARLY) {
                                    model.MANUAL_INCREMENT = model.MONTH % 12 === 0 ? this.manualGrowth: 0;
                                }
                            } else if (this.manualGrowthType === GrowthType.PERCENT) {
                                if (this.manualApplyAcross === PeriodType.MONTHLY) {
                                    model.MANUAL_INCREMENT_PERCENT = this.manualGrowth;
                                } else if (this.manualApplyAcross === PeriodType.QUARTERLY) {
                                    model.MANUAL_INCREMENT_PERCENT = model.MONTH % 3 === 0 ? this.manualGrowth: 0;
                                }  else if (this.manualApplyAcross === PeriodType.YEARLY) {
                                    model.MANUAL_INCREMENT_PERCENT = model.MONTH % 12 === 0 ? this.manualGrowth: 0;
                                }
                            }
                        }
                    });
            });
        this.showSliderMenu = false;
        this.saveManualData();
        this.editViewSelected = viewSelected;
        this.viewSelected = this.editViewSelected;
        this.processForMaps();
    }

    applyManualPropsForDataEntryMode() {
        let lastValue = this.manualStartValue;
        let stDate: Date, edDate: Date;
        if (this.manualYearOptionSelected === null) {
            if (this.manualStartMonthValue && this.manualStartYearValue) {
                stDate = new Date();
                stDate.setDate(1);
                stDate.setMonth(this.manualStartMonthValue - 1);
                stDate.setFullYear(this.manualStartYearValue);
                stDate.setHours(0); stDate.setMilliseconds(0); stDate.setMinutes(0); stDate.setSeconds(0);
            }
            if (this.manualEndMonthValue && this.manualEndYearValue) {
                edDate = new Date();
                edDate.setDate(28);
                edDate.setMonth(this.manualEndMonthValue - 1);
                edDate.setFullYear(this.manualEndYearValue);
                edDate.setHours(0); edDate.setMilliseconds(0); edDate.setMinutes(0); edDate.setSeconds(0);
            }
        }
        this
            .forecastYears
            .forEach((year: ForecastYear) => {
                year
                    .MONTHS
                    .forEach((model: ForecastUnitModel) => {
                        let proceed = false;
                        if (this.manualYearOptionSelected === null) {
                            const dt = new Date();
                            dt.setDate(1);
                            dt.setFullYear(model.YEAR);
                            dt.setMonth(model.MONTH);
                            dt.setHours(0); dt.setMilliseconds(0); dt.setMinutes(0); dt.setSeconds(0);
                            if (dt >= stDate && dt <= edDate) {
                                proceed = true;
                            }
                        }
                        else if (this.manualYearOptionSelected === 0 || (this.manualYearOptionSelected === year.YEAR)) {
                            proceed = true;
                        }
                        if (proceed) {
                            if (this.manualGrowthType === GrowthType.ABSOLUTE) {
                                if (this.manualApplyAcross === PeriodType.MONTHLY) {
                                    model.MANUAL_INCREMENT = this.manualGrowth;
                                } else if (this.manualApplyAcross === PeriodType.QUARTERLY) {
                                    model.MANUAL_INCREMENT = model.MONTH % 3 === 0 ? this.manualGrowth: 0;
                                }  else if (this.manualApplyAcross === PeriodType.YEARLY) {
                                    model.MANUAL_INCREMENT = model.MONTH % 12 === 0 ? this.manualGrowth: 0;
                                }
                            } else if (this.manualGrowthType === GrowthType.PERCENT) {
                                if (this.manualApplyAcross === PeriodType.MONTHLY) {
                                    model.MANUAL_INCREMENT_PERCENT = this.manualGrowth;
                                } else if (this.manualApplyAcross === PeriodType.QUARTERLY) {
                                    model.MANUAL_INCREMENT_PERCENT = model.MONTH % 3 === 0 ? this.manualGrowth: 0;
                                }  else if (this.manualApplyAcross === PeriodType.YEARLY) {
                                    model.MANUAL_INCREMENT_PERCENT = model.MONTH % 12 === 0 ? this.manualGrowth: 0;
                                }
                            }
                        }
                        model.MANUAL_VALUE = lastValue + model.MANUAL_INCREMENT;
                        lastValue = model.MANUAL_VALUE;
                    });
            });
        this.showSliderMenu = false;
    }

    openEditSliderMenu() {
        this.manualYearsAvailable = this.forecastYears.map((year: ForecastYear) => {
            return { label: year.YEAR.toString(), value: year.YEAR };
        });
        this.manualYearsAvailable.push({ label: 'All Years', value: 0 });
        this.manualYearOptionSelected = 0;
        this.showSliderMenu = true;
    }

    roundValue(num: number) {
        num = parseFloat(Number(num).toFixed(2)
        );
        return num;
    }

    onShowChartsModeChange() {
        setTimeout(() => {
            this.showChartsNow = this.showCharts;
            this.processForMapsLoadToComponent();
        }, 100);
    }

    saveData(convertToPercent?, widgetType?, generic?) {

        let dataEntryConfig = {
            widgetType: widgetType,
            initialConfig: {
                startValue: this.startValue,
                growth: this.growth,
                growthType: this.growthType,
                growthPeriod: this.growthPeriod,
                startDate: this.startDate,
                endDate: this.endDate,
                manual: this.isManual,
                stopAggregationAfterEndDate: true
            },
            monthResult: generic ? this.config.getGenericMonthDataEntryForSave(convertToPercent):  this.config.getDataEntryForSave(convertToPercent),
            quarterResult: this.config.getManualDataEntryForQuarter(),
            yearResult: this.config.getManualDataEntryForYear(),
        };
        this.dataForSave.emit(dataEntryConfig);
    }

    getDefaultStartDateStr() {
        const dt = new Date();
        return dt.getFullYear() + '/' + dt.getMonth() + '/' + dt.getDate();
    }

    getDefaultEndDateStr() {
        const dt = new Date();
        dt.setFullYear(dt.getFullYear() + 5);
        return dt.getFullYear() + '/' + dt.getMonth() + '/' + dt.getDate();
    }

    onApplyAcrossOptionChanged() {
        if (this.manualYearOptionSelected === 0) {
            this.startDateStr = this.manualYearsAvailable[0].value + '-01-01';
            this.endDateStr = this.manualYearsAvailable[this.manualYearsAvailable.length - 2].value + '-12-31';
        } else {
            this.startDateStr = this.manualYearOptionSelected + '-01-01';
            this.endDateStr = this.manualYearOptionSelected + '-12-31';
        }
        this.manualStartMonthValue = new Date(this.startDateStr).getMonth() + 1;
        this.manualEndMonthValue = new Date(this.endDateStr).getMonth() + 1;
        this.manualStartYearValue = new Date(this.startDateStr).getFullYear();
        this.manualEndYearValue = new Date(this.endDateStr).getFullYear();
    }

    revertManualOptionYear() {
        this.manualYearOptionSelected = null;
    }


  public saveManualDataFromModal(){
        if(!this.dataEntryMode && this.isManual){
          this.saveManualData()
        }
  }
}
