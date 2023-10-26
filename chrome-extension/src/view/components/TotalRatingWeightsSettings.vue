<template>
  <div>
    <form>
      <div class="form-row">
        <label class="small-label">Stars weight:</label>
        <div>
          <input
            v-model="starsWeight"
            class="small-input"
            type="number"
            step="0.1"
            @input="(e) => restrictDecimalPlaces(e, 'starsWeight')"
          />
          %
        </div>
      </div>
      <div class="form-row">
        <label class="small-label">Contributors weight:</label>
        <div>
          <input
            v-model="contributorsWeight"
            class="small-input"
            type="number"
            step="0.1"
            @input="(e) => restrictDecimalPlaces(e, 'contributorsWeight')"
          />
          %
        </div>
      </div>
      <div class="form-row">
        <label class="small-label">Stars growth per month weight:</label>
        <div>
          <input
            v-model="starsGrowthWeight"
            class="small-input"
            type="number"
            step="0.1"
            @input="(e) => restrictDecimalPlaces(e, 'starsGrowthWeight')"
          />
          %
        </div>
      </div>
      <div class="form-row">
        <label class="small-label">Stars activity weight:</label>
        <div>
          <input
            v-model="starsActivityWeight"
            class="small-input"
            type="number"
            step="0.1"
            @input="(e) => restrictDecimalPlaces(e, 'starsActivityWeight')"
          />
          %
        </div>
      </div>
      <div class="form-row">
        <label class="small-label">Forks / stars weight:</label>
        <div>
          <input
            v-model="forksStarsWeight"
            class="small-input"
            type="number"
            step="0.1"
            @input="(e) => restrictDecimalPlaces(e, 'forksStarsWeight')"
          />
          %
        </div>
      </div>
      <div class="form-row">
        <label class="small-label">Issues opened LTM weight:</label>
        <div>
          <input
            v-model="issuesOpenedLTMWeight"
            class="small-input"
            type="number"
            step="0.1"
            @input="(e) => restrictDecimalPlaces(e, 'issuesOpenedLTMWeight')"
          />
          %
        </div>
      </div>
      <div class="form-row">
        <label class="small-label">Issues closed LTM weight:</label>
        <div>
          <input
            v-model="issuesClosedLTMWeight"
            class="small-input"
            type="number"
            step="0.1"
            @input="(e) => restrictDecimalPlaces(e, 'issuesClosedLTMWeight')"
          />
          %
        </div>
      </div>
      <div class="form-row">
        <label class="small-label">Pull requests closed LTM weight:</label>
        <div>
          <input
            v-model="PRMergedLTMWeight"
            class="small-input"
            type="number"
            step="0.1"
            @input="(e) => restrictDecimalPlaces(e, 'PRMergedLTMWeight')"
          />
          %
        </div>
      </div>
    </form>
    <p>Total: {{ totalWeight }}%</p>
    <button :disabled="totalWeight !== 100" @click="saveAndToggle">Save</button>
    <button class="text-button" @click="onClose">Cancel</button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { downloaderStore } from '@/features/store/downloader';

export default {
  props: {
    values: {
      type: Object as PropType<TotalRatingWeights>,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  data() {
    return {
      starsWeight: this.values.starsWeight * 100,
      contributorsWeight: this.values.contributorsWeight * 100,
      starsGrowthWeight: this.values.starsGrowthWeight * 100,
      starsActivityWeight: this.values.starsActivityWeight * 100,
      forksStarsWeight: this.values.forksStarsWeight * 100,
      issuesOpenedLTMWeight: this.values.issuesOpenedLTMWeight * 100,
      issuesClosedLTMWeight: this.values.issuesClosedLTMWeight * 100,
      PRMergedLTMWeight: this.values.PRMergedLTMWeight * 100,
    };
  },
  computed: {
    totalWeight() {
      return (
        Number(this.starsWeight) +
        Number(this.contributorsWeight) +
        Number(this.starsGrowthWeight) +
        Number(this.starsActivityWeight) +
        Number(this.forksStarsWeight) +
        Number(this.issuesOpenedLTMWeight) +
        Number(this.issuesClosedLTMWeight) +
        Number(this.PRMergedLTMWeight)
      );
    },
  },
  methods: {
    async saveAndToggle() {
      await downloaderStore.setWeightsSettings({
        starsWeight: this.starsWeight / 100,
        contributorsWeight: this.contributorsWeight / 100,
        starsGrowthWeight: this.starsGrowthWeight / 100,
        starsActivityWeight: this.starsActivityWeight / 100,
        forksStarsWeight: this.forksStarsWeight / 100,
        issuesOpenedLTMWeight: this.issuesOpenedLTMWeight / 100,
        issuesClosedLTMWeight: this.issuesClosedLTMWeight / 100,
        PRMergedLTMWeight: this.PRMergedLTMWeight / 100,
      });

      this.onClose();
    },
    restrictDecimalPlaces(event: Event, key: keyof TotalRatingWeights) {
      const inputValue = (event.target as HTMLInputElement)?.value;
      const decimalCount = (inputValue.split('.')[1] || []).length;

      if (decimalCount > 1) {
        const roundedValue = parseFloat(inputValue).toFixed(1);
        this[key] = Number(roundedValue);
      }
    },
  },
};
</script>

<style>
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.small-label {
  font-size: 16px;
  width: max-content;
}

.small-input {
  position: relative;
  max-width: 48px;
  font-size: 16px;
  padding: 4px !important;
  height: 32px !important;
  margin: 0 !important;
  line-height: 20px;
  appearance: textfield;
  -moz-appearance: textfield;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    display: none;
  }
}
</style>
