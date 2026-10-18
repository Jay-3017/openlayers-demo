import { useMapStore } from '@/stores/mapStore'
import { useUistore } from '@/stores/uiStore'
import { ElMessage } from 'element-plus'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style, Text } from 'ol/style'
import CircleStyle from 'ol/style/Circle'
import { storeToRefs } from 'pinia'
import { buffer } from "@turf/turf"
import { useAnalysisStore } from '@/stores/analysisStore'
import { useLayerStore } from '@/stores/layerStore'
import GeoJSON from 'ol/format/GeoJSON'
import { nearestPoint, interpolate, difference, intersect, isobands } from '@turf/turf'
import Draw from 'ol/interaction/Draw.js'
import { Feature } from 'ol'
import { LineString, Point } from 'ol/geom'
import { getDistance } from 'ol/sphere'
import { toLonLat } from 'ol/proj'

let clickFeatures = null
let selectLayer = null
// 存放回车后选中的要素
let selectFeatures = null
//获取到缓冲区图层
// 保存等时圈选择的中心点
let isochroneFeatures = []
let drawSource = null
let drawLayer = null
//最近设施图层
let nearestPointFeatures = []
let drawNearstSource = null
// 选中样式
const selectStyle = [
  new Style({
    image: new CircleStyle({
      radius: 16,
      fill: new Fill({ color: 'rgba(0, 194, 209, 0.18)' })
    })
  }),
  new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({ color: 'rgba(0, 194, 209, 0.35)' }),
      stroke: new Stroke({ color: 'rgba(0, 194, 209, 0.9)', width: 2 })
    })
  }),
  new Style({
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({ color: '#fff' }),
      stroke: new Stroke({ color: '#00c2d1', width: 2 })
    })
  })
]
// 缓冲区结果样式
const bufferStyle = new Style({
  fill: new Fill({ color: 'rgba(0, 194, 209, 0.15)' }),
  stroke: new Stroke({ color: '#00c2d1', width: 2 })
})
//叠加分析结果样式
const overlayStyle = new Style({
  fill: new Fill({ color: 'rgba(255, 82, 155, 0.25)' }),
  stroke: new Stroke({
    color: '#ff529b',
    width: 2,
    lineDash: [6, 4]     // 虚线
  })
})
// 独立的选择图层，全局唯一
function ensureSelectLayer(map) {
  if (selectLayer) return selectLayer
  selectLayer = new VectorLayer({
    source: new VectorSource(),
    style: selectStyle,
    zIndex: 998,
    properties: { name: '分析选择图层', isToolLayer: true }
  })
  map.addLayer(selectLayer)
  return selectLayer
}
// 等时圈样式
const isochroneStyles = {
  15: new Style({
    fill: new Fill({ color: 'rgba(0, 194, 209, 0.35)' }),
    stroke: new Stroke({ color: '#00c2d1', width: 2 })
  }),
  30: new Style({
    fill: new Fill({ color: 'rgba(0, 194, 209, 0.22)' }),
    stroke: new Stroke({ color: '#00c2d1', width: 2, lineDash: [6, 4] })
  }),
  60: new Style({
    fill: new Fill({ color: 'rgba(0, 194, 209, 0.12)' }),
    stroke: new Stroke({ color: '#00c2d1', width: 2, lineDash: [3, 5] })
  })
}

//  线的样式
const lineStyle = new Style({
  stroke: new Stroke({
    color: '#ff529b',
    width: 2,
    lineDash: [6, 4]
  })
})
// 从可能是 cluster 的 feature 里提取原始 POI 点
function extractOriginals(feature) {
  const inner = feature.get('features')
  if (inner && inner.length > 0) return inner
  return [feature]
}

