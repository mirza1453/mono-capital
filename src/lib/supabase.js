import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key);

/* ═══════════════════════════════════════
   GLOBAL STATE — aynı reactive pattern
   Optimistic: local hemen güncelle + async supabase
═══════════════════════════════════════ */

let _db = {
  firmalar: [], sablonlar: [], talepler: [], bildirimler: [],
  dosyalar: [], ekip: [], mpirofil: null, firma_kullanici: [], clientProfiles: [],
};
let _subs = [];
const _deletedIds = new Set();
let _rtMuted = false;
export function muteRealtime() { _rtMuted = true; }
export function unmuteRealtime() { setTimeout(() => { _rtMuted = false; }, 800); }
let _rtChannel = null;

let _notifyTimer = null;
export const notify = () => {
  if (_notifyTimer) clearTimeout(_notifyTimer);
  _notifyTimer = setTimeout(() => {
    const snap = { ..._db };
    if (!snap.ozlukDosyalari) snap.ozlukDosyalari = snap.dosyalar || [];
    snap.firmalar = snap.firmalar || [];
    snap.sablonlar = snap.sablonlar || [];
    snap.talepler = snap.talepler || [];
    snap.bildirimler = snap.bildirimler || [];
    snap.dosyalar = snap.dosyalar || [];
    snap.ekip = snap.ekip || [];
    snap.firma_kullanici = snap.firma_kullanici || [];
    snap.clientProfiles = snap.clientProfiles || [];
    snap._v = Date.now(); _subs.forEach(fn => fn(snap));
  }, 80);
};
// Immediate notify for critical updates (boot etc)
export const notifyNow = () => {
  if (_notifyTimer) clearTimeout(_notifyTimer);
  const snap = { ..._db };
  if (!snap.ozlukDosyalari) snap.ozlukDosyalari = snap.dosyalar || [];
  snap.firmalar = snap.firmalar || [];
  snap.sablonlar = snap.sablonlar || [];
  snap.talepler = snap.talepler || [];
  snap.bildirimler = snap.bildirimler || [];
  snap.dosyalar = snap.dosyalar || [];
  snap.ekip = snap.ekip || [];
  snap.firma_kullanici = snap.firma_kullanici || [];
  snap.clientProfiles = snap.clientProfiles || [];
  snap._v = Date.now(); _subs.forEach(fn => fn(snap));
};
export const getDB = () => _db;
export const subscribe = (fn) => { _subs.push(fn); return () => { _subs = _subs.filter(x => x !== fn); }; };

// ─── camelCase ↔ snake_case ───

