'use client'

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent as ReactMouseEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { useProductFormStyle } from "@/components/creation-workspace/productFormStyle"

// Shared animated product-image uploader. Drag a file over it and the idle content
// dims while a dashed target ring + download arrow ("Release to upload") appears and a
// preview of the dragged file follows the cursor, then settles into place on drop.
// Matches the "Object Creation — Post-UBB" Figma. Props: imageUrl + onChange(url|null).

const uploadMotion = {
  settleDuration: 0.34,
  ease: [0.22, 1, 0.36, 1] as const,
}

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)
    return () => mediaQuery.removeEventListener("change", updatePreference)
  }, [])

  return prefersReducedMotion
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function imageFileLabel(file: File | null) {
  const extension = file?.name.split(".").pop()
  if (extension && extension.length <= 4) return extension.toUpperCase()
  return "IMG"
}

function imageFileDetails(file: File) {
  const extension = imageFileLabel(file)
  const size = file.size >= 1_000_000
    ? `${(file.size / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(file.size / 1_000))} KB`

  return `${extension} · ${size}`
}

function DragFileIllustration({ label }: { label: string }) {
  return (
    <div className="relative h-[48px] w-[42px] drop-shadow-[0_9px_10px_rgba(55,47,128,0.18)]">
      <div className="absolute inset-[4px_1px_0_5px] rotate-[7deg] rounded-[6px] border border-[#DCD8FF] bg-[#EFEDFF]" />
      <svg className="absolute inset-0" viewBox="0 0 42 48" fill="none" aria-hidden="true">
        <path d="M7 1.25H27.5L40.75 14.5V41.5C40.75 44.4 38.4 46.75 35.5 46.75H7C4.1 46.75 1.75 44.4 1.75 41.5V6.5C1.75 3.6 4.1 1.25 7 1.25Z" fill="white" stroke="#C9C4FF" strokeWidth="1.5" />
        <path d="M27.5 1.5V11C27.5 13.07 29.18 14.75 31.25 14.75H40.5" fill="#EFEDFF" />
        <path d="M27.5 1.5V11C27.5 13.07 29.18 14.75 31.25 14.75H40.5" stroke="#C9C4FF" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="8" y="20" width="26.5" height="17" rx="3.5" fill="#F4F2FF" stroke="#D6D2FF" />
        <circle cx="14.25" cy="25.25" r="2.25" fill="#8D84FF" />
        <path d="M10.5 34L17.1 28.1C17.84 27.44 18.97 27.47 19.67 28.17L22.2 30.7L25.26 27.64C26 26.9 27.21 26.94 27.9 27.73L32.5 33" stroke="#675DFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute bottom-[6px] left-[9px] rounded-[3px] bg-[#675DFF] px-[3px] py-[1px] text-[6px] font-[700] leading-[7px] tracking-[0.05em] text-white">
        {label}
      </span>
    </div>
  )
}

