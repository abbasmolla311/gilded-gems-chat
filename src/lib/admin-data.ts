import { queryOptions } from "@tanstack/react-query";
import { getAdminData, getAdminStatus } from "./admin.functions";

export const adminDataQuery = queryOptions({
  queryKey: ["admin-data"],
  queryFn: () => getAdminData(),
  retry: false,
});

export const adminStatusQuery = queryOptions({
  queryKey: ["admin-status"],
  queryFn: () => getAdminStatus(),
  retry: false,
});
