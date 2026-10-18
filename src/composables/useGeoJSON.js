// 导入导出

import { useMapStore } from "@/stores/mapStore"
import { parseGeoJSON, readFeatures } from "@/utils/geojson"
import { ElMessage } from "element-plus"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import Style from "ol/style/Style"
import Fill from "ol/style/Fill"
import Stroke from "ol/style/Stroke"
import { useLayerStore } from "@/stores/layerStore"
import { Cluster } from "ol/source"
import { poiClusterStyle } from "./usePOI"
//导入

export async function upload(file) {
  const mapStore = useMapStore()
  const layerStore = useLayerStore()
  const { addUploadLayer } = layerStore
  try {
    // Element Plus 的 file.raw 才是原生 File
    const json = await parseGeoJSON(file.raw)
    // console.log(json);
    
    // 转成 OpenLayers features
    const features = readFeatures(json)
    if (!features.length) {
      ElMessage.warning('文件中没有可显示的要素')
      return
    }
    //样式
    const uploadStyle = new Style({
    fill: new Fill({
        color: 'rgba(255, 0, 0, 0.2)'
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.2)',
        width: 2
      })
     })
    // 创建图层
    const uploadLayer = new VectorLayer({
      source: new VectorSource({
        features: features,
      }),
      style: uploadStyle,
      properties: {name: file.name}
    })
    mapStore.mapInstance.addLayer(uploadLayer)
    // 存入layerStore
  const ob = {
    id: `region-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'region',
    name: uploadLayer.get('name'),
    visible: true,
    olLayer: uploadLayer
  }
  addUploadLayer(ob)
  ElMessage.success(`已导入 ${features.length} 个要素`)
  } catch (err) {
    console.error(err)
    ElMessage.error(err.message)
  }
}
// poi导入
export async function uploadPoi(file) {
  const mapStore = useMapStore()
  const layerStore = useLayerStore()
  const { adduploadPoiLayer } = layerStore
  try {
    const json = await parseGeoJSON(file.raw)
    const features = readFeatures(json)

    if (!features.length) {
      ElMessage.warning('文件中没有可显示的要素')
      return
    }
    //样式
    //图层
    const poiVectorSource = new VectorSource({features: features})
    const cluster = new Cluster({
      source: poiVectorSource,
      distance: 10
    })
    const poiLayer = new VectorLayer({
      source: cluster,
      //name: file.name用于存入图层树时得到文件名并存入，type: 'POI'用于空间查询只查询POI图层的
      properties: {name: file.name, type: 'POI'},
      style: poiClusterStyle
    })
    mapStore.mapInstance.addLayer(poiLayer)
    // 存入图层树
    const ob = {
      id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'POI',
      name: poiLayer.get('name'),
      visible: true,
      olLayer: poiLayer,
      // 存入数据源，用于热力图
      //热力图和点聚合不能同时用同一个 source，要单独把数据源给一个变量
      source: poiVectorSource
    }
    adduploadPoiLayer(ob)
    ElMessage.success(`已导入 ${features.length} 个要素`)
  } catch (err) {
    console.error(err)
    ElMessage.error(err.message)
  }
}