import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { CheckCircleIcon, AlertIcon, XIcon } from "@/icons";
import { toastManager } from "@/lib/notify";
import { peopleMessages } from "@/lib/session-messages";

export function AppToasts({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} limit={5}>
      {children}
      <ToastStack />
    </Toast.Provider>
  );
}

function ToastStack() {
  const { toasts } = Toast.useToastManager();
  const t = peopleMessages();
  return (
    <Toast.Portal>
      <Toast.Viewport
        aria-label={t.toastRegion}
        className="pointer-events-none fixed right-4 bottom-4 z-[100001] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-sm flex-col-reverse gap-3 overflow-y-auto outline-none"
      >
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className="pointer-events-auto flex shrink-0 items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-gray-800 shadow-theme-lg transition duration-200 data-ending-style:translate-x-8 data-ending-style:opacity-0 data-limited:hidden data-starting-style:translate-x-8 data-starting-style:opacity-0 motion-reduce:transition-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {toast.type === "success" ? (
              <CheckCircleIcon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-teal-600 dark:text-teal-400"
              />
            ) : (
              <AlertIcon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400"
              />
            )}
            <Toast.Content className="min-w-0 flex-1">
              <Toast.Title className="text-sm leading-6 font-medium break-words" />
            </Toast.Content>
            <Toast.Close
              aria-label={t.closeToast}
              aria-hidden={false}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <XIcon className="size-4" />
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
