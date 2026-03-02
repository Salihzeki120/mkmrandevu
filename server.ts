import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import nodemailer from "nodemailer";

const db = new Database("mkm_vize.db");

// Veritabanı Tablolarını Oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    takipKodu TEXT UNIQUE,
    ad TEXT,
    soyad TEXT,
    dogumTarihi TEXT,
    ulke TEXT,
    islemDurumu TEXT,
    randevuTarihi TEXT,
    saat TEXT,
    odemeDurumu TEXT,
    pasaportNo TEXT,
    notlar TEXT,
    pasaportSkt TEXT,
    email TEXT,
    kayitTarihi TEXT,
    vizeSonucu TEXT,
    vizeGecerlilikTarihi TEXT,
    firmaAdi TEXT,
    hatirlatmaGonderildi INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS accounting (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    takipKodu TEXT,
    adSoyad TEXT,
    islemDurumu TEXT,
    randevuBilgisi TEXT,
    kayitTarihi TEXT,
    pasaportNo TEXT,
    ulke TEXT,
    odemeDurumu TEXT,
    firma TEXT,
    netTutar REAL,
    kdv REAL,
    toplam REAL,
    faturaNo TEXT,
    faturaTarihi TEXT
  );

  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ulke TEXT UNIQUE,
    konsoloslukUcreti REAL,
    hizmetBedeli REAL,
    kdvOrani REAL DEFAULT 20,
    kdv REAL,
    toplam REAL
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = Number(process.env.PORT) || 3000;

  // --- API ROUTES ---

  // Tüm Kayıtları Getir
  app.get("/api/applicants", (req, res) => {
    const rows = db.prepare("SELECT * FROM applicants ORDER BY id DESC").all();
    res.json(rows);
  });

  // Tek Kayıt Sorgula
  app.get("/api/applicants/:query", (req, res) => {
    const query = req.params.query.toUpperCase();
    const row = db.prepare("SELECT * FROM applicants WHERE takipKodu = ? OR UPPER(soyad) = ?").get(query, query);
    res.json(row || { error: "Kayıt bulunamadı" });
  });

  // Yeni Kayıt veya Güncelleme
  app.post("/api/applicants", (req, res) => {
    const data = req.body;
    
    // Takip kodu varsa veritabanında kontrol et
    const existing = data.takipKodu ? db.prepare("SELECT id FROM applicants WHERE takipKodu = ?").get(data.takipKodu) : null;

    if (existing) {
      // Güncelleme
      const stmt = db.prepare(`
        UPDATE applicants SET 
          ad=?, soyad=?, dogumTarihi=?, ulke=?, islemDurumu=?, 
          randevuTarihi=?, saat=?, odemeDurumu=?, pasaportNo=?, 
          notlar=?, pasaportSkt=?, email=?, vizeSonucu=?, 
          vizeGecerlilikTarihi=?, firmaAdi=?
        WHERE takipKodu=?
      `);
      stmt.run(
        data.ad, data.soyad, data.dogumTarihi, data.ulke, data.islemDurumu,
        data.randevuTarihi, data.saat, data.odemeDurumu, data.pasaportNo,
        data.notlar, data.pasaportSkt, data.email, data.vizeSonucu,
        data.vizeGecerlilikTarihi, data.firmaAdi, data.takipKodu
      );
      res.json({ success: true, takipKodu: data.takipKodu });
    } else {
      // Yeni Kayıt
      const newKod = data.takipKodu || `MKM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Çakışma kontrolü (nadir durum)
      const collision = db.prepare("SELECT id FROM applicants WHERE takipKodu = ?").get(newKod);
      if (collision && !data.takipKodu) {
        return res.status(500).json({ error: "Kod üretme hatası, lütfen tekrar deneyin." });
      }

      const stmt = db.prepare(`
        INSERT INTO applicants (
          takipKodu, ad, soyad, dogumTarihi, ulke, islemDurumu, 
          randevuTarihi, saat, odemeDurumu, pasaportNo, notlar, 
          pasaportSkt, email, kayitTarihi, firmaAdi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        newKod, data.ad, data.soyad, data.dogumTarihi, data.ulke, data.islemDurumu || "Talep Bekliyor",
        data.randevuTarihi || "", data.saat || "", data.odemeDurumu || "Ödenmedi", 
        data.pasaportNo || "", data.notlar || "", data.pasaportSkt || "",
        data.email || "", new Date().toISOString(), data.firmaAdi || "MKM VİZE"
      );
      res.json({ success: true, takipKodu: newKod });
    }
  });

  // Kayıt Sil
  app.delete("/api/applicants/:kod", (req, res) => {
    db.prepare("DELETE FROM applicants WHERE takipKodu = ?").run(req.params.kod);
    res.json({ success: true });
  });

  // Muhasebe Kaydı
  app.post("/api/accounting", (req, res) => {
    const data = req.body;
    const stmt = db.prepare(`
      INSERT INTO accounting (
        takipKodu, adSoyad, islemDurumu, randevuBilgisi, kayitTarihi,
        pasaportNo, ulke, odemeDurumu, firma, netTutar, kdv, toplam,
        faturaNo, faturaTarihi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      data.takipKodu, data.adSoyad, data.islemDurumu, data.randevuBilgisi,
      new Date().toISOString(), data.pasaportNo, data.ulke, data.odemeDurumu,
      data.firma, data.netTutar, data.kdv, data.toplam, data.faturaNo, data.faturaTarihi
    );
    res.json({ success: true });
  });

  app.get("/api/accounting", (req, res) => {
    const rows = db.prepare("SELECT * FROM accounting ORDER BY id DESC").all();
    res.json(rows);
  });

  // Bildirimler
  app.get("/api/notifications", (req, res) => {
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);
    
    const nowStr = now.toISOString().split('T')[0];
    const twoDaysStr = twoDaysFromNow.toISOString().split('T')[0];

    // Yaklaşan Randevular (Son 2 gün)
    const upcomingAppointments = db.prepare(`
      SELECT * FROM applicants 
      WHERE randevuTarihi >= ? AND randevuTarihi <= ? 
      AND islemDurumu != 'Tamamlandı'
    `).all(nowStr, twoDaysStr);

    // Ödeme Bekleyenler (Randevusu olan ama ödenmemiş)
    const pendingPayments = db.prepare(`
      SELECT * FROM applicants 
      WHERE odemeDurumu = 'Ödenmedi' 
      AND randevuTarihi != '' 
      AND randevuTarihi < ?
    `).all(twoDaysStr);

    res.json({
      appointments: upcomingAppointments,
      payments: pendingPayments,
      total: upcomingAppointments.length + pendingPayments.length
    });
  });

  // Otomatik Hatırlatıcı Gönderimi
  app.post("/api/reminders/send", async (req, res) => {
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);
    const targetDateStr = twoDaysFromNow.toISOString().split('T')[0];

    const upcoming = db.prepare(`
      SELECT * FROM applicants 
      WHERE randevuTarihi = ? 
      AND hatirlatmaGonderildi = 0 
      AND email IS NOT NULL 
      AND email != ''
    `).all(targetDateStr) as any[];

    if (upcoming.length === 0) {
      return res.json({ message: "Gönderilecek hatırlatma bulunamadı.", sentCount: 0 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let sentCount = 0;
    for (const applicant of upcoming) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"MKM VİZE" <no-reply@mkmvize.com>',
          to: applicant.email,
          subject: "Randevu Hatırlatması - MKM VİZE",
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #4f46e5;">Randevu Hatırlatması</h2>
              <p>Sayın <strong>${applicant.ad} ${applicant.soyad}</strong>,</p>
              <p>Yaklaşan vize randevunuz hakkında sizi bilgilendirmek isteriz:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Ülke:</strong> ${applicant.ulke}</p>
                <p style="margin: 5px 0;"><strong>Tarih:</strong> ${applicant.randevuTarihi}</p>
                <p style="margin: 5px 0;"><strong>Saat:</strong> ${applicant.saat}</p>
                <p style="margin: 5px 0;"><strong>Takip Kodu:</strong> ${applicant.takipKodu}</p>
              </div>
              <p>Lütfen randevu saatinden en az 15 dakika önce ilgili merkezde hazır bulununuz.</p>
              <p>İyi günler dileriz,<br><strong>MKM VİZE Ekibi</strong></p>
            </div>
          `,
        });

        db.prepare("UPDATE applicants SET hatirlatmaGonderildi = 1 WHERE takipKodu = ?").run(applicant.takipKodu);
        sentCount++;
      } catch (error) {
        console.error(`E-posta gönderim hatası (${applicant.email}):`, error);
      }
    }

    res.json({ message: `${sentCount} adet hatırlatma e-postası gönderildi.`, sentCount });
  });

  // Fiyatlar
  app.get("/api/prices", (req, res) => {
    const rows = db.prepare("SELECT * FROM prices").all();
    res.json(rows);
  });

  app.post("/api/prices", (req, res) => {
    const data = req.body;
    if (data.id) {
      const stmt = db.prepare(`
        UPDATE prices SET 
          ulke=?, konsoloslukUcreti=?, hizmetBedeli=?, kdvOrani=?, kdv=?, toplam=?
        WHERE id=?
      `);
      stmt.run(data.ulke, data.konsoloslukUcreti, data.hizmetBedeli, data.kdvOrani, data.kdv, data.toplam, data.id);
    } else {
      const stmt = db.prepare(`
        INSERT INTO prices (ulke, konsoloslukUcreti, hizmetBedeli, kdvOrani, kdv, toplam)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(data.ulke, data.konsoloslukUcreti, data.hizmetBedeli, data.kdvOrani, data.kdv, data.toplam);
    }
    res.json({ success: true });
  });

  app.delete("/api/prices/:id", (req, res) => {
    db.prepare("DELETE FROM prices WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // SPA Fallback: API dışındaki tüm istekleri index.html'e yönlendir
    app.get("*", (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
