<template>
  <article class="download-window">
    <div class="close-wrap">
      <a href="#" class="close" @click="remove()"></a>
    </div>
    <nav>
      <ul>
        <li>
          <strong
            ><a class="text" :href="downloader.url" target="_blank">{{
              downloader?.name
            }}</a></strong
          >
        </li>
      </ul>
    </nav>
    <b>Settings: </b>
    {{ typeStatus(downloader.settings?.stars) }} Stars
    {{ typeStatus(downloader.settings?.forks) }} Forks
    {{ typeStatus(downloader.settings?.sample) }} Sample
    {{
      downloader.settings?.samplePercent
        ? downloader.settings?.samplePercent + '%'
        : ''
    }}
    <footer>
      <details>
        <summary>
          <template v-if="progress(downloader.progress)">
            Progress: {{ progress(downloader.progress) }} Estimated Time:
            {{ timeRemaining(downloader.progress) }}
          </template>
          <template v-else>
            Note: The more stars and forks the repo has, the longer it will take
            to start. Don't worry if it hasn't started yet, it should be a few
            seconds to a few minutes to start progressing.
          </template>
        </summary>
        <li v-if="downloader?.progress?.current">
          Scanned {{ downloader?.progress?.current }} of
          {{ downloader?.progress?.max }} users
        </li>
        <li>Stars: {{ downloader?.stargazers_count }}</li>
        <li>Forks: {{ downloader?.forks_count }}</li>
      </details>
      <div class="progress-wrapper">
        <a href="#" @click="remove()">
          <svg
            class="stop"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="19"
          >
            <path
              d="M.5 7.5a7 7 0 1114 0 7 7 0 01-14 0z"
              stroke="currentColor"
            ></path>
            <path d="M9.5 5.5h-4v4h4v-4z" stroke="currentColor"></path>
          </svg>
        </a>
        <progress
          v-if="downloader?.progress"
          :value="downloader?.progress?.current"
          :max="downloader?.progress?.max"
        ></progress>
      </div>
    </footer>
  </article>
</template>

<script>
export default {
  props: ['downloader'],
  emits: ['remove'],
  methods: {
    remove() {
      this.$emit('remove', {});
    },
    progress(progress) {
      if (progress?.current && progress?.max) {
        return `${((progress.current / progress.max) * 100).toFixed(0)}%`;
      }
      return 0;
    },
    typeStatus(v) {
      return v ? '✓' : '✗';
    },
    timeRemaining(progress) {
      const ESTIMATED_SECONDS_PER_CALL = 1.2;
      if (progress?.current && progress?.max) {
        const totalMinutes =
          ((progress.max - progress.current) * ESTIMATED_SECONDS_PER_CALL) / 60;
        if (totalMinutes > 1) {
          return `${totalMinutes.toFixed(0)} Minutes`;
        }
        if (totalMinutes) {
          return 'Less than 1 minute';
        }
        if (!totalMinutes) {
          return 'Done';
        }
      }
      return 'Not sure yet';
    },
  },
};
</script>

<style>
.text {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 248px;
  font-size: 14px;
}
.download-window {
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
.stop {
  margin-right: 10px;
  position: relative;
  bottom: 6px;
}
.progress-wrapper {
  display: flex;
}
</style>
