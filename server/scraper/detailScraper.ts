// server/scraper/detailScraper.ts
import axios from "axios";
import * as cheerio from "cheerio";
import pLimit from "p-limit";
import { db } from "../db";
import {
  rvListings,
  rvImages
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const BASE = "https://www.prevost-stuff.com";
const INDEX_URL = `${BASE}/forsale/public_list_ads.php`;
const LUXURY_TYPE_ID = 4;  // Using type ID 4 for luxury coaches
const MAX_PHOTOS = 5;      // Maximum number of photos to fetch per listing

const limit = pLimit(8);   // Limit concurrent requests to be polite to the server

export default async function scrapeDetailPages() {
  console.time("scrape");
  const { data: indexHtml } = await axios.get(INDEX_URL, { timeout: 20000 });
  const $index = cheerio.load(indexHtml);

  // collect all listing hrefs
  const links = $index("a[href$='.html']")
    .map((_, el) => $index(el).attr("href")!)
    .get()
    .filter(
      (href: string) =>
        !/hauler|stacker|trailer/i.test(href) &&
        !href.includes("public_list_ads.php")
    );

  await Promise.all(
    links.map((href: string) =>
      limit(async () => {
        const fullUrl = href.startsWith("http")
          ? href
          : href.startsWith("/")
          ? `${BASE}${href}`
          : `${BASE}/forsale/${href}`;

        const sourceId = fullUrl
          .split("/")
          .pop()!
          .replace(/\.[^.]+$/, "")
          .toLowerCase();

        // skip if we already have up‑to‑date data
        const existing = await db.query.rvListings.findFirst({
          where: eq(rvListings.sourceId!, sourceId),
        });
        if (existing) return;

        try {
          const { data: pageHtml } = await axios.get(fullUrl, {
            timeout: 15000,
          });
          const $ = cheerio.load(pageHtml);

          // ----- Title -----
          let title =
            $("h2 b").first().text().trim() ||
            $("title").text().trim() ||
            sourceId;
          title = title.replace(/\bPrevost\b/gi, "").trim();

          // ----- Structured fields -----
          const txt = $("body").text().replace(/\s+/g, " ");
          const grab = (re: RegExp) => {
            const m = txt.match(re);
            return m ? m[1].trim() : null;
          };

          const year = Number(title.match(/\b(19|20)\d{2}\b/)?.[0]) || new Date().getFullYear();
          const priceStr = grab(/\$\s?([\d,]+)/);
          const price = priceStr ? Number(priceStr.replace(/,/g, "")) : 0;
          const seller = grab(/Contact:\s*([^@]+?)\s+at/i);
          const conv = grab(/(?:Converter|Interior Design|Conversion)\s*:\s*([A-Za-z ]+)/i);
          const model = (title.match(/\b(H3-45|X3-45|XLII|XL|X3)\b/i)?.[1]) || grab(/Model:\s*([A-Z0-9\-]+)/i);
          const slideStr = grab(/(\d)\s*Slide/i);
          const slides = slideStr ? Number(slideStr) : undefined;
          const state = grab(/\b([A-Z]{2})\s*(?:\d{5})?\s*Coach/i);
          const lengthStr = grab(/(\d{2})\s*(?:foot|feet|ft)/i);
          const length = lengthStr ? Number(lengthStr) : undefined;
          const mileageStr = grab(/(\d[,\d]*)\s*miles/i);
          const mileage = mileageStr ? Number(mileageStr.replace(/,/g, "")) : undefined;

          // Extract description - get the main content area
          let description = "";
          $("p, div").each((_: number, el: any) => {
            const text = $(el).text().trim();
            if (text.length > 100 && !text.includes("Contact:")) {
              description = text;
              return false; // break the loop
            }
          });

          // ----- Photos -----
          const photos = $("img[src]")
            .map((_: number, el: any) => $(el).attr("src")!)
            .get()
            .filter((src: string) => /\/(photos|Photos)\//.test(src) && /\.jpe?g$/i.test(src))
            .map((src: string) =>
              src.startsWith("http")
                ? src
                : src.startsWith("/")
                ? `${BASE}${src}`
                : `${BASE}/forsale/${src}`
            )
            .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i) // dedupe
            .slice(0, MAX_PHOTOS);

          if (!photos.length) return; // skip if no real images

          // ----- DB upsert (transaction) -----
          await db.transaction(async (tx) => {
            // Default values for required fields
            const manufacturerId = 1; // Prevost (default)
            const typeId = LUXURY_TYPE_ID;
            const location = state || "Unknown";
            const sellerId = 1; // Default seller ID
            
            const [listing] = await tx
              .insert(rvListings)
              .values({
                title,
                description: description || title,
                year,
                price,
                manufacturerId,
                converterId: null, // This would need to be mapped to an ID
                chassisTypeId: null, // This would need to be mapped to an ID
                typeId,
                length,
                mileage,
                location,
                slides,
                featuredImage: photos[0],
                sourceId,
                sellerId,
              })
              .onConflictDoUpdate({
                target: rvListings.sourceId!,
                set: { 
                  price, 
                  updatedAt: sql`NOW()` 
                },
              })
              .returning();

            await tx.delete(rvImages).where(eq(rvImages.rvId, listing.id));
            await tx.insert(rvImages).values(
              photos.map((url: string, i: number) => ({
                rvId: listing.id,
                imageUrl: url,
                isPrimary: i === 0,
              }))
            );
          });
          console.log("✓", title);
        } catch (err) {
          console.warn("✗", fullUrl, (err as Error).message);
        }
      })
    )
  );
  console.timeEnd("scrape");
}