<script setup>
import AppFooter from './layout/AppFooter.vue';
import AppHeader from './layout/AppHeader.vue';
import LeftPanel from './layout/LeftPanel.vue';
import MapContain from './layout/MapContain.vue';
import MyTools from './layout/MyTools.vue';
import RightPanel from './layout/RightPanel.vue';

</script>

<template>
  <div class="contain">
    <div class="header">
      <AppHeader></AppHeader>
      <MyTools></MyTools>
    </div>
    <div class="main">
      <LeftPanel></LeftPanel>
      <MapContain class="mapContain"></MapContain>
      <RightPanel></RightPanel>
    </div>
    <div class="footer">
      <AppFooter></AppFooter>
    </div>
  </div>
</template>

<style scoped>
.contain {
  height: 100vh;
  width: 100vw;
  position: relative;
}
.main {
  display: flex;
  overflow: hidden;
  flex: 1;
  position: relative;
}
.footer {
  position: absolute;
  bottom: 0px;
}
.mapContain {
  flex: 1;
}
</style>
