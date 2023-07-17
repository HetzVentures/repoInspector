<script lang="ts">
import { defineComponent } from 'vue';
import { auth } from '@/features/authentication';
import { api } from '@/features/api';
import { getYearMonth } from '@/features/utils';

import type { PropType } from 'vue';
import StatisticChart from './StatisticChart.vue';

export default defineComponent({
  components: { StatisticChart },
  props: {
    repoData: {
      type: Object as PropType<Downloader>,
      required: true,
    },
  },
  emits: ['remove', 'resend'],
  data() {
    return {
      resendLoading: false,
      isDetailsOpen: false,
    };
  },
  computed: {
    starGrowthLastMonth() {
      const yearMonth = getYearMonth(new Date());
      const { stargazers_count, stars_history } = this.repoData;

      if (!stargazers_count || !stars_history) return undefined;

      if (!stars_history[yearMonth]) return 0;

      return (
        (stars_history[yearMonth].count / stargazers_count) *
        100
      ).toFixed(2);
    },
    starsPerFork() {
      const { stargazers_count, forks_count } = this.repoData;

      if (!stargazers_count || !forks_count) return undefined;

      return (forks_count / stargazers_count).toFixed(2);
    },
  },
  methods: {
    toggleDetails() {
      this.isDetailsOpen = !this.isDetailsOpen;
    },
    typeStatus(v: boolean) {
      return v ? '✓' : '✗';
    },
    remove() {
      this.$emit('remove', {});
    },
    dateTime(date: string | number | Date) {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };

      const d = new Date(date);

      return `${d.toLocaleDateString('en-US', options)} ${d.toLocaleTimeString(
        'en-US',
      )}`;
    },
    resendEmail(repoId: string | null) {
      const user = auth.currentUser;

      this.resendLoading = true;

      api.get(`repository/${repoId}/resend/?user_id=${user.uuid}`).then(
        (r) => {
          if (r === 'success') {
            this.$emit('resend', true);
          } else {
            this.$emit('resend', false);
          }

          this.resendLoading = false;
        },
        (error) => {
          this.resendLoading = true;
          this.$emit('resend', false);
          console.log(error);
        },
      );
    },
  },
});
</script>

<template>
  <article class="history-window">
    <div class="close-wrap">
      <a href="#" class="close" @click="remove()"></a>
    </div>
    <nav>
      <ul>
        <li>
          <strong
            ><a class="text" :href="repoData.url" target="_blank">{{
              repoData?.name
            }}</a></strong
          >
        </li>
      </ul>
    </nav>
    <div class="grid">
      <div>
        <b>Settings: </b>
        {{ typeStatus(repoData.settings?.stars) }} Stars
        {{ typeStatus(repoData.settings?.forks) }} Forks
        {{ typeStatus(repoData.settings?.sample) }} Sample
        {{
          repoData.settings?.samplePercent
            ? repoData.settings?.samplePercent + '%'
            : ''
        }}
      </div>
      <div>
        <button
          v-if="repoData.id"
          :aria-busy="resendLoading"
          :disabled="resendLoading"
          class="secondary outline small-button pull-right"
          @click="resendEmail(repoData.id)"
        >
          Resend
        </button>
        <span v-else class="error-pill pull-right">Error</span>
      </div>
    </div>
    <footer>
      <details>
        <summary @click="toggleDetails">
          {{ repoData.date !== null && dateTime(repoData.date) }}
        </summary>
        <li>Stars: {{ repoData.stargazers_count }}</li>
        <li>Forks: {{ repoData.forks_count }}</li>
        <li v-if="typeof repoData?.issues_count !== 'undefined'">
          Issues: {{ repoData?.issues_count }}
        </li>
        <li v-if="typeof repoData?.pull_requests_count !== 'undefined'">
          Pull requests: {{ repoData?.pull_requests_count }}
        </li>
        <li v-if="typeof repoData?.contributors_count !== 'undefined'">
          Contributors: {{ repoData?.contributors_count }}
        </li>
        <li v-if="typeof repoData?.watchers_count !== 'undefined'">
          Watchers: {{ repoData?.watchers_count }}
        </li>
        <li v-if="typeof starGrowthLastMonth !== 'undefined'">
          Stars added per month: {{ starGrowthLastMonth }}%
        </li>
        <li v-if="typeof starsPerFork !== 'undefined'">
          Total forks / total stars: {{ starsPerFork }}
        </li>
        <li v-if="typeof repoData?.issues_statistic?.openedLTM !== 'undefined'">
          Issues created in last 12 month:
          {{ repoData?.issues_statistic?.openedLTM }}
        </li>
        <li v-if="typeof repoData?.issues_statistic?.health !== 'undefined'">
          Health (% issues closed in LTM):
          {{ repoData?.issues_statistic?.health }}
        </li>
        <li v-if="typeof repoData?.prsMergedLTM !== 'undefined'">
          Pull requests merged LTM:
          {{ repoData?.prsMergedLTM }}
        </li>
        <div
          v-if="repoData?.stars_history && isDetailsOpen"
          class="chart-wrapper"
        >
          <StatisticChart
            :chart-data="repoData?.stars_history"
            :chart-title="'Stargazers statistic'"
            :chart-type="'stars'"
          />
        </div>
        <div
          v-if="repoData?.issues_statistic?.chartData && isDetailsOpen"
          class="chart-wrapper"
        >
          <StatisticChart
            :chart-data="repoData?.issues_statistic?.chartData"
            :chart-title="'Issues statistic'"
            :chart-type="'issues'"
          />
        </div>
      </details>
    </footer>
  </article>
</template>

<style>
.pull-right {
  float: right;
}
.small-button {
  width: 100px;
  font-size: 12px;
  padding: 6px;
}
.text {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 248px;
}
.history-window {
  max-width: 680px;
  margin: auto;
  margin-top: 32px;
}
.close-wrap {
  text-align: right;
}
.close {
  position: relative;
  right: 28px;
  width: 16px;
  height: 16px;
  opacity: 0.3;
}
.close:hover {
  opacity: 1;
}
.close:before,
.close:after {
  position: absolute;
  left: 15px;
  content: ' ';
  height: 16px;
  width: 2px;
  background-color: #333;
}
.close:before {
  transform: rotate(45deg);
}
.close:after {
  transform: rotate(-45deg);
}
.chart-wrapper {
  display: block;
  height: 300px;
  padding-top: 20px;
}
</style>
