import { api } from "@/lib/api";
import { createPeopleApi } from "./api";
export const peopleApi = createPeopleApi(api);
