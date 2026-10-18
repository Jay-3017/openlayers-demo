<script setup>
import { toBuffer, selectAnalysis, overlayAnalysis, isochroneAnalysis, nearstPointAnalysis, clearCenter, clearIsochrone } from '@/composables/useAnalysis';
import { selectQuery } from '@/composables/useQuery';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useLayerStore } from '@/stores/layerStore';
import { useUistore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue'
// query查询
const options = [
  {value: 'clickQuery', label: '点击查询'},
  {value: 'boxQuery', label: '框选查询'},
  {value: 'exit', label: '退出查询'},
]
function handleSelect(e) {
  selectQuery(e)
}
// 空间分析工具
const uiStore = useUistore()
const analysisStore = useAnalysisStore()
const { radius } = storeToRefs(analysisStore)
const { 
  isShowAlert, isShowForm, isShowOverlayForm, isShowisochroneAlert, isShowisochroneForm,
  isShowNearstForm, isDisabled
} = storeToRefs(uiStore)
const { analysisOptions, overlayOptions, time, isochroneMethod } = uiStore

function handleAnalysis(e) {
  selectAnalysis(e)
}
// 表单数据
const formData = ref({
  radius: ''
})
// 名字
const bufferName = ref('name')
// 表单校验规则：0.1 ~ 100
const rules = ref({
  radius: [
    { required: true, message: '请输入缓冲区半径', trigger: 'blur' },
    {
      type: 'number',
      min: 0.1,
      max: 100,
      message: '半径范围必须在 0.1 ~ 100 km',
      trigger: 'blur'
    }
  ]
})
// 获取form实例，用于手动校验
const formRef = ref()
// 确认按钮点击事件
const bufferSubmit = async () => {
  await formRef.value.validate((valid) => {
    if (valid) {
      radius.value = formData.value.radius
      isShowForm.value = false
      toBuffer(bufferName.value)
    }
  })
}//
//叠加分析表单
// 获取图层树的所有缓冲区图层以及行政区图层
const layerStore = useLayerStore()
const { layer } = layerStore
const bufferLayer = layer[3].children
const regionLayer = layer[0].children
const poiLayer = layer[1].children
// 提交所得
const overlayFormData = ref({
  name: 'name',
  method: '',
  bufferLayer: '',
  regionLayer: ''
})
// 读取图层树的缓冲区图层
// 提交
function overlayFormSubmit() {
  overlayAnalysis(overlayFormData.value)
  overlayFormData.value = {
    name: 'name',
    method: '',
    bufferLayer: '',
    regionLayer: ''
  }
}
// 取消
function overlayFormCancel() {
  overlayFormData.value = {
    name: 'name',
    method: '',
    bufferLayer: '',
    regionLayer: ''
  }
  isDisabled.value = false
  isShowOverlayForm.value = false
}

//等时圈表单
const isochroneForm = ref({
  method: '',
  time: ''
})
// 提交
function isochroneFormSubmit() {
  isochroneAnalysis(isochroneForm.value)
  isochroneForm.value = {
  method: '',
  time: ''
  }
}
// 取消
function isochroneFormCancel() {
  isShowisochroneForm.value = false
  isochroneForm.value = {
  method: '',
  time: ''
  }
  clearIsochrone()
  isDisabled.value = false
}
//最近设施表单
const nearstForm = ref({
  poiLayer: ''
})
function nearstFormSubmit() {
  nearstPointAnalysis(nearstForm.value)
  nearstForm.value = {
    poiLayer: ''
  }
}
function nearstFormCancel() {
  nearstForm.value = {
    poiLayer: ''
  }
  isShowNearstForm.value = false
  clearCenter()
  isDisabled.value = false
}
// 核密度表单
// const kdeForm = ref({
//   poiLayer: ''
// })
// function kdeFormSubmit() {
//   kdeAnalysis(kdeForm.value)
// }
// function kdeFormCancel() {}
</script>

<template>
  <div class="toolsMain">
    <el-select style="width: 130px;" 
    size="small" 
    class="elSelect" placeholder="空间查询工具"
    @change="handleSelect"
    >
      <el-option 
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.label"
      ></el-option>
    </el-select>

    <el-select style="width: 130px;" 
    size="small" 
    class="elSelect" placeholder="空间分析工具"
    @change="handleAnalysis"
    :disabled="isDisabled"
    >
      <el-option 
      v-for="item in analysisOptions"
      :key="item.value"
      :label="item.label"
      :value="item.label"
      ></el-option>
    </el-select>
    <el-alert title="选择一个或多个要素,回车确认" 
    type="primary" style="margin: 20px;" v-if="isShowAlert"/>

    <el-alert title="点击地图选择一个中心点,回车确认" 
    type="primary" style="margin: 20px;" v-if="isShowisochroneAlert"/>

    <el-form ref="formRef" class="form" :model="formData" :rules="rules" v-if="isShowForm">缓冲区分析
      <el-form-item label="请输入半径（单位：千米km）" prop="radius">
        <el-input v-model.number="formData.radius" type="number" step="0.1"></el-input>
      </el-form-item>
      <el-form-item label="请给图层命名">
        <el-input placeholder="name" v-model="bufferName"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="bufferSubmit">确认</el-button>
      </el-form-item>
    </el-form>

    <el-form class="form" v-if="isShowOverlayForm" :model="overlayFormData">
      对已生成的缓冲区与行政区做相交或擦除运算
      <el-form-item label="名称：">
        <el-input placeholder="name" v-model="overlayFormData.name"></el-input>
      </el-form-item>
      <el-form-item label="选择方式:">
        <el-select v-model="overlayFormData.method" 
        size="small" style="width: 200px;" placeholder="未选择方式">
          <el-option 
          v-for="item in overlayOptions"
          :label="item.label"
          :value="item.value"
          :key="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <!--  -->
      <el-form-item label="选择缓冲区图层:">
        <el-select 
        v-model="overlayFormData.bufferLayer" size="small" 
        style="width: 200px;" placeholder="未选择图层">
        <el-option 
        v-for="item in bufferLayer"
        :key="item.id"
        :value="item.name"
        :props="{label: 'name'}"
        ></el-option>
        </el-select>
      </el-form-item>
      <!--  -->
      <el-form-item label="选择行政区图层:">
        <el-select
        v-model="overlayFormData.regionLayer"
        size="small"
        style="width: 200px;" placeholder="未选择图层">
        <el-option
        v-for="item in regionLayer"
        :key="item.id"
        :value="item.name"
        :props="{label: 'name'}"
        ></el-option>
      </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="overlayFormSubmit">确认</el-button>
      </el-form-item>
      <el-form-item>
        <el-button @click="overlayFormCancel">取消</el-button>
      </el-form-item>
    </el-form>

    <el-form class="form" :model="isochroneForm" v-if="isShowisochroneForm">等时圈分析
      <el-form-item label="选择出行方式:">
        <el-select v-model="isochroneForm.method" placeholder="未选择出行方式">
          <el-option 
          v-for="item in isochroneMethod"
          :label="item.label"
          :value="item.value"
          :key="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="时长:">
        <el-select v-model="isochroneForm.time" placeholder="未选择时长">
          <el-option
          v-for="item in time"
          :label="item.label"
          :value="item.value"
          :key="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-item>
        <el-button style="margin: 10px;" @click="isochroneFormSubmit">确认</el-button>
      </el-item>
      <el-item>
        <el-button @click="isochroneFormCancel">取消</el-button>
      </el-item>
    </el-form>

    <el-form class="form" :model="nearstForm" v-if="isShowNearstForm">
      选择一个POI图层，计算并标注最近的设施
      <el-form-item label="选择POI图层:">
        <el-select
        v-model="nearstForm.poiLayer"
        size="small"
        style="width: 200px;" placeholder="未选择图层">
        <el-option
        v-for="item in poiLayer"
        :key="item.id"
        :value="item.name"
        :props="{label: 'name'}"
        ></el-option>
      </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="nearstFormSubmit">确认</el-button>
      </el-form-item>
      <el-form-item>
        <el-button @click="nearstFormCancel">取消</el-button>
      </el-form-item>
    </el-form>
<!--  -->
    <!-- <el-form class="form" :model="kdeForm" v-if="isShowKdeForm">
      <el-form-item>核密度分析
        <el-select placeholder="未选择图层" v-model="kdeForm.poiLayer">
          <el-option
          v-for="item in poiLayer"
          :key="item.id"
          :value="item.name"
          :props="{label: 'name'}"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>

      <el-button @click="kdeFormSubmit">确认</el-button>
      </el-form-item>
      <el-form-item>
        <el-button >取消</el-button>
      </el-form-item>
    </el-form> -->
  </div>
</template>

<style scoped>
.toolsMain {
  width: 470px;
  height: 40px;
  border: 2px solid rgba(128, 126, 123, 0.8);
  border-radius: 10px;
  background-color: rgba(228, 220, 205, 0.8);
  position: absolute;
  left: 250px;
  top: 70px;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.elSelect {
  margin-top: 6px;
  margin-left: 5px;
}
.form {
  border: 2px solid #3896f5; /* element plus主题蓝 */
  background-color: rgba(216, 225, 235, 0.63); /* 蓝色，透明度0.15 */
  border-radius: 4px;
  padding: 10px;
  margin-top: 250px;
  margin-left: 50px;
}
</style>