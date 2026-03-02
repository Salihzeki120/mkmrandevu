import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wallet, 
  PieChart, 
  Settings, 
  Search, 
  PlusCircle,
  ChevronRight,
  LogOut,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Applicant, AccountingRecord, CountryPrice } from './types';
import { COUNTRIES } from './constants';
import ApplicantForm from './components/ApplicantForm';
import AccountingForm from './components/AccountingForm';
import PriceForm from './components/PriceForm';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto"><ChevronRight size={16} /></motion.div>}
  </button>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('accounting');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [accounting, setAccounting] = useState<AccountingRecord[]>([]);
  const [prices, setPrices] = useState<CountryPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Tümü');
  
  // Modals
  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [showAccountingForm, setShowAccountingForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<CountryPrice | null>(null);
  const [notifications, setNotifications] = useState<{ appointments: Applicant[], payments: Applicant[], total: number }>({ appointments: [], payments: [], total: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, accRes, priRes, notRes] = await Promise.all([
        fetch('/api/applicants'),
        fetch('/api/accounting'),
        fetch('/api/prices'),
        fetch('/api/notifications')
      ]);
      const appData = await appRes.json();
      const accData = await accRes.json();
      const priData = await priRes.json();
      const notData = await notRes.json();
      setApplicants(appData);
      setAccounting(accData);
      setPrices(priData);
      setNotifications(notData);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApplicant = async (data: Partial<Applicant>) => {
    try {
      const res = await fetch('/api/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setShowApplicantForm(false);
        setSelectedApplicant(null);
        fetchData();
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
    }
  };

  const handleDeleteApplicant = async (kod: string) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/applicants/${kod}`, { method: 'DELETE' });
      if (res.ok) {
        setShowApplicantForm(false);
        setSelectedApplicant(null);
        fetchData();
      }
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const handleSaveAccounting = async (data: any) => {
    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        // Eğer ödeme alındıysa başvuru durumunu da güncelle
        if (data.islemTipi === 'TAHSILAT_TAMAM') {
          await handleSaveApplicant({ 
            takipKodu: data.takipKodu, 
            odemeDurumu: 'Ödendi' 
          } as any);
        }
        setShowAccountingForm(false);
        setSelectedApplicant(null);
        fetchData();
      }
    } catch (error) {
      console.error('Muhasebe hatası:', error);
    }
  };

  const handleSavePrice = async (data: Partial<CountryPrice>) => {
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setShowPriceForm(false);
        setSelectedPrice(null);
        fetchData();
      }
    } catch (error) {
      console.error('Fiyat kayıt hatası:', error);
    }
  };

  const handleDeletePrice = async (id: number) => {
    if (!confirm('Bu fiyat tanımını silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/prices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Fiyat silme hatası:', error);
    }
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    try {
      const res = await fetch('/api/reminders/send', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
    } catch (error) {
      console.error('Hatırlatma gönderim hatası:', error);
      alert('Hatırlatmalar gönderilirken bir hata oluştu.');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Toplam Kayıt" value={applicants.length} icon={Users} color="bg-blue-500" />
              <StatCard label="Bekleyen Talepler" value={applicants.filter(a => a.islemDurumu === 'Talep Bekliyor').length} icon={Clock} color="bg-amber-500" />
              <StatCard label="Tamamlanan" value={applicants.filter(a => a.islemDurumu === 'Tamamlandı').length} icon={CheckCircle2} color="bg-emerald-500" />
              <StatCard label="Toplam Tahsilat" value={`${accounting.reduce((acc, curr) => acc + curr.toplam, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €`} icon={Wallet} color="bg-indigo-500" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Otomatik Hatırlatıcılar</h3>
                <p className="text-sm text-slate-500">2 gün sonra randevusu olan adaylara bilgilendirme e-postası gönderir.</p>
              </div>
              <button 
                onClick={handleSendReminders}
                disabled={isSendingReminders}
                className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSendingReminders ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Bell size={18} />}
                HATIRLATMALARI ŞİMDİ GÖNDER
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock className="text-amber-500" size={20} />
                  Son Bekleyen Talepler
                </h3>
                <div className="space-y-4">
                  {applicants.filter(a => a.islemDurumu === 'Talep Bekliyor').slice(0, 5).map(a => (
                    <div key={a.takipKodu} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-semibold">{a.ad} {a.soyad}</p>
                        <p className="text-xs text-slate-500">{a.ulke} • {a.takipKodu}</p>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">BEKLEMEDE</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Wallet className="text-indigo-500" size={20} />
                  Son Muhasebe Hareketleri
                </h3>
                <div className="space-y-4">
                  {accounting.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-semibold">{a.adSoyad}</p>
                        <p className="text-xs text-slate-500">{a.faturaNo || 'Fatura Yok'} • {a.ulke}</p>
                      </div>
                      <p className="font-bold text-indigo-600">{a.toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'applicants':
      case 'pending':
        const filteredApplicants = applicants.filter(a => 
          (activeTab === 'pending' ? a.islemDurumu === 'Talep Bekliyor' : true) &&
          (selectedCountry === 'Tümü' ? true : a.ulke === selectedCountry) &&
          (a.ad.toLowerCase().includes(searchQuery.toLowerCase()) || 
           a.soyad.toLowerCase().includes(searchQuery.toLowerCase()) || 
           a.takipKodu.includes(searchQuery.toUpperCase()))
        );
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-bottom border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold">{activeTab === 'pending' ? 'Talep Bekleyenler' : 'Tüm Kayıtlar'}</h3>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <Filter size={14} className="text-slate-400" />
                  <select 
                    className="bg-transparent text-xs font-bold outline-none"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    <option value="Tümü">Tüm Ülkeler</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="İsim veya Kod ile ara..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Takip Kodu</th>
                    <th className="px-6 py-4 font-semibold">Ad Soyad</th>
                    <th className="px-6 py-4 font-semibold">Ülke</th>
                    <th className="px-6 py-4 font-semibold">Durum</th>
                    <th className="px-6 py-4 font-semibold">Randevu</th>
                    <th className="px-6 py-4 font-semibold">Ödeme</th>
                    <th className="px-6 py-4 font-semibold text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplicants.map(a => (
                    <tr key={a.takipKodu} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{a.takipKodu}</td>
                      <td className="px-6 py-4 font-medium">{a.ad} {a.soyad}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{a.ulke}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          a.islemDurumu === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700' :
                          a.islemDurumu === 'Talep Bekliyor' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {a.islemDurumu}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{a.randevuTarihi || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold ${a.odemeDurumu === 'Ödendi' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {a.odemeDurumu}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button 
                          onClick={() => {
                            setSelectedApplicant(a);
                            setShowAccountingForm(true);
                          }}
                          className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
                        >
                          MUHASEBE
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedApplicant(a);
                            setShowApplicantForm(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                        >
                          DÜZENLE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'accounting':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Toplam Fatura" value={accounting.length} icon={FileText} color="bg-blue-500" />
              <StatCard label="Tahsil Edilen" value={`${accounting.reduce((acc, curr) => acc + curr.toplam, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €`} icon={CheckCircle2} color="bg-emerald-500" />
              <StatCard label="Bekleyen Ödeme" value={`${applicants.filter(a => a.odemeDurumu === 'Ödenmedi').length} Kayıt`} icon={AlertCircle} color="bg-rose-500" />
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-bottom border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold">Muhasebe Kayıtları</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Fatura No</th>
                      <th className="px-6 py-4 font-semibold">Müşteri</th>
                      <th className="px-6 py-4 font-semibold">Ülke</th>
                      <th className="px-6 py-4 font-semibold">Tutar</th>
                      <th className="px-6 py-4 font-semibold">KDV</th>
                      <th className="px-6 py-4 font-semibold">Toplam</th>
                      <th className="px-6 py-4 font-semibold">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounting.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold">{a.faturaNo || '-'}</td>
                        <td className="px-6 py-4 font-medium">{a.adSoyad}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{a.ulke}</td>
                        <td className="px-6 py-4 text-sm">{a.netTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €</td>
                        <td className="px-6 py-4 text-sm">{a.kdv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €</td>
                        <td className="px-6 py-4 font-bold text-indigo-600">{a.toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{a.faturaTarihi || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'prices':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-bottom border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">Ülke Bazlı Fiyat Listesi</h3>
              <button 
                onClick={() => {
                  setSelectedPrice(null);
                  setShowPriceForm(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <PlusCircle size={18} />
                YENİ FİYAT EKLE
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Ülke</th>
                    <th className="px-6 py-4 font-semibold">Konsolosluk</th>
                    <th className="px-6 py-4 font-semibold">Hizmet Bedeli</th>
                    <th className="px-6 py-4 font-semibold">KDV</th>
                    <th className="px-6 py-4 font-semibold">Toplam</th>
                    <th className="px-6 py-4 font-semibold text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prices.length > 0 ? prices.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold">{p.ulke}</td>
                      <td className="px-6 py-4 text-sm">{p.konsoloslukUcreti.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €</td>
                      <td className="px-6 py-4 text-sm">{p.hizmetBedeli.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €</td>
                      <td className="px-6 py-4 text-sm">{p.kdv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €</td>
                      <td className="px-6 py-4 font-bold text-indigo-600">{p.toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button 
                          onClick={() => {
                            setSelectedPrice(p);
                            setShowPriceForm(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                        >
                          DÜZENLE
                        </button>
                        <button 
                          onClick={() => p.id && handleDeletePrice(p.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold text-xs"
                        >
                          SİL
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400">Henüz fiyat tanımlanmamış.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'reports':
        const monthlyStats = applicants.reduce((acc: any, curr) => {
          const month = curr.kayitTarihi ? curr.kayitTarihi.substring(0, 7) : 'Bilinmiyor';
          if (!acc[month]) acc[month] = { count: 0, completed: 0, revenue: 0 };
          acc[month].count++;
          if (curr.islemDurumu === 'Tamamlandı') acc[month].completed++;
          return acc;
        }, {});

        return (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Genel Özet Raporu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(monthlyStats).sort().reverse().map(([month, stats]: [string, any]) => (
                  <div key={month} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-indigo-600">{month}</h4>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AYLIK RAPOR</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Toplam Başvuru:</span>
                        <span className="font-bold">{stats.count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tamamlanan:</span>
                        <span className="font-bold text-emerald-600">{stats.completed}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full mt-2">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(stats.completed / stats.count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-center py-20 text-slate-400">Bu sayfa yakında eklenecek.</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 fixed h-full z-10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">M</div>
          <div>
            <h1 className="font-bold text-slate-800 leading-none">MKM VİZE</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Yönetim Sistemi</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Ana Menü</p>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Clock} label="Talep Bekleyenler" active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} />
          <SidebarItem icon={Users} label="Tüm Kayıtlar" active={activeTab === 'applicants'} onClick={() => setActiveTab('applicants')} />
          
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mt-6 mb-2">Muhasebe</p>
          <SidebarItem icon={Wallet} label="Ödemeler" active={activeTab === 'accounting'} onClick={() => setActiveTab('accounting')} />
          <SidebarItem icon={FileText} label="Fiyatlar" active={activeTab === 'prices'} onClick={() => setActiveTab('prices')} />
          
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mt-6 mb-2">Raporlar</p>
          <SidebarItem icon={PieChart} label="Genel Özet" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all">
            <LogOut size={20} />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-8">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Hoş Geldiniz'}
              {activeTab === 'pending' && 'Talep Bekleyenler'}
              {activeTab === 'applicants' && 'Müşteri Kayıtları'}
              {activeTab === 'accounting' && 'Muhasebe Yönetimi'}
            </h2>
            <p className="text-slate-500 text-sm">Sistemdeki güncel veriler ve işlemler.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-xl transition-all ${showNotifications ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
              >
                <Bell size={20} />
                {notifications.total > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {notifications.total}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-slate-800">Bildirimler</h4>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Canlı</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.total === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Yeni bildirim bulunmuyor.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {notifications.appointments.map(a => (
                            <div key={`not-app-${a.takipKodu}`} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setActiveTab('applicants'); setShowNotifications(false); }}>
                              <div className="flex gap-3">
                                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                                  <Clock size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">Yaklaşan Randevu</p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{a.ad} {a.soyad} - {a.ulke}</p>
                                  <p className="text-[10px] font-bold text-amber-600 mt-1">{a.randevuTarihi} {a.saat}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {notifications.payments.map(a => (
                            <div key={`not-pay-${a.takipKodu}`} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setActiveTab('accounting'); setShowNotifications(false); }}>
                              <div className="flex gap-3">
                                <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
                                  <Wallet size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">Ödeme Bekliyor</p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{a.ad} {a.soyad} - {a.ulke}</p>
                                  <p className="text-[10px] font-bold text-rose-600 mt-1">Tahsilat yapılmadı</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Settings size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button 
              onClick={() => {
                setSelectedApplicant(null);
                setShowApplicantForm(true);
              }}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <PlusCircle size={20} />
              YENİ KAYIT
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {showApplicantForm && (
          <ApplicantForm 
            applicant={selectedApplicant || undefined} 
            onClose={() => {
              setShowApplicantForm(false);
              setSelectedApplicant(null);
            }}
            onSave={handleSaveApplicant}
            onDelete={handleDeleteApplicant}
          />
        )}

        {showAccountingForm && selectedApplicant && (
          <AccountingForm 
            applicant={selectedApplicant}
            prices={prices}
            onClose={() => {
              setShowAccountingForm(false);
              setSelectedApplicant(null);
            }}
            onSave={handleSaveAccounting}
          />
        )}

        {showPriceForm && (
          <PriceForm 
            price={selectedPrice || undefined}
            onClose={() => {
              setShowPriceForm(false);
              setSelectedPrice(null);
            }}
            onSave={handleSavePrice}
          />
        )}
      </main>
    </div>
  );
}