// 缓冲区分析主函数
export function toBuffer(name) {
  const mapStore = useMapStore()
  const layerStore = useLayerStore()
  const analysisStore = useAnalysisStore() 
  const uiStore = useUistore()
  const { isDisabled } = storeToRefs(uiStore)
  const map = mapStore.mapInstance
  // 校验
  if (!selectFeatures || selectFeatures.length === 0) {
    ElMessage.warning('请先选择要素')
    isDisabled.value = false
    return
  }
  const radiusKm = Number(analysisStore.radius)
  // 把 EPSG:3857 坐标转成经纬度，喂给 Turf
  const bufferedFeatures = []
  selectFeatures.forEach(f => {
    const format = new GeoJSON({
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:4326'
    })
    //writeFeatureObject 不要加s/
    //Turf 需要的是对象，不是字符串,writeFeature得到是字符串,writeFeatureObject得到对象
    const geojsonFeature = format.writeFeatureObject(f, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    })
    //算缓冲区，单位：千米
    const buffered = buffer(
      geojsonFeature,
      radiusKm,
      {units: 'kilometers'}
    )
      // Turf 可能返回 Feature 或 FeatureCollection，统一展开成 Feature
    if (buffered.type === 'FeatureCollection') {
      bufferedFeatures.push(...buffered.features)
    } else {
      bufferedFeatures.push(buffered)
    }
  })
  if (!bufferedFeatures.length) {
     isDisabled.value = false
      ElMessage.warning('缓冲区计算失败')
      return
    }
    // GeoJSON → OpenLayers feature（4326 → 3857）
    const format = new GeoJSON({
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    })
    const olFeatures = format.readFeatures({
      type: 'FeatureCollection',
      features: bufferedFeatures
    })
    // 创建缓冲区图层
    const bufferSource = new VectorSource({features: olFeatures})
    const bufferLayer = new VectorLayer({
      source: bufferSource,
      style: bufferStyle,
      properties: {
        name: `缓冲区-${Date.now()}`,
        type: 'analysis'
      }
    })
    // 图层名字设置
    if (name === 'name') name = `缓冲区-${new Date().toLocaleTimeString()}`
      // 加入图层树
    const ob = {
      id: `buffer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'analysis',
      name: name,
      visible: true,
      olLayer: bufferLayer
    }
    layerStore.addBufferLayer(ob)
    map.addLayer(bufferLayer)
    // 清空选择图层，进入下一次分析
    if (selectLayer) selectLayer.getSource().clear()
    selectFeatures = null
    ElMessage.success(`已生成 ${olFeatures.length} 个缓冲区`)
    isDisabled.value = false
}

// 叠加分析主函数
//叠加分析（intersect / difference）通常不需要 extent，
// 而是遍历 buffer 的每个要素，和 region 的每个要素做 Turf 运算
export function overlayAnalysis(formData) {
  const layerStore = useLayerStore()
  const allRegionLayer = layerStore.layer[0].children
  const allBufferLayer = layerStore.layer[3].children
  const mapStore = useMapStore()
  const map = mapStore.mapInstance
  const uiStore = useUistore()
  const { isShowOverlayForm, isDisabled } = storeToRefs(uiStore)
  if (!formData.regionLayer || !formData.method || !formData.bufferLayer) {
    ElMessage.warning('未选择图层或方法')
    return
  }
  const regionLayer = allRegionLayer.find(group =>
      group.name === formData.regionLayer
    )
  const bufferLayer = allBufferLayer.find(group =>
      group.name === formData.bufferLayer
    )
  const format = new GeoJSON()
  const regionFeatures = regionLayer.olLayer.getSource().getFeatures()
  const bufferFeatures = bufferLayer.olLayer.getSource().getFeatures()
  const finalResult = []
  
  bufferFeatures.forEach(bf => {
    const bfGeo = format.writeFeatureObject(bf, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326'
    })
    regionFeatures.forEach(rf => {
      const rfGeo = format.writeFeatureObject(rf, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      })
      
      const FeatureCollect = {
        type: 'FeatureCollection',
        features: [bfGeo, rfGeo]
      }
      const result = formData.method === 'intersect' 
      ? intersect(FeatureCollect) 
      : difference(FeatureCollect)
      if (result)  finalResult.push(result)
    })
  })
  // 结果校验
  if (finalResult.length === 0) {
    ElMessage.warning('没有生成任何结果')
    return
  }
// 把turf的坐标转为ol使用的坐标
  const olFormat = new GeoJSON()
  //而 Turf 的 buffer、intersect 返回的可能是裸 Feature 数组，所以用完后要自己包一层才能喂给ol
  //GeoJSON 标准里，顶层没有"数组"这一种。直接传数组给 OpenLayers，
  // 它不属于标准 GeoJSON，某些版本就报错。所以要传对象，写一个type告诉ol传的是什么
  const olFeatures = olFormat.readFeatures({
    type: 'FeatureCollection',
    features: finalResult
  }, {
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326'
  })
  const overlaySource = new VectorSource({features: olFeatures})
  const overlayLayer = new VectorLayer({
    source: overlaySource,
    style: overlayStyle,
    properties: {
        name: `叠加分析结果-${Date.now()}`,
        type: 'analysis'
      }
  })
  formData.name === 'name' ? `叠加分析结果-${Date.now()}` : formData.name
  const ob = {
    id: `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'overlay',
    name: formData.name,
    visible: true,
    olLayer: overlayLayer
  }
  layerStore.addOverlayLayer(ob)
  ElMessage.success('叠加分析成功')
  isDisabled.value = false
  isShowOverlayForm.value = false
  map.addLayer(overlayLayer)
}
// 等时圈
// 点击取消清除中心点
export function clearIsochrone() {
  if (isochroneFeatures.length === 0) return
  const center = isochroneFeatures[0]
  drawSource.removeFeature(center)
  isochroneFeatures = []
}
//等时圈分析主函数
export function isochroneAnalysis(formData) {
  if (!formData.method || !formData.time) return ElMessage.warning('未选择方法或时长')
  const uiStore = useUistore()
  const { isShowisochroneForm } = storeToRefs(uiStore)
  const layerStore = useLayerStore()
  const mapStore = useMapStore()
  const map = mapStore.mapInstance
  const method = Number(formData.method)
  const time = Number(formData.time)
  const radiusKm = method * time / 60
  //样式
  let style
  if (formData.time === '15') {
    style = isochroneStyles[15]
  } else if (formData.time === '30') {
    style = isochroneStyles[30]
  } else (style = isochroneStyles[60])
  const format = new GeoJSON()
  const geojsonFeature = format.writeFeatureObject(isochroneFeatures[0], {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    })   
  const result = buffer(
      geojsonFeature,
      radiusKm,
      {units: 'kilometers'}
    )
  const olFeatures = format.readFeature(result, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  })
  
  //readFeature返回的是单个Feature不是数组，加s的才是数组，所以用[olFeatures]
  const isochroneSource = new VectorSource({features: [olFeatures]})
  const isochroneLayer = new VectorLayer({
    source: isochroneSource,
    style,
    properties: { name: `等时圈-${time}分钟`, type: 'analysis' }
  })
  isShowisochroneForm.value = false
  map.addLayer(isochroneLayer)
  const ob = {
    id: `isochrone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'isochrone',
    name: `等时圈-${Date.now()}`,
    visible: true,
    olLayer: isochroneLayer
  }
  layerStore.addIsochroneLayer(ob)
  const target = isochroneFeatures[0]
  drawSource.removeFeature(target)
  isochroneFeatures = []
  isDisabled.value = true
  ElMessage.success('等时圈生成成功')
}

// 最近设施分析
// 点击取消清除中心点
export function clearCenter() {
  if (nearestPointFeatures.length === 0) return
  const center = nearestPointFeatures[0]
  drawNearstSource.removeFeature(center)
  nearestPointFeatures = []  
}
// 最近设施分析主函数
export function nearstPointAnalysis(formData) {
  if (!formData.poiLayer) return ElMessage.warning('未选择图层')
  const layerStore = useLayerStore()
  const { layer } = layerStore
  const mapStore = useMapStore()
  const map = mapStore.mapInstance
  const uiStore = useUistore()
  const { isShowNearstForm } = storeToRefs(uiStore)
  const format = new GeoJSON()
  const targetLayer = layer[1].children.find(group => 
    group.name === formData.poiLayer
  )
  const targetFeatures = targetLayer.olLayer.getSource().getFeatures()
  //转换坐标
  const centerFeatures = format.writeFeatureObject(nearestPointFeatures[0], {
    dataProjection: 'EPSG:4326',// 输出
    featureProjection: 'EPSG:3857'
  })
  const turfTargetFeatures = format.writeFeaturesObject(targetFeatures, {
    dataProjection: 'EPSG:4326',// 输出
    featureProjection: 'EPSG:3857'
  })
  const nearestResult = nearestPoint(centerFeatures, turfTargetFeatures)
  const olFeatures = format.readFeature(nearestResult, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  })
  // 创建线
  const start = nearestPointFeatures[0].getGeometry().getCoordinates()
  const end = olFeatures.getGeometry().getCoordinates()
  const lineFeature = new Feature({
    geometry: new LineString([start, end])
  })
  // 计算中点
  const midX = (start[0] + end[0]) / 2
  const midY = (start[1] + end[1]) / 2
  const midFeature = new Feature({
    geometry: new Point([midX, midY])
  })
  // 计算距离
  const distMeters = getDistance(
    toLonLat(start),
    toLonLat(end)
  )
  const text = distMeters >= 1000 ? (distMeters /1000).toFixed(2) + 'km' : distMeters.toFixed(0) + ' m'
  // 距离文字的样式
  const textStyle = new Style({
    text: new Text({
      text,
      font: 'bold 13px sans-serif',
      fill: new Fill({ color: '#fff' }),
      stroke: new Stroke({ color: '#000', width: 3 }),
      offsetY: -10,
      backgroundFill: new Fill({ color: 'rgba(0, 0, 0, 0.24)' }),
      padding: [3, 6, 3, 6],
    })
  })
  // 创建图层
  const lineSource = new VectorSource({
    features: [lineFeature, midFeature]
  })
  const lineLayer = new VectorLayer({
    source: lineSource,
    style: (feature) => {
      // 线用线样式，点用文字样式
      if (feature.getGeometry().getType() === 'LineString') {
        return lineStyle
      }
      return textStyle
    }
  })
  map.addLayer(lineLayer)
  isShowNearstForm.value = false
  const ob = {
    id: `nearst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'isochrone',
    name: `最近设施-${Date.now()}`,
    visible: true,
    olLayer: lineLayer
  }
  layerStore.addNearstLayer(ob)
  ElMessage.success('计算成功')
  isDisabled.value = false
}

