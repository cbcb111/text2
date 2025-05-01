<template>
  <div class="inner-html-container">
    <div class="page">
      <!--提示 start-->
      <div class="tips">
        <div class="title">基于大模型微调的医学知识问答系统</div>
        <div class="desc">
        </div>
        <div @click="handleClearStorage" class="pointer">清空</div>
      </div>
      <!--提示 end-->
      <!--内容 start-->
      <div class="grid-space-between grid-box">
        <!--左边对话框内容 start-->
        <div class="left-container">
          <el-button
            type="primary"
            class="add-btn"
            :icon="Plus"
            size="large"
            @click="handleAddSession"
            >新建对话</el-button
          >
          <div class="session-area">
            <div
              class="session-item"
              :class="activeIndex == index ? 'session-item-active' : ''"
              v-for="(item, index) in sessionList"
              :key="index"
              @click="handleChangeSessionIndex(index)"
            >
              <span
                :class="activeIndex == index ? 'active-node' : 'normal-node'"
                v-if="editIndex != index"
                >{{ item.title }}</span
              >
              <el-input
                :ref="`renameRef_${index}`"
                autofocus
                v-model="item.title"
                v-else
                size="small"
                style="width: 120px"
                @blur="editIndex = -1"
                @change="editIndex = -1"
              />
              <div class="icon-box">
                <el-icon
                  class="icon"
                  color="#fff"
                  @click.stop="handleClearSession(index)"
                >
                  <Brush />
                </el-icon>
                <el-icon
                  class="icon"
                  color="#fff"
                  @click.stop="handleFocusInput(index)"
                >
                  <EditPen />
                </el-icon>
                <el-icon
                  class="icon"
                  color="#fff"
                  @click.stop="handleDeleteSession(index)"
                >
                  <Delete />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
        <!--左边对话框内容 end-->
        <!--右边对话框内容 start-->
        <div class="container">
          <div class="message-area">
            <MessageComp
              ref="messageRef"
              :message="queryInfos.messages"
              :loading="loading"
            ></MessageComp>
          </div>
          <div class="input-area">
            <el-input
              v-model="queryKeys"
              id="keyInput"
              placeholder="请输入内容"
              show-word-limit
              @keydown.enter.native="
                (e) => {
                  if (e.isComposing || loading) return;
                  handleRequest();
                }
              "
            />
            <el-button
              style="height: 40px"
              type="primary"
              @click="handleRequest"
              :disabled="!queryKeys"
              :loading="loading"
            >
              <el-icon>
                <Promotion />
              </el-icon>
            </el-button>
          </div>
        </div>
        <!--右边对话框内容 end-->
      </div>
      <!--内容 end-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import axios from "axios";
//import OpenAI from "openai";             不用openai
import {
  Promotion,
  Delete,
  EditPen,
  Brush,
  Plus,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import MessageComp from "./components/MessageComp.vue";
import {
  OLLAMA_CONFIG as DEEPSEEK_CONFIG,
  STORAGE_KEYS,
} from "../../config/deepseek";

// 定义对话对象的类型
interface SessionItem {
  title: string;
  crtTime: Date;
  messages: any[];
}
// 响应式数据
const sessionList = ref<SessionItem[]>([]);
const activeIndex = ref<number>(-1);
const editIndex = ref<number>(-1);
const queryKeys = ref<string>("");
//const openai = ref<OpenAI | null>(null);          不用
import { OLLAMA_CONFIG } from "../../config/deepseek";
const ollamaConfig = ref(OLLAMA_CONFIG);
const loading = ref(false);
const messageRef = ref<InstanceType<typeof MessageComp> | null>(null); // 明确指定 messageRef 的类型
// 参数对象
const queryInfos = ref({
  messages: [] as any[],
  model: "deepseek-r1",
});

// 初始化会话列表
// 该函数通过从本地存储中获取会话列表数据，并将其解析为数组，用于初始化页面上的会话列表
const initSessionList = () => {
  sessionList.value = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.sessionList) || "[]"
  );
};
/**
 * 初始化索引的函数
 * 该函数用于在组件挂载时从本地存储中加载会话列表和活动索引信息
 * 并根据这些信息更新应用的状态
 */
