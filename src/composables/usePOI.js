// config/poiStyle.js
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style'

export const poiSingleStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: '#00c2d1' }),
    stroke: new Stroke({ color: '#fff', width: 1.5 })
  })
})

const clusterCache = {}

export function poiClusterStyle(feature) {
  const features = feature.get('features')
  if (!features || features.length === 0) return poiSingleStyle
  const size = features.length
  if (size === 1) return poiSingleStyle
  if (clusterCache[size]) return clusterCache[size]

  const radius = Math.min(10 + Math.log2(size) * 3, 22)
  clusterCache[size] = new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color: 'rgba(0, 194, 209, 0.75)' }),
      stroke: new Stroke({ color: '#fff', width: 2 })
    }),
    text: new Text({
      text: String(size),
      font: 'bold 12px sans-serif',
      fill: new Fill({ color: '#fff' })
    })
  })
  return clusterCache[size]
}