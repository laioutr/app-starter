import type { ByProjectKeyRequestBuilder } from "@commercetools/platform-sdk";

export const assertActiveCartExists = async ({
  commercetoolsClient,
  currency,
}: {
  commercetoolsClient: ByProjectKeyRequestBuilder;
  currency: string;
}) => {
  try {
    const activeCart = await commercetoolsClient
      .me()
      .activeCart()
      .get()
      .execute();
    return activeCart.body;
  } catch {
    const newCart = await commercetoolsClient
      .me()
      .carts()
      .post({ body: { currency } })
      .execute();
    return newCart.body;
  }
};
