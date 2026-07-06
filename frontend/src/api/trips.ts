import { apiClient } from "./client";

export type TripStatus = "Draft" | "Active" | "Completed";
export type TripStepType = "Place" | "Transport" | "Hotel" | "Restaurant" | "Activity" | "Note";
export type TripStepStatus = "Todo" | "Done" | "Skipped";

export type TripStep = {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  type: TripStepType;
  status: TripStepStatus;
  scheduledAt: string | null;
  googleMapsUrl: string | null;
  externalUrl: string | null;
  imageUrls: string[];
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type TripSummary = {
  id: string;
  title: string;
  destination: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  coverImageUrl: string | null;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  isPublicShared: boolean;
};

export type TripDetail = TripSummary & { publicShareToken: string | null; steps: TripStep[] };
export type PublicTripDetail = Pick<TripDetail, "id" | "title" | "destination" | "description" | "startDate" | "endDate" | "coverImageUrl" | "steps">;
export type TripPayload = { title: string; destination: string; description: string | null; startDate: string | null; endDate: string | null; coverImageUrl: string | null };
export type TripStepPayload = { title: string; description: string | null; type: TripStepType; scheduledAt: string | null; googleMapsUrl: string | null; externalUrl: string | null; imageUrls: string[] };

export type ShareLinkResponse = { shareUrl: string; token: string };

export async function getTrips() { return (await apiClient.get<TripSummary[]>("/api/trips")).data; }
export async function createTrip(payload: TripPayload) { return (await apiClient.post<TripDetail>("/api/trips", payload)).data; }
export async function getTrip(tripId: string) { return (await apiClient.get<TripDetail>(`/api/trips/${tripId}`)).data; }
export async function updateTrip(tripId: string, payload: TripPayload) { return (await apiClient.put<TripDetail>(`/api/trips/${tripId}`, payload)).data; }
export async function deleteTrip(tripId: string) { await apiClient.delete(`/api/trips/${tripId}`); }
export async function startTrip(tripId: string) { return (await apiClient.post<TripDetail>(`/api/trips/${tripId}/start`)).data; }
export async function completeTrip(tripId: string) { return (await apiClient.post<TripDetail>(`/api/trips/${tripId}/complete`)).data; }
export async function createTripShareLink(tripId: string) { return (await apiClient.post<ShareLinkResponse>(`/api/trips/${tripId}/share`)).data; }
export async function disableTripShareLink(tripId: string) { await apiClient.delete(`/api/trips/${tripId}/share`); }
export async function uploadFile(file: File) { const formData = new FormData(); formData.append("file", file); return (await apiClient.post<{ url: string }>("/api/files/upload", formData, { headers: { "Content-Type": "multipart/form-data" } })).data.url; }
export async function getTripSteps(tripId: string) { return (await apiClient.get<TripStep[]>(`/api/trips/${tripId}/steps`)).data; }
export async function createTripStep(tripId: string, payload: TripStepPayload) { return (await apiClient.post<TripStep>(`/api/trips/${tripId}/steps`, payload)).data; }
export async function updateTripStep(tripId: string, stepId: string, payload: TripStepPayload) { return (await apiClient.put<TripStep>(`/api/trips/${tripId}/steps/${stepId}`, payload)).data; }
export async function deleteTripStep(tripId: string, stepId: string) { await apiClient.delete(`/api/trips/${tripId}/steps/${stepId}`); }
export async function reorderTripSteps(tripId: string, stepIds: string[]) { return (await apiClient.post<TripStep[]>(`/api/trips/${tripId}/steps/reorder`, { stepIds })).data; }
export async function markTripStepDone(tripId: string, stepId: string) { return (await apiClient.post<TripStep>(`/api/trips/${tripId}/steps/${stepId}/done`)).data; }
export async function skipTripStep(tripId: string, stepId: string) { return (await apiClient.post<TripStep>(`/api/trips/${tripId}/steps/${stepId}/skip`)).data; }
export async function getPublicTrip(token: string) { return (await apiClient.get<PublicTripDetail>(`/api/public/trips/${token}`)).data; }
