import { createRouter, createWebHistory } from "vue-router";
// 导入路由配置文件
import routes from "./routes";
// 创建路由实例
const router = createRouter({
  // 使用history模式
  history: createWebHistory(),
  // 路由配置
  routes,
  scrollBehavior() {
    // 滚动到页面顶部
    return { top: 0 };
  },
});
// 全局前置守卫（这里可以加入用户登录判断）
router.beforeEach((to: any, from: any, next: () => void) => {
  // 继续前进
  console.log("全局前置守卫", to, from);
  // 返回false取消导航
  next();
});
// 全局后置钩子（这里可以加入改变页面标题等操作）
router.afterEach((to: any, from: any) => {
  console.log("全局后置钩子", to, from);
  const _title = to.meta.title;
  if (_title) {
    window.document.title = _title;
  } else {
    window.document.title = "基于大模型微调的医学知识问答系统";
  }
});
// 导出路由实例
export default router;
