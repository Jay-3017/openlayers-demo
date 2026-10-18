//校验、读取、写入
import GeoJSON from 'ol/format/GeoJSON'
export async function parseGeoJSON(file) {
  // 文件名转小写
  const name = file.name.toLowerCase()
  if (!name.endsWith('.geojson') && !name.endsWith('.json')) {
    throw new Error('仅支持geojson或json文件')
  }

  //
  let json
  try {
    //file.text()` 是 File API 的异步方法，把文件内容读成文本字符串
    json = JSON.parse(await file.text())
  } catch (e) {
    throw new Error('文件不合法: ')
  }
  
  // 3. 基本类型
  if (!json || typeof json !== 'object' || !json.type) {
    throw new Error('不是合法的 GeoJSON')
  }

  const validTypes = [
    'FeatureCollection', 'Feature',
    'Point', 'MultiPoint', 'LineString', 'MultiLineString',
    'Polygon', 'MultiPolygon', 'GeometryCollection'
  ]
  if (!validTypes.includes(json.type)) {
    throw new Error(`不支持的 GeoJSON 类型：${json.type}`)
  }
  return json
}
// 只负责：geojson → OpenLayers features
export function readFeatures(geojson, sourceProjection = 'EPSG:4326') {
  const format = new GeoJSON({
      dataProjection: sourceProjection,
      featureProjection: 'EPSG:3857'
    })
    return format.readFeatures(geojson)
}