// 核密度分析主函数
// export function kdeAnalysis(formData) {
  
//   if (formData.poiLayer === '') return ElMessage.warning('请选择图层')
//   const uiStore = useUistore()
//   const layerStore = useLayerStore()
//   const mapStore = useMapStore()
//   const map = mapStore.mapInstance
//   const { layer } = layerStore
//   const targetLayer = layer[1].children.find(group => 
//     group.name === formData.poiLayer
//   )
//   // poi图层是会聚合的所以要拿最原始的source,先前已经把原始要素存进source了
//   const poiFeatures = targetLayer.source.getFeatures()
//   const pointFeatures = []
//   // ol存properties要使用set
//   const addValueFeatures = []
//   const format = new GeoJSON()
//   poiFeatures.forEach(f => {
//     f.set('value', 1)
//     const geoResult = format.writeFeatureObject(f, {
//       dataProjection: 'EPSG:4326',
//       featureProjection: 'EPSG:3857'
//     })
//     addValueFeatures.push(geoResult)
//   })
//   const points = {
//     type: 'FeatureCollection',
//     features: addValueFeatures
//   }
//   // 先使用反距离加权IDW（interpolate）在网格上估计它们的“属性”值
//   // gridType: 'point',要用point转为点要素isobands输入的要素必须是点要素
//   const interpolateResult = interpolate(points, 1, {
//     gridType: 'point',
//     property: 'value',
//     units: 'kilometers',
//     weight: 2
//   })
//   // 看值域
//   const values = interpolateResult.features.map(f => f.properties.value)
//   const min = Math.min(...values)
//   const max = Math.max(...values)
//   console.log('插值值域：', min, max)
//   if (max === 0) {
//     ElMessage.warning('插值结果全为 0')
//     return
//   }
//   // 动态 breaks，5 级
//   const step = (max - min) / 5
//   const breaks = [
//     min,
//     min + step,
//     min + step * 2,
//     min + step * 3,
//     min + step * 4,
//     max + 1e-6
//   ]
//   const colors = [
//     'rgba(224, 243, 255, 0.7)',
//     'rgba(166, 216, 255, 0.7)',
//     'rgba(102, 179, 255, 0.7)',
//     'rgba(51, 136, 221, 0.7)',
//     'rgba(0, 85, 170, 0.7)'
//   ]
//   // 然后使用isobands 生成等值面
//   //isobands 第二项 分界[0, 5, 10, 20, 35, 50]意思是0-5分一级以此类推和传入的value挂钩
//   const isobandsResult = isobands(interpolateResult, breaks, {
//     zProperty: 'value'
//   })
//   console.log('等值面数量：', isobandsResult.features.length)
//   isobandsResult.features.forEach((f, i) => {
//     console.log(`[${i}] properties:`, f.properties)
//   })
//   //给每一级上色
//   isobandsResult.features.forEach((f, i) => {
//     f.properties.fillColor = colors[i] || colors[colors.length - 1]
//   })
//   //

