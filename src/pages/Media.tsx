import { useEffect, useState, type ChangeEvent } from 'react'
import { Plus, UploadCloud } from 'lucide-react'
import { ApiError, api } from '../api/client'
import type { MediaAsset } from '../api/types'
import { Badge, Button, Card, EmptyState, Modal, Table } from '../components/ui'
import { useToast } from '../components/ui/Toast'

const STORAGE_KEY = 'tw_media'
const ALLOWED = 'image/png, image/jpeg, image/webp, application/pdf'

function readStored(): MediaAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MediaAsset[]) : []
  } catch {
    return []
  }
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>(readStored)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { notify } = useToast()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets))
  }, [assets])

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null)
    setError('')
  }

  const upload = async () => {
    if (!file) {
      setError('Choose a file first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await api.uploadMedia(file)
      setAssets((current) => [created, ...current])
      setOpen(false)
      setFile(null)
      notify('File uploaded to temporary storage')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const promote = async (asset: MediaAsset) => {
    try {
      const result = await api.promoteMedia(asset.id)
      setAssets((current) =>
        current.map((item) =>
          item.id === result.id
            ? { ...item, status: result.status, provider: result.provider, s3Key: result.s3Key, url: result.url }
            : item,
        ),
      )
      notify('Asset promoted to long-term storage')
    } catch (cause) {
      notify(cause instanceof ApiError ? cause.message : 'Promotion failed', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Media</h1>
        <p className="mt-1 text-sm text-slate-500">Upload to Cloudinary, then promote to long-term storage.</p>
      </div>

      <Card
        title="Media assets"
        action={
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setError('')
              setOpen(true)
            }}
          >
            <Plus size={15} /> Upload file
          </Button>
        }
      >
        {assets.length === 0 ? (
          <EmptyState title="No media yet" help="Upload a file to see it here." />
        ) : (
          <Table headers={['File', 'Status', 'Provider', 'Size', 'Location', '']}>
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{asset.mimeType}</p>
                  <p className="font-mono text-xs text-slate-500">{asset.id.slice(0, 8)}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge>{asset.status}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{asset.provider}</td>
                <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-600">
                  {formatBytes(asset.size)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  <a href={asset.url} target="_blank" rel="noreferrer" className="hover:text-slate-900">
                    {asset.s3Key ?? asset.url.slice(0, 24)}
                  </a>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={asset.status === 'PROMOTED'}
                    onClick={() => void promote(asset)}
                  >
                    Promote
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Upload media">
        <div className="space-y-4">
          <label
            htmlFor="media-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-slate-400 focus-within:ring-2 focus-within:ring-yellow-400"
          >
            <UploadCloud size={24} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              {file ? file.name : 'Choose a file'}
            </span>
            <span className="text-xs text-slate-500">
              {file ? formatBytes(file.size) : `Allowed: ${ALLOWED}`}
            </span>
            <input id="media-file" type="file" className="sr-only" onChange={pickFile} />
          </label>
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" loading={busy} onClick={() => void upload()}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
