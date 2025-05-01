import axios, { type AxiosRequestConfig, type AxiosResponse, AxiosError } from "axios";
/**
 * 创建一个axios实例，用于进行HTTP请求
 * 该实例配置了默认的请求超时时间和请求头
 */
const service = axios.create({
  // 设置请求的超时时间，单位为毫秒
  timeout: 120000,
  // 设置请求头，指定发送的数据类型
  headers: {
    "Content-Type": "application/json",
  },
});
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 在请求发送之前，可以进行一些操作，例如添加请求头、修改请求参数等
    const token = config.params?.gptToken || config.data?.gptToken;
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    // 普通的接口请求
    if (sessionStorage.getItem("token")) {
      const token = sessionStorage.getItem("token");
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  (error: AxiosError) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);

// 使用服务的拦截器来处理响应
service.interceptors.response.use(
  // 成功处理响应的回调函数
  (response: AxiosResponse) => {
    // 返回响应的数据
    return response.data;
  },
  // 处理响应错误的回调函数
  (error: AxiosError) => {
    // 判断是否存在响应
    if (error.response) {
      // 检查请求状态码是否为0
      if (error.request.status == 0) {
        // 如果状态码为0，修改错误信息为自定义的服务器错误提示
        error.message = "服务器发生错误，请检查服务器。";
      }
    }
    // 返回一个拒绝的Promise，携带错误对象
    return Promise.reject(error);
  }
);
export default service;
