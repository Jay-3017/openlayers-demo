import { useLayerStore } from '@/stores/layerStore'
import { useMapStore } from '@/stores/mapStore'
import Overlay from 'ol/Overlay'
import DragBox from 'ol/interaction/DragBox.js'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Style from 'ol/style/Style'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Circle from 'ol/style/Circle'
import { storeToRefs } from 'pinia'
import { useUistore } from '@/stores/uiStore'

//
let popupOverlay = null
let clickHandler = null
let dragBox = null
let highlightLayer = null

// 高亮样式
const highlightStyle = new Style({
  image: new Circle({
    radius: 8,
    fill: new Fill({ color: 'rgba(255, 200, 0, 0.9)' }),
    stroke: new Stroke({ color: '#fff', width: 2 })
  }),
  fill: new Fill({ color: 'rgba(255, 200, 0, 0.3)' }),
  stroke: new Stroke({ color: '#ffc800', width: 3 })
})

//弹框
function ensurePopup(map) {
  if (popupOverlay) return popupOverlay
  const el = document.createElement('div')
  el.className = 'poi-popup'
  el.style.cssText = `
    background: #252e3a;
    color: #e6edf3;
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid #00c2d1;
    box-shadow: 0 4px 12px rgba(0,0,0,.4);
    font-size: 13px;
    white-space: nowrap;
    pointer-events: none;
    transform: translateY(-20%);
  `
  el.innerHTML = ''
  popupOverlay = new Overlay({
    element: el,
    positioning: 'bottom-center',
    offset: [0, -10],
    stopEvent: false
  })
  map.addOverlay(popupOverlay)
  return popupOverlay
}

// -高亮图层 
function ensureHighlightLayer(map) {
  if (highlightLayer) return highlightLayer
  highlightLayer = new VectorLayer({
    source: new VectorSource(),
    style: highlightStyle,
    zIndex: 999,
    properties: { name: '高亮图层', isToolLayer: true }
  })
  map.addLayer(highlightLayer)
  return highlightLayer
}

function highlightFeatures(features) {
  if (!highlightLayer) return
  const source = highlightLayer.getSource()
  source.clear()
  features.forEach(f => {
    source.addFeature(f.clone())
  })
}

function clearHighlight() {
  highlightLayer?.getSource().clear()
}

// 从可能是 cluster 的 feature 里提取原始 POI 点
function extractOriginals(feature) {
  const inner = feature.get('features')
  if (inner && inner.length > 0) return inner
  return [feature]
}

// 主 
export function selectQuery(event) {
  const mapStore = useMapStore()
  const map = mapStore.mapInstance
  const uiStore = useUistore()
  const { isFold } = storeToRefs(uiStore)
  if (!map) return

  // 清理上一次的绑定
  if (clickHandler) {
    map.un('click', clickHandler)
    clickHandler = null
  }
  if (dragBox) {
    map.removeInteraction(dragBox)
    dragBox = null
  }

  ensurePopup(map)
  ensureHighlightLayer(map)

  // 点击查询
  if (event === '点击查询') {
    clickHandler = (e) => {
      // 先清掉上一次的高亮
      clearHighlight()

      const targetFeatures = []
      map.forEachFeatureAtPixel(
        e.pixel,
        (feature) => {
          targetFeatures.push(feature)
          return true   // 只取最上层
        },
        {
          //隐藏的图层跳过
          layerFilter: (layer) => layer.get('type') === 'POI' && layer.getVisible()
        }
      )
      // 点到空白处
      if (!targetFeatures.length) {
        popupOverlay.setPosition(undefined)
        return
      }
      // 拆 cluster，拿原始点
      const originals = []
      targetFeatures.forEach(f => originals.push(...extractOriginals(f)))

      // 高亮
      highlightFeatures(originals)

      // 弹框显示第一个名字
      const name = originals[0]?.get('name') || '未命名'
      popupOverlay.getElement().innerHTML = name
      popupOverlay.setPosition(e.coordinate)
    }
    map.on('click', clickHandler)
    mapStore.updateStatus(event)
  }
  // 框选查询 
  if (event === '框选查询') {
    
    clearHighlight()
    const layerStore = useLayerStore()
    const { queryData } = storeToRefs(mapStore)
    dragBox = new DragBox({
      onBoxEnd: () => {
        const extent = dragBox.getGeometry().getExtent()
        const poiFeatures = []
        const featuresData = []
        layerStore.layer[1].children.forEach(item => {
          //  隐藏的图层跳过
          if (!item.visible) return
          // 用原始 source，避免 cluster
          const rawSource = item.source
          if (!rawSource) return
          const features = rawSource.getFeaturesInExtent(extent)
          poiFeatures.push(...features)
        })
        highlightFeatures(poiFeatures)
        poiFeatures.forEach(item => {
          let type
          if (item.get('train') === 'yes') {
            item.set('type', '火车站')
            type = item.get('type')
          }
          if (item.get('subway') === 'yes') {
            item.set('type', '地铁站')
            type = item.get('type')
          }
          if (item.get('amenity')) {
            item.set('type', item.get('amenity'))
            type = item.get('type')
          }
          const ob = {
            id: Date.now() + '_' + Math.random().toString(36).slice(2),
            name: item.get('name') || '未命名',
            coordinate: item.getGeometry().getCoordinates(),
            type
          }
          featuresData.push(ob)
        })
        //train: "yes" subway: "yes" amenity: "school" amenity: "hospital"
        queryData.value = featuresData
        isFold.value = false
      }
    })
    map.addInteraction(dragBox)
    mapStore.updateStatus(event)
  }
  //  退出
  if (event === '退出查询') {
    mapStore.updateStatus(event)
    return
  }
}