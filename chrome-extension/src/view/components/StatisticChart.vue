<script lang="ts">
import type { PropType } from 'vue';
import VueApexCharts from 'vue3-apexcharts';

export default {
  components: {
    apexchart: VueApexCharts,
  },
  props: {
    chartData: {
      type: Object as PropType<StarHistoryByMonth | ChartData>,
      required: true,
    },
    chartTitle: {
      type: String,
      required: true,
    },
    chartType: {
      type: String,
      required: true,
    },
  },
  computed: {
    chartOptions() {
      const allChartLabels = Object.keys(this.chartData);
      const chartLabels =
        allChartLabels.length > 24 ? allChartLabels.slice(-24) : allChartLabels;

      return {
        chart: {
          height: 350,
          foreColor: '#4076eb',
          type: this.chartType === 'stars' ? 'area' : 'bar',
          toolbar: {
            show: false,
          },
        },
        colors: ['#4076eb', '#8bfcde'],
        dataLabels: {
          enabled: false,
        },
        stroke: {
          curve: 'smooth',
        },
        fill: {
          colors:
            this.chartType === 'stars'
              ? ['#9abbfe', '#8bfcde']
              : ['#3844d3', '#8bfcde'],
          opacity: 1,
          type: 'solid',
        },
        title: {
          text: this.chartTitle,
          align: 'left',
        },
        grid: {
          borderColor: '#e7e7e7',
        },
        markers: {
          size: 3,
          colors: ['transparent', '#8bfcde'],
          strokeColors: ['#4076eb', '#8bfcde'],
          hover: {
            size: 5,
          },
        },
        xaxis: {
          categories: chartLabels,
          title: {
            text: 'Month',
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          floating: true,
          offsetY: -25,
          offsetX: -5,
        },
        plotOptions: {
          bar: {
            borderRadiusApplication: 'end',
            columnWidth: 4,
          },
        },
      };
    },
    chartSeries() {
      let series;

      const allChartData = Object.values(this.chartData);
      const dataForChart =
        allChartData.length > 24 ? allChartData.slice(-24) : allChartData;

      if (this.chartType === 'stars') {
        const starsHistory = dataForChart.map((v) => v.count);
        series = [
          {
            name: 'Stars',
            data: starsHistory,
          },
        ];
      }

      if (this.chartType === 'issues') {
        const openedIssues = dataForChart.map(({ opened }) => opened);
        const closedIssues = dataForChart.map(({ closed }) => closed);

        series = [
          {
            name: 'Opened issues',
            data: openedIssues,
          },
          {
            name: 'Closed issues',
            data: closedIssues,
          },
        ];
      }

      return series;
    },
  },
};
</script>

<template>
  <div>
    <apexchart height="300" :options="chartOptions" :series="chartSeries" />
  </div>
</template>
