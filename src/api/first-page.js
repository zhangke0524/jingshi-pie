import request from '@/utils/request';

const pathPrefix = '/api';
const headers = {
  isToken: true,
};

// 事件统计查询 - 饼图
export function GetAlarmStatistics() {
  return request({
    url: `${pathPrefix}/detection-algorithm/algorithmRecognitionResult/countResult`,
    headers,
    method: 'get',
  });
}