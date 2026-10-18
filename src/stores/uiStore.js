import { defineStore } from "pinia";
import { ref } from "vue"


export const useUistore = defineStore('ui', () => {
  // 空间分析工具
  const analysisOptions = [
    {value: 'buffer', label: '缓冲区分析'},
    {value: 'overlay', label: '叠加分析'},
    {value: 'isochrone', label: '等时圈分析'},
    {value: 'nearstPoint', label: '最近设施分析'},
    // {value: 'KDE', label: '核密度分析'},
    {value: 'exit', label: '取消选中工具'},
  ]
  // 叠加分析工具
  const overlayOptions = [
    {value: 'intersect', label: '相交运算'},
    {value: 'difference', label: '擦除运算'}
  ]
  // 等时圈
  const isochroneMethod = [
    {value: '4', label: '步行(4km/h)'},
    {value: '15', label: '骑行(15km/h)'},
    {value: '40', label: '驾车(40km/h)'},
  ]
  const time = [
    {value: '15', label: '15分钟'},
    {value: '30', label: '30分钟'},
    {value: '60', label: '60分钟'},
  ]
  // 右面板折叠 与框选查询联动
  const isFold = ref(true)
  // 选择框禁用
  const isDisabled = ref(false)
  // 显示
  const isShowAlert = ref(false)
  const isShowForm = ref(false)
  const isShowOverlayForm = ref(false)
  const isShowisochroneAlert = ref(false)
  const isShowisochroneForm = ref(false)
  const isShowNearstForm = ref(false)
  const isShowKdeForm = ref(false)
  return {
    analysisOptions, isShowAlert, isShowForm, isShowOverlayForm, overlayOptions, isShowisochroneAlert,
    isochroneMethod, time, isShowisochroneForm, isShowNearstForm, isShowKdeForm, isDisabled, isFold
  }
})