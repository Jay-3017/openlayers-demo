import { defineStore } from "pinia";
import { markRaw, shallowRef, triggerRef } from "vue";
import { useMapStore } from "./mapStore";
import { storeToRefs } from "pinia";

//

export const useLayerStore = defineStore('layer', () => {
  //olLayer 是 OpenLayers 对象，直接放 ref 数组里会被深度代理。
  // 要么 markRaw，要么整个 layers 用 shallowRef
  const layer = shallowRef([
    {
      id: 'region',
      name: '矢量图层',
      visible: true,
      children: []
    },
    {
      id: 'poi',
      name: 'POI图层',
      visible: true,
      children: []
    },
    {
      id: 'heatMap',
      name: '热力图层',
      visible: true,
      children: []
    },
    {
      id: 'buffer',
      name: '缓冲区图层',
      visible: true,
      children: []
    },
    {
      id: 'overlay',
      name: '叠加分析图层',
      visible: true,
      children: []
    },
    {
      id: 'isochrone',
      name: '等时圈分析图层',
      visible: true,
      children: []
    },
    {
      id: 'nearst',
      name: '最近设施分析图层',
      visible: true,
      children: []
    },

  ])
  // 行政区划图层
  function addUploadLayer(ob) {
    const node = {
      //...ob：对象展开，把传入ob 里面所有属性全部复制到新对象里
      //也就是把对象的大括号拆开，然后加进另一个新对象
      //markRaw告诉 Vue 不要把这个 OpenLayers 图层实例变成响应式。
      ...ob,
      olLayer: markRaw(ob.olLayer)
    }
    layer.value[0].children.push(node)
    //告诉vue更新了
    triggerRef(layer)
  }
  // poi图层
  function adduploadPoiLayer(ob) {
    const node = {
      ...ob,
      olLayer: markRaw(ob.olLayer)
    }
    layer.value[1].children.push(node)
    triggerRef(layer)
  }
  // 热力图层
  function addHeatmapLayer(ob) {
    const node = {
      ...ob,
      olLayer: markRaw(ob.olLayer)
    }
    layer.value[2].children.push(node)
    triggerRef(layer)
  }
  // 缓冲区图层
  function addBufferLayer(ob) {
    const node = {
      ...ob,
      olLayer: markRaw(ob.olLayer)
    }
    layer.value[3].children.push(node)
    triggerRef(layer)
  }
  //叠加分析图层
  function addOverlayLayer(ob) {
    const node = {
      ...ob,
      olLayer: markRaw(ob.olLayer)
    }
    layer.value[4].children.push(node)
    triggerRef(layer)
  }
  //等时圈图层
  function addIsochroneLayer(ob) {
    const node = {
      ...ob,
      olLayer: markRaw(ob.olLayer)
    }
    layer.value[5].children.push(node)
    triggerRef(layer)
  }
  //最近设施图层
  function addNearstLayer(ob) {
    const node = {
      ...ob,
      olLayer: markRaw(ob.olLayer)
    }
    layer.value[6].children.push(node)
    triggerRef(layer)
  }
  // 隐藏显示
  function toggleVisible(data) {
    // 控制全部
    if (data.id === 'region') {
      layer.value[0].visible = !layer.value[0].visible
      layer.value[0].children.forEach(group => {
        layer.value[0].visible ? group.visible = false : group.visible = true
        group.olLayer.setVisible(layer.value[0].visible)
      })
      return
    }
    if (data.id === 'poi') {
      layer.value[1].visible = !layer.value[1].visible
      layer.value[1].children.forEach(group => {
        layer.value[1].visible ? group.visible = false : group.visible = true
        group.olLayer.setVisible(layer.value[1].visible)
      })
      return
    }
    if (data.id === 'heatMap') {
      layer.value[2].visible = !layer.value[2].visible
      layer.value[2].children.forEach(group => {
        layer.value[2].visible ? group.visible = false : group.visible = true
        group.olLayer.setVisible(layer.value[2].visible)
      })
      return
    }
    if (data.id === 'buffer') {
      layer.value[3].visible = !layer.value[3].visible
      layer.value[3].children.forEach(group => {
        layer.value[3].visible ? group.visible = false : group.visible = true
        group.olLayer.setVisible(layer.value[3].visible)
      })
      return
    }
    if (data.id === 'overlay') {
      layer.value[4].visible = !layer.value[4].visible
      layer.value[4].children.forEach(group => {
        layer.value[4].visible ? group.visible = false : group.visible = true
        group.olLayer.setVisible(layer.value[4].visible)
      })
      return
    }
    if (data.id === 'isochrone') {
      layer.value[5].visible = !layer.value[5].visible
      layer.value[5].children.forEach(group => {
        layer.value[5].visible ? group.visible = false : group.visible = true
        group.olLayer.setVisible(layer.value[5].visible)
      })
      return
    }
    if (data.id === 'nearst') {
      layer.value[6].visible = !layer.value[6].visible
      layer.value[6].children.forEach(group => {
        layer.value[6].visible ? group.visible = false : group.visible = true
        group.olLayer.setVisible(layer.value[6].visible)
      })
      return
    }
    // 控制单个

    let gIdx = -1
    let target = null
    layer.value.forEach((group, idx) => {
      const found = group.children?.find(c => c.id === data.id)
      if (found) {
        gIdx = idx
        target = found
      }
    })
    if (!target) return
    //
    const nextVisible = !target.visible
    target.olLayer?.setVisible(nextVisible)
    
    layer.value = layer.value.map((group, idx) =>
      idx === gIdx
        ? {
            ...group,
            children: group.children.map(c =>
              c.id === data.id ? { ...c, visible: nextVisible } : c
            )
          }
        : group
    )
  }
  // 删除
  function removeLayer(data) {
    const mapStore = useMapStore()
    const { mapInstance } = storeToRefs(mapStore)
    if (data.id === 'region') {
      layer.value[0].children.forEach(group => {
        mapInstance.value.removeLayer(group.olLayer)
        layer.value[0].children = []
        triggerRef(layer)
      })
      return
    }
    if (data.id === 'poi') {
      layer.value[1].children.forEach(group => {
        mapInstance.value.removeLayer(group.olLayer)
        layer.value[1].children = []
        triggerRef(layer)
      })
      return
    }
    if (data.id === 'heatMap') {
      layer.value[2].children.forEach(group => {
        mapInstance.value.removeLayer(group.olLayer)
        layer.value[2].children = []
        triggerRef(layer)
      })
      return
    }
    if (data.id === 'buffer') {
      layer.value[3].children.forEach(group => {
        mapInstance.value.removeLayer(group.olLayer)
        layer.value[3].children = []
        triggerRef(layer)
      })
      return
    }
    if (data.id === 'overlay') {
      layer.value[4].children.forEach(group => {
        mapInstance.value.removeLayer(group.olLayer)
        layer.value[4].children = []
        triggerRef(layer)
      })
      return
    }
    if (data.id === 'isochrone') {
      layer.value[5].children.forEach(group => {
        mapInstance.value.removeLayer(group.olLayer)
        layer.value[5].children = []
        triggerRef(layer)
      })
      return
    }
    if (data.id === 'nearst') {
      layer.value[6].children.forEach(group => {
        mapInstance.value.removeLayer(group.olLayer)
        layer.value[6].children = []
        triggerRef(layer)
      })
      return
    }
 
    // 单个去除
    let groupIndex = -1
    let target = null
    layer.value.forEach((group, idx) => {
      const found = group.children.find(child => {
        return child.id === data.id
      })
      if (found) {
        groupIndex = idx
        target = found
      }
    })
    if (!target) return   // 没找到，直接返回
    // 从地图移除
    if (target.olLayer) {
      mapInstance.value.removeLayer(target.olLayer)
    }
    // 从 store 里移除
    layer.value = layer.value.map((group, idx) =>
      idx === groupIndex
        ? { ...group, children: group.children.filter(c => c.id !== data.id) } : group
    )
    }
    return {
      layer, 
      addUploadLayer, adduploadPoiLayer, addHeatmapLayer, addBufferLayer,addOverlayLayer,
      addIsochroneLayer, addNearstLayer,
      toggleVisible, removeLayer,
    }
})