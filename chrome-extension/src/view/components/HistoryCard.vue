<script lang="ts">
import { defineComponent } from 'vue';
import { auth } from '@/features/authentication';
import { api } from '@/features/api';

import type { PropType } from 'vue';

export default defineComponent({
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
    };
  },
  methods: {
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
        <summary>
          {{ repoData.date !== null && dateTime(repoData.date) }}
        </summary>
        <li>Stars: {{ repoData.stargazers_count }}</li>
        <li>Forks: {{ repoData.forks_count }}</li>
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
</style>
