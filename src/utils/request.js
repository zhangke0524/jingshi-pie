// to do get请求的transparams链接
import axios from 'axios';
// import { tansParams } from '@/utils/ruoyi';
// import useUserStore from '@/store/modules/user';
// import i18n from '@/locales/index';
// const { t } = i18n.global;

const getLanguage = () => {
  let str = localStorage.getItem('lang');
  if (str === 'zh') {
    return 'zh_CN';
  } else if (str === 'en') {
    return 'en_US';
  } else if (str === 'ja') {
    return 'ja_JP';
  }
  return 'zh_CN';
};

// 是否显示重新登录
export let isRelogin = { show: false };
let isLoggingOut = false;

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
// 创建axios实例
const service = axios.create({
  // axios中请求配置有baseURL选项，表示请求URL公共部分
  baseURL: import.meta.env.VITE_APP_BASE_API,
  // 超时
  // timeout: 10000,
});

// request拦截器
service.interceptors.request.use(
  (config) => {
    debugger
    // 是否需要设置 token
    const isToken = (config.headers || {}).isToken === false;
    // 暂时设置为全部需要token
    // const isToken = false
    // 是否需要防止数据重复提交
    if (sessionStorage.getItem('token') && !isToken) {
      config.headers['Authorization'] = 'Bearer ' + sessionStorage.getItem('token'); // 让每个请求携带自定义token 请根据实际情况自行修改
    }
    // get请求映射params参数
    if (config.method === 'get' && config.params) {
      // let url = config.url + '?' + tansParams(config.params);
      let url = config.url + '?' + config.params;
      url = url.slice(0, -1);
      config.params = {};
      config.url = url;
    }
    // 导出文件时需要设置responseType
    if (config.isExport) {
      config.responseType = 'blob';
    }
    // 国际化需要加入请求头，名为 language, 值为en_US或zh_CN
    config.headers['language'] = getLanguage() || 'zh_CN';
    return config;
  },
  (error) => {
    console.log(error);
    Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (res) => {
    debugger
    // 未设置状态码则默认成功状态
    const code = res.data.code;
    // 获取错误信息
    const msg = res.data.msg;
    // 二进制数据则直接返回
    if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
      return res.data;
    }
    if (code === 401) {
      // 401 说明 token 验证失败，xx 登录过期，需重新登录
      // if (!isLoggingOut) {
      //   isLoggingOut = true;
      //   useUserStore()
      //     .logOut()
      //     .then(() => {
      //       location.href = '/';
      //     })
      //     .finally(() => {
      //       isLoggingOut = false;
      //     });
      //   ElMessage({ message: msg, type: 'error' });
      // }
      return Promise.reject(new Error(msg));
    } else if (code === 500) {
      ElMessage({ message: msg, type: 'error' });
      return Promise.reject(new Error(msg, {cause: res.data}));
    } else if (code === 601) {
      ElMessage({ message: msg, type: 'warning' });
      return Promise.reject(new Error(msg));
    } else if (code !== 200 && code !== 0) {
      ElMessage({ message: msg, type: 'error' });
      return Promise.reject(new Error(msg, {cause: res.data}));
    }
    // 若依返回的成功码是200 可能业务里返回的成功码是0 此处暂时先注释 需看业务返回的成功码是多少
    // else if (code !== 0) {
    //   ElMessage({ message: msg, type: 'error' });
    //   return Promise.reject('error');
    // }
    else {
      // 通过config配置来控制是否显示成功提示，以及具体的成功提示信息
      if (res.config.isShowSuccessTip) {
        let msg = res.config.succesnnTipText || t('interfaceInfo.operateSuccess');
        ElMessage({ message: msg, type: 'success' });
      }
      return Promise.resolve(res.data);
    }
  },
  (error) => {
    console.log('err' + error);
    let { message } = error;
    if (message == 'Network Error') {
      message = t('interfaceInfo.networkError');
    } else if (message.includes('timeout')) {
      message = t('interfaceInfo.timeout');
    } else if (error.response.status === 401) {
      // 401 说明 token 验证失败，xx 登录过期，需重新登录
      // if (!isLoggingOut) {
      //   isLoggingOut = true;
      //   useUserStore()
      //     .logOut()
      //     .then(() => {
      //       location.href = '/';
      //     })
      //     .finally(() => {
      //       isLoggingOut = false;
      //     });
      //   ElMessage({ message: t('interfaceInfo.expiredToken'), type: 'error' });
      // }
      return Promise.reject(error);
    } else if (message.includes('Request failed with status code')) {
      message = t('interfaceInfo.syatemApi') + message.substr(message.length - 3) + t('interfaceInfo.abnormal');
    }
    ElMessage({ message: message, type: 'error', duration: 5 * 1000 });
    return Promise.reject(error);
  },
);

export default service;
