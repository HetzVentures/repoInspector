
<template>
    <article>
        <nav>
        <ul>
            <li><strong><a class="text" v-bind:href="repoUrl" target="_blank">{{ repoData?.name }}</a></strong></li>
        </ul>
        <ul>
            <li><button v-on:click="remove()" class="outline">Remove</button></li>
        </ul>
        </nav>
        <details>
            <summary>
            Details
            </summary>
            <li>
            Scanned {{repoData?.queueProgress?.current}} of {{repoData?.queueProgress?.max}} users
            </li>
            <li>
            Stars: {{ repoData?.stargazers_count }}
            </li>
            <li>
            Forks: {{ repoData?.forks_count }}
            </li>
        </details>
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
</style>