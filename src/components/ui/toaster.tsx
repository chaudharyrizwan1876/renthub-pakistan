"use client";

import { Toaster as Sonner } from "sonner";

/** Mounted only in the auth, owner and admin areas so public pages ship no toast JS. */
export function Toaster() {
  return <Sonner richColors position="top-center" closeButton duration={3500} toastOptions={{ className: "!rounded-xl !shadow-lg" }} />;
}
