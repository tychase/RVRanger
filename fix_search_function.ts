  async searchRvListingsWithScoring(params: any, options?: { limit?: number; offset?: number }): Promise<(RvListing & { score: number })[]> {
    try {
      const {
        query,           // Full-text search query
        manufacturer,    // Manufacturer name
        converter,       // Converter company
        chassisType,     // Chassis model
        yearFrom,        // Min year
        yearTo,          // Max year
        priceFrom,       // Min price
        priceTo,         // Maximum price
        slides,          // Number of slides
        featured         // Featured listings
      } = params;
      
      console.log("Search params:", params);
      
      // Use a simple query approach initially to get results
      const simpleQuery = sql`
        SELECT 
          l.*, 
          0 AS score
        FROM rv_listings l
        ORDER BY l.created_at DESC
        LIMIT 20
      `;
      
      console.log("Executing simple search query");
      
      try {
        const result = await db.execute(simpleQuery);
        
        // Handle the database query result
        if (result && Array.isArray(result)) {
          return result.map((item: any) => ({ 
            ...item, 
            score: 1
          })) as (RvListing & { score: number })[];
        } else if (result && result.rows && Array.isArray(result.rows)) {
          return result.rows.map((item: any) => ({ 
            ...item, 
            score: 1
          })) as (RvListing & { score: number })[];
        } else {
          return [] as (RvListing & { score: number })[];
        }
      } catch (innerError) {
        console.error("Inner error:", innerError);
        return [] as (RvListing & { score: number })[];
      }
    } catch (error) {
      console.error("Error in searchRvListingsWithScoring:", error);
      return [] as (RvListing & { score: number })[];
    }
  }
