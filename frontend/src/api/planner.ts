import { apiClient } from "./client";
import type { TripDetail, TripStepStatus, TripStepType } from "./trips";

export type PlannerMessageRole = "User" | "Assistant";
export type PlanProposalStatus = "Pending" | "Applied" | "Dismissed" | "Superseded" | "Stale";

export type ProposedTripStep = {
  key: string;
  id: string | null;
  title: string;
  description: string | null;
  type: TripStepType;
  status: TripStepStatus;
  scheduledAt: string | null;
  costAmount: number | null;
  googleMapsUrl: string | null;
  externalUrl: string | null;
  imageUrls: string[];
  participantMemberIds: string[];
};

export type ProposedTripPlan = {
  title: string;
  destination: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  currencyCode: string;
  steps: ProposedTripStep[];
};

export type PlanProposal = {
  id: string;
  status: PlanProposalStatus;
  plan: ProposedTripPlan;
  createdAt: string;
  appliedAt: string | null;
};

export type PlannerMessage = {
  id: string;
  role: PlannerMessageRole;
  content: string;
  provider: string | null;
  model: string | null;
  createdAt: string;
  proposal: PlanProposal | null;
};

export type PlannerMessagePage = { messages: PlannerMessage[]; nextBefore: string | null };
export type PlannerTurn = { userMessage: PlannerMessage; assistantMessage: PlannerMessage };

export async function getPlannerMessages(tripId: string, before?: string | null) {
  return (await apiClient.get<PlannerMessagePage>(`/api/trips/${tripId}/planner/messages`, {
    params: { limit: 50, ...(before ? { before } : {}) },
  })).data;
}

export async function sendPlannerMessage(tripId: string, message: string, locale: "vi" | "en", clientMessageId: string) {
  return (await apiClient.post<PlannerTurn>(`/api/trips/${tripId}/planner/messages`, { clientMessageId, message, locale })).data;
}

export async function applyPlanProposal(tripId: string, proposalId: string) {
  return (await apiClient.post<TripDetail>(`/api/trips/${tripId}/planner/proposals/${proposalId}/apply`)).data;
}

export async function dismissPlanProposal(tripId: string, proposalId: string) {
  await apiClient.post(`/api/trips/${tripId}/planner/proposals/${proposalId}/dismiss`);
}