//   const olFeatures = format.readFeatures(isobandsResult, {
//     dataProjection: 'EPSG:4326',
//     featureProjection: 'EPSG:3857'
//   })
//   // 按每级颜色分别设样式
//   olFeatures.forEach((f, i) => {
//     f.setStyle(new Style({
//       fill: new Fill({ color: colors[i] || colors[colors.length - 1] }),
//       stroke: new Stroke({ color: 'rgba(0, 0, 0, 0)', width: 0 })
//     }))
//   })
//   const vectorSource = new VectorSource({features: olFeatures}) 
//   const vectorLayer = new VectorLayer({
//     source: vectorSource,
//     properties: { name: `核密度-${Date.now()}`, type: 'analysis' },
//   })
//   map.addLayer(vectorLayer)
// }
//空间分析工具主函数
export function selectAnalysis(e) {
  const mapStore = useMapStore()
  const { updateStatus } = mapStore
  const map = mapStore.mapInstance
  const uiStore = useUistore()
  const { 
    isShowAlert, isShowForm, isShowisochroneAlert, isShowOverlayForm, isShowisochroneForm,
    isShowNearstForm, isDisabled
  } = storeToRefs(uiStore)
  if (clickFeatures) {
    map.un('click', clickFeatures)
    clickFeatures = null
  }
  if (e === '缓冲区分析') {
    isDisabled.value = true
    updateStatus(e)
    isShowAlert.value = true
    // 新建了高亮样式自己的图层
    ensureSelectLayer(map)
    // 清空上一次的选择
    selectLayer.getSource().clear()
    const targetFeatures = []

    clickFeatures = (evt) => {
      map.forEachFeatureAtPixel(
        evt.pixel,
        (feature) => {
          // 拆 cluster，拿到原始点
          const originals = extractOriginals(feature)
          originals.forEach(point => {
            // 用原始点去重
            if (targetFeatures.includes(point)) return
            targetFeatures.push(point)
            // 复制到选择图层
            const clone = point.clone()
            selectLayer.getSource().addFeature(clone)
          })
          return true   // 只取最上层
        },
        {
          layerFilter: (layer) =>
            layer.get('type') === 'POI' && layer.getVisible()
        }
      )
    }
    map.on('click', clickFeatures)
    // 回车确认
    const onEnter = (evt) => {
      if (evt.key !== 'Enter') return
      document.removeEventListener('keyup', onEnter)
      map.un('click', clickFeatures)
      clickFeatures = null
      isShowAlert.value = false
      if (targetFeatures.length === 0) {
        isDisabled.value = false
        ElMessage.warning('您还未选择要素')
        return
      }
      isShowForm.value = true
      // targetFeatures 里是原始 POI 点，后续传给 buffer 分析
      selectFeatures = targetFeatures
    }
    document.addEventListener('keyup', onEnter)
  }
  if (e === '叠加分析') {
    isDisabled.value = true
    updateStatus(e)
    isShowOverlayForm.value = true
  }
  if (e === '等时圈分析') {
    isDisabled.value = true
    updateStatus(e)
    isShowisochroneAlert.value = true
    let draw = null
    drawSource = drawSource || new VectorSource()
    drawLayer = drawLayer || new VectorLayer({
      source: drawSource,
    })
    draw = draw || new Draw({
      source: drawSource,
      type: 'Point',
    })
    map.addInteraction(draw)
    const exists = map.getLayers().getArray().includes(drawLayer)
    if (!exists) {
      map.addLayer(drawLayer)
    }
    const click = () => {
      isochroneFeatures = drawSource.getFeatures() 
      if (isochroneFeatures.length > 1) { 
        const target = isochroneFeatures[1]
        drawSource.removeFeature(target)
        isochroneFeatures.splice(1, 1)
        return ElMessage.warning('只能选择一个中心点哦！')
      }
    }
    const enterUp = (e) => {
      if(e.key !== 'Enter') return
      if (isochroneFeatures.length === 0) return ElMessage.warning('未选择中心点')
      map.un('click', click)
      document.removeEventListener('keyup', enterUp)
      map.removeInteraction(draw)
      draw = null
      isShowisochroneAlert.value = false
      isShowisochroneForm.value = true
    }
    map.on('click', click)
    document.addEventListener('keyup', enterUp)
  }
  if (e === '最近设施分析') {
    isDisabled.value = true
    updateStatus(e)
    isShowisochroneAlert.value = true
    let draw = null
    let drawNearstLayer = null
    drawNearstSource = drawNearstSource || new VectorSource()
    drawNearstLayer = drawNearstLayer || new VectorLayer({
      source: drawNearstSource,
    })
    draw = draw || new Draw({
      source: drawNearstSource,
      type: 'Point',
    })
    map.addInteraction(draw)
    // 把图层加入地图
    // 这一段是尝试获取drawNearstLayer
    const exists = map.getLayers().getArray().includes(drawNearstLayer)
    if (!exists) {
      map.addLayer(drawNearstLayer)
    }
    const click = () => {
      console.log(nearestPointFeatures);
      nearestPointFeatures = drawNearstSource.getFeatures()
      console.log(nearestPointFeatures);
      
      if (nearestPointFeatures.length > 1) { 
        const target = nearestPointFeatures[1]
        drawNearstSource.removeFeature(target)
        nearestPointFeatures.splice(1, 1)
        console.log(nearestPointFeatures);
        return ElMessage.warning('只能选择一个中心点哦！')
      }
    }
    const enterUp = (e) => {
      if(e.key !== 'Enter') return
      if (nearestPointFeatures.length === 0) return ElMessage.warning('未选择中心点')
      map.un('click', click)
      document.removeEventListener('keyup', enterUp)
      map.removeInteraction(draw)
      draw = null
      isShowisochroneAlert.value = false
      isShowNearstForm.value = true
    }
    map.on('click', click)
    document.addEventListener('keyup', enterUp)
  }
  // if (e === 'KDE') {
  //   isShowKdeForm.value = true
  // }
  if (e === '取消选中工具') {
    updateStatus(e)
  }
}