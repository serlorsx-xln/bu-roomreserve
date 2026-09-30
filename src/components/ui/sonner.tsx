"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { Loader2Icon } from "lucide-react"

// Toast สีเข้มด้านล่างกลางจอ แบบ Cal.com — สื่อสารด้วยข้อความ ไม่ใช้ไอคอน
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      className="toaster group"
      icons={{
        success: null,
        info: null,
        warning: null,
        error: null,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--primary)",
          "--normal-text": "var(--primary-foreground)",
          "--normal-border": "transparent",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !px-4 !py-3 !text-sm !shadow-(--shadow-dropdown) font-sans",
          description: "!text-primary-foreground/75",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
