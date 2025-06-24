"use client"

import type React from "react"

import { useState } from "react"
import Toast from "./toast"

interface FileAccessModalProps {
  isOpen: boolean
  onClose: () => void
  file: {
    _id: string
    filename: string
    accessType: "private" | "public" | "passkey"
    passkey?: string
    publicId?: string
  }
  onUpdate: () => void
}

export default function FileAccessModal({ isOpen, onClose, file, onUpdate }: FileAccessModalProps) {
  const [accessType, setAccessType] = useState<"private" | "public" | "passkey">(file.accessType)
  const [passkey, setPasskey] = useState(file.passkey || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (accessType === "passkey" && passkey.length < 4) {
      setError("Passkey must be at least 4 characters long")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/files/${file._id}/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessType, passkey: accessType === "passkey" ? passkey : null }),
      })

      if (response.ok) {
        onUpdate()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update access settings")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg text-black font-medium">Access Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">File: {file.filename}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

          <div className="space-y-3">
            <div className="flex items-start">
              <input
                id="modal-private"
                name="accessType"
                type="radio"
                value="private"
                checked={accessType === "private"}
                onChange={(e) => setAccessType(e.target.value as "private")}
                className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-3">
                <label htmlFor="modal-private" className="text-sm font-medium text-gray-700">
                  Private (Owner Only)
                </label>
                <p className="text-sm text-gray-500">Only you can access this file</p>
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="modal-public"
                name="accessType"
                type="radio"
                value="public"
                checked={accessType === "public"}
                onChange={(e) => setAccessType(e.target.value as "public")}
                className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-3">
                <label htmlFor="modal-public" className="text-sm font-medium text-gray-700">
                  Public (Anyone with Link)
                </label>
                <p className="text-sm text-gray-500">Anyone with the link can access this file</p>
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="modal-passkey"
                name="accessType"
                type="radio"
                value="passkey"
                checked={accessType === "passkey"}
                onChange={(e) => setAccessType(e.target.value as "passkey")}
                className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-3">
                <label htmlFor="modal-passkey" className="text-sm font-medium text-gray-700">
                  Passkey Protected
                </label>
                <p className="text-sm text-gray-500">Requires a passkey to access the file</p>
              </div>
            </div>
          </div>

          {accessType === "passkey" && (
            <div>
              <label htmlFor="modal-passkey-input" className="block text-sm font-medium text-gray-700">
                Passkey
              </label>
              <input
                id="modal-passkey-input"
                type="text"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey (min 4 characters)"
                className="mt-1 block w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                minLength={4}
                required
              />
            </div>
          )}



          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
        {toast && (
          <Toast message={toast.message} type={toast.type} isVisible={!!toast} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  )
}
