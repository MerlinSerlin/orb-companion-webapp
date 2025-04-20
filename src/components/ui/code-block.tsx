"use client"

import React from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string | object
  language?: string
  title?: string
  className?: string
}

export function CodeBlock({
  code,
  language = 'json',
  title,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)
  
  const codeString = typeof code === 'string' 
    ? code 
    : JSON.stringify(code, null, 2)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('rounded-md border overflow-hidden bg-muted/50', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <button
            onClick={copyToClipboard}
            className="p-1 rounded hover:bg-muted"
            aria-label="Copy code"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <CopyIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-auto text-sm">
        <code className={`language-${language}`}>
          {codeString}
        </code>
      </pre>
    </div>
  )
} 