
import { registerTool } from "./tool.registry.js";

registerTool(
  "calculate_total",
  "Calculates item totals and an optional percentage discount. Input: { items: [{ name, quantity, unit_price }], discount_percent?: number }. Returns each category total, subtotal, discount, and final total.",
  async ({ items, discount_percent = 0 }) => {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("At least one item is required.");
    }

    if (
      !Number.isFinite(discount_percent) ||
      discount_percent < 0 ||
      discount_percent > 100
    ) {
      throw new Error("Discount must be between 0 and 100.");
    }

    const categoryTotals = items.map((item) => {
      const { name, quantity, unit_price } = item;

      if (
        typeof name !== "string" ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unit_price) ||
        unit_price < 0
      ) {
        throw new Error("Each item needs a name, positive quantity, and non-negative unit price.");
      }

      return {
        name,
        total: Math.round(quantity * unit_price * 100) / 100,
      };
    });

    const subtotal = categoryTotals.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const discount = Math.round(subtotal * discount_percent) / 100;

    return {
      category_totals: categoryTotals,
      subtotal,
      discount,
      final_total: Math.round((subtotal - discount) * 100) / 100,
    };
  }
);
