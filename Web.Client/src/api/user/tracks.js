import { Api } from '../Api';

const Tracks = (api) => {
  const apiPath = '/api/tracks';
  return {
    countries: (filter) => api.post(`${apiPath}/countries`, filter),
    types: (filter) => api.post(`${apiPath}/types`, filter),
    filter: (filter) => api.post(`${apiPath}/filter`, filter),
    getById: (id) => api.get(`${apiPath}/${id}`),
    updateRating: (id, rating) => api.post(`${apiPath}/${id}/rating`, { Rating: rating })
  };
};

const tracks = Api({}).endpoints(({ api }) => Tracks(api));
export { tracks };
