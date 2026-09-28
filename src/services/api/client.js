import axios from "axios";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/constants/auth";

const LOGIN_PATH = "/login";
const AUTH_PATH_PREFIX = "/auth/";
let hasRedirectedToLogin = false;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function isAuthRequest(url) {
  return typeof url === "string" && url.includes(AUTH_PATH_PREFIX);
}

function redirectToLogin() {
  if (hasRedirectedToLogin) {
    return;
  }

  hasRedirectedToLogin = true;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);

  const redirectPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ redirect: redirectPath });
  window.location.assign(`${LOGIN_PATH}?${params.toString()}`);
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !isAuthRequest(error?.config?.url)) {
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