const initIndex = () => {
  // 从本地存储中获取会话列表的长度，如果不存在，则默认为0
  const listLen = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.sessionList) || "[]"
  ).length;
  // 从本地存储中获取活动会话的索引，如果不存在，则默认为-1
  const lastIndex = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.activeIndex) || "-1"
  );
  // 如果会话列表存在，则更新活动索引为上一次的索引或0
  activeIndex.value = Math.max(0, Math.min(lastIndex, listLen - 1)); //加的
  if (listLen) {
    activeIndex.value = lastIndex || 0;
  } else {
    // 如果会话列表为空，则将活动索引设置为-1
    activeIndex.value = -1;
  }
  // 如果活动索引不为-1，则加载对应索引的会话消息到查询信息中
  if (activeIndex.value != -1) {
    queryInfos.value.messages =
      sessionList.value[activeIndex.value]?.messages || [];
  }
};
// 新增对话框的函数
const handleAddSession = () => {
  // 检查是否有查询正在进行
  if (loading.value) {
    // 如果有查询正在进行，显示警告消息
    ElMessage({ type: "warning", message: "请当前问题查询完成后重试！" });
    return;
  }
  // 创建新的对话框对象并添加到对话框列表中
  sessionList.value.push({
    title: `对话${sessionList.value.length + 1}`,
    crtTime: new Date(),
    messages: [],
  });
  // 清空查询信息的消息列表，准备新的对话
  queryInfos.value.messages = [];
  // 设置活动对话框索引为新添加的对话框
  activeIndex.value = sessionList.value.length - 1;
};

//编辑对话框
const handleFocusInput = (index: number) => {
  // 设置编辑索引为传入的索引
  editIndex.value = index;
};
/**
 * 切换会话索引
 *
 * 此函数用于切换当前活动的会话索引，并加载选中的会话历史记录
 * 如果系统正在处理查询，将显示警告消息，阻止用户切换会话
 *
 * @param {number} index - 用户想要切换到的会话索引
 */
const handleChangeSessionIndex = async (index: number) => {
  // 检查是否有查询正在进行
  if (loading.value) {
    // 如果有查询正在进行，显示警告消息并返回
    ElMessage({ type: "warning", message: "请当前问题查询完成后重试！" });
    return;
  }
  // 更新当前活动的会话索引
  activeIndex.value = index;
  // 根据新的会话索引加载会话消息
  queryInfos.value.messages =
    sessionList.value[activeIndex.value]?.messages || [];
  // 等待Vue完成对DOM的更新
  await nextTick();
  // 检查 messageRef 是否已成功获取到组件实例
  if (messageRef.value) {
    // 调用滚动底部函数
    messageRef.value.scrollBottom();
  }
};

/**
 * 处理删除会话操作
 *
 * 此函数通过弹出确认对话框来询问用户是否确认删除当前对话如果用户点击确定，
 * 则会从sessionList中移除对应的会话，并根据当前活动的会话索引调整activeIndex的值，
 * 以确保activeIndex总是指向有效的会话最后，调用handleChangeSessionIndex来处理会话变更
 *
 * @param {number} index - 默认为0，表示要删除的会话在sessionList中的索引
 */
const handleDeleteSession = (index = 0) => {
  // 弹出确认对话框，询问用户是否确认删除当前对话
  ElMessageBox.confirm("确认删除当前对话？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      // 用户确认删除后，从sessionList中移除对应的会话
      sessionList.value.splice(index, 1);
      // 如果当前活动的会话被删除，更新activeIndex以指向新的活动会话
      if (index == activeIndex.value) {
        activeIndex.value = sessionList.value[index] ? index : --index;
      } else if (index < activeIndex.value) {
        // 如果删除的会话索引小于当前活动会话索引，递减activeIndex
        activeIndex.value = --activeIndex.value;
      }
      // 更新当前活动会话的消息列表
      queryInfos.value.messages =
        activeIndex.value > -1
          ? sessionList.value[activeIndex.value].messages
          : [];
      // 调用处理会话索引变更的函数
      handleChangeSessionIndex(activeIndex.value);
    })
    .catch((err: any) => {
      console.log(err);
    });
};
const currentConfig = ref(DEEPSEEK_CONFIG);

