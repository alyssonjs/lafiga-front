import { apiClient } from "../_lib/api/client";

const buildUrl = (role, resource, id = null, subPath = "") => {
  const base = `/api/v1/${role}/${resource}`;
  return id ? `${base}/${id}${subPath}` : `${base}${subPath}`;
};
// Singularization with overrides for irregular resources
const SINGULAR_OVERRIDES = {
  klasses: "klass",
  sub_klasses: "sub_klass",
  sheet_klasses: "sheet_klass",
  date_dimensions: "date_dimension",
  sheet_known_spells: "sheet_known_spell",
  sheet_prepared_spells: "sheet_prepared_spell",
  sheet_items: "sheet_item",
  characters_features: "characters_feature",
};

const toSingular = (resource) => {
  if (SINGULAR_OVERRIDES[resource]) return SINGULAR_OVERRIDES[resource];
  return resource.endsWith("s") ? resource.slice(0, -1) : resource;
};

const buildPayload = (resource, payload) => ({
  [toSingular(resource)]: {...payload},
});

export const crudFor = (resource, role = 'public') => ({
  getAll:          (params)               => apiClient.get( buildUrl(role, resource), { params } ),
  getOne:          (id, params)           => apiClient.get( buildUrl(role, resource, id), { params } ),
  create:          (payload)              => apiClient.post( buildUrl(role, resource), buildPayload(resource, payload)),
  update:          (id, payload)          => apiClient.put(  buildUrl(role, resource, id), buildPayload(resource, payload) ),
  destroy:         (id)                   => apiClient.delete( buildUrl(role, resource, id) ),
});

export const login    = (credentials) => apiClient.post("/authenticate", credentials);
export const logout   = ()            => apiClient.post("/auth/logout");
export const register = (credentials) => apiClient.post("/auth/signup", credentials);

export const fetchDateDimensions = (year, month, role = 'public') =>
   apiClient.get(`/api/v1/${role}/date_dimensions?year=${year}&month=${month}`);
