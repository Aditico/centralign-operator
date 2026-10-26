
import { registerTool } from "./tool.registry.js";

registerTool(
  "extract_invoice_data",
  "Extract and validate structured fields from invoice text.",
  async ({ text, clarification = {} }) => {
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Invoice text is required.");
    }

    const findField = (pattern) => {
      const match = text.match(pattern);
      return match ? match[1].trim() : null;
    };

    const vendor = findField(/^Vendor:\s*(.+)$/im);
    const invoiceNumber = findField(/^Invoice Number:\s*(.+)$/im);

    const amountMatch = text.match(
      /^Amount:\s*([A-Z]{3})\s*([\d,]+(?:\.\d{1,2})?)\s*$/im
    );

    const dueDate = findField(/^Due Date:\s*(.+)$/im);

    const extracted = {
      vendor,
      invoice_number: invoiceNumber,
      amount: amountMatch
        ? Number(amountMatch[2].replace(/,/g, ""))
        : null,
      currency: amountMatch?.[1] ?? null,
      due_date: dueDate,
    };

    const invoice = {
      ...extracted,
      ...(clarification && typeof clarification === "object"
        ? clarification
        : {}),
    };

    const missingFields = [];

    if (typeof invoice.vendor !== "string" || !invoice.vendor.trim()) {
      missingFields.push("vendor");
    }

    if (
      typeof invoice.invoice_number !== "string" ||
      !invoice.invoice_number.trim()
    ) {
      missingFields.push("invoice_number");
    }

    if (
      invoice.amount === null ||
      invoice.amount === undefined ||
      invoice.amount === "" ||
      !Number.isFinite(Number(invoice.amount)) ||
      Number(invoice.amount) < 0
    ) {
      missingFields.push("amount");
    }

    if (
      typeof invoice.currency !== "string" ||
      !/^[A-Z]{3}$/.test(invoice.currency)
    ) {
      missingFields.push("currency");
    }

    if (
      typeof invoice.due_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(invoice.due_date) ||
      Number.isNaN(Date.parse(`${invoice.due_date}T00:00:00Z`)) ||
      new Date(`${invoice.due_date}T00:00:00Z`)
        .toISOString()
        .slice(0, 10) !== invoice.due_date
    ) {
      missingFields.push("due_date");
    }

    const validationErrors = [];

    if (
      invoice.amount !== null &&
      invoice.amount !== undefined &&
      invoice.amount !== "" &&
      (!Number.isFinite(Number(invoice.amount)) ||
        Number(invoice.amount) < 0)
    ) {
      validationErrors.push("Amount must be a non-negative number.");
    }

    return {
      vendor: invoice.vendor || null,
      invoice_number: invoice.invoice_number || null,
      amount:
        invoice.amount === null || invoice.amount === undefined ||
        invoice.amount === ""
          ? null
          : Number(invoice.amount),
      currency: invoice.currency || null,
      due_date: invoice.due_date || null,
      missing_fields: missingFields,
      validation_errors: validationErrors,
      needs_review:
        missingFields.length > 0 || validationErrors.length > 0,
    };
  }
);
