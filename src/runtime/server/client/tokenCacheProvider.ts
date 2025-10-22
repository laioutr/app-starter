import { getCookie, setCookie, useEvent } from "#imports";
import type { TokenStore, TokenCache } from "@commercetools/ts-client";
import { ANONYMOUS_REFRESH_TOKEN_COOKIE, ANONYMOUS_TOKEN_COOKIE } from "../const/keys";

export const createTokenCacheProvider = async () => {
  const event = useEvent();

  let currentStore: TokenStore | undefined;

  const tokenCache: TokenCache = {
    get: async () => {
      if (currentStore) {
        return currentStore;
      }

      const anonToken = getCookie(event, ANONYMOUS_TOKEN_COOKIE);
      const anonRefreshToken = getCookie(event, ANONYMOUS_REFRESH_TOKEN_COOKIE);
      if (anonToken) {
        return {
          token: anonToken,
          refreshToken: anonRefreshToken,
          expirationTime: 60 * 60 * 24 * 2, // 2 days
        };
      }
    },
    set: async (cache) => {
      const maxAge = Math.round((cache.expirationTime - Date.now()) / 1000);
      currentStore = cache;

      if (event.res.headersSent) {
        return;
      }

      setCookie(event, ANONYMOUS_TOKEN_COOKIE, cache.token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge,
      });
    },
  };

  currentStore = await tokenCache.get();

  return {
    tokenCache,
    hasInitialToken: !!currentStore,
  };
};
