
<template>
    <article class="history-window">
        <div class="close-wrap">
          <a v-on:click="remove()" href="#" class="close"></a>
        </div>
        <nav>
        <ul>
            <li><strong><a class="text" v-bind:href="repoUrl" target="_blank">{{ repoData?.name }}</a></strong></li>
        </ul>
        </nav>
          <b>Settings: </b>
        {{ typeStatus(repoData.settings?.stars) }} Stars 
        {{ typeStatus(repoData.settings?.forks) }} Forks
        {{ typeStatus(repoData.settings?.location) }} Location
        {{ typeStatus(repoData.settings?.sample) }} Sample
        <footer>
        <details>
            <summary>
            Last Inspected: {{dateTime(repoData.inspectionTime)}}
            </summary>
            <li>
            Stars: {{ repoData.stargazers_count }}
            </li>
            <li>
            Forks: {{ repoData.forks_count }}
            </li>
        </details>
        </footer>
    </article>
</template>

<script>

export default {
  props: ['repoData', 'repoUrl', 'currentRepo'],
  emits: ['remove'],
  methods: {
    typeStatus(v) {
          return v ? '✓' : '-'
      },
        remove() {
            console.log(this.repoUrl)
            this.$emit('remove', this.repoUrl);
        },
        dateTime(date) {
          const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
          return new Date(date).toLocaleDateString("en-US", options)
        }
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