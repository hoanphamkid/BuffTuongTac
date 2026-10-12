'use client';

import './services.css';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

type PackageRow = {
  id: string;
  name: string;
  description?: string | null;
  speed: string;
  min: number;
  max: number;
  pricePer1000: string | number;
  active: boolean;
  service: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    platform: { id: string; name: string; slug: string; icon: string; active: boolean };
  };
};

type AvailabilityTarget = 'platform' | 'service' | 'server';
type ServiceOption = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  platform: { id: string; name: string; slug: string; icon: string; active: boolean };
};
type CreateServerForm = {
  serviceId: string;
  name: string;
  speed: string;
  min: string;
  max: string;
  pricePer1000: string;
  description: string;
};

const emptyServerForm: CreateServerForm = {
  serviceId: '',
  name: '',
  speed: '50K/ngày',
  min: '10',
  max: '100000',
  pricePer1000: '0',
  description: '',
};

const money = (value: string | number) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';
const activeOf = (item: PackageRow) => item.active && item.service.active && item.service.platform.active;
const availabilityLabel = (item: PackageRow) => {
  if (activeOf(item)) return 'Đang hoạt động';
  if (!item.service.platform.active) return 'Tắt tại nền tảng';
  if (!item.service.active) return 'Tắt tại dịch vụ';
  return 'Tắt tại server';
};

