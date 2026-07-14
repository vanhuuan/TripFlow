import { apiClient } from "./client";

export type TripStatus = "Draft" | "Active" | "Completed";
export type TripStepType = "Place" | "Transport" | "Hotel" | "Restaurant" | "Activity" | "Note";
export type TripStepStatus = "Todo" | "Done" | "Skipped";
export type ImageUploadKind = "TripCover" | "TripStep";

export type TripMember = {
  id: string;
  name: string;
};

export type TripMemberPayload = {
  id: string | null;
  name: string;
};

export type TripStep = {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  type: TripStepType;
  status: TripStepStatus;
  scheduledAt: string | null;
  costAmount: string | null;
  googleMapsUrl: string | null;
  externalUrl: string | null;
  imageUrls: string[];
  participantMemberIds: string[];
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
  currencyCode: string;
  totalCost: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  isPublicShared: boolean;
};

export type TripDetail = TripSummary & { publicShareToken: string | null; members: TripMember[]; steps: TripStep[] };

export type PublicTripStep = {
  id: string;
  title: string;
  description: string | null;
  type: TripStepType;
  status: TripStepStatus;
  scheduledTime: string | null;
  googleMapsUrl: string | null;
  externalUrl: string | null;
  imageUrls: string[];
  orderIndex: number;
};

export type PublicTripDetail = {
  id: string;
  title: string;
  destination: string;
  description: string | null;
  coverImageUrl: string | null;
  currencyCode: string;
  steps: PublicTripStep[];
};
export type TripPayload = { title: string; destination: string; description: string | null; startDate: string | null; endDate: string | null; coverImageUrl: string | null; currencyCode: string; members: TripMemberPayload[] };
export type TripStepPayload = { title: string; description: string | null; type: TripStepType; scheduledAt: string | null; costAmount: number | null; googleMapsUrl: string | null; externalUrl: string | null; imageUrls: string[]; participantMemberIds: string[] };

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

const MAX_IMAGE_DIMENSION = 1600;
const TARGET_IMAGE_SIZE = 500 * 1024;
const MIN_IMAGE_QUALITY = 0.5;
const QUALITY_STEP = 0.1;

function canUseCanvasCompression(file: File) {
  return file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
}

async function fileToImage(file: File) {
  if ("createImageBitmap" in window) {
    return await createImageBitmap(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

async function compressImageFile(file: File) {
  if (!canUseCanvasCompression(file)) {
    return file;
  }

  const source = await fileToImage(file);
  const width = source.width;
  const height = source.height;
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(source as CanvasImageSource, 0, 0, targetWidth, targetHeight);

  for (let quality = 0.85; quality >= MIN_IMAGE_QUALITY; quality -= QUALITY_STEP) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= TARGET_IMAGE_SIZE) {
      return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: file.lastModified });
    }
  }

  const fallback = await canvasToBlob(canvas, MIN_IMAGE_QUALITY);
  if (fallback) {
    return new File([fallback], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: file.lastModified });
  }

  return file;
}

export async function uploadFile(file: File, kind: ImageUploadKind) {
  const uploadFileToSend = await compressImageFile(file);
  const formData = new FormData();
  formData.append("file", uploadFileToSend);
  return (await apiClient.post<{ url: string }>(`/api/files/upload?kind=${kind}`, formData)).data.url;
}
export async function getTripSteps(tripId: string) { return (await apiClient.get<TripStep[]>(`/api/trips/${tripId}/steps`)).data; }
export async function createTripStep(tripId: string, payload: TripStepPayload) { return (await apiClient.post<TripStep>(`/api/trips/${tripId}/steps`, payload)).data; }
export async function updateTripStep(tripId: string, stepId: string, payload: TripStepPayload) { return (await apiClient.put<TripStep>(`/api/trips/${tripId}/steps/${stepId}`, payload)).data; }
export async function deleteTripStep(tripId: string, stepId: string) { await apiClient.delete(`/api/trips/${tripId}/steps/${stepId}`); }
export async function reorderTripSteps(tripId: string, stepIds: string[]) { return (await apiClient.post<TripStep[]>(`/api/trips/${tripId}/steps/reorder`, { stepIds })).data; }
export async function markTripStepDone(tripId: string, stepId: string) { return (await apiClient.post<TripStep>(`/api/trips/${tripId}/steps/${stepId}/done`)).data; }
export async function skipTripStep(tripId: string, stepId: string) { return (await apiClient.post<TripStep>(`/api/trips/${tripId}/steps/${stepId}/skip`)).data; }
export async function getPublicTrip(token: string) { return (await apiClient.get<PublicTripDetail>(`/api/public/trips/${token}`)).data; }




