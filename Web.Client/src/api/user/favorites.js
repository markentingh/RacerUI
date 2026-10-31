import { Api } from '../Api';

const Favorites = (api) => {
  const apiPath = '/api/favorites';
  return {
    list: (start = 0, length = 50) => api.get(`${apiPath}?start=${start}&length=${length}`),
    save: (data) => api.post(apiPath, data),
    update: (id, data) => api.put(`${apiPath}/${id}`, data),
    remove: (id) => api.delete(`${apiPath}/${id}`)
  };
};

const favorites = Api({}).endpoints(({ api }) => Favorites(api));
export { favorites };
