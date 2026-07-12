"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

type FormDialogProps = {
  triggerLabel: string;
  title: string;
  children: React.ReactNode;
};

export function FormDialog({ triggerLabel, title, children }: FormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-bci-navy px-5 py-3 text-sm font-extrabold text-white hover:bg-bci-navy2 transition-colors shadow-soft"
      >
        <Plus size={18} />
        {triggerLabel}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogTitle className="text-lg font-extrabold text-bci-ink">
            {title}
          </DialogTitle>
          <div className="mt-2">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
