import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { CountryPrice } from '../types';
import { COUNTRIES } from '../constants';

interface Props {
  price?: CountryPrice;
  onClose: () => void;
  onSave: (data: Partial<CountryPrice>) => void;
}

export default function PriceForm({ price, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<Partial<CountryPrice>>(price || {
    ulke: '',
    konsoloslukUcreti: 0,
    hizmetBedeli: 0,
    kdvOrani: 20,
    kdv: 0,
    toplam: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = e.target.type === 'number' ? Number(value) : value;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: numValue };
      
      // KDV ve Toplamı otomatik hesapla
      if (name === 'hizmetBedeli' || name === 'konsoloslukUcreti' || name === 'kdvOrani') {
        const h = name === 'hizmetBedeli' ? Number(value) : (prev.hizmetBedeli || 0);
        const k = name === 'konsoloslukUcreti' ? Number(value) : (prev.konsoloslukUcreti || 0);
        const r = name === 'kdvOrani' ? Number(value) : (prev.kdvOrani || 20);
        
        // KDV = Hizmet Bedeli'nin %r'si
        const calculatedKdv = h * (r / 100);
        newData.kdv = calculatedKdv;
        newData.toplam = k + h + calculatedKdv;
      }
      
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
          <h3 className="text-xl font-bold">{price ? 'Fiyat Güncelle' : 'Yeni Fiyat Tanımla'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Ülke</label>
            <select 
              required 
              name="ulke" 
              value={formData.ulke} 
              onChange={handleChange} 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Seçiniz...</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Konsolosluk (€)</label>
              <input 
                type="number" 
                required 
                name="konsoloslukUcreti" 
                value={formData.konsoloslukUcreti} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Hizmet Bedeli (€)</label>
              <input 
                type="number" 
                required 
                name="hizmetBedeli" 
                value={formData.hizmetBedeli} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">KDV Oranı (%)</label>
              <input 
                type="number" 
                required 
                name="kdvOrani" 
                value={formData.kdvOrani} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">KDV Tutarı (€)</label>
              <input 
                type="number" 
                readOnly
                name="kdv" 
                value={formData.kdv?.toFixed(2)} 
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none cursor-not-allowed text-slate-500" 
              />
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Toplam</span>
            <span className="text-xl font-black text-indigo-700">{(formData.toplam || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €</span>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all">İPTAL</button>
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
              <Save size={20} />
              KAYDET
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
