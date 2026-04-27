import api from '@/lib/api';

const BASE_URL = "/owner/onboarding";

export interface OwnerDraft {
  id: string;
  accountId: string;
  currentStep: string;
  draftData: unknown; // Changed from any to unknown
  lastSavedAt: string;
  version: number;
}

export interface OnboardingStatus {
  accountId: string;
  hasOwnerIdentity: boolean;
  ownerState: string | null;
  hasDraft: boolean;
  draftCurrentStep: string | null;
  canCreateVenues: boolean;
  completionPercentage: number;
}

export interface SaveDraftInput {
  step: string;
  data: Record<string, unknown>;
  version?: number;
}

export interface OwnerDocument {
  id: string;
  documentType: string;
  url: string;
  status: string;
  fileName: string;
}

export interface TimelineEvent {
  id: string;
  fromState: string;
  toState: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
  title: string;
  description: string;
  icon: 'submit' | 'review' | 'approved' | 'rejected' | 'changes' | 'resubmit';
}

export const OwnerIdentityApi = {
  getStatus: async (): Promise<OnboardingStatus> => {
    const response = await api.get(`${BASE_URL}/status`);
    return response.data;
  },

  getDraft: async (): Promise<OwnerDraft> => {
    const response = await api.get(`${BASE_URL}/draft`);
    return response.data;
  },

  saveDraft: async (input: SaveDraftInput) => {
    const response = await api.patch(`${BASE_URL}/draft`, input);
    return response.data;
  },

  submit: async (idempotencyKey?: string) => {
    const response = await api.post(`${BASE_URL}/submit`, {}, {
      headers: {
        'X-Idempotency-Key': idempotencyKey || crypto.randomUUID(),
      },
    });
    return response.data;
  },

  getTimeline: async (): Promise<TimelineEvent[]> => {
    const response = await api.get(`${BASE_URL}/timeline`);
    return response.data.timeline || [];
  },

  getDocuments: async (): Promise<OwnerDocument[]> => {
    const response = await api.get(`${BASE_URL}/documents`);
    return response.data;
  },

  generateUploadUrl: async (documentType: string, fileName: string, contentType: string, ownerDraftId?: string): Promise<{ uploadUrl: string; s3Key: string; documentId: string }> => {
    const response = await api.post(`${BASE_URL}/documents/upload-url`, {
      documentType,
      fileName,
      contentType,
      ownerDraftId,
    });
    return response.data; // { uploadUrl, key, documentId }
  },

  confirmUpload: async (params: {
    documentType: string;
    s3Key: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }): Promise<{ message: string; documentId: string }> => {
    const response = await api.post(`${BASE_URL}/documents`, params);
    return response.data;
  },

  getDocumentDownloadUrl: async (documentId: string): Promise<{ downloadUrl: string }> => {
    const response = await api.get(`${BASE_URL}/documents/${documentId}/download-url`);
    return response.data;
  },

  deleteDocument: async (documentId: string) => {
    const response = await api.delete(`${BASE_URL}/documents/${documentId}`);
    return response.data;
  },

  getFeedback: async () => {
    const response = await api.get(`${BASE_URL}/feedback`);
    return response.data;
  },

  resubmit: async () => {
    const response = await api.post(`${BASE_URL}/resubmit`);
    return response.data;
  },

  abandonOnboarding: async () => {
    const response = await api.delete(`${BASE_URL}/application`);
    return response.data;
  }
};
