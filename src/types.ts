export type Role = "ADMIN" | "STAFF" | "CUSTOMER";

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
