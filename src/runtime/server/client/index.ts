import { getCookie, setCookie, useRuntimeConfig } from "#imports";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import {
  ClientBuilder,

  // Import middlewares
  type AuthMiddlewareOptions, // Required for auth
  type HttpMiddlewareOptions, // Required for sending HTTP requests
} from "@commercetools/ts-client";
import type { H3Event } from "h3";
import { ANON_TOKEN_COOKIE } from "../const/keys";

export const commercetoolsClientFactory = ({ event }: { event: H3Event }) => {
  const { apiURL, authURL, projectKey, clientId, clientSecret } =
    useRuntimeConfig()["@laioutr-app/commercetools"];

  const scopes = [`manage_project:${projectKey}`];

  const anonToken = getCookie(event, ANON_TOKEN_COOKIE);

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
    tokenCache: {
      get: async () => ({
        token: getCookie(event, ANON_TOKEN_COOKIE) ?? "",
        expirationTime: 60 * 60 * 24 * 30, // 30 days
      }),
      set: async ({ token }) => {
        if (event.node.res.headersSent || anonToken) return;

        setCookie(event, ANON_TOKEN_COOKIE, token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      },
    },
  };

  // Configure httpMiddlewareOptions
  const httpMiddlewareOptions: HttpMiddlewareOptions = {
    host: apiURL,
    httpClient: fetch,
  };

  // Export the ClientBuilder
  let ctpClientBase = new ClientBuilder().withProjectKey(projectKey); // .withProjectKey() is not required if the projectKey is included in authMiddlewareOptions

  if (anonToken)
    ctpClientBase = ctpClientBase.withAnonymousSessionFlow(
      authMiddlewareOptions
    );
  else
    ctpClientBase = ctpClientBase.withClientCredentialsFlow(
      authMiddlewareOptions
    );

  const ctpClient = ctpClientBase
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware() // Include middleware for logging
    .build();

  const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({
    projectKey,
  });

  return apiRoot;
};
