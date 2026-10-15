# İngilizce Uygulaması — Rota ve İmplementasyon Planı

Kişisel kullanım için, iPhone'da çalışan, offline öncelikli kelime + okuma uygulaması.

## 1. Kararlar (soru-cevaptan)

| Konu | Karar |
|---|---|
| Platform | PWA (Safari → Ana Ekrana Ekle). Mac gerekmez. |
| Kullanıcı | Tek kişi, tek cihaz (iPhone). Senkronizasyon yok. |
| Kod | Kodu Claude yazar, kullanıcı test eder. |
| Kelime kaynağı | Hazır listelerin tamamı + kullanıcının eklediği kelimeler |
| Kart içeriği | TR anlam, EN tanım, örnek cümle, US telaffuz (IPA + ses), eş anlamlılar, collocation'lar, kelime ailesi |
| Çalışma yöntemi | FSRS aralıklı tekrar + kademeli egzersiz türleri |
| Bilinen kelimeler | Seviye testi yok. Her yeni kelimede "I know this" butonu var. |
| Günlük limit | Varsayılan öneri 10, ama sınır yok ("More" ile devam edilebilir) |
| Okuma kaynakları | Kaynak kaynak ayrılmış haber/makale/kitap + kendi metnin/linkin |
| Okurken sözlük | Kelimeye dokun → offline anlam → tek tıkla listeye ekle (cümlesiyle birlikte) |
| İlerleme | Okuma ilerlemesi tutulur. Hedef, streak ve istatistik yok. |
| Arayüz | Sade/minimal, dil İngilizce. Temalar: Light / Sepia / Dark / System. Font, boyut ve satır aralığı ayarlanabilir. |
| Telaffuz | Amerikan İngilizcesi (iOS'un offline sistem sesleri) |
| Barındırma | GitHub (kod + GitHub Pages) |

## 2. Teknoloji

- **Vite + React + TypeScript**: Uygulamanın iskeleti.
- **vite-plugin-pwa (Workbox)**: Offline çalışma ve ana ekrana ekleme.
- **Dexie (IndexedDB)**: Tüm veriler telefonda tutulur. `navigator.storage.persist()` ile kalıcı depolama istenir.
- **ts-fsrs**: Aralıklı tekrar algoritması.
- **Düz CSS + CSS değişkenleri**: Temalar için. Okuması kolay, ekstra bağımlılık yok.
- **Web Speech API**: `en-US` telaffuz, offline çalışır. iOS ayarlarından "Enhanced" ses indirilmesi önerilir.
- **Vitest**: FSRS, lemmatizer ve veri doğrulama için birim testleri.
- **Cloudflare Worker (ücretsiz)**: Kişisel "okuma modu" aracı. Sadece sen dokununca haberi veya kitabı çeker, temizler (Mozilla Readability) ve uygulamaya verir. Gizli bir anahtarla korunur, başkası kullanamaz. İçerik herkese açık bir yerde yeniden yayınlanmadığı için telif açısından da en temiz yol bu.

## 3. Ekranlar

Alt menü: **Today · Words · Read · Settings**

- **Today**: "Review (N due)" ve "Learn new" butonları. Kaldığın okumaya devam kısayolu.
- **Words**: Listeler (Oxford 3000, Oxford 5000, AWL, My Words), arama, kelime detayı, durum filtresi (new / learning / known).
- **Read**
  - *Library*: İndirilmiş ve offline okunabilen metinler. İlerleme yüzdesi ve kaldığın yer burada görünür.
  - *Sources*: Kaynak kaynak ayrılmış liste. Haberler (BBC, NPR, The Guardian, The Conversation…), denemeler (Aeon, Psyche…), kitaplar (Standard Ebooks / Project Gutenberg kataloğu, türlere göre). Her öğede "Read" ve "Download" seçenekleri var.
  - *Add*: Metin yapıştırma veya link ekleme.
- **Reader**: Temiz okuma ekranı. Kelimeye dokununca popup açılır (anlam, IPA, ses, "Add"). Listedeki kelimeler hafifçe işaretlenir. Kitaplar bölüm bölüm okunur.
- **Settings**: Tema, font, yazı boyutu, satır aralığı, günlük yeni kelime önerisi, **Export / Import yedek**, depolama durumu.

## 4. Kelime çalışma tasarımı

**Kelimenin yaşam döngüsü:** `new → learning → review → known`

- *New* oturumu: Kart tüm bilgisiyle gösterilir. Butonlar: **I know this** (bir daha gösterilmez) / **Learn**.
- *Review*: Zamanı gelen kartları FSRS seçer.

**Kademeli egzersizler.** Kelimenin hafızadaki gücü arttıkça egzersiz zorlaşır:

1. Tanıma: EN kelime → anlamı hatırla (kart çevirme + kendi puanın)
2. Çoktan seçmeli: TR anlam → doğru EN kelime
3. Tanımdan bulma: EN tanım → kelime
4. Boşluk doldurma: örnek cümlede boşluğa kelimeyi yaz
5. Collocation: "___ a decision" → make / do / take
6. Üretim: TR anlam → kelimeyi yaz

Puanlama: Kart çevirmede Again/Hard/Good/Easy sen seçersin. Test türlerinde doğru/yanlış ve cevap süresine göre puan otomatik verilir.

Okumadan eklenen kelimelerde, cümlenin geçtiği kendi cümlen öncelikli örnek olarak kullanılır.

## 5. Veri

**Kelime listeleri:** Oxford 3000 + Oxford 5000 + Academic Word List. Tekrarlar temizlendiğinde yaklaşık 5.500 kelime.

**Kart içeriği:** Kartlar önceden hazırlanıp uygulamaya gömülecek (`words.json`):
- IPA: açık sözlük verisinden (Wiktionary/CMUdict)
- Diğer alanlar: Claude tarafından partiler halinde üretilecek, ardından script ile doğrulanacak (eksik alan, kelimenin örnek cümlede geçip geçmediği vb.)

**Okuma sözlüğü (EN→TR):** Wiktionary (kaikki.org) çevirileri + WordNet İngilizce tanımları. Çekimli kelimeler (running → run) için lemmatizer kullanılacak. İlk açılışta IndexedDB'ye yüklenecek. Hedef boyut 15 MB'ın altı. Kapsama yetersiz kalırsa ek kaynak değerlendirilecek.

**Veritabanı tabloları (Dexie):**
- `cards`: kelime id, durum, FSRS alanları (due, stability, difficulty…), egzersiz seviyesi
- `userWords`: kendi eklediğin kelimeler + bağlam cümlesi + kaynak
- `reviews`: tekrar geçmişi (FSRS optimizasyonu için)
- `texts`: indirilmiş metinler (başlık, kaynak, içerik, bölümler)
- `progress`: metin bazında kaldığın yer ve yüzde
- `settings`

**Yedek:** Tek bir JSON dosyası. Paylaş menüsünden iPhone Dosyalar'a veya iCloud'a kaydedilebilir.

## 6. Yol haritası (fazlar)

Her fazın sonunda telefonda test edilebilir bir sürüm yayınlanır.

| Faz | İçerik | Bitti sayılır… |
|---|---|---|
| **0. Kurulum** | Node.js + Git kurulumu, repo, Vite iskeleti, GitHub Pages otomatik yayın, PWA manifest | Uygulama iPhone ana ekranında açılıyor ve uçak modunda çalışıyor |
| **1. Temel** | Alt menü, temalar, ayarlar, Dexie, Export/Import | Ayarlar kalıcı, yedek alınıp geri yüklenebiliyor |
| **2. Kelime verisi** | Listelerin derlenmesi, kart içeriği üretimi, doğrulama scripti | ~5.500 kelime eksiksiz `words.json` içinde |
| **3. Kelime çalışma** | Learn/Review akışı, FSRS, 6 egzersiz türü, Words ekranı, telaffuz | Bir hafta gerçek kullanımda sorunsuz |
| **4. Okuyucu** | Metin yapıştırma, reader, okuma ayarları, ilerleme, Library | Kendi metnini offline okuyup kaldığın yerden devam edebiliyorsun |
| **5. Sözlük + ekleme** | Offline EN-TR sözlük, lemmatizer, popup, bağlamla kelime ekleme | Okurken dokun → anlam → ekle akışı offline çalışıyor |
| **6. Kaynaklar** | Cloudflare Worker, haber/makale kaynakları, kitap kataloğu, indirme yöneticisi | Kaynak seçip makale/kitap indirip metroda okuyabiliyorsun |
| **7. Cila** | Testlerden gelen düzeltmeler, performans, küçük iyileştirmeler | — |

Sıralamanın mantığı: Kelime alanı tek başına işe yarar, o yüzden önce o geliyor. Okuma alanı da yapıştırılmış metinle ayrıca kullanılabilir. Kaynaklar en sona kalıyor, çünkü dış servislere bağımlı.

## 7. Riskler ve önlemler

- **iOS'un depolamayı silmesi:** Ana ekrana eklenen PWA'larda nadir bir durum. Önlem olarak `persist()` isteği + kolay yedek alma. Ayda bir hatırlatma eklenebilir.
- **Üretilen kart içeriğinde hata:** Doğrulama scripti + her kartta "Edit" butonu, yanlışı kendin düzeltebilirsin.
- **TR sözlük kapsamı:** Faz 5'te ölçülecek. Gerekirse ek kaynak eklenir.
- **Kaynak sitelerin yapısının değişmesi:** Worker'da kaynak bazlı küçük ayarlar yapılır. Kitaplar kalıcı olduğu için etkilenmez.
- **Telif:** Uygulama kişisel kullanım içindir. Haberler yalnızca istek üzerine çekilir ve herkese açık bir yerde yeniden yayınlanmaz.

## 8. Başlamadan önce gerekenler

- [ ] Windows'a **Node.js LTS** ve **Git** kurulumu
- [ ] GitHub'da yeni repo (public olmalı, ücretsiz GitHub Pages için gerekli)
- [ ] **Cloudflare** hesabı (ücretsiz). Faz 6'ya kadar gerekmiyor.
