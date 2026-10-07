import api from './axiosInstance.js';

export const authApi = {
  login: (email, password, config) => api.post('/auth/login', { email, password }, config),
  googleLogin: (credential, config) => api.post('/auth/google', { credential }, config),
  logout: (config) => api.post('/auth/logout', undefined, config),
};

export const userApi = {
  list: (params) => api.get('/users', { params }),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  deactivate: (id) => api.delete(`/users/${id}`),
  reactivate: (id) => api.put(`/users/${id}/reactivate`),
  reassignTeam: (id, newTeamLeadId) => api.put(`/users/${id}/reassign-team`, { newTeamLeadId }),
};

export const leadApi = {
  list: (params, config) => api.get('/leads', { params, ...config }),
  ids: (params, config) => api.get('/leads/ids', { params, ...config }),
  create: (payload, config) => api.post('/leads', payload, config),
  get: (id, config) => api.get(`/leads/${id}`, config),
  update: (id, payload, config) => api.put(`/leads/${id}`, payload, config),
  remove: (id, config) => api.delete(`/leads/${id}`, config),
  bulkAssign: (leadIds, assignedTo, config) =>
    api.post('/leads/bulk-assign', { leadIds, assignedTo }, config),
  bulkStatus: (leadIds, status, config) =>
    api.post('/leads/bulk-status', { leadIds, status }, config),
  bulkTag: (leadIds, tag, config) => api.post('/leads/bulk-tag', { leadIds, tag }, config),
  mergeDuplicates: (primaryId, duplicateId, config) =>
    api.post('/leads/merge-duplicates', { primaryId, duplicateId }, config),
  findDuplicateGroups: (config) => api.get('/leads/duplicates', config),
};

export const interactionApi = {
  create: (payload, config) => api.post('/interactions', payload, config),
  listForLead: (leadId, config) => api.get(`/interactions/lead/${leadId}`, config),
  update: (id, payload, config) => api.put(`/interactions/${id}`, payload, config),
  uploadAttachments: (interactionId, formData, config) =>
    api.post(`/interactions/${interactionId}/attachments`, formData, config),
};

export const calendarApi = {
  me: (date, config) => api.get('/calendar/me', { params: { date }, ...config }),
  team: (date, config) => api.get('/calendar/team', { params: { date }, ...config }),
  streak: (userId, config) => api.get(`/calendar/streak/${userId}`, config),
};

export const categoryApi = {
  list: (config) => api.get('/categories', config),
  create: (payload, config) => api.post('/categories', payload, config),
  update: (id, payload, config) => api.put(`/categories/${id}`, payload, config),
};

export const importApi = {
  preview: (formData, config) => api.post('/import/preview', formData, config),
  commit: (formData, config) => api.post('/import/commit', formData, config),
  undo: (batchId, config) => api.post(`/import/undo/${batchId}`, undefined, config),
};

export const dashboardApi = {
  founder: (config) => api.get('/dashboard/founder', config),
  team: (config) => api.get('/dashboard/team', config),
  bde: (id, config) => api.get(`/dashboard/bde/${id}`, config),
  exportReport: (params, config) =>
    api.get('/dashboard/export', { params, responseType: 'blob', ...config }),
};

export const fraudApi = {
  listFlags: (params, config) => api.get('/fraud/flags', { params, ...config }),
  summary: (config) => api.get('/fraud/summary', config),
  reviewFlag: (id, decision, reviewNotes, config) =>
    api.put(`/fraud/flags/${id}/review`, { decision, reviewNotes }, config),
  reviewFlags: (flagIds, decision, reviewNotes, config) =>
    api.post('/fraud/flags/review', { flagIds, decision, reviewNotes }, config),
};

export const mapApi = {
  pins: (params, config) => api.get('/map/pins', { params, ...config }),
  heatmap: (mode, config) => api.get('/map/heatmap', { params: { mode }, ...config }),
  cityDrilldown: (cityId, config) => api.get(`/map/city/${cityId}`, config),
  coverageSummary: (config) => api.get('/map/coverage-summary', config),
};

export const coverageApi = {
  byState: (stateCode, config) => api.get(`/coverage/${stateCode}`, config),
  byCity: (stateCode, cityName, config) =>
    api.get(`/coverage/${stateCode}/${encodeURIComponent(cityName)}`, config),
  toggle: (stateCode, cityName, categoryId, done, config) =>
    api.put(
      `/coverage/${stateCode}/${encodeURIComponent(cityName)}/${categoryId}`,
      { done },
      config
    ),
  stateSummary: (stateCode, config) => api.get(`/coverage/${stateCode}/summary`, config),
};

export const metaApi = {
  statesCities: (config) => api.get('/meta/states-cities', config),
};

export const AUDIT_LOGS = {
  list: '/audit-logs',
  summary: '/audit-logs/summary',
  forRecord: (collection, id) => `/audit-logs/${collection}/${id}`,
};

export const dealApi = {
  list: (config) => api.get('/deals', config),
  create: (payload, config) => api.post('/deals', payload, config),
  getForLead: (leadId, config) => api.get(`/deals/lead/${leadId}`, config),
  update: (id, payload, config) => api.put(`/deals/${id}`, payload, config),
};