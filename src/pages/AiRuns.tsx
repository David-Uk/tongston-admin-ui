import { useState } from 'react'
import { ApiError, api } from '../api/client'
import { useAsync } from '../hooks/useAsync'
import { formatRelative } from '../utils/format'
import { Badge, Button, Card, EmptyState, Pagination, Skeleton, Table } from '../components/ui'

export function AiRunsPage() {
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data, error, loading, reload } = useAsync(() => api.aiRuns(page), [page])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">AI runs</h1>
        <p className="mt-1 text-sm text-slate-500">Summaries, latency and token rewards.</p>
      </div>

      <Card>
        {error && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
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
        ) : !data || data.data.length === 0 ? (
          <EmptyState title="No AI runs yet" help="Summarize a content item to see results here." />
        ) : (
          <>
            <Table headers={['Status', 'Latency', 'Tokens', 'Created', '']}>
              {data.data.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Badge>{run.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-slate-700">{run.latencyMs} ms</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-slate-700">
                    {run.tokensAwarded}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500" title={run.createdAt}>
                    {formatRelative(run.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                    >
                      {expanded === run.id ? 'Hide' : 'Output'}
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
            {expanded && (
              <div className="border-t border-slate-200 px-5 py-4">
                {data.data
                  .filter((run) => run.id === expanded)
                  .map((run) => (
                    <div key={run.id} className="space-y-2">
                      <p className="text-xs font-medium uppercase text-slate-500">
                        Output · prompt {run.promptVersion}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-700">{run.output}</p>
                      {run.reason && <p className="text-xs text-slate-500">Reason: {run.reason}</p>}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
        {data && <Pagination page={page} totalPages={data.meta.totalPages} onPage={setPage} />}
      </Card>
    </div>
  )
}
