export interface Listing {
  id: string;
  title: string;
  converter: string;
  price: number;
  year: number;
  mileage: number;
  score?: number;  // relevance score, only populated when sorting by relevance
  featuredImage: string;  // URL to the featured image
  // …any other fields you need to share between client & server
}