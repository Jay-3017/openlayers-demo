import TileLayer from "ol/layer/Tile";
import { XYZ } from "ol/source";
import { create } from "ol/transform";

//底图配置
//- `BASEMAPS`：所有可选底图的清单（给图层树渲染下拉 / 列表用）
//- `DEFAULT_BASEMAP`：页面加载时默认显示哪个（给地图初始化用）
export const BASEMAPS = {
  gaodeVector: {
    id: 'gaodeVector',
    name: '高德矢量底图',
    layerKeys: ['gaodeVector'],
//如果把 `new TileLayer` 直接写在对象字面量里，模块一 import 就会执行 哪怕这个用户根本没勾选高德底图，
// 图层实例也被 new 出来了，白白占内存、发请求。包成函数后，勾选了才调用 `create()`
    create: () => ({
      gaodeVector: new TileLayer({
        source: new XYZ({
          url: 'https://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=7&x='
          + '{x}&y={y}&z={z}',
          crossOrigin: 'anonymous'
        })
      })
    })
  },
  //gaode
  gaodeImagery: {
    id: 'gaodeImagery',
    name: '高德影像底图',
    layerKeys: ['gaodeImagery'],
    create: () => ({
      gaodeImagery: new TileLayer({
        source: new XYZ({
          url: 'https://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=6&x='
          + '{x}&y={y}&z={z}',
          crossOrigin: 'anonymous'
        })
      })
    })
  },
  //tian
  tianVector: {
    id: 'tianVector',
    name: '天地图矢量底图',
    layerKeys: ['tianVector', 'tianVectorNote'],//底图+注记
    create: () => ({
      tianVector: new TileLayer({
        source: new XYZ({
          url: 'https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0'
          +'&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}'
          +'&TILECOL={x}&tk=197eb5fd3359ca9c9ef81de10c53225f',
          crossOrigin: 'anonymous'
        })
      }),
      tianVectorNote: new TileLayer({
        source: new XYZ({
          url: 'http://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0'
          +'&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}'
          +'&TILECOL={x}&tk=197eb5fd3359ca9c9ef81de10c53225f',
          crossOrigin: 'anonymous'
        })
      })
    })
  },
  tianImagery: {
    id: 'tianImagery',
    name: '天地图影像底图',
    layerKeys: ['tianImagery', 'tianImageryNote'],
    create: () => ({
      tianImagery: new TileLayer({
        source: new XYZ({
          url: 'https://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0'
          +'&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&'
          +'TILECOL={x}&tk=197eb5fd3359ca9c9ef81de10c53225f',
          crossOrigin: 'anonymous'
        })
      }),
      tianImageryNote: new TileLayer({
        source: new XYZ({
          url: 'http://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0'
          +'&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&'
          +'TILECOL={x}&tk=197eb5fd3359ca9c9ef81de10c53225f',
          crossOrigin: 'anonymous'
        })
      })
    })
  }
}
export const DEFAULT_BASEMAP = 'tianVector'