//fetch API
const handleRequest = async () => {
  if (!queryKeys.value) return;

  // 添加用户消息
  queryInfos.value.messages.push({
    role: "user",
    content: queryKeys.value,
    name: "问答助手",
  });
  queryKeys.value = "";

  try {
    loading.value = true;
    // 添加助手消息占位
    queryInfos.value.messages.push({ role: "assistant", content: "" });

    // 使用 Fetch API 发送请求
    const response = await fetch("/ollama/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "hf-mirror.com/CCCBBB/doctor:latest",
        prompt:
          queryInfos.value.messages[queryInfos.value.messages.length - 2]
            .content,
        stream: true,
      }),
    });

    // 确认响应状态
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 获取可读流
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法获取流式响应");
    }

    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        const chunk = decoder.decode(value);
        try {
          const jsonChunk = JSON.parse(chunk);
          queryInfos.value.messages[
            queryInfos.value.messages.length - 1
          ].content += jsonChunk.response;
        } catch (error) {
          console.error("解析流数据失败:", chunk);
        }
      }
    }

    // 保存会话
    //sessionList.value[activeIndex.value].messages = queryInfos.value.messages;
    //loading.value = false;

    if (activeIndex.value >= 0 && sessionList.value[activeIndex.value]) {
      sessionList.value[activeIndex.value].messages = [
        ...queryInfos.value.messages,
      ];
    } else {
      console.error("无效的会话索引:", activeIndex.value);
      await handleAddSession(); // 自动创建新会话
      sessionList.value[activeIndex.value].messages = [
        ...queryInfos.value.messages,
      ];
    }
    loading.value = false;//更新
  } catch (error) {
    loading.value = false;
    console.error("请求失败:", error);
    queryInfos.value.messages[queryInfos.value.messages.length - 1].content =
      "请求出错，请检查模型服务";
  }
};

/**
 * 清除会话中的所有消息
 *
 * 此函数接受一个索引参数，该参数指示需要清除消息的会话在列表中的位置
 * 它首先清除指定会话中的所有消息，然后更新查询信息中的消息列表以匹配清除后的会话，
 * 最后更新活动会话索引以指向清除后的会话
 *
 * @param index 会话在列表中的索引位置
 */
const handleClearSession = (index: number) => {
  // 清除指定会话中的所有消息
  sessionList.value[index].messages = [];
  // 更新查询信息中的消息列表以匹配清除后的会话
  queryInfos.value.messages = sessionList.value[index].messages;
  // 更新活动会话索引以指向清除后的会话
  activeIndex.value = index;
};
// 监听sessionList的变化，当sessionList发生改变时，执行回调函数
watch(
  sessionList,
  (val) => {
    // 遍历新的sessionList数组，对每个元素进行处理
    const list = val.map((o, i) => ({
      // 将原始对象展开，确保新对象包含原始对象的所有属性
      ...o,
      // 如果当前索引与activeIndex相同，则使用queryInfos中的messages，否则保留原始messages
      messages:
        i === activeIndex.value ? queryInfos.value.messages : o.messages,
    }));
    // 将处理后的list数组转换为JSON字符串，并存储到localStorage中
    localStorage.setItem(STORAGE_KEYS.sessionList, JSON.stringify(list));
  },
  { deep: true }
);
// 监听 activeIndex 变化
watch(
  activeIndex,
  (val) => {
    // 当 activeIndex 发生变化时，将其值存储到本地存储中
    // 这样做可以在页面刷新或者重新加载时，保留用户最后访问的索引位置
    localStorage.setItem(STORAGE_KEYS.activeIndex, JSON.stringify(val));
  },
  { deep: true }
);

/**
 * 清除存储并重置状态
 *
 * 本函数旨在从本地存储中移除关键的会话信息，并清空应用中的相关数据
 * 它移除了会话列表和活动索引的本地存储项，以及重置了应用状态中的会话消息、会话列表和活动索引
 */
const handleClearStorage = () => {
  // 从本地存储中移除会话列表
  localStorage.removeItem(STORAGE_KEYS.sessionList);
  // 从本地存储中移除活动会话的索引
  localStorage.removeItem(STORAGE_KEYS.activeIndex);
  // 清空会话消息列表
  queryInfos.value.messages = [];
  // 重置会话列表为空数组
  sessionList.value = [];
  // 设置当前没有活动会话
  activeIndex.value = -1;
};
//组件挂载
onMounted(() => {
  initSessionList();
  initIndex();
  if (sessionList.value.length === 0) {
    handleAddSession();
  }
});
</script>

