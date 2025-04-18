"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  id: string
  name?: string
  label: string | React.ReactNode
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  pattern?: string
  labelClassName?: string
  inputClassName?: string
  gridClassName?: string
}

export function FormField({
  id,
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  required = false,
  pattern,
  labelClassName = "text-right",
  inputClassName = "col-span-3",
  gridClassName = "grid grid-cols-4 items-center gap-4",
}: FormFieldProps) {
  return (
    <div className={gridClassName}>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <Input
        id={id}
        name={name || id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        pattern={pattern}
        className={inputClassName}
      />
    </div>
  )
} 