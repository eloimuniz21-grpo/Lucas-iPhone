import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadSiteImage } from '../lib/storage'
import type { Device, DeviceCondition, DeviceStatus } from '../lib/types'
import { Modal } from '../components/Modal'
import { ConfirmButton } from '../components/ConfirmButton'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_LABEL: Record<DeviceStatus, string> = {
  em_estoque: 'Em estoque',
  reservado: 'Reservado',
  vendido: 'Vendido',
}

const STATUS_STYLE: Record<DeviceStatus, string> = {
  em_estoque: 'bg-success/10 text-success',
  reservado: 'bg-terracotta-light text-terracotta-dark',
  vendido: 'bg-ink/10 text-ink-muted',
}

type FormState = {
  model: string
  storage_gb: string
  color: string
  condition: DeviceCondition | ''
  cost_price: string
  imei: string
  status: DeviceStatus
  photo_url: string | null
}

const emptyForm: FormState = {
  model: '',
  storage_gb: '',
  color: '',
  condition: '',
  cost_price: '',
  imei: '',
  status: 'em_estoque',
  photo_url: null,
}

export function Estoque() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<DeviceStatus | 'todos'>('todos')
  const [editing, setEditing] = useState<Device | null | 'new'>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInput = useRef<HTMLInputElement | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Não consegui carregar o estoque agora.')
    } else {
      setDevices((data ?? []) as Device[])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setForm(emptyForm)
    setEditing('new')
  }

  function openEdit(device: Device) {
    setForm({
      model: device.model,
      storage_gb: device.storage_gb?.toString() ?? '',
      color: device.color ?? '',
      condition: device.condition ?? '',
      cost_price: device.cost_price.toString(),
      imei: device.imei ?? '',
      status: device.status,
      photo_url: device.photo_url ?? null,
    })
    setEditing(device)
  }

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true)
    setError(null)
    try {
      const url = await uploadSiteImage(file, 'devices')
      setForm((prev) => ({ ...prev, photo_url: url }))
    } catch {
      setError('Não consegui subir essa foto. Tenta um arquivo menor (JPG/PNG).')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSave() {
    if (!form.model.trim() || !form.cost_price) return
    setSaving(true)

    const payload = {
      model: form.model.trim(),
      storage_gb: form.storage_gb ? Number(form.storage_gb) : null,
      color: form.color.trim() || null,
      condition: form.condition || null,
      cost_price: Number(form.cost_price),
      imei: form.imei.trim() || null,
      status: form.status,
      photo_url: form.photo_url,
    }

    const { error } =
      editing === 'new'
        ? await supabase.from('devices').insert(payload)
        : await supabase.from('devices').update(payload).eq('id', (editing as Device).id)

    setSaving(false)

    if (error) {
      setError('Não consegui salvar. Confira os dados e tente de novo.')
      return
    }

    setEditing(null)
    load()
  }

  async function handleDelete(device: Device) {
    const { error } = await supabase.from('devices').delete().eq('id', device.id)
    if (error) {
      setError('Não consegui remover esse aparelho.')
      return
    }
    load()
  }

  const filtered = devices.filter((d) => filter === 'todos' || d.status === filter)

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">Estoque</h1>
          <p className="mt-1 text-sm text-ink-muted">{devices.length} aparelhos cadastrados</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center justify-center rounded-full bg-terracotta px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-dark"
        >
          + Adicionar aparelho
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(['todos', 'em_estoque', 'reservado', 'vendido'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
              filter === s
                ? 'border-terracotta bg-terracotta-light text-terracotta-dark'
                : 'border-border bg-card text-ink-muted'
            }`}
          >
            {s === 'todos' ? 'Todos' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-sm text-ink-muted">Carregando…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-ink-muted">Nenhum aparelho nesse filtro ainda.</p>
        )}
        {filtered.map((device) => (
          <div key={device.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-soft">
                  {device.photo_url ? (
                    <img src={device.photo_url} alt={device.model} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-ink-muted">Sem foto</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{device.model}</p>
                  <p className="text-xs text-ink-muted">
                    {[device.storage_gb ? `${device.storage_gb}GB` : null, device.color, device.condition]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[device.status]}`}>
                {STATUS_LABEL[device.status]}
              </span>
            </div>

            <p className="mt-3 text-sm text-ink-muted">
              Custo: <span className="font-semibold text-ink">{currency.format(device.cost_price)}</span>
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <button
                type="button"
                onClick={() => openEdit(device)}
                className="text-xs font-medium text-terracotta-dark hover:underline"
              >
                Editar
              </button>
              <ConfirmButton label="Remover" onConfirm={() => handleDelete(device)} />
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Adicionar aparelho' : 'Editar aparelho'} onClose={() => setEditing(null)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream-soft">
                {form.photo_url ? (
                  <img src={form.photo_url} alt={form.model || 'Aparelho'} className="h-full w-full object-cover" />
                ) : (
                  <span className="px-1 text-center text-[9px] text-ink-muted">Sem foto</span>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-[9px] text-ink">
                    Enviando…
                  </div>
                )}
              </div>
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePhotoUpload(file)
                  e.target.value = ''
                }}
              />
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-cream-soft"
                >
                  {form.photo_url ? 'Trocar foto' : 'Adicionar foto'}
                </button>
                {form.photo_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, photo_url: null })}
                    className="text-left text-xs font-medium text-danger hover:underline"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>

            <label className="col-span-2 text-sm">
              <span className="mb-1 block font-medium text-ink">Modelo</span>
              <input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="iPhone 15 Pro"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Armazenamento (GB)</span>
              <input
                type="number"
                value={form.storage_gb}
                onChange={(e) => setForm({ ...form, storage_gb: e.target.value })}
                placeholder="256"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Cor</span>
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="Titânio azul"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Condição</span>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value as DeviceCondition })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              >
                <option value="">Selecionar…</option>
                <option value="lacrado">Lacrado</option>
                <option value="seminovo">Seminovo</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DeviceStatus })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              >
                <option value="em_estoque">Em estoque</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Custo (R$)</span>
              <input
                type="number"
                step="0.01"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                placeholder="4500.00"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">IMEI (opcional)</span>
              <input
                value={form.imei}
                onChange={(e) => setForm({ ...form, imei: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.model.trim() || !form.cost_price}
              className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
