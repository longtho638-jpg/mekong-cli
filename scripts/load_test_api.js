import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 20 }, // ramp up to 20 users
    { duration: '3m', target: 20 }, // stay at 20 users
    { duration: '1m', target: 50 }, // ramp up to 50 users
    { duration: '3m', target: 50 }, // stay at 50 users
    { duration: '1m', target: 0 },  // scale down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<200'], // 99% of requests must be below 200ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.agencyos.network';

export default function () {
  let res = http.get(`${BASE_URL}/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'healthy status': (r) => JSON.parse(r.body).status === 'healthy',
  });

  // Test a common API endpoint (simulated)
  let rootRes = http.get(`${BASE_URL}/`);
  check(rootRes, {
    'root status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
