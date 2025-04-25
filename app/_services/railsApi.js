import { apiClient } from '../_lib/api/client';

//Auth
export async function login(credentials) {
  try {
    const response = await apiClient.post('/authenticate', credentials);
    return response;
  } catch (error) {
    throw new Error('Erro ao efetuar login: ' + error.message);
  }
}

export async function logout() {
  try {
    const response = await apiClient.post('/auth/logout');
    return response;
  } catch (error) {
    throw new Error('Erro ao efetuar logout: ' + error.message);
  }
}

export async function register(credentials) {
  try {
    const response = await apiClient.post('/auth/signup', credentials);
    return response;
  } catch (error) {
    throw new Error('Erro ao efetuar cadastro: ' + error.message);
  }
}

//Users Admin
export async function getAdminUsers() {
  return apiClient.get('/api/v1/admin/users');
}

export async function editAdminUser(userId, user) {
  return apiClient.put(`/api/v1/admin/users/${userId}`, user);
}

//Users Roles
export async function getAdminRoles() {
  return apiClient.get('/api/v1/admin/roles'); 
}

//Schedules Public
export async function fetchPublicSchedules() {
  return apiClient.get('/api/v1/public/schedules');
}

//Schedules Player
export async function fetchPlayerSchedules() {
  return apiClient.get('/api/v1/player/schedules');
}

export async function createPlayerSchedules(schedule) {
  return apiClient.post('/api/v1/player/schedules', schedule);
}

export async function editPlayerSchedule(scheduleId, schedule) {
  return apiClient.put(`/api/v1/player/schedules/${scheduleId}`, { schedule });

}

export async function createAdminSchedule(schedule) {
  return apiClient.post('/api/v1/admin/schedules', schedule);
}

export async function editAdminSchedule(scheduleId, schedule) {
  return apiClient.put(`/api/v1/admin/schedules/${scheduleId}`, { schedule });
}

//Characters Public
export async function getPublicCharacters() {
  return apiClient.get('/api/v1/public/characters');
}

//Characters Player
export async function getPlayerCharacters() {
  return apiClient.get('/api/v1/player/characters');
}

export async function editPlayerCharacter(characterId, character) {
  return apiClient.put(`/api/v1/player/characters/${characterId}`, character);
}

export async function createPlayerCharacter(character) {
  return apiClient.post('/api/v1/player/characters', character);
}

//Characters Admin
export async function getAdminCharacters() {
  return apiClient.get('/api/v1/admin/characters');
}

export async function editAdminCharacter(characterId, character) {
  return apiClient.put(`/api/v1/admin/characters/${characterId}`, character);
}

export async function createAdminCharacter(character) {
  return apiClient.post('/api/v1/admin/characters', character);
}

//Groups Public
export async function getPublicGroups() {
  return apiClient.get('/api/v1/public/groups');
}

//Groups Player
export async function getPlayerGroups() {
  return apiClient.get('/api/v1/player/groups');
}

export async function createPlayerGroups(group) {
  return apiClient.post('/api/v1/player/groups', group);
}

export async function editPlayerGroups(group) {
  return apiClient.put('/api/v1/player/groups', group);
}

//Groups Admin
export async function getAdminGroups() {
  return apiClient.get('/api/v1/admin/groups');
}

export async function createAdminGroup(group) {
  return apiClient.post('/api/v1/admin/groups', group);
}

export async function editAdminGroup(groupId, group) {
  if (!groupId) {
    throw new Error("Group ID is required for update");
  }
  return apiClient.put(`/api/v1/admin/groups/${groupId}`, { group });
}

//DateDimension Public
export async function fetchDateDimensions(year, month) {
  return apiClient.get(
    `/api/v1/public/date_dimensions?year=${year}&month=${month}`
  );
}

export async function editAdminDateDimension(dateDimensionId, dateDimension) {
  return apiClient.put(`/api/v1/admin/date_dimensions/${dateDimensionId}`, dateDimension);
}
