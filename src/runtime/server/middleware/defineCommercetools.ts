import { defineOrchestr } from "#imports";
import { name } from "../../../../package.json";
import { commercetoolsClientFactory } from "../client";

export const defineCommercetools = defineOrchestr
  .meta({
    app: name,
  })
  .extendClientEnv(({ clientEnv }) => {
    const language = clientEnv.locale.split("-")[0];
    return {
      facets: [
        {
          name: "Price",
          field: "variants.prices.centAmount",
          fieldType: "number",
          ranges: [
            { from: 0, to: 10000 },
            { from: 10000, to: 50000 },
            { from: 50000, to: 100000 },
            { from: 100000 },
          ],
        },
        {
          name: "In Stock",
          field: "variants.availability.isOnStock",
          fieldType: "boolean",
        },
        {
          name: "Color",
          field: "variants.attributes.search-color.key",
          fieldType: "lenum",
          language,
        },
        // You can add more available filters here (https://docs.commercetools.com/api/projects/product-search#facets)
      ],
      sortings: [
        {
          key: "variants.prices.centAmount-asc",
          label: "Price (ASC)",
        },
        {
          key: "variants.prices.centAmount-desc",
          label: "Price (DESC)",
        },
        // You can add more available sortings here (https://docs.commercetools.com/api/search-query-language#ctp:api:type:SearchSorting)
      ],
    };
  })
  .use(async ({ event }, next) => {
    const commercetoolsClient = commercetoolsClientFactory({ event });

    return next({
      context: { commercetoolsClient },
    });
  });

export const defineCommercetoolsAction = defineCommercetools.actionHandler;
export const defineCommercetoolsQuery = defineCommercetools.queryHandler;
export const defineCommercetoolsLink = defineCommercetools.linkHandler;
export const defineCommercetoolsComponentResolver =
  defineCommercetools.componentResolver;

export default () => {};
