import { apiClient } from "./client";

export type TripStatus = "Draft" | "Active" | "Completed";

export type TripStep = {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  scheduledAt: string | null;
  googleMapsUrl: string | null;
  externalUrl: string | null;
  ticketImageUrl: string | null;
  placeImageUrl: string | null;
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
};

export type TripDetail = TripSummary & {
  steps: TripStep[];
};

export type TripPayload = {
  title: string;
  destination: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  coverImageUrl: string | null;
};

export async function getTrips() {
  const response = await apiClient.get<TripSummary[]>("/api/trips");
  return response.data;
}

export async function createTrip(payload: TripPayload) {
  const response = await apiClient.post<TripDetail>("/api/trips", payload);
  return response.data;
}

export async function getTrip(tripId: string) {
  const response = await apiClient.get<TripDetail>(`/api/trips/${tripId}`);
  return response.data;
}

export async function updateTrip(tripId: string, payload: TripPayload) {
  const response = await apiClient.put<TripDetail>(`/api/trips/${tripId}`, payload);
  return response.data;
}

export async function deleteTrip(tripId: string) {
  await apiClient.delete(`/api/trips/${tripId}`);
}

export async function startTrip(tripId: string) {
  const response = await apiClient.post<TripDetail>(`/api/trips/${tripId}/start`);
  return response.data;
}

export async function completeTrip(tripId: string) {
  const response = await apiClient.post<TripDetail>(`/api/trips/${tripId}/complete`);
  return response.data;
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<{ url: string }>("/api/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.url;
}
