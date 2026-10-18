<script setup>
import { useMapStore } from '@/stores/mapStore';
import { storeToRefs } from 'pinia';

const mapStore = useMapStore()
const {coordinate, zoom, status} = storeToRefs(mapStore)
</script>

<template>
  <div class="footer">
    <div class="im"><img src="/public/status.png" alt="" style="width: 20px;"></div>
    <div class="coordinate">鼠标坐标：{{ coordinate[0]}},{{ coordinate[1] }}</div>
    <div class="zoom">缩放层级: {{ zoom?.toFixed(2) }}</div>
    <div class="status">当前操作提示: {{ status }}</div>
  </div>
</template>

<style scoped>
.footer {
  width: 100vw;
  height: 28px;
  background-color: #252e3a;
  display: flex;
  color: #e6edf3;
  gap: 30px;
  align-items: center;
}
.im {
  margin-left: 200px;
}
</style>