import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Applicant } from '../types';
import { COUNTRIES, STATUS_OPTIONS, PAYMENT_OPTIONS, RESULT_OPTIONS } from '../constants';

interface Props {
  applicant?: Applicant;
  onClose: () => void;
  onSave: (data: Partial<Applicant>) => void;
  onDelete?: (kod: string) => void;
}

export default function ApplicantForm({ applicant, onClose, onSave, onDelete }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [formData, setFormData] = useState<Partial<Applicant>>({
    takipKodu: applicant?.takipKodu || `MKM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    ad: '',
    soyad: '',
    dogumTarihi: '',
    ulke: '',
    islemDurumu: 'Talep Bekliyor',
    randevuTarihi: '',
    saat: '',
    odemeDurumu: 'Ödenmedi',
    pasaportNo: '',
    notlar: '',
    pasaportSkt: '',
    email: '',
    vizeSonucu: '',
    vizeGecerlilikTarihi: '',
    firmaAdi: 'MKM VİZE',
    ...applicant
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/applicants/${searchQuery}`);
      const data = await res.json();
      if (data.error) {
        setSearchError('Kayıt bulunamadı.');
      } else {
        setFormData(prev => ({ ...prev, ...data }));
        setSearchError('');
      }
    } catch (error) {
      setSearchError('Arama sırasında bir hata oluştu.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
          <h3 className="text-xl font-bold">{applicant ? 'Kayıt Güncelle' : 'Yeni Başvuru Kaydı'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-8">
          {!applicant && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="text-sm font-bold text-slate-700">Kayıt Bul / Getir (Takip Kodu veya Soyadı)</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Kod veya Soyadı giriniz..." 
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                />
                <button 
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sorgula'}
                </button>
              </div>
              {searchError && <p className="text-xs font-bold text-rose-600">{searchError}</p>}
            </div>
          )}

          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">1. Müşteri Bilgileri</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Takip Kodu (Otomatik)</label>
                <input 
                  readOnly 
                  name="takipKodu" 
                  value={formData.takipKodu} 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none font-mono text-indigo-600 font-bold cursor-not-allowed" 
                />
              </div>
              <div className="hidden md:block"></div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Ad</label>
                <input required name="ad" value={formData.ad} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Soyad</label>
                <input required name="soyad" value={formData.soyad} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Doğum Tarihi</label>
                <input type="date" name="dogumTarihi" value={formData.dogumTarihi} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">E-posta</label>
                <input type="email" required name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Pasaport No</label>
                <input name="pasaportNo" value={formData.pasaportNo} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Pasaport SKT</label>
                <input type="date" name="pasaportSkt" value={formData.pasaportSkt} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">2. Vize & Randevu Detayları</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Hedef Ülke</label>
                <select required name="ulke" value={formData.ulke} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Seçiniz...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">İşlem Durumu</label>
                <select name="islemDurumu" value={formData.islemDurumu} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Randevu Tarihi</label>
                <input type="date" name="randevuTarihi" value={formData.randevuTarihi} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Randevu Saati</label>
                <input type="time" name="saat" value={formData.saat} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Ödeme Durumu</label>
                <select name="odemeDurumu" value={formData.odemeDurumu} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Firma Adı</label>
                <input name="firmaAdi" value={formData.firmaAdi} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
          </section>

          {formData.islemDurumu === 'Tamamlandı' && (
            <section className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">3. Vize Sonuç Bilgisi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Vize Sonucu</label>
                  <select name="vizeSonucu" value={formData.vizeSonucu} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Seçiniz...</option>
                    {RESULT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {formData.vizeSonucu === 'Çıktı' && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Vize Geçerlilik Tarihi</label>
                    <input type="date" name="vizeGecerlilikTarihi" value={formData.vizeGecerlilikTarihi} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Notlar / Özel İstekler</label>
            <textarea name="notlar" value={formData.notlar} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Müşteri notlarını buraya ekleyin..." />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {applicant && onDelete && (
            <button 
              type="button"
              onClick={() => onDelete(applicant.takipKodu)}
              className="flex items-center gap-2 px-6 py-2.5 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-all"
            >
              <Trash2 size={20} />
              KAYDI SİL
            </button>
          )}
          <div className="flex items-center gap-4 ml-auto">
            <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all">İPTAL</button>
            <button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
              <Save size={20} />
              {applicant ? 'GÜNCELLE' : 'KAYDET'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
