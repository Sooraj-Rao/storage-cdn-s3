"use client"

import { useState } from "react"

interface UrlDisplayProps {
  url: string
  label?: string
  showPasskeyHint?: boolean
  passkey?: string
}

export default function UrlDisplay({ url, label = "URL", showPasskeyHint = false, passkey }: UrlDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
      const textArea = document.createElement("textarea")
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyWithPasskey = async () => {
    const urlWithPasskey = `${url}?passkey=${encodeURIComponent(passkey || "")}`
    try {
      await navigator.clipboard.writeText(urlWithPasskey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  return (
    <div className="bg-blue-50 p-3 rounded-md">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-800">{label}:</p>
          <p className="text-sm text-blue-600 break-all font-mono bg-white px-2 py-1 rounded mt-1">{url}</p>
          {showPasskeyHint && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-blue-600">For passkey access, use the complete URL below:</p>
              {passkey && (
                <p className="text-xs text-blue-700 font-mono bg-blue-100 px-2 py-1 rounded break-all">
                  {url}?passkey={passkey}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="ml-3 flex flex-col space-y-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              copied ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            {copied ? "✓ Copied!" : "Copy URL"}
          </button>
          {showPasskeyHint && passkey && (
            <button
              type="button"
              onClick={copyWithPasskey}
              className="px-3 py-2 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors font-medium"
            >
              📋 Copy Complete URL
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
