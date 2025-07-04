"use client"

import { Toaster } from "@/components/ui/sonner" // Assuming sonner is used for toasts
import { useToast } from "@/components/ui/use-toast" // Corrected import path

export function ToasterProvider() {
  const { toasts } = useToast()

  return (
    <Toaster
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:fill-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...toasts}
    />
  )
}