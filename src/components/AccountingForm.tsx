import React, { useState, useEffect } from 'react';
import { X, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Applicant, CountryPrice } from '../types';

interface Props {
  applicant: Applicant;
  prices: CountryPrice[];
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function AccountingForm({ applicant, prices, onClose, onSave }: Props) {
  const countryPrice = prices.find(p => p.ulke === applicant.ulke);

  const [formData, setFormData] = useState({
    faturaNo: '',
    tutar: countryPrice?.toplam || 0,
    tarih: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (tip: 'FATURA_KAYDI' | 'TAHSILAT_TAMAM') => {
    const total = Number(formData.tutar);
    let netTutar = total * 0.8;
    let kdv = total * 0.2;

    // Eğer ülke fiyatı tanımlıysa daha hassas hesaplama yapalım
    if (countryPrice) {
      const k = countryPrice.konsoloslukUcreti;
      const r = countryPrice.kdvOrani || 20;
      // Total = k + h + (r/100)h => Total - k = h(1 + r/100) => h = (Total - k) / (1 + r/100)
      const h = (total - k) / (1 + r / 100);
      kdv = h * (r / 100);
      netTutar = total - kdv;
    }

    onSave({
      ...formData,
      islemTipi: tip,
      takipKodu: applicant.takipKodu,
      adSoyad: `${applicant.ad} ${applicant.soyad}`,
      ulke: applicant.ulke,
      islemDurumu: applicant.islemDurumu,
      pasaportNo: applicant.pasaportNo,
      firma: applicant.firmaAdi,
      netTutar: netTutar,
      kdv: kdv,
      toplam: total
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Wallet size={24} />
            Fatura & Tahsilat Yönetimi
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Müşteri</p>
              <p className="font-bold text-slate-800">{applicant.ad} {applicant.soyad}</p>
              <p className="text-xs text-slate-500 font-mono">{applicant.takipKodu} • {applicant.ulke}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ödeme Durumu</p>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                applicant.odemeDurumu === 'Ödendi' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {applicant.odemeDurumu}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Fatura No</label>
              <input 
                name="faturaNo" 
                value={formData.faturaNo} 
                onChange={handleChange} 
                placeholder="MKM-2026-..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Tutar (€)</label>
                <input 
                  type="number" 
                  name="tutar" 
                  value={formData.tutar} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Tarih</label>
                <input 
                  type="date" 
                  name="tarih" 
                  value={formData.tarih} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {applicant.odemeDurumu === 'Ödenmedi' && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-bold">Ödeme Alındı</span> butonuna tıkladığınızda müşteri ödeme durumu otomatik olarak <span className="font-bold">"Ödendi"</span> olarak güncellenecektir.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={() => handleSubmit('FATURA_KAYDI')}
              className="px-4 py-3 border-2 border-emerald-600 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
            >
              FATURA KESİLDİ
            </button>
            <button 
              onClick={() => handleSubmit('TAHSILAT_TAMAM')}
              className="px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              ÖDEME ALINDI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
