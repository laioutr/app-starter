import { CartAddItemsAction } from "@laioutr-core/canonical-types/ecommerce";
import { defineCommercetoolsAction } from "../../middleware/defineCommercetools";
import { assertActiveCartExists } from "../../orchestr-helper/cart";

export default defineCommercetoolsAction(
  CartAddItemsAction,
  async ({ input, context, clientEnv }) => {
    const { commercetoolsClient } = context;

    const { currency } = clientEnv;

    const products = input.filter((i) => i.type === "product");

    const [activeCart, variantsRes] = await Promise.all([
      assertActiveCartExists({ commercetoolsClient, currency }),
      commercetoolsClient
        .productProjections()
        .search()
        .get({
          queryArgs: {
            filter: [
              `variants.sku:"${products.map((p) => p.variantId).join('","')}"`,
            ],
          },
        })
        .execute(),
    ]);

    const skuToId = {} as Record<string, number>;

    for (const p of variantsRes.body.results) {
      [p.masterVariant, ...p.variants]
        .filter((v) => v.sku)
        .forEach((v) => (skuToId[v.sku!] = v.id));
    }

    await commercetoolsClient
      .me()
      .carts()
      .withId({ ID: activeCart.id })
      .post({
        body: {
          version: activeCart.version,
          actions: products
            .filter((p) => skuToId[p.variantId])
            .map((p) => ({
              action: "addLineItem",
              productId: p.productId,
              variantId: skuToId[p.variantId],
              quantity: p.quantity,
            })),
        },
      })
      .execute();
  }
);
