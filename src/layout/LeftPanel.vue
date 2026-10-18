<script setup>
import { ref, watch } from 'vue'
import { upload, uploadPoi } from '@/composables/useGeoJSON'
import { useLayerStore } from '@/stores/layerStore'
import { storeToRefs } from 'pinia'
import { ElButton, ElTooltip } from 'element-plus'
import { createHeatMap } from '@/composables/useHeatmap'

const isFold = ref(false)
function handleFold () {
  isFold.value = !isFold.value
}
// 上传文件
async function handleUpload(file) {
  upload(file)
}
async function handleUploadPoi(file) {
  uploadPoi(file)
}
// 图层树
const layerStore = useLayerStore()
const { layer } = storeToRefs(layerStore)
const treeKey = ref(0)
// 监听强制刷新图层树
watch(() => layer.value[0].children.length, () => {
  treeKey.value++
})
watch(() => layer.value[1].children.length, () => {
  treeKey.value++
})
watch(() => layer.value[2].children.length, () => {
  treeKey.value++
})
watch(() => layer.value[3].children.length, () => {
  treeKey.value++
})
watch(() => layer.value[4].children.length, () => {
  treeKey.value++
})
watch(() => layer.value[5].children.length, () => {
  treeKey.value++
})
watch(() => layer.value[6].children.length, () => {
  treeKey.value++
})
// el图层树自定义节点内容
// 删除
const remove = (data) => {
  layerStore.removeLayer(data)
}
const setVisible = (data) => {
  layerStore.toggleVisible(data)
}
const renderContent = (h, {node, data}) => {
  return h(
    'div',
    {style: 'display: flex; align-items: center; justify-content: space-between; gap: 2px'},
    [
      h('div', null, [
        h(ElButton, {
          type: 'primary', 
          style: 'height: 10px; width: 15px; font-size: 11px;',
          onClick: () => setVisible(data)
        },
        {default: () => '隐藏'},)
      ]),
      h('div', null, [
        h(ElButton, {
          type: 'danger', 
          style: 'height: 10px; width: 15px; font-size: 11px;',
          onClick: () => remove(data)
        },
        {default: () => '删除'},)
      ]),
      h(ElTooltip, {
        content: node.label,
        placement: 'top',
        effect: 'dark'
      }, {
        default: () => h('span', {
          style: `
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          `
        }, node.label)
      })
    ]
  )
}
// 热力图
// heatMap需要数字型，在el-option要在value前面加上：
const radius = ref(10)
const select = ref('')
function clickHeatMap(radius, selectId) {
  createHeatMap(radius, selectId)
  //select拿到的为id
}
</script>

<template>
  <div class="leftPanel" :class="{'fold': isFold}">
    <span @click="handleFold">{{isFold ? '>' : '<'}}</span>
    <el-upload 
        @change="handleUpload"
        :auto-upload="false"
        class="upload"
        accept=".geojson,application/geo+json"
        ><el-button>上传行政区GeoJSON</el-button></el-upload>
    <el-upload 
        @change="handleUploadPoi"
        :auto-upload="false"
        class="upload"
        accept=".geojson,application/geo+json"
        ><el-button>上传poi数据</el-button></el-upload>
    <em>上传GeoJSON文件</em>
    <div class="box">已添加的图层</div>
    <el-tree
    class="my-tree"
    :key="treeKey"
    ref="treeRef"
    :data="layer"
    :props="{ label: 'name' }"
    node-key="id"
    :render-content="renderContent"
    :default-expand-all='true'
    ></el-tree>
    <div class="radio">
      <el-button style="width: 80px;" @click="clickHeatMap(radius, select)">生成热力图</el-button>
      <el-select placeholder="请选择poi图层" v-model="select">
        <el-option 
        v-for="item in layer[1].children"
        :key="item.id"
        :value="item.id"
        :label="item.name"
        ></el-option>
      </el-select>
      <el-radio-group v-model="radius" size="small">
      <el-radio :value="10">10px</el-radio>
      <el-radio :value="20">20px</el-radio>
      <el-radio :value="30">30px</el-radio>
    </el-radio-group>
    </div>
  </div>
</template>

<style scoped>
.leftPanel {
  background-color: #2e3744;
  width: 21vw;
  height: calc(100vh - 28px - 56px);
  left: 0;
  position: absolute;
  transition: left 0.3s ease;
  z-index: 2;
}
span {
  background-color: #2e3744;
  color: #e2e8ed;
  position: absolute;
  right: -14px;
  border-radius: 20px;
  padding: 8px;
  z-index: 2;
}
span:hover {
  color: black;
}
.fold {
  left: -21vw;
}
.upload {
  width: 160px;
  margin-left: 20px;
}
em {
  color: #e6edf3;
}
:deep(.el-tree-node__content) {
  width: 100% !important;
  padding: 3px 4px !important;
  align-items: center;
}
:deep(.el-tree-node) {
  width:100%;
}
:deep(.el-tree-node__expand-icon) {
  flex-shrink: 0;
  margin-right:4px;
}
.radio {
  margin-top: 50px;
  background-color: #243751;
}
.box {
  margin: 20px 0 10px 10px;
  color: #e6edf3;
}
:deep(.my-tree) {
  border: 1px solid;
  border-radius: 10px;
}
</style>