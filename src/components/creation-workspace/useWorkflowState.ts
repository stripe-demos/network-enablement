'use client'

import { useState, useCallback, useMemo, useRef } from "react"
import type { WorkflowConfig } from "./workflowConfig"
import { getPriceDisplay } from "./previewUtils"

// ── Types ────────────────────────────────────────────────────────────

export type WorkflowObject = {
  id: string
  kind: string
  label: string
  isPlaceholder: boolean
  isComplete: boolean
  data: Record<string, any>
}

export type WorkflowPhase = "editing" | "reviewing"

export type ValidationError = {
  objectId: string
  objectLabel: string
  field: string
}

export type WorkflowState = {
  objects: WorkflowObject[]
  activeObjectId: string | null
  activeObject: WorkflowObject | null
  phase: WorkflowPhase
  validationErrors: ValidationError[]
  clearValidationErrors: () => void
  addObject: (kind: string) => string
  removeObject: (id: string) => void
  setActiveObject: (id: string) => void
  updateObjectData: (id: string, data: Record<string, any>) => void
  availableNextSuggestions: () => { kind: string; actionLabel: string; reason: string }[]
  availableAddOptions: () => { kind: string; label: string }[]
  enterReview: () => void
  exitReview: () => void
  resetToInitial: () => void
  handlePrimaryAction: () => void
  config: WorkflowConfig
}

// ── Helpers ──────────────────────────────────────────────────────────

function derivePriceLabel(data: Record<string, any>): string | null {
  const amount = data.amount as string | undefined
  const model = data.pricingModel as string | undefined
  if ((amount && amount.trim()) || model === "graduated" || model === "volume") {
    const presentation = getPriceDisplay(data)
    return `${presentation.title} · ${presentation.detail}`
  }
  return null
}

function checkCompletion(config: WorkflowConfig, kind: string, data: Record<string, any>): boolean {
  const kindConfig = config.objectKinds[kind]
  if (kindConfig?.requiredFields && kindConfig.requiredFields.length > 0) {
    return kindConfig.requiredFields.every(
      (f) => typeof data[f] === "string" && data[f].trim().length > 0
    )
  }
  return Object.values(data).some(
    (v) => typeof v === "string" && v.trim().length > 0
  )
}

function validateObjects(config: WorkflowConfig, objects: WorkflowObject[]): ValidationError[] {
  const errors: ValidationError[] = []
  for (const obj of objects) {
    const kindConfig = config.objectKinds[obj.kind]
    if (!kindConfig?.requiredFields) continue
    for (const field of kindConfig.requiredFields) {
      const value = obj.data[field]
      if (!value || (typeof value === "string" && !value.trim())) {
        errors.push({ objectId: obj.id, objectLabel: obj.label, field })
      }
    }
  }
  return errors
}

/** Shared filter for + menu options (contextual or general menu kind list). */
export function computeAddOptionsFromMenuKinds(
  config: WorkflowConfig,
  objects: WorkflowObject[],
  menuKinds: string[]
): { kind: string; label: string }[] {
  const existingKinds = new Set(objects.map((o) => o.kind))
  return menuKinds
    .filter((kind) => config.objectKinds[kind])
    .filter((kind) => {
      const cfg = config.objectKinds[kind]
      if (cfg.dependsOn && !existingKinds.has(cfg.dependsOn)) return false
      if (cfg.allowMultiple) return true
      return !existingKinds.has(kind)
    })
    .map((kind) => ({ kind, label: config.objectKinds[kind].label }))
}

