import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ClientGender, Device, Sale } from '../lib/types'
import { Modal } from '../components/Modal'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const GENDER_LABEL: Record<ClientGender, string> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  nao_informado: 'Não informado',
}

type FormState = {
  device_id: string
  sale_price: string
  client_name: string
  client_phone: string
  client_gender: ClientGender | ''
  client_age: string
  client_city: string
  payment_method: string
  sale_date: string
  notes: string
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm: FormState = {
  device_id: '',
  sale_price: '',
  client_name: '',
  client_phone: '',
  client_gender: '',
  client_age: '',
  client_city: '',
  payment_method: '',
  sale_date: today(),
  notes: '',
}

export function Vendas() {
  const [sales, setSales] = useState<Sale[]>([])
  const [availableDevices, setAvailableDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)

    const [salesRes, devicesRes] = await Promise.all([
      supabase
        .from('sales')
        .select('*, device:devices(id, model, cost_price)')
        .order('sale_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('devices')
        .select('*')
        .in('status', ['em_estoque', 'reservado'])
        .order('model'),
    ])

    if (salesRes.error || devicesRes.error) {
      setError('Não consegui carregar as vendas agora.')
    } else {
      setSales((salesRes.data ?? []) as Sale[])
      setAvailableDevices((devicesRes.data ?? []) as Device[])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openForm() {
    setForm(emptyForm)
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.device_id || !form.sale_price) return
    setSaving(true)
    setError(null)

    const { error } = await supabase.rpc('register_sale', {
      p_device_id: form.device_id,
      p_sale_price: Number(form.sale_price),
      p_client_name: form.client_name.trim() || null,
      p_client_phone: form.client_phone.trim() || null,
      p_client_gender: form.client_gender || null,
      p_payment_method: form.payment_method.trim() || null,
      p_sale_date: form.sale_date || today(),
      p_notes: form.notes.trim() || null,
      p_client_age: form.client_age ? Number(form.client_age) : null,
      p_client_city: form.client_city.trim() || null,
    })

    setSaving(false)

    if (error) {
      setError('Não consegui registrar a venda. ' + error.message)
      return
    }

    setFormOpen(false)
    load()
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">Vendas</h1>
          <p className="mt-1 text-sm text-ink-muted">Últimas {sales.length} vendas registradas</p>
        </div>
        <button
          type="button"
          onClick={openForm}
          disabled={availableDevices.length === 0}
          className="inline-flex items-center justify-center rounded-full bg-terracotta px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-dark disabled:opacity-50"
        >
          + Registrar venda
        </button>
      </div>

      {availableDevices.length === 0 && !loading && (
        <p className="mt-2 text-xs text-ink-muted">
          Não há aparelhos em estoque disponíveis. Cadastre um em "Estoque" primeiro.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-ink-muted">Carregando…</p>}
        {!loading && sales.length === 0 && (
          <p className="text-sm text-ink-muted">Nenhuma venda registrada ainda.</p>
        )}
        {sales.map((sale) => {
          const profit = sale.device ? Number(sale.sale_price) - Number(sale.device.cost_price) : null
          return (
            <div
              key={sale.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-ink">
                  {sale.device?.model ?? 'Aparelho removido'}{' '}
                  <span className="font-normal text-ink-muted">
                    · {new Date(sale.sale_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </p>
                <p className="text-xs text-ink-muted">
                  {sale.client_name || 'Cliente não informado'}
                  {sale.client_gender && sale.client_gender !== 'nao_informado'
                    ? ` · ${GENDER_LABEL[sale.client_gender]}`
                    : ''}
                  {sale.client_age ? ` · ${sale.client_age} anos` : ''}
                  {sale.client_city ? ` · ${sale.client_city}` : ''}
                  {sale.payment_method ? ` · ${sale.payment_method}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink">{currency.format(sale.sale_price)}</p>
                {profit !== null && (
                  <p className="text-xs text-success">lucro {currency.format(profit)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {formOpen && (
        <Modal title="Registrar venda" onClose={() => setFormOpen(false)}>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 text-sm">
              <span className="mb-1 block font-medium text-ink">Aparelho</span>
              <select
                value={form.device_id}
                onChange={(e) => setForm({ ...form, device_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              >
                <option value="">Selecionar…</option>
                {availableDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.model} {d.storage_gb ? `${d.storage_gb}GB` : ''} {d.color ?? ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Valor da venda (R$)</span>
              <input
                type="number"
                step="0.01"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Data da venda</span>
              <input
                type="date"
                value={form.sale_date}
                onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="col-span-2 text-sm">
              <span className="mb-1 block font-medium text-ink">Nome do cliente</span>
              <input
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Telefone</span>
              <input
                value={form.client_phone}
                onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Gênero (opcional)</span>
              <select
                value={form.client_gender}
                onChange={(e) => setForm({ ...form, client_gender: e.target.value as ClientGender })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              >
                <option value="">Não informado</option>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Idade (opcional)</span>
              <input
                type="number"
                min={0}
                max={120}
                value={form.client_age}
                onChange={(e) => setForm({ ...form, client_age: e.target.value })}
                placeholder="32"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Cidade (opcional)</span>
              <input
                value={form.client_city}
                onChange={(e) => setForm({ ...form, client_city: e.target.value })}
                placeholder="São Paulo"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="col-span-2 text-sm">
              <span className="mb-1 block font-medium text-ink">Forma de pagamento</span>
              <input
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                placeholder="Pix, cartão, dinheiro…"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="col-span-2 text-sm">
              <span className="mb-1 block font-medium text-ink">Notas (opcional)</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.device_id || !form.sale_price}
              className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Registrar venda'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
