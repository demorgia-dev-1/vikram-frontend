/** Mirrors the API enum; RIDER still exists there, on older accounts. */
export type Role = "ADMIN" | "USER" | "RIDER";

/** Roles offered when creating or editing a user. */
export const ROLES: Role[] = ["ADMIN", "USER"];

export type CustomerType = "AIRLINE" | "MRO" | "OEM" | "OTHER";

export const CUSTOMER_TYPES: CustomerType[] = [
  "AIRLINE",
  "MRO",
  "OEM",
  "OTHER",
];

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

/** Create also takes an initial password; update omits it. */
export interface CreateUserPayload extends UserPayload {
  password: string;
}

export interface WorkflowTemplatePayload {
  name: string;
  description?: string;
}

export interface StagePayload {
  name: string;
  isInitial?: boolean;
  isTerminal?: boolean;
}

export interface TransitionPayload {
  name: string;
  srcStageId: string;
  destStageId: string;
}

/** Only the name is editable; the stages it connects are fixed. */
export interface TransitionUpdatePayload {
  name: string;
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
  /** The action it represents, e.g. "Approve". Template graphs only. */
  name?: string | null;
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

export type WorkflowItemStatus = "ACTIVE" | "COMPLETED" | "REVOKED";

export interface Product {
  id: string;
  name: string;
  description: string;
  customerId: string;
  workflowTemplateId: string;
  /** The published version's id — not its number; resolve via the versions list. */
  workflowTemplateVersionId: string;
  workflowInstanceId: string;
  workflowItemId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  transitionAssignments: TransitionAssignment[];
  /** Where the product's workflow item stands. */
  workflowItemStatus: WorkflowItemStatus;
  /** The instance stage it currently sits in — same id space as transitions. */
  currentStage: WorkflowStage;
}

export interface ProductPayload {
  name: string;
  description: string;
  customerId: string;
  workflowTemplateId: string;
  /** Optional on the API; omitted means the latest published version. */
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
  name?: string | null;
  srcStage: WorkflowStage;
  destStage: WorkflowStage;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  allowAttachments?: boolean;
}

export interface HistoryAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

/** One transition assigned to you, actionable from the product's current stage. */
export interface PendingTransition {
  transitionId: string;
  transitionName: string | null;
  /** Where it would move the product; the source is the product's currentStage. */
  destStage: WorkflowStage;
  allowAttachments: boolean;
}

/** Pending work grouped by product — a product with nothing to do is omitted. */
export interface PendingProduct {
  productId: string;
  productName: string;
  productDescription: string | null;
  customerId: string;
  customerName: string;
  /** Every pending transition below starts from this stage. */
  currentStage: WorkflowStage;
  pendingTransitions: PendingTransition[];
}

/** One transition you performed, with anything you attached at the time. */
export interface PerformedTransition {
  logId: string;
  transitionId: string;
  transitionName: string | null;
  srcStage: WorkflowStage;
  destStage: WorkflowStage;
  performedAt: string;
  attachments: HistoryAttachment[];
}

/** Your own activity, grouped by product, most recent first within each. */
export interface PerformedProduct {
  productId: string;
  productName: string;
  productDescription: string | null;
  customerId: string;
  customerName: string;
  performedTransitions: PerformedTransition[];
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

export interface HistoryEntry {
  id: string;
  transitionId: string;
  transitionName: string | null;
  srcStageId: string;
  destStageId: string;
  performedById: string;
  performedByName: string;
  performedByEmail: string;
  performedAt: string;
  attachments: HistoryAttachment[];
}

export type NotificationType = "PENDING_TRANSITION" | "TRANSITION_ASSIGNED";

export interface Notification {
  id: string;
  type: NotificationType;
  recipientId: string;
  productId: string;
  productName: string;
  transitionId: string;
  transitionName: string | null;
  stageName: string;
  /** Pre-composed sentence; the ids are there for deep-linking. */
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Omitting isRead returns unread only — the API's own default. */
export interface NotificationListParams extends ListParams {
  isRead?: boolean;
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

/** GET /customers also filters by search term, type and active status. */
export interface CustomerListParams extends ListParams {
  search?: string;
  type?: CustomerType | "";
  isActive?: boolean;
}

/** GET /products also filters by search term, customer, template and status. */
export interface ProductListParams extends ListParams {
  search?: string;
  customerId?: string;
  workflowTemplateId?: string;
  isActive?: boolean;
}

/** GET /workflow-templates filters by search term only. */
export interface TemplateListParams extends ListParams {
  search?: string;
}
