<template>
  <router-view></router-view>
</template>
<script setup lang="ts">
import{onMounted}from 'vue';
onMounted(()=>{
  document.body.style.setProperty("--el--color--primary","#e99d53")
  document.body.style.setProperty("--el--color--primary-light-3","#e99d53")
  document.body.style.setProperty("--el--color--primary-light-9","#e99d53")
});
</script>
<style>
@import url(highlight.js/styles/default.css);
/**
  * 自定义滚动条样式，使其在Webkit渲染引擎下宽度为7px且不显示
  * 这里使用了CSS的伪元素选择器::-webkit-scrollbar来定制滚动条
  * 主要目的是为了提升用户界面的视觉效果和一致性
  */
*::-webkit-scrollbar {
  width: 7px;
  display: none;
}
/**
  * 自定义滚动条样式，使其在视觉上更加协调
  *
  * 这里使用了WebKit渲染引擎的CSS扩展，来修改滚动条的thumb（滑块）部分
  * 设置了滚动条滑块的样式，包括圆角、背景色，并默认隐藏滑块
   *
  * 注意：WebKit渲染引擎用于Safari、Chrome和一些基于它们的浏览器
  * 这种样式定制增强了用户界面的视觉效果，使其与网站的整体设计风格保持一致
  */
*::-webkit-scrollbar-thumb {
  /** 滚动条滑块的圆角 */
  border-radius: 8px;
  /** 滚动条滑块的背景色 */
  background-color: #03044a;
  /** 滚动条滑块的隐藏 */
  display: none;
}
/* 隐藏 WebKit 渲染引擎下的滚动条轨道，并设置其样式 */
*::-webkit-scrollbar-track {
  /* 完全隐藏滚动条轨道 */
  display: none;
  /* 设置轨道的圆角半径为 8 像素 */
  border-radius: 8px;
  /* 设置轨道的背景颜色为半透明的深蓝色 */
  background-color: #03044a87;
  /* 设置轨道的边框为 1 像素宽的半透明深蓝色实线 */
  border: 1px solid #03044a87;
}
/* 为Vue应用的主组件App设置样式
  * 使用CSS选择器#app来定位具有id为app的元素
   * 设置字体家族，确保在不同设备和浏览器上的一致性
  * 设置宽度和高度分别占据整个视口的100%，以适应各种屏幕尺寸
  */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  width: 100vw;
  height: 100vh;
}
</style>
