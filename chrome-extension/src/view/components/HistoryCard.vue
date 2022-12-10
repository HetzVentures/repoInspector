
<template>
    <article class="history-window">
        <div class="close-wrap">
          <a v-on:click="remove()" href="#" class="close"></a>
        </div>
        <nav>
        <ul>
            <li><strong><a class="text" v-bind:href="repoData.url" target="_blank">{{ repoData?.name }}</a></strong></li>
        </ul>
        </nav>
        <div class="grid">
          <div>
            <b>Settings: </b>
          {{ typeStatus(repoData.settings?.stars) }} Stars 
          {{ typeStatus(repoData.settings?.forks) }} Forks
          {{ typeStatus(repoData.settings?.sample) }} Sample {{ repoData.settings?.samplePercent ? repoData.settings?.samplePercent + '%' : '' }}
          </div>
          <div>
            <button v-bind:aria-busy="resendLoading" v-bind:disabled="resendLoading" 
            v-if="repoData.id" @click="resendEmail(repoData.id)" 
            class="secondary outline small-button pull-right">Resend</button>
          </div>
        </div>
        <footer>
        <details>
            <summary>
            {{dateTime(repoData.date)}}
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
import { auth } from '@/js/authentication'
import { api } from '@/js/api'

export default {
  props: ['repoData'],
  emits: ['remove', 'resend'],
  data() {
    return {
      resendLoading: false
    }
  },
  methods: {
    typeStatus(v) {
          return v ? '✓' : '✗'
      },
        remove() {
            this.$emit('remove', {});
        },
        dateTime(date) {
          const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
          const d =  new Date(date)
          return d.toLocaleDateString("en-US", options) + ' ' + d.toLocaleTimeString('en-US')
        },
        resendEmail(repoId) {
          const user = auth.currentUser;
          this.resendLoading = true;
          api.get(`repository/${repoId}/resend/?user_id=${user.uuid}`).then(() => {
            this.resendLoading = false;
            this.$emit('resend', true);
          }, (error) => {
              this.resendLoading = true;
              this.$emit('resend', false);
              console.log(error);
          });
        }
    }
}
</script>

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