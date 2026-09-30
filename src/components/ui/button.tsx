import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // ปุ่มหลัก: สีเกือบดำพร้อมเงานูนเล็กน้อย (แบบ Cal.com)
        default:
          "bg-primary text-primary-foreground shadow-(--shadow-button-solid) hover:bg-primary/92 hover:shadow-(--shadow-button-solid-hover) active:shadow-(--shadow-button-solid-active)",
        // ปุ่มรอง: พื้นขาว ขอบเทา
        outline:
          "border-input bg-background text-foreground shadow-(--shadow-button-outline) hover:border-border-strong hover:bg-canvas aria-expanded:bg-muted",
        secondary: "bg-secondary text-foreground hover:bg-emphasis aria-expanded:bg-emphasis",
        ghost: "text-body hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-white shadow-(--shadow-button-solid) hover:bg-destructive/90 focus-visible:ring-destructive/25",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-3.5",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-4",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={render}
      // เมื่อ render เป็นลิงก์ (<Link />) ไม่ใช่ <button> ต้องบอก Base UI ให้ใส่ role="button" แทน
      nativeButton={nativeButton ?? !render}
      {...props}
    />
  )
}

export { Button, buttonVariants }
