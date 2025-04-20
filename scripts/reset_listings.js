/**
 * Reset Listings Script
 * 
 * This script removes all existing RV listings and images from the database
 * to prepare for a fresh scrape with the updated 20-image limit.
 */
import { db } from '../server/db.js';
import { rvImages, rvListings } from '../shared/schema.js';

async function resetListings() {
  console.log('Starting database reset process...');
  
  try {
    // Use a transaction to ensure all operations succeed or fail together
    await db.transaction(async (tx) => {
      console.log('Deleting all RV images...');
      await tx.delete(rvImages);
      
      console.log('Deleting all RV listings...');
      await tx.delete(rvListings);
    });
    
    // Verify deletion
    const remainingListings = await db.select().from(rvListings).execute();
    console.log(`Reset complete. Remaining listings: ${remainingListings.length}`);
    
    console.log('Database reset successful. Ready for fresh scrape.');
    return true;
  } catch (error) {
    console.error('Error during database reset:', error);
    return false;
  }
}

// Run the reset function
resetListings().then(success => {
  if (success) {
    console.log('Listings reset completed successfully');
    process.exit(0);
  } else {
    console.error('Listings reset failed');
    process.exit(1);
  }
});