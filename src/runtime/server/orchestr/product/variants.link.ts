import { ProductVariantsLink } from "@laioutr-core/canonical-types/ecommerce";
import { defineCommercetoolsLink } from "../../middleware/defineCommercetools";

export default defineCommercetoolsLink(
  ProductVariantsLink,
  async ({ entityIds, context }) => {
    const { commercetoolsClient } = context;

    const res = await commercetoolsClient
      .productProjections()
      .get({
        queryArgs: {
          where: `id in (${entityIds.map((id) => `"${id}"`).join(",")})`,
        },
      })
      .execute();

    return {
      links: res.body.results.map((product) => ({
        sourceId: product.id.toString(),
        targetIds: [product.masterVariant, ...product.variants]
          .map((v) => v.sku ?? "")
          .filter(Boolean),
      })),
    };
  }
);
