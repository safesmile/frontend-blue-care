import { Toast } from "@base-ui/react/toast";

export const toastManager = Toast.createToastManager();

export const notify = {
  success: (title: string) =>
    toastManager.add({ title, type: "success", timeout: 5000 }),
  error: (title: string, id?: string) =>
    toastManager.add({ id, title, type: "error", timeout: 9000 }),
};