export default function ServicesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceOption[]>([]);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('ALL');
  const [state, setState] = useState('ALL');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [trialSettingsReady, setTrialSettingsReady] = useState(true);
  const [trialSaving, setTrialSaving] = useState(false);
  const [trialMessage, setTrialMessage] = useState('');
  const [trialError, setTrialError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateServerForm>(emptyServerForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/services', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Không tải được danh sách gói dịch vụ');
        return result;
      })
      .then((result) => {
        const next: PackageRow[] = result.data || [];
        setPackages(next);
        setServiceCatalog(result.services || []);
        if (typeof result.trialEnabled === 'boolean') setTrialEnabled(result.trialEnabled);
        if (typeof result.trialSettingsReady === 'boolean') setTrialSettingsReady(result.trialSettingsReady);
        setSelectedId((current) => current && next.some((item) => item.id === current) ? current : '');
        setError('');
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không tải được danh sách gói dịch vụ'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function toggleTrialAvailability() {
    const active = !trialEnabled;
    const action = active ? 'bật' : 'tắt';
    const effect = active
      ? 'Khách hàng sẽ có thể chọn gói thử TikTok Views và tạo đơn bằng KEY.'
      : 'Khách hàng sẽ không thể chọn hoặc tạo đơn dùng thử. Các đơn dịch vụ trả phí không bị ảnh hưởng.';
    if (!window.confirm(`Xác nhận ${action} gói dùng thử miễn phí?\n\n${effect}`)) return;

    setTrialSaving(true);
    setTrialError('');
    setTrialMessage('');
    try {
      const response = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'trialAvailability', active }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Không thể cập nhật trạng thái gói thử');
      setTrialEnabled(active);
      setTrialMessage(`Đã ${active ? 'bật' : 'tắt'} gói dùng thử.`);
    } catch (reason) {
      setTrialError(reason instanceof Error ? reason.message : 'Không thể cập nhật trạng thái gói thử');
    } finally {
      setTrialSaving(false);
    }
  }

  const platformOptions = useMemo(() => Array.from(new Map(packages.map((item) => [item.service.platform.slug, item.service.platform])).values()), [packages]);
  const platformCounts = useMemo(() => {
    const counts = new Map<string, number>();
    packages.forEach((item) => {
      const slug = item.service.platform.slug;
      counts.set(slug, (counts.get(slug) || 0) + 1);
    });
    return counts;
  }, [packages]);
  const serviceOptions = useMemo(() => serviceCatalog.length ? serviceCatalog : Array.from(new Map(packages.map((item) => [item.service.id, item.service])).values()), [packages, serviceCatalog]);
  useEffect(() => {
    if (!createForm.serviceId && serviceOptions[0]) setCreateForm((current) => ({ ...current, serviceId: serviceOptions[0].id }));
  }, [createForm.serviceId, serviceOptions]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return packages.filter((item) => {
      const searchable = [item.service.platform.name, item.service.name, item.name, item.description, item.id].join(' ').toLowerCase();
      const matchesQuery = !needle || searchable.includes(needle);
      const matchesPlatform = platform === 'ALL' || item.service.platform.slug === platform;
      const matchesState = state === 'ALL' || (state === 'ACTIVE' ? activeOf(item) : !activeOf(item));
      return matchesQuery && matchesPlatform && matchesState;
    });
  }, [packages, platform, query, state]);

  const selected = packages.find((item) => item.id === selectedId) || null;
  const updatePackage = (updated: PackageRow) => setPackages((current) => current.map((item) => item.id === updated.id ? updated : item));
  const updateAvailability = (target: AvailabilityTarget, id: string, active: boolean) => setPackages((current) => current.map((item) => {
    if (target === 'server' && item.id === id) return { ...item, active };
    if (target === 'service' && item.service.id === id) return { ...item, service: { ...item.service, active } };
    if (target === 'platform' && item.service.platform.id === id) return { ...item, service: { ...item.service, platform: { ...item.service.platform, active } } };
    return item;
  }));
  const activeCount = packages.filter(activeOf).length;

  async function createServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setCreateError('');
    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Không thể thêm máy chủ');
      setPackages((current) => [...current, result.data]);
      setSelectedId(result.data.id);
      setCreateOpen(false);
      setCreateForm((current) => ({ ...emptyServerForm, serviceId: current.serviceId }));
    } catch (reason) {
      setCreateError(reason instanceof Error ? reason.message : 'Không thể thêm máy chủ');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="admin-body services-page">
      <div className="services-intro">
        <div>
          <p className="services-crumb">Quản lý　›　Giá nền tảng & dịch vụ</p>
          <h2 className="admin-only-title">Điều chỉnh giá nền tảng & dịch vụ</h2>
          <p className="admin-only-sub">Chọn nền tảng, dịch vụ và gói/server để cập nhật giá bán. Giá mới áp dụng cho các đơn tạo sau khi lưu.</p>
        </div>
        <button type="button" className="services-refresh" onClick={load} disabled={loading}>{loading ? 'Đang tải...' : '↻ Làm mới'}</button>
      </div>

      <div className="services-note"><span>i</span><p><b>Giá áp dụng:</b> nhập giá cho 1.000 lượt. Riêng dịch vụ comment, hệ thống sẽ tự quy đổi và hiển thị theo từng comment ở trang đặt đơn.</p></div>

      <section className="admin-card trial-admin-card" aria-label="Quản lý gói dùng thử">
        <div className="trial-admin-copy">
          <span className="trial-admin-icon" aria-hidden="true">✦</span>
          <div><b>Gói dùng thử miễn phí</b><small>TikTok Views · cài đặt riêng, không ảnh hưởng dịch vụ trả phí</small></div>
          <span className={'service-effective-state ' + (trialEnabled ? 'active' : 'inactive')}>{trialEnabled ? 'Đang bật' : 'Đang tắt'}</span>
        </div>
        <button type="button" role="switch" aria-checked={trialEnabled} aria-label={trialEnabled ? 'Tắt gói dùng thử' : 'Bật gói dùng thử'} className="service-switch" onClick={toggleTrialAvailability} disabled={trialSaving || loading || !trialSettingsReady}>
          <i />
        </button>
        {!trialSettingsReady && <p className="trial-admin-message error">Cần áp dụng migration cơ sở dữ liệu trước khi chỉnh trạng thái gói thử.</p>}
        {(trialMessage || trialError) && <p className={'trial-admin-message ' + (trialError ? 'error' : 'success')}>{trialError || trialMessage}</p>}
      </section>

      <div className="services-stats">
        <Stat label="TỔNG GÓI DỊCH VỤ" value={packages.length} tone="blue" />
        <Stat label="ĐANG HOẠT ĐỘNG" value={activeCount} tone="green" />
        <Stat label="NỀN TẢNG" value={platformOptions.length} tone="purple" />
        <Stat label="ĐANG HIỂN THỊ" value={filtered.length} tone="orange" />
      </div>

      <div className="services-toolbar">
        <label className="services-search">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nền tảng, dịch vụ, server..." /></label>
        <select value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Lọc nền tảng"><option value="ALL">Tất cả nền tảng</option>{platformOptions.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        <select value={state} onChange={(event) => setState(event.target.value)} aria-label="Lọc trạng thái"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Đang tắt</option></select>
      </div>

      {createOpen && <form className="admin-card server-create-panel" onSubmit={createServer}>
        <div className="server-create-head"><div><span>SERVER MANAGEMENT / CREATE</span><h3>Thêm máy chủ mới</h3><p>Máy chủ mới sẽ xuất hiện ngay trong danh sách và có thể dùng để tạo đơn.</p></div><button type="button" onClick={() => setCreateOpen(false)} aria-label="Đóng">×</button></div>
        <div className="server-create-grid">
          <label className="server-field server-field-wide">Dịch vụ<select value={createForm.serviceId} onChange={(event) => setCreateForm((current) => ({ ...current, serviceId: event.target.value }))} required><option value="">Chọn dịch vụ</option>{serviceOptions.map((item) => <option key={item.id} value={item.id}>{item.platform.name} · {item.name}</option>)}</select></label>
          <label className="server-field server-field-wide">Tên máy chủ<input value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ví dụ: TikTok Likes [SV4]" maxLength={160} required /></label>
          <label className="server-field">Tốc độ<input value={createForm.speed} onChange={(event) => setCreateForm((current) => ({ ...current, speed: event.target.value }))} placeholder="50K/ngày" maxLength={120} required /></label>
          <label className="server-field">Tối thiểu<input type="number" min="1" value={createForm.min} onChange={(event) => setCreateForm((current) => ({ ...current, min: event.target.value }))} required /></label>
          <label className="server-field">Tối đa<input type="number" min="1" value={createForm.max} onChange={(event) => setCreateForm((current) => ({ ...current, max: event.target.value }))} required /></label>
          <label className="server-field">Giá / 1.000 lượt<input type="number" min="0" value={createForm.pricePer1000} onChange={(event) => setCreateForm((current) => ({ ...current, pricePer1000: event.target.value }))} required /></label>
          <label className="server-field server-field-wide">Mô tả <textarea value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} placeholder="Mô tả ngắn về máy chủ (không bắt buộc)" maxLength={500} /></label>
        </div>
        {createError && <p className="server-create-error">{createError}</p>}
        <div className="server-create-actions"><button type="button" className="server-cancel" onClick={() => setCreateOpen(false)}>Hủy</button><button type="submit" className="server-submit" disabled={creating || !serviceOptions.length}>{creating ? 'Đang tạo...' : '＋ Tạo máy chủ'}</button></div>
      </form>}

      <div className={'services-layout ' + (selected ? 'has-selection' : '')}>
        <section className="admin-card services-table-card">
          <div className="services-table-head"><div><h3>Tất cả gói/server</h3><span>{filtered.length} gói hiển thị · {packages.length} gói trong hệ thống</span></div><div className="services-table-actions"><span className="services-table-hint">Chọn một gói để chỉnh giá</span><button type="button" className="services-add-server" onClick={() => { setCreateOpen((current) => !current); setCreateError(''); }}>＋ Thêm máy chủ</button></div></div>
          <div className="services-platform-tabs" role="group" aria-label="Lọc nhanh theo nền tảng">
            <button type="button" className={'platform-filter-chip ' + (platform === 'ALL' ? 'active' : '')} aria-pressed={platform === 'ALL'} onClick={() => setPlatform('ALL')}>
              <span className="platform-filter-icon">✦</span><span>Tất cả</span><b>{packages.length}</b>
            </button>
            {platformOptions.map((item) => (
              <button key={item.slug} type="button" className={'platform-filter-chip ' + (platform === item.slug ? 'active' : '')} aria-pressed={platform === item.slug} onClick={() => setPlatform(item.slug)}>
                <span className="platform-filter-icon">{item.icon || '◈'}</span><span>{item.name}</span><b>{platformCounts.get(item.slug) || 0}</b>
              </button>
            ))}
          </div>
          <div className="services-table-wrap">
            <table className="admin-table services-table">
              <thead><tr><th>NỀN TẢNG</th><th>DỊCH VỤ</th><th>GÓI / SERVER</th><th>GIỚI HẠN</th><th>GIÁ / 1.000</th><th>TRẠNG THÁI</th><th /></tr></thead>
              <tbody>{filtered.map((item) => <tr key={item.id} className={selected?.id === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}>
                <td className="services-platform-column" data-label="Nền tảng"><div className="platform-cell"><span>{item.service.platform.icon || '◈'}</span><b>{item.service.platform.name}</b></div></td>
                <td className="services-service-column" data-label="Dịch vụ"><small className="service-platform-mobile">{item.service.platform.icon || '◈'} {item.service.platform.name}</small><b>{item.service.name}</b><small>{item.service.slug}</small></td>
                <td className="services-package-column" data-label="Gói / server"><b>{item.name}</b><small>Mã: {item.id}</small></td>
                <td className="services-limit-column" data-label="Giới hạn">{item.min.toLocaleString('vi-VN')} - {item.max.toLocaleString('vi-VN')}<small>{item.speed}</small></td>
                <td className="services-price-column" data-label="Giá / 1.000"><strong className="service-price">{money(item.pricePer1000)}</strong></td>
                <td className="services-status-column" data-label="Trạng thái"><span title={availabilityLabel(item)} className={'service-status ' + (activeOf(item) ? 'active' : 'inactive')}>{availabilityLabel(item)}</span></td>
                <td className="services-action-column" data-label="Thao tác"><button type="button" className="service-edit" onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); }}>Chỉnh sửa <span aria-hidden="true">↗</span></button></td>
              </tr>)}</tbody>
            </table>
            {loading && <div className="services-empty">Đang tải gói dịch vụ...</div>}
            {!loading && error && <div className="services-empty error">{error}</div>}
            {!loading && !error && !filtered.length && <div className="services-empty">Không có gói dịch vụ phù hợp.</div>}
          </div>
        </section>
        {selected && <>
          <button type="button" className="service-editor-backdrop" aria-label="Đóng bảng chỉnh giá" onClick={() => setSelectedId('')} />
          <ServicePriceEditor item={selected} onUpdated={updatePackage} onAvailabilityUpdated={updateAvailability} onClose={() => setSelectedId('')} />
        </>}
      </div>
    </div>
  );
}

