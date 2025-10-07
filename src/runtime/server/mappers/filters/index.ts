import type {
  ProductSearchFacetResult,
  ProductSearchFacetResultBucket,
  SearchQuery,
} from "@commercetools/platform-sdk";
import type { AvailableFilter } from "#orchestr/types";

export const mapCommercetoolsFacetsToAvailableFilters = (
  facets: ProductSearchFacetResult[]
): AvailableFilter[] => {
  const filters = [] as AvailableFilter[];

  for (const facet of facets) {
    const buckets = (facet as ProductSearchFacetResultBucket).buckets;

    if (!buckets.length) continue;

    const isRange = buckets.every((bucket) =>
      bucket.key.match(/^((\d+\.\d+)|\*)-((\d+\.\d+)|\*)$/)
    );

    const isBoolean = buckets.every(
      (bucket) => bucket.key === "true" || bucket.key === "false"
    );

    if (isRange) {
      filters.push({
        id: facet.name,
        type: "intervals",
        label: facet.name,
        intervals: buckets.map((bucket) => {
          const [min, max] = bucket.key.split("-");
          return {
            min: min === "*" ? Number.MIN_SAFE_INTEGER : +min,
            max: max === "*" ? Number.MAX_SAFE_INTEGER : +max,
            count: bucket.count,
          };
        }),
      });
    } else if (isBoolean) {
      filters.push({
        id: facet.name,
        type: "boolean",
        label: facet.name,
        trueCount: buckets.find((bucket) => bucket.key === "true")?.count,
        falseCount: buckets.find((bucket) => bucket.key === "false")?.count,
      });
    } else {
      filters.push({
        id: facet.name,
        type: "list",
        label: facet.name,
        presentation: "text",
        values: buckets.map((bucket) => ({
          id: bucket.key,
          label: bucket.key,
          count: bucket.count,
        })),
      });
    }
  }

  return filters;
};

export const mapSelectedFiltersToCommercetoolsFilters = (
  filters:
    | Record<
        string,
        | boolean
        | string[]
        | {
            min?: number | undefined;
            max?: number | undefined;
          }
      >
    | undefined,
  {
    facetConfig,
  }: { facetConfig: Array<{ name: string; field: string; fieldType: string }> }
): SearchQuery[] => {
  const rangeFilters = [] as SearchQuery[];
  const booleanFilters = [] as SearchQuery[];
  const listFilters = [] as SearchQuery[];

  const assertFacetConfig = (key: string) => {
    const config = facetConfig.find((f) => f.name === key);

    if (!config) throw new Error(`Missing facet configuration for ${key}.`);

    return config;
  };

  const handleRangeFilter = (
    key: string,
    filter: {
      min?: number | undefined;
      max?: number | undefined;
    }
  ) => {
    if (typeof filter !== "object" || !("min" in filter || "max" in filter)) {
      return;
    }

    const config = assertFacetConfig(key);

    rangeFilters.push({
      range: {
        field: config.field,
        gte: filter.min,
        lte: filter.max,
      },
    });
  };

  const handleBooleanFilter = (key: string, filter: boolean) => {
    if (typeof filter !== "boolean") return;

    const config = assertFacetConfig(key);

    booleanFilters.push({
      exact: {
        field: config.field,
        fieldType: config.fieldType,
        value: filter,
      },
    });
  };

  const handleListFilter = (key: string, filter: string[]) => {
    if (!Array.isArray(filter)) return;

    const config = assertFacetConfig(key);

    for (const value of filter) {
      listFilters.push({
        exact: { field: config.field, fieldType: config.fieldType, value },
      });
    }
  };

  for (const filter in filters) {
    handleRangeFilter(
      filter,
      filters[filter] as Parameters<typeof handleRangeFilter>[1]
    );
    handleBooleanFilter(
      filter,
      filters[filter] as Parameters<typeof handleBooleanFilter>[1]
    );
    handleListFilter(
      filter,
      filters[filter] as Parameters<typeof handleListFilter>[1]
    );
  }

  const commercetoolsFilters = [
    ...rangeFilters,
    ...(booleanFilters.length > 1 ? [{ or: booleanFilters }] : booleanFilters),
    ...(listFilters.length > 1 ? [{ or: listFilters }] : listFilters),
  ];

  if (commercetoolsFilters.length > 1) return [{ and: commercetoolsFilters }];

  return commercetoolsFilters;
};