<style scoped>
/**
* 定义一个名为.inner-html-container的CSS类，用于设置容器样式
* 该容器占据整个视口的宽度和高度，内容居中显示，背景为黑色
*/
.inner-html-container {
  width: 100vw;
  /* 设置容器宽度为视口宽度的100% */
  height: 100vh;
  /* 设置容器高度为视口高度的100% */
  display: flex;
  /* 使用Flex布局以便内容居中 */
  justify-content: center;
  /* 水平居中对齐内容 */
  align-items: center;
  /* 垂直居中对齐内容 */
  background: #ffffff;
  /* 设置容器背景色为白色 */
}
.add-btn {
  /* 设置按钮宽度为100%，使其充满父容器 */
  width: 100%;
  /* 设置字体大小为15像素，以确保文本清晰可见 */
  font-size: 15px;
  /* 使用加粗字体，以强调按钮的重要性 */
  font-weight: bold;
}
.page {
  /** 设置容器宽度为视窗宽度的94% */
  width: 94vw;
  /** 设置容器高度为视窗高度的94% */
  height: 94vh;
  /** 设置容器背景色为白色 */
  background: #ffffff;
  /** 添加阴影效果 */
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.15); /* 蓝色阴影 */
  /** 设置盒模型为border-box */
  box-sizing: border-box;
  /** 设置圆角半径为12px */
  border-radius: 12px;
  /** 隐藏溢出的内容 */
  overflow: hidden;
}
.tips {
  width: 100%;
  height: 40px;
  background: linear-gradient(90deg, #409eff, #79bbff);
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
}
.message-item-avatar img {
  filter: brightness(0.8); /* 图标颜色调浅 */
}
.tips .title {
  /** 设置标题字体大小为18像素 */
  font-size: 18px;
  /** 设置标题字体粗细为粗体 */
  font-weight: bold;
}
.tips .desc {
  /** 设置描述字体大小为14像素 */
  font-size: 14px;
  /** 设置颜色为白色，透明度为0.9 */
  color: rgba(255, 255, 255, 0.9);
}
.grid-box {
  /** 使用网格布局 */
  display: grid;
  /** 设置网格列数为280像素和auto，auto表示剩余空间 */
  grid-template-columns: 280px auto;
  /** 设置网格列间距为16像素 */
  gap: 16px;
  /** 设置内边距为16像素 */
  padding: 16px;
}
.grid-space-between {
  /** 设置宽度为100% */
  width: 100%;
  /** 设置元素高度为父元素高度的100%减去40px */
  height: calc(100% - 40px);
}
/** 左边样式 start */

.session-item:hover {
  background: rgba(64, 158, 255, 0.1);
}
.left-container {
  /* 设置背景颜色为浅蓝色 */
  background-color: #ffffff;
  border-radius: 8px;
  /* 设置内边距为16像素 */
  padding: 16px;
  /* 设置圆角半径为8像素 */
  border-radius: 8px;
  /* 计算元素的高度 视窗高度的94%减去顶部和底部的边距及组件高度*/
  height: calc(94vh - 40px - 32px);
}
.left-container .session-area {
  /** 设置顶部边距为16像素 */
  margin-top: 16px;
  /** 设置元素的高度为视窗高度的100%减去56px */
  height: calc(100% - 56px);
  /** 设置元素的纵轴溢出为自动，允许内容超出时显示滚动条 */
  overflow-y: auto;
}
.left-container .session-item {
  /** 使用Flex布局*/
  display: flex;
  /** 水平居中对齐内容 */
  align-items: center;
  /** 项目间均匀分布，两端对齐 */
  justify-content: space-between;
  /** 设置内边距为8像素和12像素 */
  padding: 8px 12px;
  /** 设置底部边距为8像素 */
  margin-bottom: 8px;
  /** 设置圆角半径为6像素 */
  border-radius: 6px;
  /** 设置背景为深灰色，透明度为0.6 */
  background: rgba(255, 255, 255, 0.6);
  /** 设置文本颜色为白色 */
  color: #000000;
  /** 设置鼠标悬停时的样式 */
  cursor: pointer;
  /** 设置过渡效果 所有属性的变化将在0.3秒内完成，变化曲线为ease*/
  transition: all 0.3s ease;
}
.left-container .session-item-active {
  /** 设置背景为浅蓝色，透明度为0.2 */
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid #409eff;
  /** 设置边框为1像素宽的红色虚线，透明度为0.3 */
  border: 1px solid rgba(254, 44, 85, 0.3);
}

.session-item .icon-box {
  /** 使用 flex 布局 */
  display: flex;
  /** 设置项目间距为8像素 */
  gap: 8px;
  /** 设置透明度为0， */
  opacity: 0;
  /** 过渡效果为0.3秒内完成，变化曲线为 ease */
  transition: opacity 0.3s ease;
}
.session-item .icon-box:hover {
  /** 设置透明度为1 ,设置鼠标悬停时显示元素*/
  opacity: 1;
}
.icon-box .icon {
  /** 设置字体大小为16像素 */
  font-size: 16px;
  /** 设置鼠标悬停时光标样式为指针 */
  cursor: pointer;
  /** 设置过渡效果，所有属性的变化将在0.3秒内完成，变化曲线为ease */
  transition: all 0.3s ease;
}
.icon:hover {
  /** 设置图标放大为1.2倍 */
  transform: scale(1.4);
  /** 设置图标颜色为橙色 */
  color: #409eff !important;
}
/**按钮样式*/
:deep(.el-button) {
  /** 设置按钮圆角半径为8像素 */
  border-radius: 8px;
  /** 设置过渡效果，所有属性的变化将在0.3秒内完成，变化曲线为ease */
  transition: all 0.3s ease;
}
:deep(.el-button:hover) {
  /** 设置按钮上移1像素 */
  transform: translateY(-1px);
  /** 设置按钮阴影效果
第1个参数：水平偏移量为0，表示阴影不向左右偏移
第2个参数：垂直偏移量为0，表示阴影不向上或向下偏移
第3个参数：模糊半径为12px，表示阴影的模糊程度
第4个参数：阴影颜色为rgba(208, 204, 8, 0.5)，表示颜色为淡黄色，透明度为50%
*/
  box-shadow: 0 0 12px rgba(208, 204, 8, 0.5);
}
:deep(.el-button:active) {
  /** 按钮点击时，Y轴偏移1px */
  transform: translateY(1px);
}
/**发送按钮 */
:deep(.el-button.is-disabled) {
  /** 设置背景为淡黄色，透明度为50% */
  background-color: #409eff;
  /** 设置边框颜色为淡黄色，透明度为50% */
  border-color: #409eff;
}
/** 左边样式 end */

/** 右边样式 start */
.container {
  /** 设置宽度为100% */
  width: 100%;
  /** 计算元素的高度，占视窗高度的94%后减去40px */
  height: calc(94vh - 40px);
  /** 设置聊天背景为白色 */
  background: #ffffff;
  /** 设置圆角半径为8像素 */
  border-radius: 8px;
  /** 设置内边距为16像素 */
  padding: 16px;
  /** 设置盒模型为border-box */
  box-sizing: border-box;
}
.container .message-area {
  /** 设置高度为100%减去45像素减去8像素减去36像素 */
  height: calc(100% - 45px - 8px - 36px);
  /** 设置宽度为100%减去12像素 */
  width: calc(100% - 12px);
  /** 设置内边距为8像素 */
  padding: 8px 8px 0 8px;
}
.input-area {
  /** 设置高度为36像素 */
  height: 36px;
  /** 使用网格布局 */
  display: grid;
  /** 设置网格列数为3列，第一列宽度为auto，第二列宽度为120像素，第三列宽度为80像素 */
  grid-template-columns: auto 120px 80px;
  /** 设置网格列间距为10像素 */
  grid-gap: 10px;
  /** 设置盒模型为border-box */
  box-sizing: border-box;
  /** */
  padding: 0 8px 8px 0;
}
/**
头像
 */
:deep(.el-input__wrapper) {
  /** 设置高度为40像素 */
  height: 40px;
  /** 设置行高为40像素 */
  line-height: 40px;
  /** 设置背景为深灰色 */
  background-color: #ffffff;
  /** 设置边框为1像素宽的蓝色实线*/
  border: 1px solid #409eff;
  background-color: #ffffff;
  /** 水平和垂直偏移均为0、模糊半径为8px、颜色为RGBA(208, 204, 8, 0.5)的阴影 */
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.1);
  /** 设置圆角半径为8像素 */
  border-radius: 8px;
  /** 设置内边距为0和12像素 */
  padding: 0 12px;
  /** 设置过渡效果，所有属性的变化将在0.3秒内完成，变化曲线为ease */
  transition: all 0.3s ease;
}
:deep(.el-input__wrapper .el-input__inner) {
  /** 设置高度为40像素 */
  height: 40px;
  /** 设置行高为40像素 */
  line-height: 40px;
  /** 设置文本颜色为黑色 */
  color: #000000;
  /** 设置字体大小为14像素 */
  font-size: 14px;
}
/** 右边样式 end */
</style>
