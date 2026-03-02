export type ApplicationStatus = 'İşlemde' | 'Randevu Alındı' | 'Tamamlandı' | 'Talep Bekliyor';
export type PaymentStatus = 'Ödendi' | 'Ödenmedi';
export type VisaResult = 'Çıktı' | 'Çıkmadı' | '';

export interface Applicant {
  id?: number;
  takipKodu: string;
  ad: string;
  soyad: string;
  dogumTarihi: string;
  ulke: string;
  islemDurumu: ApplicationStatus;
  randevuTarihi: string;
  saat: string;
  odemeDurumu: PaymentStatus;
  pasaportNo: string;
  notlar: string;
  pasaportSkt: string;
  email: string;
  kayitTarihi: string;
  vizeSonucu: VisaResult;
  vizeGecerlilikTarihi: string;
  firmaAdi: string;
}

export interface AccountingRecord {
  id?: number;
  takipKodu: string;
  adSoyad: string;
  islemDurumu: string;
  randevuBilgisi: string;
  kayitTarihi: string;
  pasaportNo: string;
  ulke: string;
  odemeDurumu: string;
  firma: string;
  netTutar: number;
  kdv: number;
  toplam: number;
  faturaNo: string;
  faturaTarihi: string;
}

export interface CountryPrice {
  id?: number;
  ulke: string;
  konsoloslukUcreti: number;
  hizmetBedeli: number;
  kdvOrani: number;
  kdv: number;
  toplam: number;
}
