import { ProductBySlugQuery } from "@laioutr-core/canonical-types/ecommerce";
import { defineCommercetoolsQuery } from "../../middleware/defineCommercetools";

export default defineCommercetoolsQuery(
  ProductBySlugQuery,
  async ({ context, clientEnv, input }) => {
    const { commercetoolsClient } = context;

    const { slug } = input;

    const res = await commercetoolsClient
      .products()
      .get({
        queryArgs: {
          where: `masterData(current((slug(${clientEnv.locale} = "${slug}"))))`,
        },
      })
      .execute();

    return { id: res.body.results[0].id };
  }
);
