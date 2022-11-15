
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
        {{ repoData?.url }}
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