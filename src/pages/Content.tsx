import { useState } from 'react'
import { AlignLeft, Copy, FileText, MessageSquare, Plus, Search, Tag } from 'lucide-react'
import { ApiError, api } from '../api/client'
import type { ContentItem, SummarizeResult } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { formatRelative } from '../utils/format'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Table,
  Textarea,
} from '../components/ui'
import { useToast } from '../components/ui/Toast'

const tones = ['neutral', 'formal', 'casual', 'persuasive']
const lengths = ['short', 'medium', 'long']

export function ContentPage() {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useAsync(
    () => api.content({ q: query, tag, page }),
    [query, tag, page],
  )
  const { refreshUser } = useAuth()
  const [target, setTarget] = useState<ContentItem | null>(null)
  const [tone, setTone] = useState('neutral')
  const [length, setLength] = useState('short')
  const [result, setResult] = useState<SummarizeResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const { notify } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newTags, setNewTags] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const items = data?.data ?? []
  const tagOptions = [...new Set(items.flatMap((item) => item.tags))].sort()

  const summarize = async () => {
    if (!target) return
    setBusy(true)
    setActionError('')
    try {
      const summary = await api.summarize(target.id, tone, length)
      setResult(summary)
      await refreshUser()
    } catch (cause) {
      setActionError(cause instanceof ApiError ? cause.message : 'Summarization failed')
    } finally {
      setBusy(false)
    }
  }

  const createContent = async () => {
    const title = newTitle.trim()
    const body = newBody.trim()
    const tags = newTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    setCreateError('')
    if (!title || title.length > 200) {
      setCreateError('Title is required and must be at most 200 characters.')
      return
    }
    if (!body) {
      setCreateError('Body is required.')
      return
    }

    setCreating(true)
    try {
      await api.createContent({ title, body, tags })
      setCreateOpen(false)
      setNewTitle('')
      setNewBody('')
      setNewTags('')
      setQuery('')
      setTag('')
      setPage(1)
      reload()
      notify('Content created')
    } catch (cause) {
      setCreateError(cause instanceof ApiError ? cause.message : 'Could not create content')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Content</h1>
        <p className="mt-1 text-sm text-slate-500">Search articles and generate AI summaries.</p>
      </div>

      <Card
        title="Content library"
        className="space-y-4"
        action={
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setCreateError('')
              setCreateOpen(true)
            }}
          >
            <Plus size={15} /> New content
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Search"
            icon={Search}
            type="search"
            placeholder="Search title or body"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
          <Select
            label="Tag"
            icon={Tag}
            value={tag}
            onChange={(event) => {
              setTag(event.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All tags' },
              ...tagOptions.map((value) => ({ value, label: value })),
            ]}
          />
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <div className="flex items-center justify-between gap-4">
              <span>{error.message}</span>
              <Button variant="secondary" size="sm" onClick={reload}>
                Retry
              </Button>
            </div>
            {error instanceof ApiError && error.requestId && (
              <p className="mt-1 font-mono text-xs">requestId: {error.requestId}</p>
            )}
          </div>
        )}

        {loading ? (
          <Skeleton rows={5} />
        ) : items.length === 0 ? (
          <EmptyState title="No content found" help="Try a different search or tag filter." />
        ) : (
          <Table headers={['Title', 'Tags', 'Created', '']}>
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="max-w-md truncate text-xs text-slate-500">{item.body}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((itemTag) => (
                      <Badge key={itemTag} tone="neutral">
                        {itemTag}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500" title={item.createdAt}>
                  {formatRelative(item.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setTarget(item)
                      setResult(null)
                      setActionError('')
                    }}
                  >
                    Summarize
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && <Pagination page={page} totalPages={data.meta.totalPages} onPage={setPage} />}
      </Card>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={result ? 'Summary' : 'Summarize content'}
      >
        {target && !result && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{target.title}</p>
            <Select
              label="Tone"
              icon={MessageSquare}
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              options={tones.map((value) => ({ value, label: value }))}
            />
            <Select
              label="Length"
              icon={AlignLeft}
              value={length}
              onChange={(event) => setLength(event.target.value)}
              options={lengths.map((value) => ({ value, label: value }))}
            />
            {actionError && <p className="text-sm text-rose-600">{actionError}</p>}
            <Button variant="accent" loading={busy} onClick={() => void summarize()}>
              Generate summary
            </Button>
          </div>
        )}
        {result && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-slate-700">{result.output}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void navigator.clipboard
                  .writeText(result.output)
                  .then(() => notify('Summary copied'))
                  .catch(() => notify('Could not copy summary', 'error'))
              }}
            >
              <Copy size={14} /> Copy summary
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={result.status === 'SUCCESS' ? 'success' : 'warning'}>
                {result.status ?? 'SUCCESS'}
              </Badge>
              <Badge tone="info">{result.latencyMs} ms</Badge>
              <Badge tone={result.tokensAwarded > 0 ? 'success' : 'neutral'}>
                +{result.tokensAwarded} tokens
              </Badge>
            </div>
            {result.reason && <p className="text-xs text-slate-500">Reason: {result.reason}</p>}
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create content">
        <div className="space-y-4">
          <Input
            label="Title"
            icon={FileText}
            value={newTitle}
            maxLength={200}
            placeholder="A short, descriptive title"
            onChange={(event) => setNewTitle(event.target.value)}
          />
          <Textarea
            label="Body"
            icon={AlignLeft}
            value={newBody}
            placeholder="Write the content to summarize"
            onChange={(event) => setNewBody(event.target.value)}
          />
          <Input
            label="Tags"
            icon={Tag}
            value={newTags}
            placeholder="guide, tokens (comma separated)"
            hint="Optional — separate multiple tags with commas"
            onChange={(event) => setNewTags(event.target.value)}
          />
          {createError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {createError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" loading={creating} onClick={() => void createContent()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
