export type Role = "ADMIN" | "STAFF" | "CUSTOMER" | "USER";

export const ROLES: Role[] = ["ADMIN", "STAFF", "CUSTOMER", "USER"];

export type CustomerType = "AIRLINE" | "MRO" | "OEM";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPayload {
  name: string;
  email: string;
  role: Role;
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPayload {
  name: string;
  type: CustomerType;
  email: string;
  phone: string;
  address: string;
}

export interface WorkflowStage {
  id: string;
  name: string;
  isInitial: boolean;
  isTerminal: boolean;
}

export interface WorkflowTransition {
  id: string;
  srcStage: WorkflowStage;
  destStage: WorkflowStage;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** The by-id response adds the current draft graph. */
export interface WorkflowTemplateDetail extends WorkflowTemplate {
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
}

export interface WorkflowTemplateVersion {
  id: string;
  version: number;
  publishedAt: string;
}

/** A published version's frozen graph — what a product is instantiated from. */
export interface WorkflowTemplateVersionDetail extends WorkflowTemplateVersion {
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
}

/** Returned on a product; the assignee is expanded by the API. */
export interface TransitionAssignment {
  transitionId: string;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
}

/** Sent when creating a product. */
export interface TransitionAssignmentInput {
  transitionId: string;
  assigneeUserId: string;
  allowAttachments: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  customerId: string;
  workflowTemplateId: string;
  workflowTemplateVersion: number;
  dopWorkflowInstanceId: string;
  dopWorkflowItemId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  transitionAssignments: TransitionAssignment[];
}

export interface ProductPayload {
  name: string;
  description: string;
  customerId: string;
  workflowTemplateId: string;
  workflowTemplateVersion: number;
  transitionAssignments: TransitionAssignmentInput[];
}

/** Customer and workflow template are immutable after creation. */
export interface ProductUpdatePayload {
  name: string;
  description: string;
}

/** A template transition merged with this product's own assignee, if any. */
export interface ProductTransition {
  id: string;
  srcStage: WorkflowStage;
  destStage: WorkflowStage;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  allowAttachments?: boolean;
}

export interface AssignTransitionPayload {
  assigneeUserId: string;
  allowAttachments: boolean;
}

export interface PresignFileRequest {
  fileName: string;
  mimeType: string;
}

/** One short-lived S3 upload target returned by the presign endpoint. */
export interface PresignedUpload {
  url: string;
  key: string;
  fileName?: string;
  mimeType?: string;
}

export interface AttachmentRef {
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface HistoryAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  transitionId: string;
  srcStageId: string;
  destStageId: string;
  performedById: string;
  performedByName: string;
  performedByEmail: string;
  performedAt: string;
  attachments: HistoryAttachment[];
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: Meta;
}

export interface ListParams {
  page?: number;
  limit?: number;
}
