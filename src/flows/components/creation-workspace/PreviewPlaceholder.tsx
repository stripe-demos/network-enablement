'use client'

type PreviewPlaceholderProps = {
  title: string
  [key: string]: any
}

export function PreviewPlaceholder({ title }: PreviewPlaceholderProps) {
  return (
    <div className="flex min-h-full w-full shrink-0 items-center justify-center">
      <div
        className="flex max-w-full flex-col items-center justify-center rounded-[12px] border border-dashed border-[#D4DEE9] bg-white px-[24px] py-[20px] text-center"
        style={{
          width: "max(420px, 50%)",
          height: "clamp(280px, 44vh, 520px)",
        }}
      >
        <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A2C44]">
          {title}
        </p>
        <span className="mt-[6px] inline-block rounded-full border border-[#E3E8EF] bg-[#F8FAFB] px-[8px] py-[2px] text-[11px] font-[500] leading-[14px] text-[#68778B]">
          Example preview
        </span>
      </div>
    </div>
  )
}

export function InvoicePlaceholderPreview(props: any) {
  return <PreviewPlaceholder title="Invoice" />
}

export function SubscriptionPlaceholderPreview(props: any) {
  return <PreviewPlaceholder title="Subscription" />
}

export function PaymentLinkPlaceholderPreview(props: any) {
  return <PreviewPlaceholder title="Payment link" />
}
