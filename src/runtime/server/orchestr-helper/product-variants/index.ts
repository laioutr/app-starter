import type {
  Price,
  ProductProjection,
  ProductVariant,
} from "@commercetools/platform-sdk";
import { centsToDecimal, getLoc, getSelectedPrice } from "../products/index.";
import { Money } from "@screeny05/ts-money";

function stringifyAttributeValue(value: unknown, locale: string): string {
  // Handles common CT attribute shapes (string/enum/lenum/number/boolean/objects)
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value))
    return value.map((v) => stringifyAttributeValue(v, locale)).join(", ");
  // { key, label } (enum/lenum) or localized string maps
  if (typeof value === "object") {
    const anyVal = value as Record<string, unknown>;
    if ("label" in anyVal) {
      const lbl = anyVal.label as unknown;
      if (typeof lbl === "string") return lbl;
      if (lbl && typeof lbl === "object") {
        const locMap = lbl as Record<string, string>;
        const first = Object.values(locMap)[0];
        return getLoc(locMap, locale) ?? first ?? "";
      }
    }
    // localized string object
    const first = Object.values(anyVal)[0];
    if (typeof first === "string") return first;
  }
  return JSON.stringify(value);
}

// Extract variant “options” from attributes (commonly size/color etc.)
export function mapVariantOptionsFromAttributes(
  v: ProductVariant,
  locale: string
): Array<{ name: string; value: string }> {
  if (!v.attributes) return [];
  return v.attributes.map((a) => ({
    name: a.name,
    value: stringifyAttributeValue(a.value, locale),
  }));
}

// Pull “barcode/gtin” if you store it as an attribute (common names shown)
export function getBarcode(
  v: ProductVariant,
  product: ProductProjection
): string | undefined {
  const attrNames = ["barcode", "gtin", "ean", "upc"];
  for (const name of attrNames) {
    const fromVariant = v.attributes?.find((a) => a.name === name)?.value;
    if (typeof fromVariant === "string") return fromVariant;
    const fromProduct = product.masterVariant?.attributes?.find(
      (a) => a.name === name
    )?.value;
    if (typeof fromProduct === "string") return fromProduct;
  }
  return undefined;
}

// Unit price measurement & unit price —
// Commonly modeled via attributes, adapt names to your schema.
export function readUnitPriceMeasurement(v: ProductVariant):
  | {
      measuredType?: string;
      quantityValue: number;
      quantityUnit: string;
      referenceValue: number;
      referenceUnit: string;
    }
  | undefined {
  const a = v.attributes ?? [];
  const measuredType =
    (a.find((x) => x.name === "measuredType")?.value as string | undefined) ??
    (a.find((x) => x.name === "unitMeasuredType")?.value as string | undefined);
  const quantityValue = Number(
    a.find((x) => x.name === "quantityValue")?.value ?? Number.NaN
  );
  const quantityUnit = a.find((x) => x.name === "quantityUnit")?.value as
    | string
    | undefined;
  const referenceValue = Number(
    a.find((x) => x.name === "referenceValue")?.value ?? Number.NaN
  );
  const referenceUnit = a.find((x) => x.name === "referenceUnit")?.value as
    | string
    | undefined;

  if (
    !Number.isFinite(quantityValue) ||
    !quantityUnit ||
    !Number.isFinite(referenceValue) ||
    !referenceUnit
  ) {
    return undefined;
  }
  return {
    measuredType,
    quantityValue,
    quantityUnit,
    referenceValue,
    referenceUnit,
  };
}

export function readUnitPrice(v: ProductVariant, currencyFallback: string) {
  // If you store a separate “unitPrice” attribute, map it; otherwise reuse selected price.
  const a = v.attributes ?? [];
  const raw = a.find((x) => x.name === "unitPrice")?.value as
    | { centAmount: number; currencyCode: string; fractionDigits?: number }
    | number
    | undefined;

  if (typeof raw === "number") {
    return Money.fromDecimal(raw, currencyFallback);
  }
  if (raw && typeof raw === "object" && "centAmount" in raw) {
    const fd = (raw.fractionDigits as number | undefined) ?? 2;
    const dec = centsToDecimal(raw.centAmount, fd);
    return Money.fromDecimal(dec, raw.currencyCode);
  }
  // fallback: use selected price as unit price
  const sel = getSelectedPrice(v);
  if (!sel?.value) return undefined;
  const fd = sel.value.fractionDigits ?? 2;
  const dec = centsToDecimal(sel.value.centAmount, fd);
  return Money.fromDecimal(dec, sel.value.currencyCode);
}

// Quantity rules (commonly modeled via attributes)
export function readQuantityRule(v: ProductVariant) {
  const a = v.attributes ?? [];
  const min = Number(a.find((x) => x.name === "minOrderQuantity")?.value ?? 1);
  const increment = Number(
    a.find((x) => x.name === "orderQuantityStep")?.value ?? 1
  );
  const maxRaw = a.find((x) => x.name === "maxOrderQuantity")?.value;
  const max = maxRaw == null ? undefined : Number(maxRaw);
  return {
    min: Math.max(1, min),
    increment: Math.max(1, increment),
    max: Number.isFinite(Number(max)) ? Number(max) : undefined,
  };
}

export function computeAvailability(v: ProductVariant) {
  // Uses variant.availability.* which reflects Inventory if configured
  const isOn = v.availability?.isOnStock ?? false;
  const qty = v.availability?.availableQuantity ?? 0;
  return {
    status: isOn ? "inStock" : "outOfStock",
    quantity: qty ?? 0,
  } as const;
}

export function mapQuantityPriceBreaks(price: Price | undefined) {
  if (!price?.tiers || !price.value) return [];
  const fdBase = price.value.fractionDigits ?? 2;
  const basePrice = Money.fromDecimal(
    centsToDecimal(price.value.centAmount, fdBase),
    price.value.currencyCode
  );
  return price.tiers.map((t) => {
    const fd = t.value.fractionDigits ?? fdBase;
    const dec = centsToDecimal(t.value.centAmount, fd);
    const tierPrice = Money.fromDecimal(dec, t.value.currencyCode);
    return {
      quantity: t.minimumQuantity,
      price: tierPrice,
      savingsPercent: tierPrice.percentageOf(basePrice),
    };
  });
}
