import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// HOW TO POINT THIS AT YOUR BACKEND
// ----------------------------------
// EXPO_PUBLIC_API_URL always wins when set, in both dev and production —
// it's the one knob you need for "use my local Django instead of the live
// one" or vice versa. Set it in a `.env` file at the project root:
//   EXPO_PUBLIC_API_URL=http://192.168.1.42:8000/api
//
// When it's unset, the default depends on __DEV__:
//   - Dev (Expo Go / dev client): falls back to your computer's LAN IP.
//     127.0.0.1 only ever means "this device" — on a physical phone, that's
//     the phone itself, not your computer, which is why it shows up as a
//     generic Network Error with no server response at all. The LAN IP
//     fallback below works from a physical device on the same Wi-Fi, an
//     Android emulator, or an iOS simulator. To use it:
//       1. Find your computer's LAN IP:
//            macOS/Linux: ipconfig getifaddr en0   (or `ifconfig`, look for "inet")
//            Windows:     ipconfig                  (look for "IPv4 Address")
//       2. Edit DEV_FALLBACK_API_URL below to match.
//       3. Run `python manage.py runserver 0.0.0.0:8000` (not just 127.0.0.1)
//          so it actually accepts connections from other devices.
//   - Production builds: falls back to the live Railway backend, so a
//     release build works out of the box with no env file at all.
const DEV_FALLBACK_API_URL = "http://192.168.0.235:8000/api";
const PRODUCTION_API_URL = "https://workout-tracker-production-30b3.up.railway.app/api";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? DEV_FALLBACK_API_URL : PRODUCTION_API_URL);

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

// expo-secure-store has no web implementation (its web build is an empty
// stub — every method throws "is not a function"), since there's no OS
// keychain to back it on the web. Fall back to localStorage there, the
// conventional (if less secure) web equivalent.
const secureStore =
  Platform.OS === "web"
    ? {
        getItemAsync: async (key: string) =>
          typeof localStorage === "undefined" ? null : localStorage.getItem(key),
        setItemAsync: async (key: string, value: string) => {
          if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
        },
        deleteItemAsync: async (key: string) => {
          if (typeof localStorage !== "undefined") localStorage.removeItem(key);
        },
      }
    : SecureStore;

export const tokenStorage = {
  getAccess: () => secureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefresh: () => secureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setTokens: async (access: string, refresh: string) => {
    await secureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
    await secureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
  },
  clear: async () => {
    await secureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await secureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

export const api = axios.create({ baseURL: API_URL });

// A bare axios instance (no interceptors) used only for the refresh call
// itself, so a failed refresh can't recursively trigger another refresh.
const refreshClient = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const access = await tokenStorage.getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStorage.getRefresh();
  if (!refresh) return null;

  try {
    const { data } = await refreshClient.post("/auth/refresh/", { refresh });
    // ROTATE_REFRESH_TOKENS is enabled server-side, so a new refresh token
    // comes back alongside the access token — persist both.
    await tokenStorage.setTokens(data.access, data.refresh ?? refresh);
    return data.access as string;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const newAccess = await refreshPromise;

    if (!newAccess) {
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${newAccess}`;
    return api(original);
  }
);

// DRF field names -> a human label for messages that don't already read
// fine on their own (e.g. "password2": ["..."] should read "Confirm
// Password: ..." rather than "Password2: ...").
const FIELD_LABELS: Record<string, string> = {
  password2: "Confirm Password",
  non_field_errors: "",
  detail: "",
};

function humanizeField(field: string): string {
  if (field in FIELD_LABELS) return FIELD_LABELS[field];
  return field
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** Flattens every field's error message(s) from a DRF 400 response into one
 *  readable, multi-line string — e.g.:
 *    Email: An account with that email already exists.
 *    Password: This password is too short. This password is too common.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Check console for details."
): string {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (!data) return fallback;

  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.filter((m) => typeof m === "string").join("\n");

  if (typeof data === "object") {
    const lines: string[] = [];

    for (const [field, value] of Object.entries(data as Record<string, unknown>)) {
      const messages = Array.isArray(value)
        ? value.filter((m): m is string => typeof m === "string")
        : typeof value === "string"
          ? [value]
          : [];
      if (messages.length === 0) continue;

      const label = humanizeField(field);
      lines.push(label ? `${label}: ${messages.join(" ")}` : messages.join(" "));
    }

    if (lines.length > 0) return lines.join("\n");
  }

  return fallback;
}
