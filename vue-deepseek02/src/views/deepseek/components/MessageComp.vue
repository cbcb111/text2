<template>
  <div class="container-message" id="messageCompBox">
    <!--有内容 start-->
    <template v-if="message.length > 0">
      <div
        class="box-item"
        v-for="(item, index) in message"
        :key="`message_${index}`"
      >
        <div
          :class="[
            'message-item',
            item.role === 'assistant'
              ? 'message-item-assistant'
              : 'message-item-user',
          ]"
          v-if="item.role === 'assistant' || item.content"
        >
          <!--显示头像 start-->
          <el-avatar
            class="message-item-avatar"
            v-if="item.role === 'assistant'"
          >
            <img src="../images/ai.png" />
          </el-avatar>
          <div v-else></div>
          <!--显示头像 end-->
          <!--显示对话内容 start-->
          <div
            :class="[
              'message-item-content',
              item.role === 'assistant'
                ? 'message-item-content-left'
                : 'message-item-content-right',
            ]"
          >
            <div class="message-item-text">
              <Markdown v-loading :source="item.content || '思考中...'" />
            </div>
          </div>
          <!--显示对话内容 end-->
          <!--显示用户头像 start -->
          <el-avatar
            class="message-item-avatar"
            v-if="item.role !== 'assistant'"
          >
            <img src="../images/user.png" />
          </el-avatar>
          <div v-else></div>
          <!--显示用户头像 end-->
        </div>
      </div>
    </template>
    <!--有内容 end-->
    <!--无内容 start -->
    <template v-else>
      <div class="empty-box">
        <el-empty description="暂无对话消息"> </el-empty>
      </div>
    </template>
    <!--无内容 end -->
  </div>
</template>

<script setup lang="ts">
import { nextTick, watch } from "vue";
import Markdown from "vue3-markdown-it";
interface MessageItem {
  role: "user" | "assistant";
  content: string;
  name?: string;
}
// 接收父组件传递过来的数据
const props = defineProps({
  message: {
    type: Array,
    default: () => [],
  },
});
console.log(props.message);

/**
 * 滚动到底部函数
 * 该函数用于在下次DOM更新循环结束时，自动滚动至具有特定ID的元素的底部
 */
const scrollBottom = async () => {
  // 等待Vue完成对DOM的渲染
  await nextTick();
  // 获取ID为"messageCompBox"的元素
  const div = document.getElementById("messageCompBox");
  // 如果元素存在，则滚动到该元素的底部
  if (div) {
    div.scrollTop = div.scrollHeight - div.clientHeight;
  }
};
// 将 scrollBottom 方法暴露给父组件或其他引用该组件的地方，
// 使得外部可以直接调用该方法。
defineExpose({
  scrollBottom,
});
// 监听 message 的变化并自动滚动到底部
watch(
  () => props.message,
  () => {
    scrollBottom();
  },
  { deep: true }
);
</script>

<style scoped>
.container-message {
  /** 宽度100% */
  width: 100%;
  /** 高度100% */
  height: 100%;
  /** 设置元素的溢出文本处理方式为自动 */
  overflow: auto;
}
.empty-box {
  /** 宽度100% */
  width: 100%;
  /** 高度100% */
  height: 100%;
  /**使用flex布局 */
  display: flex;
  /** 设置Flex容器的子元素在主轴方向上的对齐方式为居中对齐 */
  justify-content: center;
  /** 将Flex容器的项目在交叉轴上居中对齐 */
  align-items: center;
}
.box-item {
  /** 设置底部边距为12px */
  margin-bottom: 12px;
}
.message-item {
  /** 设置网格布局 */
  display: grid;
  /** 设置列之间的间隔为8像素 */
  column-gap: 8px;
}
.message-item-user {
  /** 第一列宽度为0%，第二列为自动宽度，第三列为固定40px。 */
  grid-template-columns: 0% auto 40px;
  /** 设置Flex容器的子元素在主轴上的排列方式为末尾对齐 */
  justify-content: end;
}
.message-item-assistant {
  /* 设置栅格模板列宽，分别为40像素、自动和1% */
  grid-template-columns: 40px auto 1%;
  /* 从起始位置对齐内容 */
  justify-content: start;
}
.message-item-avatar {
  /** 设置元素的宽度为36像素*/
  width: 36px;
  /** 设置元素的高度为36像素 */
  height: 36px;
  /** 设置元素的背景颜色为白色 */
  background-color: #ffffff;
  /**设置元素的边框为2像素实线，颜色为浅蓝色 */
  border: 2px solid #409eff;
  /** 设置元素的内边距为4像素 */
  padding: 4px;
}
.message-item-content {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
  /** 设置元素的位置为相对位置 */
  position: relative;
  /** 设置元素的边框为4像素圆角 */
  border-radius: 8px;
}
/* AI消息（左侧） */
.message-item-assistant .message-item-content {
  background-color: #ffffff; /* 白色背景 */
  border: 1px solid #dcdfe6; /* 浅灰色边框 */
}
/* 用户消息（右侧） */
.message-item-user .message-item-content {
  background-color: #ecf5ff;
}
.message-item-content-left::before,
.message-item-content-right::before {
  content: "";
  width: 0;
  height: 0;
  position: absolute;
  border: 5px solid transparent;
  top: 15px;
}
.message-item-content-left::before {
  /** 设置右边框的颜色为蓝色 */
  border-right-color: #409eff;
  /** 将元素的左边距设置为负9像素 */
  left: -9px;
}
.message-item-content-right::before {
  /** 设置左边框的颜色为蓝色 */
  border-left-color: #409eff;
  /**将元素的右边距设置为负9像素 */
  right: -9px;
}
.message-item-text {
  /** 设置元素的内边距为上下0rem，左右12px */
  padding: 0rem 12px;
  /** 设置元素的字体颜色为白色 */
  color: #606266;
  /** 设置元素的位置为相对位置 */
  position: relative;
  /** 设置元素的字体大小为0.875rem */
  font-size: 0.875rem;
  /** 设置元素的行高为1.4 */
  line-height: 1.4;
}
:deep(p) {
  /** 设置段落的边距为0.5rem */
  margin: 0.5rem 0;
}
:deep(pre) {
  /** 设置代码块的边距为0.5rem */
  margin: 0.5rem 0;
  /** 设置代码块的字体大小为0.8125rem */
  font-size: 0.8125rem;
  /** 设置代码块的最大宽度为100% */
  max-width: 100%;
  /** 设置代码块的溢出方式 */
  overflow-x: auto;
  /** 设置代码块的换行方式 */
  white-space: pre-wrap;
  /** 设置允许长单词进行自动换行 */
  word-wrap: break-word;
}
:deep(code) {
  /** 设置代码块的字体大小为0.8125rem */
  font-size: 0.8125rem;
  /** 设置代码块的最大宽度为100% */
  max-width: 100%;
  /** 设置代码块的溢出方式 */
  overflow-x: auto;
  /** 设置代码块的换行方式 */
  white-space: pre-wrap;
  /** 设置允许长单词进行自动换行 */
  word-wrap: break-word;
}
</style>