function ServicePriceEditor({ item, onUpdated, onAvailabilityUpdated, onClose }: { item: PackageRow; onUpdated: (item: PackageRow) => void; onAvailabilityUpdated: (target: AvailabilityTarget, id: string, active: boolean) => void; onClose: () => void }) {
  const [price, setPrice] = useState(String(item.pricePer1000));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [statusSaving, setStatusSaving] = useState<AvailabilityTarget | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');

  useEffect(() => { setPrice(String(item.pricePer1000)); setSaving(false); setMessage(''); setError(''); setStatusSaving(null); setStatusMessage(''); setStatusError(''); }, [item.id]);

  async function setAvailability(target: AvailabilityTarget, id: string, current: boolean, scope: string) {
    const active = !current;
    const verb = active ? 'bật' : 'tắt';
    const effect = target === 'platform'
      ? `Thay đổi này ảnh hưởng đến toàn bộ dịch vụ và gói thuộc nền tảng ${scope}.`
      : target === 'service'
        ? `Thay đổi này ảnh hưởng đến tất cả server của dịch vụ ${scope}.`
        : `Thay đổi này chỉ ảnh hưởng đến gói/server ${scope}.`;
    if (!window.confirm(`Bạn có chắc muốn ${verb} ${scope}?\n\n${effect}`)) return;

    setStatusSaving(target);
    setStatusError('');
    setStatusMessage('');
    try {
      const response = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'availability', target, id, active }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Không thể cập nhật trạng thái');
      onAvailabilityUpdated(target, id, active);
      setStatusMessage(`${scope} đã ${active ? 'được bật' : 'được tắt'}.`);
    } catch (reason) {
      setStatusError(reason instanceof Error ? reason.message : 'Không thể cập nhật trạng thái');
    } finally {
      setStatusSaving(null);
    }
  }

  async function save() {
    const value = price.trim();
    if (!/^\d+$/.test(value)) { setError('Nhập giá là số nguyên không âm.'); return; }
    if (Number(value) > Number.MAX_SAFE_INTEGER) { setError('Giá gói quá lớn.'); return; }
    if (value === String(item.pricePer1000)) { setMessage('Giá gói chưa thay đổi.'); return; }
    if (!window.confirm(`Xác nhận cập nhật giá ${item.name} thành ${money(value)} / 1.000?`)) return;
    setSaving(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/admin/services', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ serverId: item.id, pricePer1000: value }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Không thể cập nhật giá gói');
      onUpdated(result.data);
      setPrice(String(result.data.pricePer1000));
      setMessage('Đã lưu giá mới. Đơn hàng tạo sau sẽ dùng mức giá này.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật giá gói');
    } finally { setSaving(false); }
  }

  return <aside className="admin-card service-price-editor" aria-label="Chỉnh giá gói dịch vụ">
    <div className="service-editor-head"><div><p><span className="service-editor-pulse" /> ĐANG CHỈNH SỬA GIÁ</p><h3>{item.name}</h3></div><button type="button" onClick={onClose} aria-label="Đóng">×</button></div>
    <div className="service-editor-path"><span>{item.service.platform.icon || '◈'}</span><div><b>{item.service.platform.name}</b><small>{item.service.name}</small></div></div>
    <div className="service-editor-info"><Info label="Server ID" value={item.id} /><Info label="Giới hạn" value={`${item.min.toLocaleString('vi-VN')} - ${item.max.toLocaleString('vi-VN')}`} /><Info label="Tốc độ" value={item.speed} /></div>
    <section className="service-availability" aria-label="Trạng thái bán của gói">
      <div className="service-availability-title"><div><b>Trạng thái bán</b><small>Bật đủ các cấp để khách đặt gói này</small></div><span className={'service-effective-state ' + (activeOf(item) ? 'active' : 'inactive')}>{activeOf(item) ? 'Đang hoạt động' : 'Đang tắt'}</span></div>
      <StatusSwitch label="Nền tảng" scope={item.service.platform.name} hint="Áp dụng cho toàn bộ dịch vụ trên nền tảng" checked={item.service.platform.active} disabled={statusSaving !== null} saving={statusSaving === 'platform'} onChange={() => setAvailability('platform', item.service.platform.id, item.service.platform.active, item.service.platform.name)} />
      <StatusSwitch label="Dịch vụ" scope={item.service.name} hint="Áp dụng cho tất cả server của dịch vụ" checked={item.service.active} disabled={statusSaving !== null} saving={statusSaving === 'service'} onChange={() => setAvailability('service', item.service.id, item.service.active, item.service.name)} />
      <StatusSwitch label="Gói / server" scope={item.name} hint="Chỉ áp dụng cho gói đang chọn" checked={item.active} disabled={statusSaving !== null} saving={statusSaving === 'server'} onChange={() => setAvailability('server', item.id, item.active, item.name)} />
      {statusError && <p className="service-editor-message error">{statusError}</p>}
      {statusMessage && <p className="service-editor-message success">{statusMessage}</p>}
    </section>
    <label className="service-price-label">Giá bán / 1.000 lượt<div className="service-price-input"><input inputMode="numeric" type="number" min="0" step="1" value={price} onChange={(event) => { setPrice(event.target.value); setError(''); setMessage(''); }} disabled={saving} /><span>đ</span></div></label>
    <div className="service-price-preview"><span>Ví dụ 1.000 lượt</span><b>{money(price || 0)}</b></div>
    {error && <p className="service-editor-message error">{error}</p>}{message && <p className="service-editor-message success">{message}</p>}
    <button type="button" className="service-save" onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu giá gói'}</button>
    <small className="service-editor-footnote">Thay đổi này chỉ áp dụng cho đơn hàng mới; giá các đơn đã tạo không thay đổi.</small>
  </aside>;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className={'service-stat ' + tone}><span>{label}</span><strong>{value}</strong><small>Dữ liệu hiện tại</small></div>; }
function Info({ label, value }: { label: string; value: string }) { return <p className="service-info"><span>{label}</span><b>{value}</b></p>; }
function StatusSwitch({ label, scope, hint, checked, disabled, saving, onChange }: { label: string; scope: string; hint: string; checked: boolean; disabled: boolean; saving: boolean; onChange: () => void }) {
  return <div className={'service-switch-row ' + (checked ? 'is-on' : 'is-off')}>
    <div className="service-switch-copy"><div><b>{label}</b><small>{scope}</small></div><span>{saving ? 'Đang lưu…' : checked ? 'Đang bật' : 'Đang tắt'}</span><p>{hint}</p></div>
    <button type="button" role="switch" aria-checked={checked} aria-label={`${label}: ${checked ? 'đang bật' : 'đang tắt'}`} className="service-switch" onClick={onChange} disabled={disabled || saving}><i /></button>
  </div>;
}
