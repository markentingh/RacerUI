import { Api } from '../Api';

const AssettoCorsa = (api) => {
  const apiPath = '/api/ac';
  return {
    weatherControllers: () => api.get(`${apiPath}/weather-controllers`),
    controllerSettings: (id) => api.get(`${apiPath}/weather-controllers/${encodeURIComponent(id)}/settings`)
  };
};

const ac = Api({}).endpoints(({ api }) => AssettoCorsa(api));
export { ac };
