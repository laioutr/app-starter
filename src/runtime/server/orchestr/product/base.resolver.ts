import {
  ProductBase,
  ProductDescription,
  ProductFlags,
  ProductInfo,
  ProductMedia,
  ProductPrices,
  ProductSeo,
} from "@laioutr-core/canonical-types/entity/product";
import { defineCommercetoolsComponentResolver } from "../../middleware/defineCommercetools";
import {
  extractBrand,
  getHtmlDescription,
  getLoc,
  getMinMaxPrices,
} from "../../orchestr-helper/products/index.";
import type { MediaImage } from "@laioutr-core/canonical-types";
import { Money } from "@screeny05/ts-money";
import { mapImage } from "../../mappers/media";

export default defineCommercetoolsComponentResolver({
  entityType: "Product",
  label: "Commercetools Product Resolver",
  provides: [
    ProductBase,
    ProductDescription,
    ProductInfo,
    ProductMedia,
    ProductPrices,
    ProductSeo,
    ProductFlags,
  ],
  resolve: async ({ entityIds, context, clientEnv, $entity }) => {
    const { commercetoolsClient } = context;

    const { locale, currency } = clientEnv;

    const res = await commercetoolsClient
      .productProjections()
      .get({
        queryArgs: {
          where: `id in (${entityIds.map((id) => `"${id}"`).join(",")})`,
          currency: clientEnv.currency,
        },
      })
      .execute();

    const entities = res.body.results.map((p) => {
      const title = getLoc(p.name, locale) ?? "";
      const handle = getLoc(p.slug, locale) ?? "";
      const description = getLoc(p.description, locale);
      const descriptionHtml = getHtmlDescription(p, locale);
      const brand = extractBrand(p);

      // Gather media (master first, then variants)
      const mappedMedia: MediaImage[] = [
        ...(p.masterVariant?.images?.map(mapImage) ?? []),
        ...(p.variants ?? []).flatMap((v) => v.images?.map(mapImage) ?? []),
      ];

      // Featured image analogue = first image
      const featuredImage = p.masterVariant?.images?.[0]
        ? mapImage(p.masterVariant.images[0])
        : undefined;

      // Pricing (derive min/max across variants using selected price)
      const { min, max } = getMinMaxPrices(p);

      const rawProduct = {
        id: p.id,
        title,
        handle,
        description,
        descriptionHtml,
        vendor: brand,
        featuredImage,
        priceRange: min
          ? {
              minVariantPrice: {
                amount: String(min.price),
                currencyCode: min.currency,
              },
              maxVariantPrice: {
                amount: String(max?.price ?? min.price),
                currencyCode: min.currency,
              },
            }
          : {
              minVariantPrice: { amount: "0", currencyCode: currency },
              maxVariantPrice: { amount: "0", currencyCode: currency },
            },
        compareAtPriceRange:
          min && min.original && min.original > min.price
            ? {
                minVariantPrice: {
                  amount: String(min.original),
                  currencyCode: min.currency,
                },
                maxVariantPrice: {
                  amount: String(min.original),
                  currencyCode: min.currency,
                },
              }
            : {
                minVariantPrice: {
                  amount: String(min?.price ?? 0),
                  currencyCode: min?.currency ?? currency,
                },
                maxVariantPrice: {
                  amount: String(max?.price ?? min?.price ?? 0),
                  currencyCode: min?.currency ?? currency,
                },
              },
        seo: {
          title: getLoc(p.metaTitle, locale) ?? undefined,
          description: getLoc(p.metaDescription, locale) ?? undefined,
        },
      };

      return $entity({
        id: rawProduct.id,

        base: () => ({
          name: rawProduct.title,
          slug: rawProduct.handle,
        }),

        info: () => ({
          cover: rawProduct.featuredImage
            ? rawProduct.featuredImage
            : mappedMedia[0],
          shortDescription: rawProduct.description,
          brand: rawProduct.vendor,
        }),

        media: () => ({
          cover: mappedMedia[0],
          media: mappedMedia,
          images: mappedMedia.filter(
            (m): m is MediaImage => m.type === "image"
          ),
        }),

        prices: () => {
          const { priceRange, compareAtPriceRange } = rawProduct;

          const price = Money.fromDecimal(
            Number(priceRange.minVariantPrice.amount),
            priceRange.minVariantPrice.currencyCode
          );

          const minCompareAtPriceRaw = Number(
            compareAtPriceRange.minVariantPrice?.amount
          );
          const strikethroughPrice =
            Number.isFinite(minCompareAtPriceRaw) &&
            minCompareAtPriceRaw > Number(priceRange.minVariantPrice.amount)
              ? Money.fromDecimal(
                  Number(compareAtPriceRange.minVariantPrice.amount),
                  compareAtPriceRange.minVariantPrice.currencyCode
                )
              : undefined;

          return {
            price,
            isOnSale: !!strikethroughPrice,
            strikethroughPrice,
            savingsPercent: strikethroughPrice
              ? 100 - price.percentageOf(strikethroughPrice)
              : undefined,
            isStartingFrom:
              priceRange.minVariantPrice.amount !==
              priceRange.maxVariantPrice.amount,
          };
        },

        seo: () => ({
          title: rawProduct.seo?.title ?? rawProduct.title,
          description: rawProduct.seo?.description ?? rawProduct.description,
        }),

        description: () => rawProduct.descriptionHtml,

        flags: () => [],
      });
    });

    return { entities };
  },
});
