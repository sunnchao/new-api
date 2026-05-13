import { api } from "@/lib/api";
import type {
  ApiResponse,
  GetUsersParams,
  GetUsersResponse,
  ManageUserAction,
  ManageUserQuotaPayload,
  OAuthBinding,
  SearchUsersParams,
  User,
  UserFormData,
} from "./types";

export async function getUsers(
  params: GetUsersParams = {},
): Promise<GetUsersResponse> {
  const { p = 1, page_size = 10 } = params;
  const res = await api.get(`/api/user/?p=${p}&page_size=${page_size}`);
  return res.data;
}

export async function searchUsers(
  params: SearchUsersParams,
): Promise<GetUsersResponse> {
  const { keyword = "", group = "", p = 1, page_size = 10 } = params;
  const res = await api.get(
    `/api/user/search?keyword=${keyword}&group=${group}&p=${p}&page_size=${page_size}`,
  );
  return res.data;
}

export async function getUser(id: number): Promise<ApiResponse<User>> {
  const res = await api.get(`/api/user/${id}`);
  return res.data;
}

export async function createUser(
  data: UserFormData,
): Promise<ApiResponse<User>> {
  const res = await api.post("/api/user/", data);
  return res.data;
}

export async function updateUser(
  data: UserFormData & { id: number },
): Promise<ApiResponse<Partial<User>>> {
  const res = await api.put("/api/user/", data);
  return res.data;
}

export async function deleteUser(id: number): Promise<ApiResponse> {
  const res = await api.delete(`/api/user/${id}/`);
  return res.data;
}

export async function manageUser(
  id: number,
  action: ManageUserAction,
): Promise<ApiResponse<Partial<User>>> {
  const res = await api.post("/api/user/manage", { id, action });
  return res.data;
}

export async function adjustUserQuota(
  payload: ManageUserQuotaPayload,
): Promise<ApiResponse<Partial<User>>> {
  const res = await api.post("/api/user/manage", payload);
  return res.data;
}

export async function resetUserPasskey(id: number): Promise<ApiResponse> {
  const res = await api.delete(`/api/user/${id}/reset_passkey`);
  return res.data;
}

export async function resetUserTwoFA(id: number): Promise<ApiResponse> {
  const res = await api.delete(`/api/user/${id}/2fa`);
  return res.data;
}

export async function getGroups(): Promise<ApiResponse<string[]>> {
  const res = await api.get("/api/group/");
  return res.data;
}

export async function getUserOAuthBindings(
  userId: number,
): Promise<ApiResponse<OAuthBinding[]>> {
  const res = await api.get(`/api/user/${userId}/oauth/bindings`);
  return res.data;
}

export async function adminClearUserBinding(
  userId: number,
  bindingType: string,
): Promise<ApiResponse> {
  const res = await api.delete(`/api/user/${userId}/bindings/${bindingType}`);
  return res.data;
}

export async function adminUnbindCustomOAuth(
  userId: number,
  providerId: string,
): Promise<ApiResponse> {
  const res = await api.delete(
    `/api/user/${userId}/oauth/bindings/${providerId}`,
  );
  return res.data;
}
