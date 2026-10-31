import { Api } from '../Api';

const Auth = (api) => {
  return {
    // The backend's login is a form POST to / - proxied via /account/login
    login: (username, password) => api.post('/account/login',
      new URLSearchParams({ username, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  };
};

const auth = Api({}).endpoints(({ api }) => Auth(api));
export { auth };
