/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseFolderPath(folderName?: string): string {
  if (!folderName) return "uploads"

  const sanitized = folderName
    .replace(/[^a-zA-Z0-9\-_/]/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "")

  return `uploads/${sanitized}`
}

export function getFolderStructure(files: any[]): any {
  const structure: any = {
    folders: {},
    files: [],
  }

  files.forEach((file) => {
    const pathParts = file.s3Key.split("/")

    if (pathParts.length <= 2) {
      structure.files.push(file)
    } else {
      const folderPath = pathParts.slice(1, -1).join("/")

      if (!structure.folders[folderPath]) {
        structure.folders[folderPath] = {
          name: folderPath,
          files: [],
          fileCount: 0,
          totalSize: 0,
        }
      }

      structure.folders[folderPath].files.push(file)
      structure.folders[folderPath].fileCount++
      structure.folders[folderPath].totalSize += file.size
    }
  })

  return structure
}

export function searchFiles(files: any[], query: string): any[] {
  if (!query.trim()) return files

  const searchTerm = query.toLowerCase()

  return files.filter(
    (file) =>
      file.filename.toLowerCase().includes(searchTerm) ||
      file.contentType.toLowerCase().includes(searchTerm) ||
      file.s3Key.toLowerCase().includes(searchTerm),
  )
}
