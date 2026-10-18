<script setup>
import { useMapStore } from '@/stores/mapStore';
import { useUistore } from '@/stores/uiStore';
import { ElMessage } from 'element-plus';
import { storeToRefs } from 'pinia';
//折叠
const uiStore = useUistore()
const { isFold } = storeToRefs(uiStore)
function handleFold () {
  isFold.value = !isFold.value
}
//定位
const mapStore = useMapStore()
async function handleLocation() {
  const res = await fetch('https://restapi.amap.com/v3/ip?key=56944a97f1060ba8f2539de900dad81e')
  const data = await res.json()
  console.log(data);
  
   if (data.status !== '1' || data.rectangle.length === 0) {
    ElMessage.warning('定位失败')
    return
  }
  const [lb, rt] = data.rectangle.split(';')
  const [minLng, minLat] = lb.split(',').map(Number)
  const [maxLng, maxLat] = rt.split(',').map(Number)
  mapStore.locateTo((minLng + maxLng) / 2, (minLat + maxLat) / 2, 10)
}
// 框选结果展示 以及定位
const { queryData } = storeToRefs(mapStore)
function toFeatureLocation(e) {
  mapStore.locateToFeature(e)
}
</script>

<template>
  <div class="rightPanel" :class="{'fold': isFold}">
    <span class="foldSpan" @click="handleFold">{{ isFold ? '<' : '>' }}</span>
    <!-- 回到初始，函数在mapStore里 -->
    <el-button @click="mapStore.goHome()" class="back" type="primary" circle>
      <img src="/public/home.png" alt="">
    </el-button>
    <el-button @click="handleLocation" class="location" type="primary" circle>
      <img src="/public/location.png" alt="">
    </el-button>
    <div class="queryResult">框选查询结果(点击定位)
      <el-card class="card" shadow="hover" v-for="item in queryData" @click="toFeatureLocation(item)">
        {{ item.name }}
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.rightPanel {
  background-color: #29313b;
  width: 18vw;
  height: calc(100vh - 28px - 56px);
  right: 0;
  position: absolute;
  transition: right 0.3s ease;
}
.foldSpan {
  background-color: #29313b;
  color: #e6edf3;
  position: absolute;
  left: -14px;
  border-radius: 20px;
  padding: 8px;
}
.back {
  background-color: #a0bbdc;
  position: absolute;
  left: -55px;
  top: 6px;
  border-radius: 50%;
  padding: 8px;
}
.location {
  background-color: #a0bbdc;
  position: absolute;
  left: -103px;
  top: 6px;
  border-radius: 50%;
  padding: 8px;
}
img {
  width: 25px;
}
span:hover {
  color: black;
}
.fold {
  right: -18vw;
}
.queryResult {
  background-color: #2f3843;
  width: 200px;
  height: 250px;
  position: absolute;
  top: 50px;
  overflow: auto;
  color: #e6edf3;
}
.card {
  width: 170px;
  background-color: bisque;
  margin: 5px;
  cursor: pointer;
}
</style>