export function ProductImageDropzone({
  imageUrl,
  onChange,
}: {
  imageUrl: string | null
  onChange: (next: string | null) => void
}) {
  const { productFormStyle } = useProductFormStyle()
  const reduceMotion = usePrefersReducedMotion()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null)
  const previewCloseRef = useRef<HTMLButtonElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const dragDepthRef = useRef(0)
  const dropTimeoutRef = useRef<number | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isDropSettling, setIsDropSettling] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; details: string } | null>(null)
  const [imageError, setImageError] = useState("")
  const [dragFileLabel, setDragFileLabel] = useState("IMG")
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0, rotate: -6 })
  const dropHeight = productFormStyle === "current" ? "min-h-[88px]" : "min-h-[104px]"
  const textClass = productFormStyle === "current"
    ? "text-[12px] font-[400] leading-[16px] tracking-[-0.024px] text-[#6C7688]"
    : productFormStyle === "refresh"
      ? "text-[13px] font-[400] leading-[20px] tracking-[-0.065px] text-[#68778B]"
      : "text-[14px] font-[400] leading-[20px] tracking-[-0.15px] text-[#818DA0]"
  const browseClass = productFormStyle === "current"
    ? "rounded-[6px] border border-[#D8DEE4] bg-white px-[8px] py-[2px] font-[600] text-[#273951] shadow-[0_1px_1px_rgba(20,34,52,0.04)]"
    : productFormStyle === "refresh"
      ? "rounded-full bg-[#F1F6FB] px-[10px] py-[2px] font-[500] text-[#142234]"
      : "rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[3px] font-[600] text-[#273951] shadow-[0_1px_1px_rgba(20,34,52,0.04)]"

  useEffect(() => () => {
    if (dropTimeoutRef.current !== null) window.clearTimeout(dropTimeoutRef.current)
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  useEffect(() => {
    if (!isPreviewOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPreviewOpen(false)
      if (event.key === "Tab") {
        event.preventDefault()
        previewCloseRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.requestAnimationFrame(() => previewCloseRef.current?.focus())

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      previewTriggerRef.current?.focus()
    }
  }, [isPreviewOpen])

  const validateFile = (file: File | null) => {
    if (!file) return "Choose a JPEG, PNG, or WEBP image"
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Use a JPEG, PNG, or WEBP image"
    if (file.size > 2 * 1024 * 1024) return "Image must be 2 MB or smaller"
    return ""
  }

  const handleFile = (file: File | null) => {
    const error = validateFile(file)
    if (error || !file) {
      setImageError(error)
      return false
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const nextUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextUrl
    setUploadedFile({ name: file.name, details: imageFileDetails(file) })
    setImageError("")
    onChange(nextUrl)
    return true
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.item(0) ?? null)
    event.target.value = ""
  }

  const updateDragPosition = (event: DragEvent<HTMLDivElement>) => {
    const rect = dropRef.current?.getBoundingClientRect()
    if (!rect) return

    const rawX = event.clientX - rect.left - rect.width / 2
    const rawY = event.clientY - rect.top - rect.height / 2
    const maxX = Math.max(8, rect.width / 2 - 30)
    const maxY = Math.max(4, rect.height / 2 - 28)
    const cursorGap = 58
    const previewX = rawX + cursorGap <= maxX
      ? rawX + cursorGap
      : rawX - cursorGap

    setDragPosition({
      x: clamp(previewX, -maxX, maxX),
      y: clamp(rawY - 16, -maxY, maxY),
      rotate: clamp((rawX / (rect.width / 2)) * 10, -10, 10),
    })
    setDragFileLabel(imageFileLabel(event.dataTransfer.files?.item(0) ?? null))
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.item(0) ?? null
    dragDepthRef.current = 0

    const error = validateFile(file)
    if (error || !file) {
      setImageError(error)
      setIsDragActive(false)
      return
    }

    setDragFileLabel(imageFileLabel(file))
    setIsDropSettling(true)

    dropTimeoutRef.current = window.setTimeout(() => {
      handleFile(file)
      setIsDragActive(false)
      setIsDropSettling(false)
      dropTimeoutRef.current = null
    }, reduceMotion ? 0 : uploadMotion.settleDuration * 1000)
  }

  const removeImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setUploadedFile(null)
    setImageError("")
    setIsPreviewOpen(false)
    onChange(null)
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
      <div
        ref={dropRef}
        aria-busy={isDropSettling}
        className={`relative flex ${dropHeight} w-full items-center justify-center overflow-hidden rounded-[6px] border outline-none transition-[border-color,background-color,box-shadow] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          isDragActive
            ? "border-[#675DFF] bg-[#F7F5FF] shadow-[inset_0_0_0_1px_rgba(103,93,255,0.06),0_6px_18px_rgba(103,93,255,0.10)]"
            : imageUrl
              ? "border-solid border-[#D8DEE4] bg-[#FAFBFC] p-[8px] hover:border-[#B6C0CD]"
              : "border-dashed border-[#D8DEE4] bg-white hover:border-[#B6C0CD] hover:bg-[#FAFBFC]"
        }`}
        onDragEnter={(event) => {
          event.preventDefault()
          if (isDropSettling) return
          dragDepthRef.current += 1
          updateDragPosition(event)
          setIsDragActive(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = "copy"
          if (isDropSettling) return
          updateDragPosition(event)
          setIsDragActive(true)
        }}
        onDragLeave={() => {
          if (isDropSettling) return
          dragDepthRef.current -= 1
          if (dragDepthRef.current <= 0) {
            dragDepthRef.current = 0
            setIsDragActive(false)
          }
        }}
        onDrop={onDrop}
      >
        <motion.span
          className="flex h-full w-full items-center justify-center"
          animate={{
            opacity: isDragActive ? 0.16 : 1,
            scale: isDragActive && !reduceMotion ? 0.97 : 1,
            filter: isDragActive && !reduceMotion ? "blur(1px)" : "blur(0px)",
          }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: uploadMotion.ease }}
        >
          {imageUrl ? (
            <motion.span
              key={imageUrl}
              className="group/image-card flex h-full w-full min-w-0 items-center gap-[12px]"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.72, filter: "blur(5px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: reduceMotion ? 0 : 0.42, ease: uploadMotion.ease }}
            >
              <button
                ref={previewTriggerRef}
                type="button"
                aria-label="View product image"
                className="group relative h-[72px] w-[88px] shrink-0 overflow-hidden rounded-[6px] border border-[#D8DEE4] bg-white p-[4px] outline-none transition-[border-color,box-shadow] hover:border-[#B6C0CD] focus-visible:border-[#675DFF] focus-visible:shadow-[0_0_0_3px_rgba(103,93,255,0.18)]"
                onClick={() => setIsPreviewOpen(true)}
              >
                <img src={imageUrl} alt="Uploaded product image" className="h-full w-full rounded-[3px] object-contain" />
                <span className="absolute inset-0 flex items-center justify-center bg-[rgba(20,34,52,0.58)] text-white opacity-0 transition-opacity duration-[150ms] group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="7.75" cy="7.75" r="4.75" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M11.3 11.3L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M7.75 5.75V9.75M5.75 7.75H9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>

              <span className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-[13px] font-[600] leading-[18px] tracking-[-0.08px] text-[#273951]" aria-live="polite">
                  Image uploaded
                </span>
                <span className="max-w-[220px] truncate text-[12px] font-[400] leading-[16px] text-[#6C7688]">
                  {uploadedFile?.name ?? "Click the preview to view full size"}
                </span>
                {uploadedFile && (
                  <span className="text-[11px] font-[400] leading-[15px] text-[#818DA0]">
                    {uploadedFile.details}
                  </span>
                )}
              </span>

              <span className="pointer-events-none ml-auto flex shrink-0 items-center gap-[4px] opacity-0 transition-opacity duration-[150ms] group-hover/image-card:pointer-events-auto group-hover/image-card:opacity-100 group-focus-within/image-card:pointer-events-auto group-focus-within/image-card:opacity-100 motion-reduce:transition-none">
                <button
                  type="button"
                  aria-label="Replace product image"
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#3C4F69] transition-colors hover:bg-[#F0EDFF] focus-visible:bg-[#F0EDFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#675DFF]"
                  onClick={() => inputRef.current?.click()}
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none" className="h-[10.61px] w-[10.61px]">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0.206568 7.25358C0.22268 7.0119 0.325969 6.78427 0.497246 6.61299L6.6709 0.43934C7.25669 -0.146446 8.20643 -0.146447 8.79222 0.43934L10.1709 1.81802C10.7567 2.40381 10.7567 3.35355 10.1709 3.93934L3.99725 10.113C3.82597 10.2843 3.59835 10.3876 3.35666 10.4037L0.266643 10.6097C0.115722 10.6197 -0.00949439 10.4945 0.000567011 10.3436L0.206568 7.25358ZM1.59227 9.01797L1.69075 7.54081L5.76188 3.46968L7.14056 4.84836L3.06943 8.91949L1.59227 9.01797ZM8.20122 3.7877L9.11024 2.87868L7.73156 1.5L6.82254 2.40902L8.20122 3.7877Z" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Remove product image"
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[#3C4F69] transition-colors hover:bg-[#FEF4F6] hover:text-[#C0123C] focus-visible:bg-[#FEF4F6] focus-visible:text-[#C0123C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0123C]"
                  onClick={removeImage}
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="h-[12px] w-[12px]">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.99998 3V1.5C8.99998 0.671573 8.3284 0 7.49998 0H4.49998C3.67155 0 2.99998 0.671573 2.99998 1.5V3H0.75C0.335786 3 0 3.33579 0 3.75C0 4.16421 0.335786 4.5 0.75 4.5H1.49998V10C1.49998 11.1046 2.39541 12 3.49998 12H8.49998C9.60454 12 10.5 11.1046 10.5 10V4.5H11.25C11.6642 4.5 12 4.16421 12 3.75C12 3.33579 11.6642 3 11.25 3H8.99998ZM7.49998 1.4H4.49998C4.44475 1.4 4.39998 1.44477 4.39998 1.5V3H7.59998V1.5C7.59998 1.44477 7.5552 1.4 7.49998 1.4ZM9.09998 4.5V10C9.09998 10.3314 8.83135 10.6 8.49998 10.6H3.49998C3.1686 10.6 2.89998 10.3314 2.89998 10V4.5H9.09998Z" fill="currentColor" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.62498 5.5C4.97015 5.5 5.24998 5.77982 5.24998 6.125V8.875C5.24998 9.22018 4.97015 9.5 4.62498 9.5C4.2798 9.5 3.99998 9.22018 3.99998 8.875V6.125C3.99998 5.77982 4.2798 5.5 4.62498 5.5Z" fill="currentColor" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.37498 5.5C7.72015 5.5 7.99998 5.77982 7.99998 6.125V8.875C7.99998 9.22018 7.72015 9.5 7.37498 9.5C7.0298 9.5 6.74998 9.22018 6.74998 8.875V6.125C6.74998 5.77982 7.0298 5.5 7.37498 5.5Z" fill="currentColor" />
                  </svg>
                </button>
              </span>
            </motion.span>
          ) : (
            <button
              type="button"
              aria-label="Upload product image"
              className={`flex h-full w-full items-center justify-center rounded-[5px] outline-none focus-visible:shadow-[inset_0_0_0_3px_rgba(103,93,255,0.18)] ${textClass}`}
              onClick={() => {
                if (!isDropSettling) inputRef.current?.click()
              }}
            >
              <span className="flex items-center gap-[8px]">
                <span>Drop to upload or</span>
                <span className={browseClass}>
                  Browse
                </span>
              </span>
            </button>
          )}
        </motion.span>

        <AnimatePresence>
          {isDragActive && (
            <motion.span
              key="drop-glow"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(103,93,255,0.16),rgba(103,93,255,0)_66%)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: isDropSettling ? 1 : 0.72 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDragActive && (
            <motion.span
              key="drop-target"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[48px] w-[48px] -translate-x-1/2 -translate-y-1/2"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
              animate={isDropSettling
                ? { opacity: 0, scale: 0.72, filter: "blur(3px)" }
                : { opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.82 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: uploadMotion.ease }}
              aria-hidden="true"
            >
              <span className="absolute inset-0 rounded-full border border-dashed border-[#9188FF] bg-white/80 shadow-[0_5px_18px_rgba(103,93,255,0.15),inset_0_0_0_5px_rgba(103,93,255,0.05)]" />
              <span className="absolute inset-[9px] flex items-center justify-center rounded-full bg-[#E9E6FF] text-[#5A50E6] shadow-[inset_0_0_0_1px_rgba(103,93,255,0.14)]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2.25V9.25M4.25 6.75L7 9.5L9.75 6.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 11.5H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="absolute left-1/2 top-[52px] -translate-x-1/2 whitespace-nowrap text-[10px] font-[600] leading-[12px] tracking-[-0.02em] text-[#5A50E6]">
                Release to upload
              </span>
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDragActive && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
              <motion.span
                className="block"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.72, y: dragPosition.y + 8, rotate: -10 }}
                animate={isDropSettling
                  ? { opacity: 0, scale: 0.46, x: 0, y: 0, rotate: 0, filter: "blur(5px)" }
                  : { opacity: 1, scale: 1, x: dragPosition.x, y: dragPosition.y, rotate: dragPosition.rotate, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={isDropSettling
                  ? { duration: reduceMotion ? 0 : uploadMotion.settleDuration, ease: uploadMotion.ease }
                  : reduceMotion
                    ? { duration: 0 }
                    : {
                        x: { type: "spring", stiffness: 430, damping: 32, mass: 0.52 },
                        y: { type: "spring", stiffness: 430, damping: 32, mass: 0.52 },
                        rotate: { type: "spring", stiffness: 360, damping: 28, mass: 0.55 },
                        opacity: { duration: 0.16 },
                        scale: { duration: 0.22, ease: uploadMotion.ease },
                      }}
              >
                <DragFileIllustration label={dragFileLabel} />
              </motion.span>
            </span>
          )}
        </AnimatePresence>
      </div>

      {imageError && <p role="alert" className="mt-[4px] text-[11px] leading-[16px] text-[#DF1B41]">{imageError}</p>}

      <AnimatePresence>
        {isPreviewOpen && imageUrl && (
          <motion.div
            key="product-image-preview"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,26,36,0.64)] p-[24px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15, ease: uploadMotion.ease }}
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Product image preview"
              className="relative flex max-h-[min(760px,calc(100vh-48px))] max-w-[min(880px,calc(100vw-48px))] flex-col overflow-hidden rounded-[12px] border border-[#D8DEE4] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: uploadMotion.ease }}
              onClick={(event: ReactMouseEvent<HTMLDivElement>) => event.stopPropagation()}
            >
              <div className="flex h-[48px] shrink-0 items-center justify-between border-b border-[#ECF1F6] px-[16px]">
                <div className="min-w-0">
                  <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#273951]">Product image</p>
                  {uploadedFile && <p className="max-w-[520px] truncate text-[11px] leading-[14px] text-[#818DA0]">{uploadedFile.name}</p>}
                </div>
                <button
                  ref={previewCloseRef}
                  type="button"
                  aria-label="Close image preview"
                  className="-mr-[6px] flex h-[30px] w-[30px] items-center justify-center rounded-[6px] text-[#596171] outline-none transition-colors hover:bg-[#F1F3F5] focus-visible:shadow-[0_0_0_3px_rgba(103,93,255,0.18)]"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex min-h-0 items-center justify-center bg-[#F5F6F8] p-[24px]">
                <img src={imageUrl} alt="Product image" className="max-h-[min(640px,calc(100vh-144px))] max-w-[min(800px,calc(100vw-96px))] rounded-[6px] object-contain shadow-[0_1px_3px_rgba(15,23,42,0.10)]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
