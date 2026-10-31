import { Api } from '../Api';

const Cars = (api) => {
  const apiPath = '/api/cars';
  return {
    classes: (filter) => api.post(`${apiPath}/classes`, filter),
    countries: (filter) => api.post(`${apiPath}/countries`, filter),
    manufacturers: (filter) => api.post(`${apiPath}/manufacturers`, filter),
    models: (filter) => api.post(`${apiPath}/models`, filter),
    years: (filter) => api.post(`${apiPath}/years`, filter),
    types: (filter) => api.post(`${apiPath}/types`, filter),
    styles: (filter) => api.post(`${apiPath}/styles`, filter),
    specializations: (filter) => api.post(`${apiPath}/specializations`, filter),
    filter: (filter) => api.post(`${apiPath}/filter`, filter),
    powerCurve: (id) => api.get(`${apiPath}/${id}/powercurve`),
    updateRating: (id, rating) => api.post(`${apiPath}/${id}/rating`, { Rating: rating }),
    allCountries: () => api.get(`${apiPath}/countries`),
    allMakes: () => api.get(`${apiPath}/makes`),
    allModels: () => api.get(`${apiPath}/models`),
    createMake: (name) => api.post(`${apiPath}/makes`, { Name: name }),
    createModel: (name, makeId) => api.post(`${apiPath}/models`, { Name: name, MakeId: makeId }),
    updateDetails: (id, details) => api.put(`${apiPath}/${id}`, details)
  };
};

const cars = Api({}).endpoints(({ api }) => Cars(api));
export { cars };
