import { MenuByAliasQuery } from "@laioutr-core/canonical-types/ecommerce";
import { defineCommercetoolsQuery } from "../../middleware/defineCommercetools";

export default defineCommercetoolsQuery(
  MenuByAliasQuery,
  async ({ context, input }) => {
    const { commercetoolsClient } = context;

    const { alias } = input;

    if (alias === "root") {
      const res = await commercetoolsClient
        .categories()
        .get({ queryArgs: { where: "parent is not defined" } })
        .execute();

      return { ids: res.body.results.map((r) => r.id), total: res.body.total };
    } else {
      const res = await commercetoolsClient
        .categories()
        .withKey({ key: alias })
        .get()
        .execute();

      return { ids: [res.body.id], total: 1 };
    }
  }
);
