import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// 辅助函数：处理资源 URL
export const resolveUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  // 如果路径是以 /covers/ 开头的，说明是前端 public 目录下的静态资源
  // 在开发环境下，Vite 会处理 public 目录
  // 在生产环境下，这些资源会被部署到根目录
  if (path.startsWith('/covers/') || path.startsWith('covers/')) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  // 确保 path 以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // 如果 baseURL 是 /，则直接返回路径，避免出现 //api/xxx 的情况
  if (baseURL === '/') {
    return normalizedPath;
  }
  
  // 去掉 baseURL 末尾的 / (如果存在)
  const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  return `${cleanBaseURL}${normalizedPath}`;
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加 auth token 等
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 统一处理错误
    if (error.response && error.response.status === 401) {
      // 未授权，跳转登录
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
