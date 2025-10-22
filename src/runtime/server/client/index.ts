import { getCookie, useRuntimeConfig } from "#imports";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import {
  ClientBuilder,

  // Import middlewares
  type AuthMiddlewareOptions, // Required for auth
  type HttpMiddlewareOptions, // Required for sending HTTP requests
} from "@commercetools/ts-client";
import type { H3Event } from "h3";
import { ANONYMOUS_TOKEN_COOKIE } from "../const/keys";
import { createTokenCacheProvider } from "./tokenCacheProvider";

export const commercetoolsClientFactory = async ({ event }: { event: H3Event }) => {
  const { apiURL, authURL, projectKey, clientId, clientSecret } = useRuntimeConfig()["@laioutr-app/commercetools"];

  const scopes = [`manage_project:${projectKey}`];

  const anonToken = getCookie(event, ANONYMOUS_TOKEN_COOKIE);

  const { tokenCache, hasInitialToken } = await createTokenCacheProvider();

  // Configure authMiddlewareOptions
  const authMiddlewareOptions: AuthMiddlewareOptions = {
    host: authURL,
    projectKey: projectKey,
    credentials: {
      clientId,
      clientSecret,
    },
    scopes,
    httpClient: fetch,
    tokenCache,
  };

  // Configure httpMiddlewareOptions
  const httpMiddlewareOptions: HttpMiddlewareOptions = {
    host: apiURL,
    httpClient: fetch,
  };

  // Export the ClientBuilder
  let ctpClientBase = new ClientBuilder().withProjectKey(projectKey); // .withProjectKey() is not required if the projectKey is included in authMiddlewareOptions

  if (anonToken) ctpClientBase = ctpClientBase.withAnonymousSessionFlow(authMiddlewareOptions);
  else ctpClientBase = ctpClientBase.withClientCredentialsFlow(authMiddlewareOptions);

  const ctpClient = ctpClientBase
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware() // Include middleware for logging
    .build();

  const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({
    projectKey,
  });

  // Force initial token fetch
  if (!hasInitialToken) {
    await apiRoot.get().execute();
  }

  return apiRoot;
};
