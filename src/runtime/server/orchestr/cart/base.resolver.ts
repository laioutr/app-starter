import { defineCommercetoolsComponentResolver } from "../../middleware/defineCommercetools";
import { CartBase, CartCost } from "@laioutr-core/canonical-types/entity/cart";

export default defineCommercetoolsComponentResolver({
  entityType: "Cart",
  label: "Commercetools Cart Resolver",
  provides: [CartBase, CartCost],
  resolve: async ({ entityIds, context, $entity }) => {
    const { commercetoolsClient } = context;

    const res = await commercetoolsClient
      .carts()
      .get({
        queryArgs: {
          where: `id in (${entityIds.map((id) => `"${id}"`).join(",")})`,
          expand: ["discountCodes[*].isActive", "discountCodes[*].code"],
        },
      })
      .execute();

    const entities = await Promise.all(
      res.body.results.map(async (cart) => {
        const currency = cart.totalPrice.currencyCode;

        return $entity({
          id: cart.id,

          base: () => ({
            totalQuantity: cart?.lineItems?.length ?? 0,
            discountCodes: cart.discountCodes.map((code) => ({
              code: code.discountCode.obj?.code as string,
              isApplicable: !!code.discountCode.obj?.isActive,
            })),
          }),

          cost: () => ({
            subtotal: {
              amount: cart.lineItems.reduce(
                (acc, curr) => acc + curr.totalPrice.centAmount,
                0
              ),
              currency,
            },
            subtotalIsEstimated: false,
            total: {
              amount: cart?.totalPrice.centAmount,
              currency,
            },
            totalIsEstimated: false,
            totalTax: {
              amount: cart.taxedPrice?.totalTax?.centAmount ?? 0,
              currency,
            },
            totalTaxIsEstimated: false,
            taxesIncluded:
              cart.lineItems.some((item) => item.taxRate?.includedInPrice) ||
              !!cart.shippingInfo?.taxRate?.includedInPrice,
            totalDuty: { amount: 0, currency },
            totalDutyIsEstimated: true,
            dutiesIncluded: false,
          }),
        });
      })
    );

    return { entities };
  },
});
