import { GetCurrentCartQuery } from "@laioutr-core/canonical-types/ecommerce";
import { defineCommercetoolsQuery } from "../../middleware/defineCommercetools";
import { assertActiveCartExists } from "../../orchestr-helper/cart";

export default defineCommercetoolsQuery(
  GetCurrentCartQuery,
  async ({ context, clientEnv }) => {
    try {
      const { commercetoolsClient } = context;

      const { currency } = clientEnv;

      const cart = await assertActiveCartExists({
        commercetoolsClient,
        currency,
      });

      return { id: cart.id };
    } catch {
      // Neither anonymous session nor authenticated sessions are created yet at this point
      return { id: "" };
    }
  }
);
