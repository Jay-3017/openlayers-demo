// 存放空间分析的数据结果等等

import { defineStore } from "pinia";
import { ref } from "vue";

export const useAnalysisStore = defineStore('analysis', () => {
  const radius = ref(null)
  return {radius}
})