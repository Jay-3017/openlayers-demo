//凡是 "地图库/图表库/Canvas库new出来的实例"，一律 `shallowRef` 或 `markRaw`，别用普通 `ref`。
//普通 `ref(obj)`：Vue 会递归把 obj 所有属性都变成响应式代理（Proxy）。
//shallowRef(obj)`：只监听 `.value` 这一层不深入obj 内部
//给对象盖个章："我是 raw，以后无论谁把我塞进 reactive/ref，都不准转成 Proxy。"
//和 `shallowRef` 的区别：`markRaw` 是贴在对象身上的标记，`shallowRef` 是容器本身不深入。
import { defineStore } from "pinia"
import {  BASEMAPS, DEFAULT_BASEMAP } from '@/config/basemaps'
import { fromLonLat } from "ol/proj"
import { shallowRef, ref, markRaw } from "vue"

const inital = {
  center: fromLonLat([104, 35]),
  zoom: 4.5
}
export const useMapStore = defineStore('map', () => {
  const mapInstance = shallowRef({})
  const baseLayerRefs = shallowRef({})
  const currentBasemap = ref(DEFAULT_BASEMAP)
  const coordinate = ref([0, 0]) //鼠标经纬度
  const zoom = ref(4.5)  //缩放层级
  const status = ref(null) // 操作提示
  const queryData = ref()// 存入框选查询的要素数据、
  
//把map实例存入
  function setMap(map) {
    mapInstance.value = map ? markRaw(map) : null
  }

  function registerBaseLayers(layers) {
    baseLayerRefs.value = layers
  }

  function setCurrentBasemap(id) {
    currentBasemap.value = id
  }
// 底图显示隐藏
  function switchBasemap(id) {
    const config = BASEMAPS[id]
    if (!config) return
    const layers = baseLayerRefs.value
    // 先全部隐藏
    //Object.values(layers)把 layers这个对象的值（也就是所有 TileLayer 实例）拎出来，变成数组。
    Object.values(layers).forEach(layer => layer.setVisible(false))
    //再显示
    config.layerKeys.forEach(key => layers[key]?.setVisible(true))
    currentBasemap.value = id
  }
// 回到初始
  function goHome() {
    mapInstance.value?.getView().animate({
      ...inital,
      duration: 1000
    })
  }
  //定位
  function locateTo(lng, lat, z = 10, duration = 1000) {
    mapInstance.value?.getView().animate({
      center: fromLonLat([lng, lat]),
      zoom: z,
      duration
    })
  }
  //
  function updateCoordinate(lon, lat) {
    coordinate.value = [lon, lat]
  }
  function updateZoom(z) {
    zoom.value = z
  }
  // 操作提示
  function updateStatus(event) {
    if (event === '退出查询' || event === '取消选中工具') {
      status.value = null
      return
    }
    status.value = event
  }
  // 点击卡片定位
  function locateToFeature(e) {
    console.log(e.coordinate);
    mapInstance.value.getView().animate({
    center: e.coordinate,
    zoom: 15,
    duration: 1000
  })
  }
  return {
    mapInstance, currentBasemap, coordinate, zoom, status, queryData,
    setMap, registerBaseLayers, setCurrentBasemap, switchBasemap, 
    goHome, locateTo, updateCoordinate, updateZoom, updateStatus,
    locateToFeature
  }
})