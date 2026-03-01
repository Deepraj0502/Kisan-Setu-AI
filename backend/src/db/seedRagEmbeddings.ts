import "dotenv/config";
import { getPool } from "./client";
import { ingestContentForRAG } from "../services/rag/ragService";

async function seedSchemes() {
  const pool = getPool();

  const result = await pool.query<{
    id: string;
    scheme_code: string;
    name_english: string;
    benefits_summary: string | null;
    description_english: string | null;
    eligible_states: string[] | null;
  }>(
    `SELECT id, scheme_code, name_english, benefits_summary, description_english, eligible_states
     FROM government_schemes
     WHERE is_active = true
     ORDER BY created_at ASC
     LIMIT 50`
  );

  console.log(`Found ${result.rowCount} government schemes to embed...`);

  for (const row of result.rows) {
    const states =
      row.eligible_states && row.eligible_states.length > 0
        ? row.eligible_states.join(", ")
        : "all states";

    const content = [
      `Government scheme for farmers: ${row.name_english} (code: ${row.scheme_code}).`,
      row.benefits_summary
        ? `Benefits: ${row.benefits_summary}.`
        : undefined,
      row.description_english
        ? `Description: ${row.description_english}.`
        : undefined,
      `Eligible states: ${states}.`
    ]
      .filter(Boolean)
      .join(" ");

    await ingestContentForRAG(content, "scheme", row.id, "en", {
      scheme_code: row.scheme_code
    });
  }
}

async function seedMandiData() {
  const pool = getPool();

  const result = await pool.query<{
    id: string;
    mandi_name: string;
    district: string | null;
    state: string | null;
    commodity_name: string;
    variety: string | null;
    min_price: string | null;
    max_price: string | null;
    modal_price: string | null;
    price_date: string;
    unit: string | null;
  }>(
    `SELECT id, mandi_name, district, state, commodity_name, variety,
            min_price, max_price, modal_price, price_date, unit
     FROM mandi_data
     ORDER BY price_date DESC
     LIMIT 100`
  );

  console.log(`Found ${result.rowCount} mandi price rows to embed...`);

  for (const row of result.rows) {
    const locationParts = [
      row.mandi_name,
      row.district,
      row.state
    ].filter(Boolean);

    const priceRange =
      row.min_price && row.max_price
        ? `Price range: ₹${row.min_price}–₹${row.max_price}`
        : undefined;

    const modal =
      row.modal_price && row.unit
        ? `Most common price: ₹${row.modal_price} per ${row.unit}`
        : row.modal_price
        ? `Most common price: ₹${row.modal_price}`
        : undefined;

    const contentLines = [
      `Mandi price information for ${row.commodity_name}${
        row.variety ? ` (${row.variety})` : ""
      }.`,
      locationParts.length > 0
        ? `Location: ${locationParts.join(", ")}.`
        : undefined,
      `Date: ${row.price_date}.`,
      priceRange,
      modal
    ];

    const content = contentLines.filter(Boolean).join(" ");

    await ingestContentForRAG(content, "mandi", row.id, "en", {
      commodity_name: row.commodity_name,
      mandi_name: row.mandi_name
    });
  }
}

async function main() {
  try {
    console.log("🌾 Seeding RAG embeddings from government_schemes and mandi_data...");
    await seedSchemes();
    await seedMandiData();
    console.log("✅ RAG embeddings seeding completed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error while seeding RAG embeddings:", error);
    process.exit(1);
  }
}

void main();

