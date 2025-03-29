import { apiClient } from '../_lib/api/client';

export async function fetchSchedules() {
  return apiClient.get('/api/v1/public/schedules');
}