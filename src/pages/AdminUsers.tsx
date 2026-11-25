import { useState } from 'react'
import { ApiError, api } from '../api/client'
import type { User } from '../api/types'
import { useAsync } from '../hooks/useAsync'
import { formatNumber, formatRelative, signedAmount } from '../utils/format'
import { Badge, Button, Card, EmptyState, Modal, Pagination, Skeleton, Table } from '../components/ui'

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<User | null>(null)
  const usersState = useAsync(() => api.adminUsers(page), [page])
  const historyState = useAsync(
    () => (selected ? api.adminUserHistory(selected.id) : Promise.resolve(null)),
    [selected?.id],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">All accounts and their token balances.</p>
      </div>

      <Card>
        {usersState.error && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <div className="flex items-center justify-between gap-4">
              <span>{usersState.error.message}</span>
              <Button variant="secondary" size="sm" onClick={usersState.reload}>
                Retry
              </Button>
            </div>
            {usersState.error instanceof ApiError && usersState.error.requestId && (
              <p className="mt-1 font-mono text-xs">requestId: {usersState.error.requestId}</p>
            )}
          </div>
        )}
        {usersState.loading ? (
          <Skeleton rows={5} />
        ) : !usersState.data || usersState.data.data.length === 0 ? (
          <EmptyState title="No users" help="Registered users will appear here." />
        ) : (
          <>
            <Table headers={['Email', 'Role', 'Balance', '']}>
              {usersState.data.data.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={user.role === 'admin' ? 'info' : 'neutral'}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-slate-900">
                    {formatNumber(user.tokenBalance)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="secondary" size="sm" onClick={() => setSelected(user)}>
                      History
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination
              page={page}
              totalPages={usersState.data.meta.totalPages}
              onPage={setPage}
            />
          </>
        )}
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`Ledger · ${selected?.email ?? ''}`}>
        {historyState.loading ? (
          <Skeleton rows={4} />
        ) : !historyState.data || historyState.data.data.length === 0 ? (
          <EmptyState title="No ledger rows" help="This user has no token activity yet." />
        ) : (
          <Table headers={['Type', 'Source', 'Amount', 'Date']}>
            {historyState.data.data.slice(0, 20).map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Badge>{row.type}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.source}</td>
                <td
                  className={`px-4 py-3 text-right font-mono text-sm tabular-nums ${
                    row.amount > 0 ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  {signedAmount(row.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500" title={row.createdAt}>
                  {formatRelative(row.createdAt)}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Modal>
    </div>
  )
}
