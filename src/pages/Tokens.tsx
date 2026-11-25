import { useState } from 'react'
import { Coins, Hash } from 'lucide-react'
import { ApiError, api } from '../api/client'
import type { Conversion, ConvertResult } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { formatNumber, formatRelative, signedAmount } from '../utils/format'
import {
  Badge,
  Button,
  Card,
  CopyableHash,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
  StatCard,
  Table,
} from '../components/ui'
import { useToast } from '../components/ui/Toast'

const RATES: Record<string, number> = { MOCK_USDT: 100, MOCK_ETH: 20000 }
const MIN_AMOUNT = 100

function previewAmount(amount: number, asset: string): string {
  if (!Number.isFinite(amount) || amount <= 0) return '—'
  const value = amount / RATES[asset]
  return `${value.toFixed(asset === 'MOCK_USDT' ? 1 : 2)} ${asset}`
}

export function TokensPage() {
  const { refreshUser } = useAuth()
  const { notify } = useToast()
  const [historyPage, setHistoryPage] = useState(1)
  const balanceState = useAsync(() => api.balance(), [])
  const historyState = useAsync(() => api.history({ page: historyPage }), [historyPage])
  const conversionsState = useAsync(() => api.conversions(), [])
  const totalsState = useAsync(() => api.history({ page: 1, limit: 100 }), [])

  const [asset, setAsset] = useState('MOCK_USDT')
  const [amount, setAmount] = useState('100')
  const [busy, setBusy] = useState(false)
  const [convertResult, setConvertResult] = useState<ConvertResult | null>(null)
  const [formError, setFormError] = useState('')
  const [withdrawTarget, setWithdrawTarget] = useState<Conversion | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)

  const balance = balanceState.data?.tokenBalance ?? 0
  const snapshot = totalsState.data?.data ?? []
  const earned = snapshot
    .filter((row) => row.type === 'EARN')
    .reduce((sum, row) => sum + row.amount, 0)
  const converted = Math.abs(
    snapshot.filter((row) => row.type === 'CONVERT').reduce((sum, row) => sum + row.amount, 0),
  )

  const refreshAll = () => {
    balanceState.reload()
    historyState.reload()
    conversionsState.reload()
    totalsState.reload()
    void refreshUser()
  }

  const convert = async () => {
    const value = Number(amount)
    setFormError('')
    if (!Number.isInteger(value) || value < MIN_AMOUNT) {
      setFormError(`Enter a whole number of at least ${MIN_AMOUNT} tokens.`)
      return
    }
    setBusy(true)
    try {
      const result = await api.convert(asset, value, crypto.randomUUID())
      setConvertResult(result)
      setFormError('')
      refreshAll()
      notify(`Converted ${value} tokens to ${result.convertedAmount}`)
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.message : 'Conversion failed')
    } finally {
      setBusy(false)
    }
  }

  const withdraw = async () => {
    if (!withdrawTarget) return
    setWithdrawing(true)
    try {
      await api.withdraw(withdrawTarget.id, crypto.randomUUID())
      notify('Withdrawal confirmed', 'success')
      setWithdrawTarget(null)
      refreshAll()
    } catch (cause) {
      notify(cause instanceof ApiError ? cause.message : 'Withdrawal failed', 'error')
    } finally {
      setWithdrawing(false)
    }
  }

  const error = balanceState.error ?? historyState.error ?? conversionsState.error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Tokens</h1>
        <p className="mt-1 text-sm text-slate-500">Balance, ledger history and mock conversions.</p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <span>{error.message}</span>
          {error instanceof ApiError && error.requestId && (
            <p className="mt-1 font-mono text-xs">requestId: {error.requestId}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Balance" value={formatNumber(balance)} sub="Available tokens" accent />
        <StatCard label="Earned" value={formatNumber(earned)} sub="Latest 100 ledger rows" />
        <StatCard label="Converted" value={formatNumber(converted)} sub="Tokens spent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Convert tokens">
          <div className="max-w-md space-y-4">
            <Select
              label="Asset"
              icon={Coins}
              value={asset}
              onChange={(event) => setAsset(event.target.value)}
              options={[
                { value: 'MOCK_USDT', label: 'MOCK_USDT' },
                { value: 'MOCK_ETH', label: 'MOCK_ETH' },
              ]}
            />
            <Input
              label="Amount (tokens)"
              icon={Hash}
              type="number"
              min={MIN_AMOUNT}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              hint={`Minimum ${MIN_AMOUNT} tokens · balance ${formatNumber(balance)}`}
              error={formError}
            />
            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">You receive: </span>
              <span className="font-mono font-medium text-slate-900">
                {previewAmount(Number(amount), asset)}
              </span>
            </div>
            <Button variant="accent" loading={busy} onClick={() => void convert()}>
              Convert
            </Button>
            {convertResult && (
              <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <p>Converted {convertResult.convertedAmount}</p>
                <CopyableHash value={convertResult.txHashMock} />
                <p className="text-xs">New balance: {formatNumber(convertResult.totalTokenBalance)}</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Latest ledger rows">
          {historyState.loading ? (
            <Skeleton rows={4} />
          ) : !historyState.data || historyState.data.data.length === 0 ? (
            <EmptyState title="No ledger rows" help="Summarize content or grant tokens to get started." />
          ) : (
            <Table headers={['Type', 'Amount', 'Balance after', 'Date']}>
              {historyState.data.data.slice(0, 5).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Badge>{row.type}</Badge>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-sm tabular-nums ${
                      row.amount > 0 ? 'text-emerald-700' : 'text-slate-600'
                    }`}
                  >
                    {signedAmount(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-slate-700">
                    {formatNumber(row.balanceAfter)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500" title={row.createdAt}>
                    {formatRelative(row.createdAt)}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <Card title="Token history">
        {historyState.loading ? (
          <Skeleton rows={5} />
        ) : !historyState.data || historyState.data.data.length === 0 ? (
          <EmptyState title="Nothing here yet" help="Token earnings and conversions will appear here." />
        ) : (
          <>
            <Table headers={['Type', 'Source', 'Amount', 'Balance after', 'Reference', 'Date']}>
              {historyState.data.data.map((row) => (
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
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-slate-700">
                    {formatNumber(row.balanceAfter)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {row.referenceId ? row.referenceId.slice(0, 8) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500" title={row.createdAt}>
                    {formatRelative(row.createdAt)}
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination
              page={historyPage}
              totalPages={historyState.data.meta.totalPages}
              onPage={setHistoryPage}
            />
          </>
        )}
      </Card>

      <Card title="Conversions">
        {conversionsState.loading ? (
          <Skeleton rows={3} />
        ) : !conversionsState.data || conversionsState.data.length === 0 ? (
          <EmptyState title="No conversions" help="Convert tokens to see mock assets here." />
        ) : (
          <Table headers={['Asset', 'Amount', 'Status', 'Transaction', '']}>
            {conversionsState.data.map((conversion) => (
              <tr key={conversion.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{conversion.toAsset}</td>
                <td className="px-4 py-3 text-sm tabular-nums text-slate-700">
                  {conversion.convertedAmount}
                </td>
                <td className="px-4 py-3">
                  <Badge>{conversion.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <CopyableHash value={conversion.txHashMock} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={conversion.status !== 'CONFIRMED'}
                    onClick={() => setWithdrawTarget(conversion)}
                  >
                    Withdraw
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={Boolean(withdrawTarget)}
        onClose={() => setWithdrawTarget(null)}
        title="Confirm withdrawal"
      >
        <p className="text-sm text-slate-600">
          Simulate sending {withdrawTarget?.convertedAmount} to the mock network? The conversion will
          be marked WITHDRAWN and a ledger row will be added.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setWithdrawTarget(null)}>
            Cancel
          </Button>
          <Button variant="primary" loading={withdrawing} onClick={() => void withdraw()}>
            Withdraw
          </Button>
        </div>
      </Modal>
    </div>
  )
}
