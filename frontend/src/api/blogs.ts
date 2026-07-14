import { apiClient } from "./client";

export type TripBlogSection = {
  sourceStepId: string;
  heading: string;
  body: string;
  costAmount: number | null;
  scheduledAt: string | null;
  imageUrls: string[];
};

export type TripBlogContent = {
  title: string;
  introduction: string;
  conclusion: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  coverImageUrl: string | null;
  currencyCode: string;
  totalCost: number;
  sections: TripBlogSection[];
};

export type TripBlog = {
  id: string;
  tripId: string;
  locale: "vi" | "en";
  draft: TripBlogContent;
  generatedAt: string;
  updatedAt: string;
  isPublished: boolean;
  publishedAt: string | null;
  publicUrl: string | null;
  generatedProvider: string | null;
  generatedModel: string | null;
};

export type PublicTripBlog = {
  id: string;
  locale: "vi" | "en";
  content: TripBlogContent;
  publishedAt: string;
};

export type UpdateTripBlogPayload = {
  title: string;
  introduction: string;
  conclusion: string;
  sections: Array<Pick<TripBlogSection, "sourceStepId" | "heading" | "body">>;
};

export async function getTripBlog(tripId: string) {
  return (await apiClient.get<TripBlog>(`/api/trips/${tripId}/blog`)).data;
}

export async function generateTripBlog(tripId: string, locale: "vi" | "en") {
  return (await apiClient.post<TripBlog>(`/api/trips/${tripId}/blog/generate`, { locale })).data;
}

export async function updateTripBlog(tripId: string, payload: UpdateTripBlogPayload) {
  return (await apiClient.put<TripBlog>(`/api/trips/${tripId}/blog`, payload)).data;
}

export async function publishTripBlog(tripId: string) {
  return (await apiClient.post<TripBlog>(`/api/trips/${tripId}/blog/publish`)).data;
}

export async function unpublishTripBlog(tripId: string) {
  await apiClient.delete(`/api/trips/${tripId}/blog/publish`);
}

export async function getPublicTripBlog(token: string) {
  return (await apiClient.get<PublicTripBlog>(`/api/public/blogs/${token}`)).data;
}