function fmtTarih(d) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '';
  const gg = String(dt.getDate()).padStart(2, '0');
  const aa = String(dt.getMonth() + 1).padStart(2, '0');
  return `${gg}.${aa}.${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

const rowToTalep = r => ({
  id: r.id, firmaId: r.firma_id, odId: r.olusturan_id, olusturanId: r.olusturan_id,
  olusturan: r.olusturan, atananId: r.atanan_id, kisi: r.kisi,
  sablonId: r.sablon_id, sablonAd: r.sablon_ad, alanlar: r.alanlar || [],
  durum: r.durum, acil: r.acil, aciklama: r.aciklama,
  mukellefGorsun: r.mukellef_gorsun, bildirimGonder: r.bildirim_gonder,
  musavirNot: r.musavir_not, musavirCheckler: r.musavir_checkler || [],
  sonuclar: r.sonuclar || [], arsiv: r.arsiv, sira: r.sira,
  tarih: fmtTarih(r.created_at), created_at: r.created_at,
});

const talepToRow = t => ({
  firma_id: t.firmaId, olusturan_id: t.olusturanId || t.odId,
  olusturan: t.olusturan, atanan_id: t.atananId || null,
  kisi: t.kisi || null, sablon_id: t.sablonId || null,
  sablon_ad: t.sablonAd, alanlar: t.alanlar || [], durum: t.durum,
  acil: t.acil || false, aciklama: t.aciklama || null,
  mukellef_gorsun: t.mukellefGorsun !== false, bildirim_gonder: t.bildirimGonder !== false,
  musavir_not: t.musavirNot || null, musavir_checkler: t.musavirCheckler || [],
  sonuclar: t.sonuclar || [], arsiv: t.arsiv || false, sira: t.sira || 0,
});

const rowToFirma = r => ({ id: r.id, ad: r.ad, vkn: r.vkn || '', officeUserId: r.office_user_id, tarih: fmtTarih(r.created_at) });
const firmaToRow = f => ({ ad: f.ad, vkn: f.vkn || null, office_user_id: f.officeUserId });

const rowToSablon = r => ({
  id: r.id, ad: r.ad, alanlar: r.alanlar || [],
  kontrolSablonu: r.kontrol_sablonu || [], aciklamaSablonu: r.aciklama_sablonu || '',
  bildirimSablonu: r.bildirim_sablonu || '', baslikFormat: r.baslik_format || ['firmaAd', 'sablonAd'],
  baslikSep: r.baslik_sep || ' • ', officeUserId: r.office_user_id,
});
const sablonToRow = s => ({
  ad: s.ad, alanlar: s.alanlar || [], kontrol_sablonu: s.kontrolSablonu || [],
  aciklama_sablonu: s.aciklamaSablonu || '', bildirim_sablonu: s.bildirimSablonu || '',
  baslik_format: s.baslikFormat || ['firmaAd', 'sablonAd'], baslik_sep: s.baslikSep || ' • ',
  office_user_id: s.officeUserId,
});

const rowToBildirim = r => ({
  id: r.id, tip: r.tip, mesaj: r.mesaj, hedef: r.hedef,
  firmaId: r.firma_id, talepId: r.talep_id, okundu: r.okundu,
  tarih: fmtTarih(r.created_at),
});
const bildirimToRow = b => ({
  tip: b.tip, mesaj: b.mesaj, hedef: b.hedef,
  firma_id: b.firmaId || null, talep_id: b.talepId || null, okundu: b.okundu || false,
});

const rowToDosya = r => {
  const d = {
    id: r.id, firmaId: r.firma_id, ad: r.ad, klasor: r.klasor || 'Genel',
    boyut: r.boyut, storagePath: r.storage_path, ekleyenId: r.ekleyen_id,
    ekleyen: r.ekleyen, isKlasor: r.is_klasor || false, isPin: r.is_pin || false,
    pinKey: r.pin_key, tarih: fmtTarih(r.created_at),
  };
  if (r.storage_path) {
    const { data } = supabase.storage.from('dosyalar').getPublicUrl(r.storage_path);
    d.publicUrl = data?.publicUrl || '';
  }
  return d;
};
const dosyaToRow = d => ({
  firma_id: d.firmaId, ad: d.ad, klasor: d.klasor || 'Genel',
  boyut: d.boyut || null, storage_path: d.storagePath || null,
  ekleyen_id: d.ekleyenId || null, ekleyen: d.ekleyen || null,
  is_klasor: d.isKlasor || false, is_pin: d.isPin || false, pin_key: d.pinKey || null,
});

const rowToProfile = r => ({
  id: r.id, ad: r.ad, eposta: r.eposta, rol: r.rol,
  renk: r.renk, anaFirma: r.ana_firma, bildirimAcik: r.bildirim_acik,
});

/* ═══════════════════════════════════════
   BOOT — Supabase'den tüm veriyi çek
═══════════════════════════════════════ */

export async function boot(userId) {
  try {
    const { data: profil } = await supabase.from('profiles').select('*').eq('id', userId).single();
    _db.mpirofil = profil ? rowToProfile(profil) : null;
    const anaFirma = profil?.ana_firma;

    // Önce ekip listesini çek
    let ekipIds = [userId];
    if (profil?.rol === 'office' && anaFirma) {
      const { data: ekipRaw } = await supabase.from('profiles').select('*').eq('rol', 'office').eq('ana_firma', anaFirma);
      _db.ekip = (ekipRaw || []).map(rowToProfile);
      ekipIds = _db.ekip.map(e => e.id);
    }

    const [firmR, sabR, talR, bilR, dosR, fkR] = await Promise.all([
      supabase.from('firmalar').select('*').in('office_user_id', ekipIds),
      supabase.from('sablonlar').select('*').in('office_user_id', ekipIds),
      supabase.from('talepler').select('*').order('created_at', { ascending: false }),
      supabase.from('bildirimler').select('*').order('created_at', { ascending: false }),
      supabase.from('dosyalar').select('*'),
      supabase.from('firma_kullanici').select('*'),
    ]);

    _db.firmalar = (firmR.data || []).map(rowToFirma);
    _db.sablonlar = (sabR.data || []).map(rowToSablon);
    _db.talepler = (talR.data || []).map(rowToTalep);
    _db.bildirimler = (bilR.data || []).map(rowToBildirim);
    _db.dosyalar = (dosR.data || []).map(rowToDosya);
    _db.firma_kullanici = fkR.data || [];

    // Client profilleri çek (firma_kullanici'daki user'ların ad/eposta bilgisi)
    const clientIds = [...new Set((_db.firma_kullanici || []).map(fk => fk.user_id))];
    if (clientIds.length > 0) {
      const { data: cpRaw } = await supabase.from('profiles').select('*').in('id', clientIds);
      _db.clientProfiles = (cpRaw || []).map(rowToProfile);
    }

    if (_db.sablonlar.length === 0 && profil?.rol === 'office') {
      await seedDefaults(userId);
    }
  } catch (e) { console.error('Boot error:', e); }
  notifyNow();
}

async function seedDefaults(uid) {
  const rows = [
    { ad: 'KDV Beyannamesi', alanlar: [{ id: 'a1', ad: 'Alış Faturaları', zorunlu: true, tip: 'onay' }, { id: 'a2', ad: 'Satış Faturaları', zorunlu: true, tip: 'onay' }, { id: 'a3', ad: 'Banka Ekstresi', zorunlu: true, tip: 'onay' }, { id: 'a4', ad: 'Açıklama', zorunlu: false, tip: 'paragraf' }], kontrol_sablonu: ['Alış faturaları kontrol', 'Satış faturaları kontrol', 'KDV hesaplama'], aciklama_sablonu: 'KDV Beyannamesi için gerekli alış/satış faturalarınızı ve banka ekstrenizi kontrol ediniz.', bildirim_sablonu: '{firmaAd} firmasının {sablonAd} işlemi tamamlanmıştır.', office_user_id: uid },
    { ad: 'Maaş Bordrosu', alanlar: [{ id: 'a5', ad: 'Personel Listesi', zorunlu: true, tip: 'onay' }, { id: 'a6', ad: 'Mesai Çizelgesi', zorunlu: true, tip: 'onay' }, { id: 'a7', ad: 'Personel Adı', zorunlu: true, tip: 'metin' }], kontrol_sablonu: ['Personel listesi kontrol', 'SGK bildirge'], aciklama_sablonu: 'Maaş bordrosu hazırlanması için personel listesi ve mesai çizelgesini kontrol ediniz.', bildirim_sablonu: '{firmaAd} firmasının {sablonAd} işlemi tamamlanmıştır.', office_user_id: uid },
    { ad: 'Vergi Borcu Yoktur Yazısı', alanlar: [{ id: 'a9', ad: 'Vergi Kimlik No', zorunlu: true, tip: 'metin' }, { id: 'a10', ad: 'Kullanım Amacı', zorunlu: true, tip: 'metin' }], kontrol_sablonu: ['VKN doğrulama', 'Borç sorgu'], aciklama_sablonu: '', bildirim_sablonu: '{firmaAd} firmasının {sablonAd} belgesi hazırlanmıştır.', office_user_id: uid },
  ];
  const { data } = await supabase.from('sablonlar').insert(rows).select();
  if (data) _db.sablonlar = data.map(rowToSablon);
}

/* ═══════════════════════════════════════
   REALTIME
═══════════════════════════════════════ */

export function startRealtime() {
  if (_rtChannel) return;
  _rtChannel = supabase.channel('mc-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'talepler' }, p => {
      if (_rtMuted) return;
      if (p.eventType === 'INSERT') {
        const t = rowToTalep(p.new);
        if (_deletedIds.has(t.id)) return;
        if (_db.talepler.find(x => x.id === t.id)) return;
        const tempIdx = _db.talepler.findIndex(x => typeof x.id === 'string' && x.id.startsWith('t') && x.sablonAd === t.sablonAd && (x.odId === t.odId || x.olusturanId === t.olusturanId));
        if (tempIdx >= 0) { _db.talepler[tempIdx] = t; } else { _db.talepler.unshift(t); }
        notify();
      }
      else if (p.eventType === 'UPDATE') { if (_deletedIds.has(p.new.id)) return; const i = _db.talepler.findIndex(x => x.id === p.new.id); if (i >= 0) { _db.talepler[i] = rowToTalep(p.new); notify(); } }
      else if (p.eventType === 'DELETE') { _deletedIds.add(p.old.id); _db.talepler = _db.talepler.filter(x => x.id !== p.old.id); notify(); }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bildirimler' }, p => {
      if (_rtMuted) return;
      if (p.eventType === 'INSERT') { const b = rowToBildirim(p.new); if (!_db.bildirimler.find(x => x.id === b.id)) { _db.bildirimler.unshift(b); notify(); } }
      else if (p.eventType === 'UPDATE') { const i = _db.bildirimler.findIndex(x => x.id === p.new.id); if (i >= 0) { _db.bildirimler[i] = rowToBildirim(p.new); notify(); } }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dosyalar' }, p => {
      if (_rtMuted) return;
      if (p.eventType === 'INSERT') { const d = rowToDosya(p.new); if (!_db.dosyalar.find(x => x.id === d.id)) { _db.dosyalar.push(d); notify(); } }
      else if (p.eventType === 'UPDATE') { const i = _db.dosyalar.findIndex(x => x.id === p.new.id); if (i >= 0) { _db.dosyalar[i] = rowToDosya(p.new); notify(); } }
      else if (p.eventType === 'DELETE') { _db.dosyalar = _db.dosyalar.filter(x => x.id !== p.old.id); notify(); }
    })
    .subscribe();
}

export function stopRealtime() {
  if (_rtChannel) { supabase.removeChannel(_rtChannel); _rtChannel = null; }
}

/* ═══════════════════════════════════════
   CRUD — Optimistic local + async Supabase
═══════════════════════════════════════ */

// ─── TALEPLER ───

export async function insertTalep(talep) {
  _db.talepler.unshift(talep);
  notify();
  const row = talepToRow(talep);
  const { data, error } = await supabase.from('talepler').insert(row).select().single();
  if (data) {
    const i = _db.talepler.findIndex(x => x === talep || (x.id === talep.id && talep.id?.startsWith?.('t')));
    if (i >= 0) { _db.talepler[i] = rowToTalep(data); notify(); }
  }
  if (error) console.error('insertTalep:', error);
  return data;
}

export async function updateTalep(id, changes) {
  const i = _db.talepler.findIndex(x => x.id === id);
  if (i >= 0) { Object.assign(_db.talepler[i], changes); notify(); }
  const row = {};
  const map = { durum: 'durum', sablonAd: 'sablon_ad', mukellefGorsun: 'mukellef_gorsun', bildirimGonder: 'bildirim_gonder', musavirNot: 'musavir_not', musavirCheckler: 'musavir_checkler', sonuclar: 'sonuclar', atananId: 'atanan_id', acil: 'acil', aciklama: 'aciklama', kisi: 'kisi', arsiv: 'arsiv', alanlar: 'alanlar', sira: 'sira' };
  Object.keys(map).forEach(k => { if (k in changes) row[map[k]] = changes[k]; });
  if (Object.keys(row).length) { const { error } = await supabase.from('talepler').update(row).eq('id', id); if (error) console.error('updateTalep:', error); }
}

export async function deleteTalep(id) {
  _deletedIds.add(id);
  _db.talepler = _db.talepler.filter(x => x.id !== id);
  notify();
  if (typeof id === 'number' || (typeof id === 'string' && !id.startsWith('t'))) {
    await supabase.from('talepler').delete().eq('id', id);
  }
}

export async function deleteTaleplerToplu(ids) {
  ids.forEach(id => _deletedIds.add(id));
  _db.talepler = _db.talepler.filter(x => !ids.includes(x.id));
  notify();
  const realIds = ids.filter(id => typeof id === 'number' || (typeof id === 'string' && !id.startsWith('t')));
  if (realIds.length) await supabase.from('talepler').delete().in('id', realIds);
}

export async function arsivTaleplerToplu(ids, arsiv = true) {
  _db.talepler.forEach(t => { if (ids.includes(t.id)) t.arsiv = arsiv; });
  notify();
  await supabase.from('talepler').update({ arsiv }).in('id', ids);
}

// ─── FİRMALAR ───

export async function insertFirma(firma) {
  _db.firmalar.push(firma);
  notify();
  const { data, error } = await supabase.from('firmalar').insert(firmaToRow(firma)).select().single();
  if (data) { const i = _db.firmalar.findIndex(x => x === firma); if (i >= 0) { _db.firmalar[i] = rowToFirma(data); notify(); } }
  if (error) console.error('insertFirma:', error);
  return data;
}

export async function updateFirma(id, changes) {
  const i = _db.firmalar.findIndex(x => x.id === id);
  if (i >= 0) { Object.assign(_db.firmalar[i], changes); notify(); }
  const row = {};
  if ('ad' in changes) row.ad = changes.ad;
  if ('vkn' in changes) row.vkn = changes.vkn;
  if (Object.keys(row).length) await supabase.from('firmalar').update(row).eq('id', id);
}

export async function deleteFirma(id) {
  _db.firmalar = _db.firmalar.filter(x => x.id !== id);
  _db.talepler = _db.talepler.filter(x => x.firmaId !== id);
  _db.dosyalar = _db.dosyalar.filter(x => x.firmaId !== id);
  _db.firma_kullanici = _db.firma_kullanici.filter(x => x.firma_id !== id);
  notify();
  await supabase.from('firmalar').delete().eq('id', id); // cascades
}

export async function insertFirmalarToplu(rows, officeUserId) {
  const items = rows.map(r => ({ ad: r.ad, vkn: r.vkn || null, office_user_id: officeUserId }));
  const tempLocals = rows.map(r => ({ id: '_tmp' + Math.random(), ad: r.ad, vkn: r.vkn || '', officeUserId, tarih: '' }));
  _db.firmalar.push(...tempLocals);
  notify();
  const { data } = await supabase.from('firmalar').insert(items).select();
  if (data) {
    _db.firmalar = _db.firmalar.filter(x => !x.id.startsWith('_tmp'));
    _db.firmalar.push(...data.map(rowToFirma));
    notify();
  }
}

// ─── ŞABLONLAR ───

export async function insertSablon(sablon) {
  _db.sablonlar.push(sablon);
  notify();
  const row = sablonToRow(sablon);
  const { data } = await supabase.from('sablonlar').insert(row).select().single();
  if (data) { const i = _db.sablonlar.findIndex(x => x === sablon); if (i >= 0) { _db.sablonlar[i] = rowToSablon(data); notify(); } }
  return data;
}

export async function updateSablon(id, changes) {
  const i = _db.sablonlar.findIndex(x => x.id === id);
  if (i >= 0) { Object.assign(_db.sablonlar[i], changes); notify(); }
  const row = {};
  const map = { ad: 'ad', alanlar: 'alanlar', kontrolSablonu: 'kontrol_sablonu', aciklamaSablonu: 'aciklama_sablonu', bildirimSablonu: 'bildirim_sablonu', baslikFormat: 'baslik_format', baslikSep: 'baslik_sep' };
  Object.keys(map).forEach(k => { if (k in changes) row[map[k]] = changes[k]; });
  if (Object.keys(row).length) await supabase.from('sablonlar').update(row).eq('id', id);
}

export async function deleteSablon(id) {
  _db.sablonlar = _db.sablonlar.filter(x => x.id !== id);
  notify();
  await supabase.from('sablonlar').delete().eq('id', id);
}

// ─── BİLDİRİMLER ───

export async function insertBildirim(b) {
  _db.bildirimler.unshift(b);
  notify();
  const row = bildirimToRow(b);
  const { data } = await supabase.from('bildirimler').insert(row).select().single();
  if (data) { const i = _db.bildirimler.findIndex(x => x === b); if (i >= 0) { _db.bildirimler[i] = rowToBildirim(data); notify(); } }
}

export async function updateBildirim(id, changes) {
  const i = _db.bildirimler.findIndex(x => x.id === id);
  if (i >= 0) { Object.assign(_db.bildirimler[i], changes); notify(); }
  if ('okundu' in changes) await supabase.from('bildirimler').update({ okundu: changes.okundu }).eq('id', id);
}

export async function markAllBildirimOkundu(hedef, firmaId) {
  _db.bildirimler.forEach(b => {
    if (b.hedef === hedef && (!firmaId || !b.firmaId || b.firmaId === firmaId)) b.okundu = true;
  });
  notify();
  let q = supabase.from('bildirimler').update({ okundu: true }).eq('hedef', hedef).eq('okundu', false);
  if (firmaId) q = q.eq('firma_id', firmaId);
  await q;
}

// ─── DOSYALAR ───

export async function uploadFileToStorage(file, firmaId, klasor, ekleyenId, ekleyen) {
  const ts = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = klasor ? `${firmaId}/${klasor}/${ts}_${safeName}` : `${firmaId}/${ts}_${safeName}`;
  
  // Supabase Storage'a yükle
  const { data: upData, error: upError } = await supabase.storage.from('dosyalar').upload(path, file);
  if (upError) { console.error('[STORAGE] Upload error:', upError); return null; }
  
  // Public URL al
  const { data: urlData } = supabase.storage.from('dosyalar').getPublicUrl(path);
  const publicUrl = urlData?.publicUrl || '';
  
  // Boyut formatla
  const fmtBoyut = b => { if (!b) return ''; if (b < 1024) return b + 'B'; if (b < 1048576) return (b / 1024).toFixed(1) + 'KB'; return (b / 1048576).toFixed(1) + 'MB'; };
  
  // dosyalar tablosuna kaydet
  const row = {
    firma_id: firmaId, ad: file.name, klasor: klasor || 'Genel',
    boyut: fmtBoyut(file.size), storage_path: path,
    ekleyen_id: ekleyenId || null, ekleyen: ekleyen || null,
    is_klasor: false, is_pin: false,
  };
  const { data, error } = await supabase.from('dosyalar').insert(row).select().single();
  if (error) { console.error('[STORAGE] DB insert error:', error); return null; }
  
  const dosya = { ...rowToDosya(data), publicUrl };
  _db.dosyalar.push(dosya);
  notify();
  return dosya;
}

export async function insertKlasor(firmaId, klasor, ekleyenId, ekleyen) {
  const row = { firma_id: firmaId, ad: '.klasor', klasor, boyut: null, storage_path: null, ekleyen_id: ekleyenId, ekleyen, is_klasor: true, is_pin: false };
  const { data, error } = await supabase.from('dosyalar').insert(row).select().single();
  if (error) { console.error('[STORAGE] Klasor insert error:', error); return null; }
  const d = rowToDosya(data);
  _db.dosyalar.push(d);
  notify();
  return d;
}

export async function insertDosya(d) {
  _db.dosyalar.push(d);
  notify();
  const { data } = await supabase.from('dosyalar').insert(dosyaToRow(d)).select().single();
  if (data) { const i = _db.dosyalar.findIndex(x => x === d); if (i >= 0) { _db.dosyalar[i] = rowToDosya(data); notify(); } }
  return data;
}

export async function updateDosya(id, changes) {
  const i = _db.dosyalar.findIndex(x => x.id === id);
  if (i >= 0) { Object.assign(_db.dosyalar[i], changes); notify(); }
  const row = {};
  if ('ad' in changes) row.ad = changes.ad;
  if ('isPin' in changes) row.is_pin = changes.isPin;
  if ('pinKey' in changes) row.pin_key = changes.pinKey;
  if (Object.keys(row).length) await supabase.from('dosyalar').update(row).eq('id', id);
}

export async function deleteDosya(id) {
  _db.dosyalar = _db.dosyalar.filter(x => x.id !== id);
  notify();
  await supabase.from('dosyalar').delete().eq('id', id);
}

// ─── PROFİL ───

export async function updateProfile(id, changes) {
  if (_db.mpirofil?.id === id) Object.assign(_db.mpirofil, changes);
  const ei = _db.ekip.findIndex(x => x.id === id);
  if (ei >= 0) Object.assign(_db.ekip[ei], changes);
  notify();
  const row = {};
  if ('renk' in changes) row.renk = changes.renk;
  if ('ad' in changes) row.ad = changes.ad;
  if ('bildirimAcik' in changes) row.bildirim_acik = changes.bildirimAcik;
  if (Object.keys(row).length) await supabase.from('profiles').update(row).eq('id', id);
}

// ─── FİRMA-KULLANICI ───

export async function addFirmaKullanici(firmaId, userId) {
  _db.firma_kullanici.push({ firma_id: firmaId, user_id: userId });
  notify();
  await supabase.from('firma_kullanici').insert({ firma_id: firmaId, user_id: userId });
}

export async function removeFirmaKullanici(firmaId, userId) {
  _db.firma_kullanici = _db.firma_kullanici.filter(x => !(x.firma_id === firmaId && x.user_id === userId));
  notify();
  await supabase.from('firma_kullanici').delete().eq('firma_id', firmaId).eq('user_id', userId);
}

// ─── MÜKELLEF OLUŞTUR ───

// Session bozmayan ayrı client — sadece kullanıcı oluşturmak için
const _adminClient = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
});

export async function createClientUser(email, password, ad, firmaId) {
  console.log('[AUTH] createClientUser:', email, ad, firmaId);
  const { data: existing } = await supabase.from('profiles').select('id').eq('eposta', email).maybeSingle();
  if (existing) {
    console.log('[AUTH] Existing user found:', existing.id);
    await addFirmaKullanici(firmaId, existing.id);
    return { id: existing.id, existing: true };
  }
  console.log('[AUTH] Calling signUp for client...');
  const { data, error } = await _adminClient.auth.signUp({ email, password, options: { data: { ad, rol: 'client' } } });
  console.log('[AUTH] signUp result:', JSON.stringify({ data, error }, null, 2));
  if (error) return { error: error.message };
  if (data?.user) {
    console.log('[AUTH] User created:', data.user.id);
    await addFirmaKullanici(firmaId, data.user.id);
    return { id: data.user.id };
  }
  console.error('[AUTH] No user in response:', data);
  return { error: 'Kullanıcı oluşturulamadı' };
}

export async function createEkipUyesi(email, password, ad, anaFirma) {
  console.log('[AUTH] createEkipUyesi:', email, ad, anaFirma);
  const { data, error } = await _adminClient.auth.signUp({ email, password, options: { data: { ad, rol: 'office', ana_firma: anaFirma } } });
  console.log('[AUTH] signUp result:', JSON.stringify({ data, error }, null, 2));
  if (error) return { error: error.message };
  if (data?.user) {
    console.log('[AUTH] Ekip user created:', data.user.id);
    const yeni = { id: data.user.id, ad, eposta: email, rol: 'office', renk: null, anaFirma, bildirimAcik: true };
    _db.ekip.push(yeni);
    notify();
    return { id: data.user.id };
  }
  console.error('[AUTH] No user in response:', data);
  return { error: 'Kullanıcı oluşturulamadı' };
}

// ─── Eski uyumluluk: ozlukDosyalari alias ───
// MonoApp'ta db.ozlukDosyalari kullanılıyor → dosyalar ile eşleştir
Object.defineProperty(_db, 'ozlukDosyalari', {
  get() { return this.dosyalar; },
  set(v) { this.dosyalar = v; },
  enumerable: false,
});

/* ═ Storage URL helper — signed URL (private bucket) ═ */
const _signedCache = new Map();
export async function getFileUrl(storagePath) {
  if (!storagePath) return '';
  const cached = _signedCache.get(storagePath);
  if (cached && Date.now() - cached.ts < 300000) return cached.url;
  const { data, error } = await supabase.storage.from('dosyalar').createSignedUrl(storagePath, 3600);
  if (!error && data?.signedUrl) {
    _signedCache.set(storagePath, { url: data.signedUrl, ts: Date.now() });
    return data.signedUrl;
  }
  const { data: pub } = supabase.storage.from('dosyalar').getPublicUrl(storagePath);
  return pub?.publicUrl || '';
}
