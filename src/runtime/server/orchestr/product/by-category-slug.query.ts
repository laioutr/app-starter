import { ProductsByCategorySlugQuery } from "@laioutr-core/canonical-types/ecommerce";
import { defineCommercetoolsQuery } from "../../middleware/defineCommercetools";
import { mapCommercetoolsFacetsToAvailableFilters, mapSelectedFiltersToCommercetoolsFilters } from "../../mappers/filters";

export default defineCommercetoolsQuery(ProductsByCategorySlugQuery, async ({ context, clientEnv, input, filter, sorting }) => {
  const { commercetoolsClient } = context;

  const { categorySlug } = input;

  const categoryRes = await commercetoolsClient
    .categories()
    .get({
      queryArgs: { where: `(slug(${clientEnv.locale} = "${categorySlug}"))` },
    })
    .execute();

  const filters = mapSelectedFiltersToCommercetoolsFilters(filter, {
    facetConfig: context.facets,
  });

  const sort = context.sortings.find((s) => s.key === sorting)?.key ?? "";

  const [field, order] = sort.split("-");

  const res = await commercetoolsClient
    .products()
    .search()
    .post({
      body: {
        query: {
          filter: [
            {
              exact: {
                field: `categories`,
                value: categoryRes.body.results[0].id,
              },
            },
          ],
        },
        facets: [
          ...context.facets.filter((facet) => facet.fieldType !== "number").map((facet) => ({ distinct: facet })),
          ...context.facets.filter((facet) => facet.fieldType === "number").map((facet) => ({ ranges: facet })),
        ],
        postFilter: filters.length ? { filter: filters } : undefined,
        sort: field && order ? [{ field, order }] : undefined,
      },
    })
    .execute();

  const availableFilters = mapCommercetoolsFacetsToAvailableFilters(res.body.facets);

  const availableSortings = context.sortings;

  return {
    ids: res.body.results.map((r) => r.id),
    total: res.body.total,
    availableFilters,
    availableSortings,
  };
});
