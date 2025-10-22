import type {
  ProductProjection,
  ProductVariant,
} from "@commercetools/platform-sdk";

export const getLoc = (l: Record<string, string> | undefined, locale: string) =>
  (l && (l[locale] ?? l[Object.keys(l)[0]])) || undefined;

// Try attribute "brand" on master/variants; adjust if you store brand elsewhere
export const extractBrand = (p: ProductProjection): string | undefined => {
  const firstAttr = (v?: ProductVariant) =>
    v?.attributes?.find((a) => a.name === "brand")?.value;

  const mv = p.masterVariant;
  if (mv) {
    const v = firstAttr(mv);
    if (typeof v === "string") return v;
  }
  for (const v of p.variants ?? []) {
    const val = v.attributes?.find((a) => a.name === "brand")?.value;
    if (typeof val === "string") return val;
  }
  return undefined;
};

// Pick the “selected” price per CT REST price selection (priceCurrency/country/channel)
export const getSelectedPrice = (v: ProductVariant) => {
  // REST price selection puts the chosen price in `price`
  // If not present, fall back to the first in `prices`
  return v.price ?? v.prices?.[0];
};

// Convert CT centAmount to decimal (Money utility expects decimal)
export const centsToDecimal = (centAmount: number, fractionDigits: number) =>
  centAmount / Math.pow(10, fractionDigits);

// Compute min/max price across variants (using selected price)
export const getMinMaxPrices = (p: ProductProjection) => {
  const variants: ProductVariant[] = [
    p.masterVariant,
    ...(p.variants ?? []),
  ].filter(Boolean) as ProductVariant[];

  let min: { price: number; currency: string; original?: number } | undefined;
  let max: { price: number; currency: string } | undefined;

  for (const v of variants) {
    const sel = getSelectedPrice(v);
    if (!sel?.value) continue;

    const curr = sel.value.currencyCode;
    const fd = sel.value.fractionDigits ?? 2;
    const original = centsToDecimal(sel.value.centAmount, fd);

    // If discounted present, the current price is the discounted value
    const current = sel.discounted
      ? centsToDecimal(
          sel.discounted.value.centAmount,
          sel.discounted.value.fractionDigits ?? fd
        )
      : original;

    // Track min (keep original for potential strikethrough)
    if (!min || current < min.price) {
      min = { price: current, currency: curr, original };
    }
    // Track max
    if (!max || current > max.price) {
      max = { price: current, currency: curr };
    }
  }

  return { min, max };
};

// If you store HTML in a custom attribute, read and return it here.
// Otherwise we fall back to plain description.
export const getHtmlDescription = (
  p: ProductProjection,
  locale: string
): string | undefined => {
  // Example: const html = p.masterVariant?.attributes?.find(a => a.name === 'descriptionHtml')?.value as string | undefined;
  // return html ?? getLoc(p.description, locale);
  return getLoc(p.description, locale);
};