function computeNextSuggestions(
  config: WorkflowConfig,
  objects: WorkflowObject[],
  activeObject: WorkflowObject | null
): { kind: string; actionLabel: string; reason: string }[] {
  if (!activeObject) return []
  const kindConfig = config.objectKinds[activeObject.kind]
  if (!kindConfig?.suggestedNext) return []
  const existingKinds = new Set(objects.map((o) => o.kind))
  return kindConfig.suggestedNext.filter((s) => {
    const targetKind = config.objectKinds[s.kind]
    if (targetKind?.dependsOn && !existingKinds.has(targetKind.dependsOn)) return false
    if (targetKind?.allowMultiple) return true
    return !existingKinds.has(s.kind)
  })
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useWorkflowState(config: WorkflowConfig): WorkflowState {
  const nextIdRef = useRef(1)

  const [objects, setObjects] = useState<WorkflowObject[]>(() => {
    const initial = config.objectKinds[config.initialObjectKind]
    if (!initial) return []
    const id = `obj_${nextIdRef.current++}`
    return [{
      id,
      kind: config.initialObjectKind,
      label: initial.label,
      isPlaceholder: true,
      isComplete: false,
      data: {},
    }]
  })

  const [activeObjectId, setActiveObjectId] = useState<string | null>(
    () => objects[0]?.id ?? null
  )

  const [phase, setPhase] = useState<WorkflowPhase>("editing")

  const activeObject = useMemo(
    () => objects.find((o) => o.id === activeObjectId) ?? null,
    [objects, activeObjectId]
  )

  const addObject = useCallback(
    (kind: string): string => {
      const kindConfig = config.objectKinds[kind]
      if (!kindConfig) throw new Error(`Unknown object kind: ${kind}`)
      const id = `obj_${nextIdRef.current++}`
      const existingCount = objects.filter((o) => o.kind === kind).length
      const obj: WorkflowObject = {
        id,
        kind,
        label: existingCount > 0 ? `${kindConfig.label} (${existingCount + 1})` : kindConfig.label,
        isPlaceholder: true,
        isComplete: false,
        data: {},
      }
      setObjects((prev) => [...prev, obj])
      setActiveObjectId(id)
      setPhase("editing")
      return id
    },
    [config, objects]
  )

  const removeObject = useCallback(
    (id: string) => {
      const removedKind = objects.find((o) => o.id === id)?.kind
      const dependentIds = removedKind
        ? objects
            .filter((o) => config.objectKinds[o.kind]?.dependsOn === removedKind)
            .map((o) => o.id)
        : []
      const allIdsToRemove = new Set([id].concat(dependentIds))

      setObjects((prev) => prev.filter((o) => !allIdsToRemove.has(o.id)))
      setActiveObjectId((prev) => {
        if (prev && allIdsToRemove.has(prev)) {
          const remaining = objects.filter((o) => !allIdsToRemove.has(o.id))
          return remaining[remaining.length - 1]?.id ?? null
        }
        return prev
      })
    },
    [objects, config]
  )

  const updateObjectData = useCallback(
    (id: string, data: Record<string, any>) => {
      setObjects((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o
          const merged = { ...o.data, ...data }
          const nameField = merged.name || merged.customerName || merged.productName
          const priceLabel = o.kind === "price" ? derivePriceLabel(merged) : null
          const resolvedLabel = priceLabel || (nameField && nameField.trim() ? nameField.trim() : null)
          return {
            ...o,
            data: merged,
            label: resolvedLabel || o.label,
            isPlaceholder: !resolvedLabel,
            isComplete: checkCompletion(config, o.kind, merged),
          }
        })
      )
    },
    [config]
  )

  const availableNextSuggestions = useCallback(
    () => computeNextSuggestions(config, objects, activeObject),
    [activeObject, config, objects]
  )

  const availableAddOptions = useCallback(() => {
    const menuKinds = config.addMenuKinds ?? Object.keys(config.objectKinds)
    return computeAddOptionsFromMenuKinds(config, objects, menuKinds)
  }, [config, objects])

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const clearValidationErrors = useCallback(() => setValidationErrors([]), [])

  const enterReview = useCallback(() => setPhase("reviewing"), [])
  const exitReview = useCallback(() => setPhase("editing"), [])

  const resetToInitial = useCallback(() => {
    const initialObj = objects.find((o) => o.kind === config.initialObjectKind)
    if (initialObj) {
      setObjects([initialObj])
      setActiveObjectId(initialObj.id)
    }
    setPhase("editing")
    setValidationErrors([])
  }, [objects, config])

  const handlePrimaryAction = useCallback(() => {
    const errors = validateObjects(config, objects)
    if (errors.length > 0) {
      setValidationErrors(errors)
      if (objects.length > 1) {
        setActiveObjectId(errors[0].objectId)
      }
      return
    }
    setValidationErrors([])
    console.log("Created!", objects)
  }, [objects, config])

  return {
    objects,
    activeObjectId,
    activeObject,
    phase,
    validationErrors,
    clearValidationErrors,
    addObject,
    removeObject,
    setActiveObject: setActiveObjectId,
    updateObjectData,
    availableNextSuggestions,
    availableAddOptions,
    enterReview,
    exitReview,
    resetToInitial,
    handlePrimaryAction,
    config,
  }
}
