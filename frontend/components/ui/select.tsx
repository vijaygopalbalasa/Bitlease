import React from 'react'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

interface SelectTriggerProps {
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

export function Select({ value, onValueChange, children }: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {children}
      </select>
    </div>
  )
}

export function SelectContent({ children }: SelectContentProps) {
  return <>{children}</>
}

export function SelectItem({ value, children }: SelectItemProps) {
  return <option value={value}>{children}</option>
}

export function SelectTrigger({ children }: SelectTriggerProps) {
  return <>{children}</>
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <span>{placeholder}</span>
}
