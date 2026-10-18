import { useMapStore } from "@/stores/mapStore";
import { toLonLat } from "ol/proj";

export function useMapCoordinate() {
  const mapStore = useMapStore()

  function throttle(fn, t) {
    let last = 0
    return function (e) {
      const now = Date.now()
      if (now - last >= t) {
        last = now
        fn(e)
      }
    }
  }
  
  function bindCoordinate(map) {
    const handler = (e) => {
      const [lon, lat] = toLonLat(e.coordinate)
      mapStore.updateCoordinate(lon.toFixed(2), lat.toFixed(2))
      mapStore.updateZoom(map.getView().getZoom())
    }
    const onMove = throttle(handler, 100)
    map.on('pointermove', onMove)
    map.getView().on('change:resolution', () => {
      mapStore.updateZoom(map.getView().getZoom())
    })
    return () => {
      map.un('pointermove', onMove)
    }
  }
  return {  bindCoordinate  }
}