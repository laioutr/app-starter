import { defineCommercetoolsComponentResolver } from "../../middleware/defineCommercetools";
import {
  ProductVariantBase,
  ProductVariantInfo,
  ProductVariantAvailability,
  ProductVariantPrices,
  ProductVariantQuantityPrices,
  ProductVariantQuantityRule,
  ProductVariantShipping,
  ProductVariantOptions,
} from "@laioutr-core/canonical-types/entity/product-variant";
import {
  centsToDecimal,
  getLoc,
  getSelectedPrice,
} from "../../orchestr-helper/products/index.";
import type { ProductVariant } from "@commercetools/platform-sdk";
import {
  computeAvailability,
  getBarcode,
  mapVariantOptionsFromAttributes,
  readQuantityRule,
  readUnitPrice,
  readUnitPriceMeasurement,
} from "../../orchestr-helper/product-variants";
import { mapImage } from "../../mappers/media";
import { Money } from "@screeny05/ts-money";

export default defineCommercetoolsComponentResolver({
  entityType: "ProductVariant",
  label: "Commercetools Product Variant Resolver",
  provides: [
    ProductVariantBase,
    ProductVariantInfo,
    ProductVariantAvailability,
    ProductVariantPrices,
    ProductVariantQuantityPrices,
    ProductVariantQuantityRule,
    ProductVariantShipping,
    ProductVariantOptions,
  ],
  resolve: async ({ entityIds, context, clientEnv, $entity }) => {
    const { commercetoolsClient } = context;

    const { locale, currency } = clientEnv;

    const res = await commercetoolsClient
      .productProjections()
      .search()
      .get({
        queryArgs: {
          priceCurrency: currency,
          filter: [`variants.sku:"${entityIds.join('","')}"`],
        },
      })
      .execute();

    // For each matching product, pull ONLY the variants that match the given SKUs
    const wanted = new Set(entityIds);

    const entities: Array<Parameters<typeof $entity>[0]> = [];

    for (const p of res.body.results) {
      const title = getLoc(p.name, locale) ?? "";
      const productImages = p.masterVariant?.images ?? [];

      const variants: ProductVariant[] = [
        p.masterVariant,
        ...p.variants,
      ].filter(Boolean) as ProductVariant[];

      for (const v of variants) {
        if (!v?.sku || !wanted.has(v.sku)) continue;

        const selectedPrice = getSelectedPrice(v);
        // current price (discount wins)
        let priceAmount = 0;
        let priceCurrencyCode = currency;
        let compareAtAmount: number | undefined;

        if (selectedPrice?.value) {
          const fd = selectedPrice.value.fractionDigits ?? 2;
          const original = centsToDecimal(selectedPrice.value.centAmount, fd);
          if (selectedPrice.discounted?.value) {
            const dfd = selectedPrice.discounted.value.fractionDigits ?? fd;
            const discounted = centsToDecimal(
              selectedPrice.discounted.value.centAmount,
              dfd
            );
            priceAmount = discounted;
            priceCurrencyCode = selectedPrice.discounted.value.currencyCode;
            compareAtAmount = original > discounted ? original : undefined;
          } else {
            priceAmount = original;
            priceCurrencyCode = selectedPrice.value.currencyCode;
          }
        }

        const image = v.images?.[0] ?? productImages[0];
        const availability = computeAvailability(v);
        const barcode = getBarcode(v, p);
        const unitPriceMeasurement = readUnitPriceMeasurement(v);
        const unitPrice = readUnitPrice(v, priceCurrencyCode);
        const quantityRule = readQuantityRule(v);

        entities.push(
          $entity({
            id: v.sku,
            base: () => ({
              sku: v.sku ?? barcode ?? (v.id ? String(v.id) : `${p.id}`),
              name: title,
              gtin: barcode ?? undefined,
            }),

            availability: () => ({
              status: availability.status,
              quantity: availability.quantity ?? 0,
            }),

            options: () => ({
              selected: mapVariantOptionsFromAttributes(v, locale),
              swatch: image ? ["image", mapImage(image)] : undefined,
            }),

            prices: () => {
              const price = Money.fromDecimal(
                Number(priceAmount),
                priceCurrencyCode
              );
              const compareAtPrice =
                compareAtAmount && compareAtAmount > priceAmount
                  ? Money.fromDecimal(
                      Number(compareAtAmount),
                      priceCurrencyCode
                    )
                  : undefined;

              return {
                price,
                isOnSale: !!compareAtPrice,
                strikethroughPrice: compareAtPrice,
                savingsPercent: compareAtPrice
                  ? 100 - price.percentageOf(compareAtPrice)
                  : undefined,
                unitPrice:
                  unitPriceMeasurement && unitPrice
                    ? {
                        quantity: {
                          value: unitPriceMeasurement.quantityValue,
                          unit: unitPriceMeasurement.quantityUnit,
                        },
                        price: unitPrice,
                        reference: {
                          value: unitPriceMeasurement.referenceValue,
                          unit: unitPriceMeasurement.referenceUnit,
                        },
                      }
                    : undefined,
              };
            },

            info: () => ({
              image: image ? mapImage(image) : undefined,
            }),

            quantityPrices: () => {
              const baseMoney = selectedPrice?.value
                ? Money.fromDecimal(
                    centsToDecimal(
                      selectedPrice.value.centAmount,
                      selectedPrice.value.fractionDigits ?? 2
                    ),
                    selectedPrice.value.currencyCode
                  )
                : Money.fromDecimal(Number(priceAmount), priceCurrencyCode);

              return (selectedPrice?.tiers ?? []).map((t) => {
                const fd = t.value.fractionDigits ?? 2;
                const tierMoney = Money.fromDecimal(
                  centsToDecimal(t.value.centAmount, fd),
                  t.value.currencyCode
                );
                return {
                  quantity: t.minimumQuantity,
                  price: tierMoney,
                  savingsPercent: tierMoney.percentageOf(baseMoney),
                };
              });
            },

            quantityRule: () => ({
              min: quantityRule.min,
              increment: quantityRule.increment,
              max: quantityRule.max ?? undefined,
            }),

            shipping: () => ({
              // If you store this as an attribute, read it; default true
              required:
                (v.attributes?.find((a) => a.name === "requiresShipping")
                  ?.value as boolean | undefined) ?? true,
            }),
          })
        );
      }
    }

    return { entities };
  },
});
