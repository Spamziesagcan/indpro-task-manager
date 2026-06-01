import { Toaster as SonnerToaster, toast } from "sonner";

const Toaster = () => (
  <SonnerToaster
    theme="dark"
    richColors
    position="top-right"
    closeButton
    toastOptions={{
      classNames: {
        toast:
          "!border-white/10 !bg-[rgba(2,6,23,0.94)] !text-slate-100 !shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
        title: "!text-white",
        description: "!text-slate-400",
        actionButton:
          "!bg-indigo-500 !text-white hover:!bg-indigo-400",
        cancelButton:
          "!bg-white/5 !text-slate-200 hover:!bg-white/10",
      },
    }}
  />
);

export { Toaster, toast };