<script lang="ts">
import ApexCharts from 'apexcharts';

export default {
  props: {
    chartData: {
      type: Object as PropType<StarHistoryByMonth>,
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
    chartId: {
      type: Number,
      required: true,
    },
  },
  mounted() {
    this.renderChart();
  },
  methods: {
    getChartId() {
      return `${this.chartType}-${this.chartId}`;
    },
    renderChart() {
      let chartSeries;

      const allChartData = Object.values(this.chartData);
      const dataForChart =
        allChartData.length > 12 ? allChartData.slice(-12) : allChartData;

      const allChartLabels = Object.keys(this.chartData);
      const chartLabels =
        allChartLabels.length > 12 ? allChartLabels.slice(-12) : allChartLabels;

      if (this.chartType === 'stars') {
        const starsHistory = dataForChart.map((v) => v.count);
        chartSeries = [
          {
            name: 'Stars',
            data: starsHistory,
          },
        ];
      }

      if (this.chartType === 'issues') {
        const openedIssues = dataForChart.map(({ opened }) => opened);
        const closedIssues = dataForChart.map(({ closed }) => closed);

        chartSeries = [
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

      const chartOptions = {
        chart: {
          height: 250,
          type: 'line',
          dropShadow: {
            enabled: true,
            color: '#000',
            top: 12,
            left: 6,
            blur: 10,
            opacity: 0.2,
          },
          toolbar: {
            show: false,
          },
        },
        series: chartSeries,
        colors: ['#77B6EA', '#545454'],
        dataLabels: {
          enabled: true,
        },
        stroke: {
          curve: 'smooth',
        },
        title: {
          text: this.chartTitle,
          align: 'left',
        },
        grid: {
          borderColor: '#e7e7e7',
          row: {
            colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5,
          },
        },
        markers: {
          size: 1,
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
      };

      const chart = new ApexCharts(
        document.querySelector(`#${this.getChartId()}`),
        chartOptions,
      );
      chart.render();
    },
  },
};
</script>

<template>
  <div>
    <div :id="getChartId()"></div>
  </div>
</template>

<style scoped>
#chart {
  width: 100%;
  height: 300px;
  overflow: hidden;
}
</style>
