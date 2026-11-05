import { api } from "@/lib/api";
import { createUsersApi } from "./api";
export const usersApi = createUsersApi(api);
