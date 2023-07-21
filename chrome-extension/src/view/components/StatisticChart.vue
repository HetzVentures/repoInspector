<script lang="ts">
import VueApexCharts from 'vue3-apexcharts';

export default {
  components: {
    apexchart: VueApexCharts,
  },
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
  },
  computed: {
    chartOptions() {
      const allChartLabels = Object.keys(this.chartData);
      const chartLabels =
        allChartLabels.length > 12 ? allChartLabels.slice(-12) : allChartLabels;

      return {
        chart: {
          height: 250,
          type: this.chartType === 'stars' ? 'line' : 'bar',
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
        colors: ['#77B6EA', '#FF8300'],
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
    },
    chartSeries() {
      let series;

      const allChartData = Object.values(this.chartData);
      const dataForChart =
        allChartData.length > 12 ? allChartData.slice(-12) : allChartData;

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
    <apexchart height="250" :options="chartOptions" :series="chartSeries" />
  </div>
</template>
