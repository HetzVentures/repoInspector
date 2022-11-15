
<template>
    <article class="download-window">
        <div class="close-wrap">
          <a v-on:click="remove()" href="#" class="close"></a>
        </div>
        <nav>
        <ul>
            <li><strong><a class="text" v-bind:href="repoUrl" target="_blank">{{ repoData?.name }}</a></strong></li>
        </ul>
        </nav>
        {{ repoData?.url }}
        <footer>
          <details>
            <summary>
            Progress: {{ progress(repoData.queueProgress) }} 
            Estimated Time: {{ timeRemaining(repoData.queueProgress) }}
            </summary>
            <li v-if="repoData?.queueProgress?.current">
            Scanned {{repoData?.queueProgress?.current}} of {{repoData?.queueProgress?.max}} users
            </li>
            <li>
            Stars: {{ repoData?.stargazers_count }}
            </li>
            <li>
            Forks: {{ repoData?.forks_count }}
            </li>
        </details>
          <progress v-if="repoData?.queueProgress"
        v-bind:value="repoData?.queueProgress?.current"
        v-bind:max="repoData?.queueProgress?.max"></progress>
        </footer>
    </article>
</template>

<script>

export default {
  props: ['repoData', 'repoUrl', 'currentRepo'],
  emits: ['remove'],
  methods: {
        remove() {
            console.log(this.repoUrl)
            this.$emit('remove', this.repoUrl);
        },
        progress(queueProgress) {
        if (queueProgress?.current && queueProgress?.max) {
          return `${(queueProgress.current / queueProgress.max * 100).toFixed(0)}%`;
        }
        return 0
      },
      timeRemaining(queueProgress) {
        const ESTIMATED_SECONDS_PER_CALL = 1.2;
        if (queueProgress?.current && queueProgress?.max) {
          const totalMinutes = (queueProgress.max - queueProgress.current) * ESTIMATED_SECONDS_PER_CALL / 60;
          if (totalMinutes > 1) {
            return `${totalMinutes.toFixed(0)} Minutes`;
          }
          else if (totalMinutes){
            return 'Less than 1 minute'
          }
          else if (!totalMinutes){
            return 'Done'
          }
        }
        return 'Not sure yet'
      },
    }
}
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
.close:before, .close:after {
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