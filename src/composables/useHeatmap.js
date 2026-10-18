import { useLayerStore } from '@/stores/layerStore'
import { useMapStore } from '@/stores/mapStore'
import { ElMessage } from 'element-plus'
import Heatmap from 'ol/layer/Heatmap.js'
let heatMapLayer = null
export function createHeatMap(radius, selectId) {
  //热力图和点聚合不能同时用同一个 source
  const mapStore = useMapStore()
  const map = mapStore.mapInstance
  const layerStore = useLayerStore()
  const poiLayer = layerStore.layer[1].children
  if (poiLayer.length === 0) {
    ElMessage.warning('没有poi数据')
    return
  }
  if (!selectId) {
    ElMessage.warning('请选择图层')
    return
  }
  const selectLayer = layerStore.layer[1].children.find(item => 
    item.id === selectId
  )
  const source = selectLayer.source
  heatMapLayer = new Heatmap({
    source: source,
    blur: 15,
    radius: radius,
    gradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
    opacity: 0.8,
    properties: { name: 'POI 热力图', isToolLayer: true }
  })
  // 注册到图层树
  const ob = {
    id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    idx: selectId,
    type: 'Heatmap',
    name: radius + 'px' + '热力图' + selectLayer.name,
    visible: true,
    olLayer: heatMapLayer
  }
  layerStore.addHeatmapLayer(ob)
  map.addLayer(heatMapLayer)
}