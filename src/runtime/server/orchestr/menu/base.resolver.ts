import { MenuItemBase } from "@laioutr-core/canonical-types/entity/menuItem";
import { defineCommercetoolsComponentResolver } from "../../middleware/defineCommercetools";

export default defineCommercetoolsComponentResolver({
  entityType: "MenuItem",
  label: "Commercetools Menu Resolver",
  provides: [MenuItemBase],
  resolve: async ({ entityIds, context, clientEnv, $entity }) => {
    const { commercetoolsClient } = context;

    const children = {} as Record<string, Array<string>>;

    const res = await commercetoolsClient
      .categories()
      .get({ queryArgs: { limit: 500 } }) // Fetch all categories to construct full tree
      .execute();

    for (const category of res.body.results) {
      const parent = category.parent;

      if (!parent) continue;

      if (!(parent.id in children)) children[parent.id] = [];

      children[parent.id].push(category.id);
    }

    const entities = res.body.results
      .filter((category) => entityIds.includes(category.id))
      .map((category) =>
        $entity({
          id: category.id,

          base: () => ({
            type: "reference",
            name:
              category.name[clientEnv.locale] ??
              Object.values(category.name)[0],
            reference: {
              type: "category",
              slug:
                category.slug[clientEnv.locale] ??
                Object.values(category.slug)[0],
              id: category.id,
            },
            childIds: children[category.id] ?? [],
            parentId: category.parent?.id,
          }),
        })
      );

    return { entities };
  },
});
