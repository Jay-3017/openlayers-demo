<script setup>
import { BASEMAPS, DEFAULT_BASEMAP } from '@/config/basemaps';
import { useMapStore } from '@/stores/mapStore';
import { onMounted, onUnmounted, ref } from 'vue';
import Map from 'ol/Map'
import { View } from 'ol';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls, ScaleLine, ZoomSlider } from 'ol/control'
import { useMapCoordinate } from '@/composables/useMapCoordinate'

const mapRef = ref(null)
const mapStore = useMapStore()
const { bindCoordinate } = useMapCoordinate()
let map = null
  //OpenLayers 的 XYZ 源只认 {x} {y} {z} 这种花括号格式

onMounted(async () => {
  //把所有图层创建出来
  const layerMap = {}
  Object.values(BASEMAPS).forEach(config => {
    //`Object.assign(目标, 源)`：把源对象的所有属性复制到目标对象上。
    //config.create()产出的对象是{gaodeVector: TileLayer实例}
    Object.assign(layerMap, config.create())
  })
   
  // 默认只显示默认底图对应的图层
  const defaultKeys = BASEMAPS[DEFAULT_BASEMAP].layerKeys
  //`Object.entries(layerMap)把 layerMap 转成 [key, layer] 的数组
  //解构 `[key, layer]`：每次循环拿到一个图层的字符串 key 和它的实例
  Object.entries(layerMap).forEach(([key, layer]) => {
    //`defaultKeys.includes(key)`：判断这个 key 是不是默认底图需要的那几个
    layer.setVisible(defaultKeys.includes(key))
    //给图层打标签
    layer.set('isBaseLayer', true)
  })
  //
  // 创建地图
  map = new Map({
    target: mapRef.value,
    view: new View({
      center: fromLonLat([104, 35]),
      zoom: 4.5,
      projection: 'EPSG:3857'
    }),
    controls: defaultControls({
      zoom: false,
      rotate: false,
      attribution: false
    }).extend([new ScaleLine(), new ZoomSlider()]),
    layers: Object.values(layerMap)
  })
  // 存store
  mapStore.setMap(map)
  mapStore.registerBaseLayers(layerMap)
  mapStore.setCurrentBasemap(DEFAULT_BASEMAP)

  //绑定坐标监听
  bindCoordinate(map)
})

onUnmounted(() => {
  map?.setTarget(undefined)
  mapStore.setMap(null)
})
</script>

<template>
  <div id="map" ref="mapRef"></div>
</template>

<style scoped>
#map {
  width: 100%;
  height: calc(100vh - 28px - 56px);
}
:deep(.ol-scale-line) {
  left: 23%;
}
:deep(.ol-zoomslider) {
  top: 780px;
  left: 20%;
}
</style>