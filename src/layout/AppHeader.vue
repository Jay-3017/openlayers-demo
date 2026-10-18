<script setup>
import { BASEMAPS } from '@/config/basemaps';
import { useMapStore } from '@/stores/mapStore';
import { storeToRefs } from 'pinia'
const mapStore = useMapStore()
const { currentBasemap } = storeToRefs(mapStore)

const options = Object.values(BASEMAPS).map(b => ({
  label: b.name,
  value: b.id
}))

function handleSelect(id) {
  mapStore.switchBasemap(id)
}
</script>

<template>
  <div class="AppHeader">
    <div class="logo"><img src="/public/logo.png" alt=""></div>
    <div class="name">CityScope空间分析平台</div>
    <el-select @change="handleSelect" placeholder="选择底图(默认高德矢量底图)" 
    :model-value="currentBasemap" style="width: 230px;" class="select">
      <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
      ></el-option>
    </el-select>
    <div><a href="">GitHub</a></div>
    <div>|</div>
    <div><a href="">关于</a></div>
  </div>
</template>

<style scoped>
.AppHeader {
  width: 100%;
  height: 56px;
  display: flex;
  padding: 0px 20px;
  background-color: #1e2630;
  align-items: center;
  color: #e6edf3;
}
img {
  width: 56px;
}
a {
  text-decoration: none;
  text-align: center;
  color: #e6edf3;
}
.name {
  margin-right: 300px;
}
.select {
margin-right: 50px;
}
a:hover {
  color: rgb(123, 187, 194);
}
</style>