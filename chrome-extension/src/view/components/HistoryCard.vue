<script lang="ts">
import { defineComponent } from 'vue';
import { auth } from '@/features/authentication';
import { api } from '@/features/api';
import { loadFromHistory } from '@/features/utils';

import type { PropType } from 'vue';
import { STAGE } from '@/features/store/models';
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
      isPauseBTNDisabled: true,
    };
  },
  computed: {
    isPaused() {
      return this.repoData.stage === STAGE.PAUSE;
    },
    starGrowthLastMonth() {
      const { stargazers_count, lastMonthStars } = this.repoData;

      if (!stargazers_count || typeof lastMonthStars === 'undefined')
        return undefined;

      return ((lastMonthStars / stargazers_count) * 100).toFixed(2);
    },
    starsPerFork() {
      const { stargazers_count, forks_count } = this.repoData;

      if (!stargazers_count || !forks_count) return undefined;

      return (forks_count / stargazers_count).toFixed(2);
    },
    restoreLimitDate() {
      const { restoreLimitsDate } = this.repoData;

      if (!restoreLimitsDate) return undefined;

      const dateOfRestoreLimits = new Date(restoreLimitsDate);

      return dateOfRestoreLimits.toLocaleTimeString();
    },
  },
  mounted() {
    if (!this.repoData.id && this.repoData.stage === STAGE.PAUSE)
      setInterval(() => {
        this._checkIsLimitsRestored();
      }, 3000);
  },
  methods: {
    _checkIsLimitsRestored() {
      const now = new Date().getTime();

      if (
        now >= new Date(this.repoData.restoreLimitsDate ?? new Date()).getTime()
      ) {
        this.isPauseBTNDisabled = false;
      }
    },
    async unpause() {
      const downloader = { ...this.repoData };
      const result = await loadFromHistory(downloader);

      if (result.success) this.remove();
    },
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
        <div v-if="isPaused && !repoData.id" class="buttons-block">
          <div class="paused-info">
            <span v-if="isPauseBTNDisabled"
              >Paused until {{ restoreLimitDate }}</span
            >
            <span
              >Progress:
              {{
                (
                  (repoData.progress.current / repoData.progress.max) *
                  100
                ).toFixed(0)
              }}%</span
            >
          </div>
          <button
            :disabled="isPauseBTNDisabled"
            class="secondary outline small-button pull-right"
            @click="unpause()"
          >
            Continue
          </button>
        </div>
        <span v-if="!repoData.id && !isPaused" class="error-pill pull-right"
          >Error</span
        >
      </div>
    </div>
    <footer>
      <details>
        <summary @click="toggleDetails">
          {{ repoData.date !== null && dateTime(repoData.date) }}
        </summary>
        <li>
          Stars
          <em data-tooltip="Total stars per repository.">(?)</em>:
          {{ repoData.stargazers_count }}
        </li>
        <li>
          Forks <em data-tooltip="Total forks per repository.">(?)</em>:
          {{ repoData.forks_count }}
        </li>
        <li v-if="typeof repoData?.issues_count !== 'undefined'">
          Issues
          <em data-tooltip="Total issues per repository.">(?)</em>:
          {{ repoData?.issues_count }}
        </li>
        <li v-if="typeof repoData?.pull_requests_count !== 'undefined'">
          Pull requests
          <em data-tooltip="Total pull requests per repository.">(?)</em>:
          {{ repoData?.pull_requests_count }}
        </li>
        <li v-if="typeof repoData?.contributors_count !== 'undefined'">
          Contributors
          <em
            data-tooltip="Total contributors per repository. Excludes anonymous contributions"
            >(?)</em
          >:
          {{ repoData?.contributors_count }}
        </li>
        <li v-if="typeof repoData?.watchers_count !== 'undefined'">
          Watchers
          <em data-tooltip="Total watchers per repository.">(?)</em>:
          {{ repoData?.watchers_count }}
        </li>
        <li v-if="typeof starGrowthLastMonth !== 'undefined'">
          Stars added per month
          <em data-tooltip="Star % growth within last month per repository."
            >(?)</em
          >: {{ starGrowthLastMonth }}%
        </li>
        <li v-if="typeof starsPerFork !== 'undefined'">
          Total forks / total stars
          <em data-tooltip="Total forks / total stars per repository.">(?)</em>:
          {{ starsPerFork }}
        </li>
        <li v-if="typeof repoData?.issues_statistic?.openedLTM !== 'undefined'">
          Issues created in last 12 month
          <em data-tooltip="Issues created within the last twelve months."
            >(?)</em
          >:
          {{ repoData?.issues_statistic?.openedLTM }}
        </li>
        <li v-if="typeof repoData?.issues_statistic?.health !== 'undefined'">
          Health
          <em data-tooltip="% of issues closed in last twelve months.">(?)</em>:
          {{ repoData?.issues_statistic?.health }}
        </li>
        <li v-if="typeof repoData?.prsMergedLTM !== 'undefined'">
          Pull requests merged LTM
          <em data-tooltip="Pull requests merged in last twelve months.">(?)</em
          >:
          {{ repoData?.prsMergedLTM }}
        </li>
        <li v-if="typeof repoData?.total_rating !== 'undefined'">
          <b>Total rating</b>
          <div class="tooltip-container">
            (?)
            <div class="tooltip">
              <p>
                We normalize each value, assign a weight, and then sum the
                weighted values.
              </p>
              <ul>
                <li>
                  {{ repoData?.totalRatingWeights?.starsWeight * 100 }}% - Total
                  GitHub Stars
                </li>
                <li>
                  {{ repoData?.totalRatingWeights?.contributorsWeight * 100 }}%
                  - Total GitHub Contributors
                </li>
                <li>
                  {{ repoData?.totalRatingWeights?.starsGrowthWeight * 100 }}% -
                  Star Growth MoM
                </li>
                <li>
                  {{ repoData?.totalRatingWeights?.starsActivityWeight * 100 }}%
                  - Stars / Total Months Active
                </li>
                <li>
                  {{ repoData?.totalRatingWeights?.forksStarsWeight * 100 }}% -
                  Forks / Stars
                </li>
                <li>
                  {{
                    repoData?.totalRatingWeights?.issuesOpenedLTMWeight * 100
                  }}% - Issues Created In Last Month
                </li>
                <li>
                  {{ repoData?.totalRatingWeights?.PRMergedLTMWeight * 100 }}% -
                  Pull Requests Merged LTM
                </li>
                <li>
                  {{
                    repoData?.totalRatingWeights?.issuesClosedLTMWeight * 100
                  }}% - % Issues Closed in LTM
                </li>
              </ul>
            </div>
          </div>
          :
          <b>{{ repoData?.total_rating }}</b>
        </li>
        <div
          v-if="repoData?.stars_history && isDetailsOpen && !isPaused"
          class="chart-wrapper"
        >
          <StatisticChart
            :chart-data="repoData?.stars_history"
            :chart-title="'Stargazers statistic'"
            :chart-type="'stars'"
          />
        </div>
        <div
          v-if="
            repoData?.issues_statistic?.chartData && isDetailsOpen && !isPaused
          "
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
.paused-info {
  display: flex;
  flex-direction: column;
}
.buttons-block {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 24px;
}

.tooltip-container {
  position: relative;
  display: inline-block;

  &:hover {
    cursor: help;
  }
}

.tooltip {
  position: absolute;
  z-index: 99;
  bottom: 100%;
  left: 50%;
  padding: 0.5rem;
  transform: translate(-50%, -0.25rem);
  border-radius: 0.25rem;
  background: hsl(205, 30%, 15%);
  color: #fff;
  font-style: normal;
  font-weight: 400;
  font-size: 0.875rem;
  text-decoration: none;
  white-space: pre-line;
  pointer-events: none;
  width: max-content;
  display: none;

  li,
  p {
    color: #fff;
    font-size: 0.75rem;
    line-height: 120%;
  }

  p {
    margin-bottom: 16px;
    max-width: 300px;
  }

  ul {
    margin-bottom: 0;
  }
}

.tooltip::after {
  content: '';
  position: absolute;
  bottom: 0%;
  left: 50%;
  transform: translate(-50%, 100%);
  border-width: 6px;
  border-style: solid;
  border-color: #1b2832 transparent transparent transparent;
}

.tooltip-container:hover .tooltip {
  display: block;
}
</style>
