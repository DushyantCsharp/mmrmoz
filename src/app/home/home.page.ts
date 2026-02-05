import { Component, OnInit, OnDestroy } from '@angular/core';
import { GoldPriceService } from '../services/gold-price.service';
import { Currency, Weight, GoldPrice, PriceData } from '../models/gold.model';
import { Subscription } from 'rxjs';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  currentPrice: GoldPrice | null = null;
  selectedCurrency: Currency = 'MZN';
  selectedWeight: Weight = 'oz';
  
  currencies: Currency[] = ['MZN', 'USD', 'ZAR'];
  weights: Weight[] = ['oz', 'g', 'kg'];
  
  private priceSubscription?: Subscription;
  private dataSubscription?: Subscription;

  // Chart configuration
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#EDE9DF',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#EDE9DF',
        bodyColor: '#EDE9DF',
        borderColor: '#D4AF37',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#C9C2B3',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(255, 215, 0, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#C9C2B3'
        },
        grid: {
          color: 'rgba(255, 215, 0, 0.1)'
        }
      }
    }
  };

  constructor(private goldPriceService: GoldPriceService) {}

  ngOnInit() {
    this.priceSubscription = this.goldPriceService.currentPrice$.subscribe(price => {
      this.currentPrice = price;
    });

    this.dataSubscription = this.goldPriceService.historicalData$.subscribe(() => {
      this.updateChart();
    });
  }

  ngOnDestroy() {
    this.priceSubscription?.unsubscribe();
    this.dataSubscription?.unsubscribe();
  }

  updateChart() {
    const historicalData = this.goldPriceService.getHistoricalData(this.selectedCurrency, 'oz');

    this.lineChartData.labels = historicalData.map(d =>
      d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    const datasets = this.weights.map((weight, index) => {
      const data = this.goldPriceService
        .getHistoricalData(this.selectedCurrency, weight)
        .map(d => d.price);

      const palette = [
        { border: '#D4AF37', fill: 'rgba(212, 175, 55, 0.18)' },
        { border: '#8FB7FF', fill: 'rgba(143, 183, 255, 0.14)' },
        { border: '#7AD9B1', fill: 'rgba(122, 217, 177, 0.14)' }
      ];
      const colors = palette[index % palette.length];

      return {
        data,
        label: `${this.goldPriceService.getWeightLabel(weight)}`,
        backgroundColor: colors.fill,
        borderColor: colors.border,
        pointBackgroundColor: colors.border,
        pointBorderColor: '#0b0c10',
        pointHoverBackgroundColor: colors.border,
        pointHoverBorderColor: colors.border,
        fill: true,
        tension: 0.35
      };
    });

    this.lineChartData.datasets = datasets;
  }

  get displayPrice(): string {
    const price = this.goldPriceService.getPrice(this.selectedCurrency, this.selectedWeight);
    if (price === null) return '---';
    
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }

  get currencySymbol(): string {
    return this.goldPriceService.getCurrencySymbol(this.selectedCurrency);
  }

  get weightLabel(): string {
    return this.goldPriceService.getWeightLabel(this.selectedWeight);
  }

  onCurrencyChange(event: any) {
    this.selectedCurrency = event.detail.value;
    this.updateChart();
  }

  onWeightChange(event: any) {
    this.selectedWeight = event.detail.value;
    this.updateChart();
  }
}
