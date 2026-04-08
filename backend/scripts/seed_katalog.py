#!/usr/bin/env python3
"""
Seed script for Declaro katalog tables.

Idempotent — safe to run multiple times:
  - ana_kategori  : UPSERT on kod
  - admin_config  : UPSERT on config_key
  - kalem_override: INSERT IGNORE on ic_kod

Usage:
    cd /home/ziyahan/declaro/backend
    python3 scripts/seed_katalog.py
"""

import json
import os
import pathlib
import sys
from datetime import datetime, timezone

import sqlalchemy as sa
import yaml

# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

ANA_KATEGORILER = [
    # ── ZARAR OLSA DAHİ ──────────────────────────────────────────────────────
    {
        "kod": "istirak_kazanc_istisnalari",
        "soru": "İştirak kazancı istisnası var mı? (KVK 5/1-a, 5/1-b, 5/1-d)",
        "grup": "zarar_olsa_dahi",
        "etiket": "Her koşulda indirilir",
        "bilgi": """## İştirak Kazancı İstisnaları (KVK 5/1-a, b, d)

**Kapsamdaki kazançlar:**

- **Tam mükellef kurum iştirak kazancı (KVK 5/1-a):** Türkiye'de tam mükellef statüsündeki bir kurumun sermayesine katılım payından elde edilen kâr payları. En az 1 yıl elde tutulmuş olması şartı aranmaz (anonim ve limited şirketler dahil).

- **Yurt içi iştirak hissesi satış kazancı (KVK 5/1-e bağlantılı):** Tam mükellef kurumların hisse senetlerinin satışından elde edilen kazancın %75'i (en az 2 yıl elde tutulmuş olmalı).

- **Yurt dışı iştirak kazancı (KVK 5/1-b):** En az %10 paya sahip olunan ve en az 1 yıl elde tutulan yurt dışı iştirake ait kâr payları — yurt dışında en az %15 efektif vergi yükü şartı ile.

- **Yabancı fon yöneticisi (KVK 5/A-3)** ve portföy işletmeciliği kazançları (KVK 5/1-d) da bu grupta değerlendirilir.

**Dikkat:**
Yurt içi kâr paylarında tevkifat mahsubu, yurt dışı iştirak kazançlarında çifte vergilendirmeyi önleme anlaşmaları (ÇVÖA) devreye girebilir. İştirak zinciri (dolaylı iştirak) durumunda şartların her halka için ayrı ayrı değerlendirilmesi gerekir.""",
        "beyanname_kodlari": [
            297, 298, 299, 300, 306, 307, 317, 318, 319, 387,
            389, 390, 392, 393, 394, 395, 396, 397, 398, 399, 400,
        ],
        "sira": 0,
        "aktif": True,
    },
    {
        "kod": "serbest_bolge_tgb_istisnalari",
        "soru": "Serbest bölge veya Teknoloji Geliştirme Bölgesi (TGB) faaliyetin var mı?",
        "grup": "zarar_olsa_dahi",
        "etiket": "Her koşulda indirilir",
        "bilgi": """## Serbest Bölge ve TGB İstisnaları

### Serbest Bölge Kazanç İstisnası (3218 sk. Geçici Md. 3)

Serbest bölgelerde faaliyet gösteren kurumlara iki ayrı istisna uygulanır:

- **İmalat istisnası:** 06.02.2004 tarihinden önce ruhsat almış, imalat faaliyetiyle uğraşan kurumların *imalattan elde ettikleri kazançları* — ruhsat bitimine kadar vergiden istisnadır.
- **İhracat istisnası:** Yalnızca ürettikleri ürünleri Türkiye'ye ihraç eden kurumlar için ek istisna imkânı (2023 ve sonrası değişikliklerle sınırlandırılmıştır).

### Teknoloji Geliştirme Bölgesi İstisnaları (4691 sk. Geçici Md. 2)

- **Yazılım/Ar-Ge kazancı:** TGB'de faaliyet gösteren kurumların, bölgede yürütülen yazılım ve Ar-Ge projelerinden elde ettikleri kazançlar **31.12.2028 tarihine kadar** kurumlar vergisinden istisnadır.
- **TGB yönetici şirketi:** Teknopark işletmecisi şirketin bu faaliyetten elde ettiği kazançlar da ayrıca istisna kapsamındadır (KVK — TGB Yönetici Şirketi beyan satırı).

**Önemli:** İstisna, yalnızca bölge içindeki faaliyetlerden elde edilen kazançlara uygulanır; bölge dışı faaliyetler kapsam dışıdır.""",
        "beyanname_kodlari": [308, 310, 311],
        "sira": 1,
        "aktif": True,
    },
    {
        "kod": "yurtdisi_istisnalar",
        "soru": "Yurtdışı şube, daimi temsilci veya inşaat/montaj/teknik hizmet faaliyetin var mı?",
        "grup": "zarar_olsa_dahi",
        "etiket": "Her koşulda indirilir",
        "bilgi": """## Yurt Dışı Faaliyet İstisnaları (KVK 5/1-g, 5/1-h)

### Yurt Dışı Şube ve Daimi Temsilci Kazancı (KVK 5/1-g)

Tam mükellef kurumların yurt dışındaki şube ve daimi temsilcilerinden elde ettikleri kazançlar aşağıdaki şartlarla istisnadır:

- Faaliyetin bulunduğu ülkede en az **%15 efektif vergi yükü** taşıması (finans/sigorta için %20),
- Kazancın Türkiye'ye **17 Nisan akşamına kadar** transfer edilmesi,
- Kazancın beyanname verilmeden önce *fiilen* Türkiye'ye getirilmesi.

### Yurt Dışı İnşaat, Montaj ve Teknik Hizmet Kazancı (KVK 5/1-h)

Yurt dışında yapılan inşaat, onarım, montaj işleri ile teknik hizmetlerden elde edilen kazançlar **koşulsuz** olarak istisna kapsamındadır — yurt dışındaki vergi yükü veya Türkiye'ye transfer şartı aranmaz.

**Dikkat:**
- Yurt dışı zararlar Türkiye'deki vergi matrahından mahsup edilemez.
- İstisna ile mahsup edilemeyen yurt dışı vergilerin daha sonra mahsup imkânı kısıtlıdır.""",
        "beyanname_kodlari": [304, 322],
        "sira": 2,
        "aktif": True,
    },
    {
        "kod": "varlik_satis_istisnalari",
        "soru": "Taşınmaz, iştirak hissesi veya sat-kirala-geri al işlemi yaptın mı?",
        "grup": "zarar_olsa_dahi",
        "etiket": "Her koşulda indirilir",
        "bilgi": """## Varlık Satış ve Finansman İstisnaları (KVK 5/1-e, 5/1-j, 5/1-k)

### Taşınmaz ve İştirak Hissesi Satış Kazancı (KVK 5/1-e)

En az **2 yıl** aktifte tutulan taşınmaz ve iştirak hisselerinin satışından elde edilen kazancın **%50'si** istisnadır (2023 öncesi satışlarda %75 idi — değişikliğe dikkat).

İstisna şartları:
- Satış bedelinin tamamı 2 yıl içinde tahsil edilmiş olmalı,
- İstisna tutarı 5 yıl süreyle pasifte özel fon hesabında tutulmalı,
- Bu fondan başka amaçla kullanılırsa istisna iptal edilir ve vergi + gecikme zammı ile ceza uygulanır.

### Sat-Kirala-Geri Al (Financial Lease-Back) İstisnası (KVK 5/1-j)

Kurumlara ait taşınır/taşınmaz varlıkların **6361 sayılı Kanun** kapsamında finansal kiralama şirketlerine veya varlık kiralama şirketlerine satılması halinde doğan kazançlara istisna uygulanır. Geri kiralama süresi boyunca istisna korunur.

### Kira Sertifikası İhracı İstisnası (KVK 5/1-k)

Varlık kiralama şirketlerine devredilen taşınmaz/taşınır hakların ihraç amacıyla devrine ilişkin kazançlar da istisna kapsamındadır.""",
        "beyanname_kodlari": [351, 352, 353, 354, 355, 356, 357, 358, 359],
        "sira": 4,
        "aktif": True,
    },
    {
        "kod": "doviz_alacak_istisnalari",
        "soru": "Döviz/altın hesabı dönüşüm istisnası (GVK Geçici Md. 14) uyguladın mı?",
        "grup": "zarar_olsa_dahi",
        "etiket": "Her koşulda indirilir",
        "bilgi": """## Döviz/KKM Dönüşüm Kazançları İstisnası (GVK Geçici Md. 14)

**2021 yılında yürürlüğe giren bu istisna, döviz/altın hesaplarının Türk lirasına dönüştürülmesini teşvik etmek amacıyla getirilmiştir.**

### Kapsam

Kurumların döviz, dövize endeksli mevduat veya altın hesaplarını belirlenen tarihlerde Türk lirası mevduata ya da katılım hesabına dönüştürmesinden kaynaklanan:
- Değerleme farkları,
- Kur farkı kazançları,
- Vade sonu faiz/kâr payı gelirleri

**kurumlar vergisinden istisnadır.**

### Uygulama Koşulları

- Dönüşüm belirli tarihler arasında ve yetkili aracı kurumlar (bankalar/katılım bankaları) aracılığıyla yapılmış olmalıdır.
- İstisna tutarı, dönüşüm tarihindeki kur ile hesaplanan fark üzerinden hesaplanır.
- Beyannamede her alt hesap türü (TL mevduat, katılım hesabı, altın dönüşüm vb.) için ayrı satır doldurulur.

**Dikkat:** Bu istisnanın uygulama süresi defalarca uzatılmıştır; hesap vadesi/dönüşüm tarihi ve Geçici Madde 14'ün güncel halini inceleyiniz.""",
        "beyanname_kodlari": [370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385],
        "sira": 5,
        "aktif": True,
    },
    {
        "kod": "ar_ge_istisna",
        "soru": "Ar-Ge ve sınai mülkiyet hakkı istisnası var mı? (KVK 5/B — Patent Box)",
        "grup": "zarar_olsa_dahi",
        "etiket": "Her koşulda indirilir",
        "bilgi": """## Sınai Mülkiyet Hakları İstisnası — Patent Box (KVK 5/B)

**2017 yılında yürürlüğe giren KVK Madde 5/B, Türkiye'de gerçekleştirilen Ar-Ge faaliyetlerinden doğan fikri mülkiyet haklarının ticarileştirilmesini teşvik eder.**

### Kapsamdaki Haklar

Türkiye'de Ar-Ge faaliyetleri sonucunda elde edilerek Türk Patent ve Marka Kurumu (TÜRKPATENT) tarafından tescil edilen:
- Patentler,
- Faydalı modeller,
- Bütünleşik devre topografyaları,
- Bitki ıslahçı hakları,
- Coğrafi işaretler,
- Lisans gelirleri

**%50 oranında kurumlar vergisinden istisnadır.**

### Uygulama

- Hak, Türkiye'de yapılan Ar-Ge faaliyetinden doğmuş olmalıdır.
- Lisans/devir gelirleri ile bu haklara dayalı üretilen ürün satışından elde edilen kazancın hakka atfedilebilen kısmı istisna kapsamındadır.
- Türkiye'de kullanılmayan haklardan elde edilen kâr payları bu istisnadan yararlanamaz.

**Önemli:** NEXUS oranı hesaplaması gereklidir (hakkın Türkiye'deki AR-GE harcamalarıyla orantılanması).""",
        "beyanname_kodlari": [324],
        "sira": 6,
        "aktif": True,
    },
    {
        "kod": "egitim_saglik_istisnalari",
        "soru": "Eğitim, öğretim veya rehabilitasyon merkezi işletiyorsun mu? (KVK 5/1-ı)",
        "grup": "zarar_olsa_dahi",
        "etiket": "Her koşulda indirilir",
        "bilgi": """## Eğitim, Öğretim ve Rehabilitasyon Kazanç İstisnası (KVK 5/1-ı)

**Kapsam:**

Aşağıdaki kuruluşları işleten kurumların bu faaliyetlerden elde ettikleri kazançlar **5 yıl süreyle** kurumlar vergisinden istisnadır:

- Okul öncesi eğitim kurumları,
- İlkokul, ortaokul, lise (özel okullar),
- Özel yükseköğretim kurumları,
- Rehabilitasyon merkezleri.

### Uygulama Şartları

- İstisna, faaliyete geçilen hesap döneminden itibaren **5 vergilendirme dönemi** uygulanır.
- İstisna süresi dolmadan **tasfiye veya devir** halinde elde edilen kazanç vergilendirilir.
- Eğitim dışı faaliyetlerden (örn. kira geliri, finansman geliri) elde edilen kazançlar istisna dışındadır.

**Güncel not:** Bazı özel yükseköğretim kurumları için 5 yıllık süre uzatıma tabi tutulabilmektedir; güncel mevzuatı kontrol ediniz.""",
        "beyanname_kodlari": [305],
        "sira": 7,
        "aktif": True,
    },
    {
        "kod": "diger_istisnalar",
        "soru": "Diğer KVK istisnaları (5/1-f banka, 5/1-k kira sertifikası, ÇVÖA, ürün senedi, TUGS vb.) var mı?",
        "grup": "zarar_olsa_dahi",
        "etiket": "Her koşulda indirilir",
        "bilgi": """## Diğer KVK İstisna ve İndirimler

Bu kategori; diğer gruplara girmeyen çeşitli özel istisnaları kapsamaktadır:

### Banka ve Finansal Kurum Varlık Satışı (KVK 5/1-f)
Bankalara, finansal kiralama ve faktoring şirketlerine borçlu kurumların bu kurumlara devrettikleri taşınmaz ve iştirak hisselerinin satışından elde edilen kazançlara istisna.

### Yabancı Fon Yöneticisi İstisnası (KVK 5/A-3)
Türkiye'de kurulan portföy yönetim şirketleri aracılığıyla yönetilen yabancı fonların Türkiye'de elde ettiği kazançlar.

### TUGS — Türk Uluslararası Gemi Sicili (KVK — TUGS)
TUGS'a kayıtlı gemilerin işletilmesinden ve devrinden elde edilen kazançlar vergiden istisnadır.

### Ürün Senedi İstisnası (GVK Geçici Md. 76)
Lisanslı depolar tarafından düzenlenen ürün senetlerinin ticaretinden elde edilen kazançlara özel istisna.

### ÇVÖA Kapsamındaki İstisna Kazançlar (Beyanname 386)
Çifte Vergilendirmeyi Önleme Anlaşmaları uyarınca Türkiye'de vergilendirilmeyecek kazançlar.""",
        "beyanname_kodlari": [315, 321, 323, 349, 350, 386, 391],
        "sira": 8,
        "aktif": True,
    },
    # ── GEÇMİŞ YIL ZARARI ────────────────────────────────────────────────────
    {
        "kod": "gecmis_yil_zararlari",
        "soru": "Önceki 5 takvim yılına ait mahsup edilmemiş geçmiş yıl zararın var mı? (KVK Md. 9)",
        "grup": "gecmis_yil_zarari",
        "etiket": "Mali kârdan mahsup edilir",
        "bilgi": """## Geçmiş Yıl Zararı Mahsubu (KVK Madde 9)

**Kurumlar vergisi matrahının hesabında geçmiş yıl zararları aşağıdaki şartlarla mahsup edilebilir:**

### Temel Kural

- Son **5 takvim yılına** ait, her yıl ayrı ayrı beyan edilmiş zararlar mahsuba konu olabilir.
- 5 yılı aşan eski dönem zararları mahsup hakkını kaybeder.
- Her yılın zararı, o yılın kazancından önce mahsup edilir (FIFO mantığı).

### Yurt Dışı Zararlar

- Yurt dışı zararlar ancak **denetimli yabancı kurum** kapsamında değilse ve beyanname ile belgelenirse mahsup edilebilir.
- Türkiye'de istisna uygulanan yurt dışı faaliyetlerin zararları mahsup edilemez.

### Devir ve Birleşme Durumu

Devreden kurumun zararları, devralan kurum tarafından belirli şartlar altında (en az 5 yıl faaliyet, benzer faaliyet) mahsup edilebilir.

### Önemli Hatırlatma

Zarar mahsubunun **önce mi** istisna uygulamasından **sonra mı** yapılacağı, beyanname sıralamasında kritiktir. Declaro bu sıralamayı otomatik yönetir.""",
        "beyanname_kodlari": [],
        "sira": 3,
        "aktif": True,
    },
    # ── KAZANÇ VARSA ─────────────────────────────────────────────────────────
    {
        "kod": "arge_tasarim_indirimleri",
        "soru": "Ar-Ge merkezi, tasarım merkezi veya teknogirişim indirimi var mı? (5746 sk.)",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": """## Ar-Ge, Tasarım ve Teknogirişim İndirimleri (5746 Sayılı Kanun)

### Ar-Ge İndirimi (5746 sk. Md. 3)

Ar-Ge ve yenilik projesi kapsamında Ar-Ge merkezinde yapılan harcamaların **%100'ü** kurumlar vergisi matrahından indirilir. Ek olarak:
- Yetersiz kazanç nedeniyle indirilemeyen tutar **beş yıl** süreyle devreder.
- Türkiye'de ilk kez gerçekleştirilen proje faaliyetlerinde **%50 ilave indirim** imkânı (= toplamda %150).

### Tasarım İndirimi (5746 sk. Md. 3/A)

Tasarım merkezlerinde yapılan tasarım harcamalarının **%100'ü** (belirli koşullarda %150) indirilebilir.

### Teknogirişim Sermaye Desteği

TÜBİTAK, KOSGEB veya bakanlıklarca sağlanan teknogirişim sermaye desteği kurumlar vergisinden istisnadır.

### Temel Şartlar

- Ar-Ge veya tasarım merkezinin Bilim, Sanayi ve Teknoloji Bakanlığı tarafından **yetkilendirilmiş** olması gerekir.
- Projeler için ayrı maliyet muhasebesi tutulmalıdır.
- İndirim, Ar-Ge harcama belgelerine dayanılarak talep edilir.""",
        "beyanname_kodlari": [409, 410, 454, 455, 456, 457],
        "sira": 9,
        "aktif": True,
    },
    {
        "kod": "bagis_yardim_sponsorluk",
        "soru": "Bağış, yardım veya sponsorluk harcaman var mı? (KVK 10/1-b, c, ç, d, e, f)",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": """## Bağış, Yardım ve Sponsorluk İndirimleri (KVK Madde 10)

### Sınırsız İndirim Hakkı (tam indirim)

- Genel bütçeli kamu idarelerine yapılan eğitim/sağlık/kültür tesisi bağışları,
- Diyanet İşleri Başkanlığı'na ibadethane yapımı için yapılan bağışlar,
- Doğal afet dönemlerinde Cumhurbaşkanlığı kararnamesiyle belirlenen bağışlar,
- Kızılay/Yeşilay'a makbuz karşılığı ayni/nakdi yardımlar.

### Sınırlı İndirim Hakkı (matrahın %5'ine kadar)

- Kamuya yararlı dernekler, vakıflar,
- Spor kulüpleri bağış ve sponsorlukları (KVK 10/1-b),
- Eğitim, sağlık, kültür, turizm, çevre amaçlı bağışlar.

### Sponsorluk (KVK 10/1-b)

- Amatör spor dallarına yapılan harcamaların **%100'ü**,
- Profesyonel spor dallarına yapılan harcamaların **%50'si** indirim konusu yapılabilir.

**Belge şartı:** Her bağış/yardım için yetkili kurum makbuzu veya banka dekontu zorunludur.""",
        "beyanname_kodlari": [
            402, 403, 404, 417, 419, 451, 460, 461, 462, 463, 464, 465, 466,
            468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480,
            481, 482, 483, 484,
        ],
        "sira": 10,
        "aktif": True,
    },
    {
        "kod": "yatirim_tesvikleri",
        "soru": "Yatırım teşvik belgesi veya indirimli kurumlar vergisi (KVK 32/A, 32/7, 32/8) uygulaması var mı?",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": """## Yatırım Teşvik Belgesi ve İndirimli Kurumlar Vergisi

### İndirimli KV — Yatırım Teşvik Belgeli Yatırımlar (KVK 32/A)

Yatırım Teşvik Belgesi (YTB) sahibi kurumlar, belgedeki yatırım katkı tutarına ulaşana kadar indirimli kurumlar vergisi oranı uygular. İndirim oranı ve katkı tutarı, yatırımın bölgesine ve türüne göre değişir (1. bölge: %10-20, 6. bölge: %80-90 katkı).

### İmalat ve İhracat İndirimi (KVK 32/7 ve 32/8)

- **İmalat indirimi (32/7):** İmalat faaliyetinden elde edilen kazanca uygulanacak KV oranı, genel oran olan %25 yerine **%1 puan indirimli** uygulanabilir.
- **İhracat indirimi (32/8):** Mal ihracatından elde edilen kazanca ek **%1 puan indirim** uygulanır.
- Her iki indirim birlikte uygulanabilir; imalat + ihracat yapan bir kurum **%2 indirimden** yararlanabilir.

### Uygulama Notu

YTB'li yatırımlar için matrah parçalanması gereklidir: yatırımdan elde edilen kazanç ile diğer kazançlar ayrı ayrı hesaplanır. Birden fazla YTB varsa her biri için ayrı çalışma kâğıdı düzenlenir.""",
        "beyanname_kodlari": [500, 501, 502, 503],
        "sira": 11,
        "aktif": True,
    },
    {
        "kod": "hizmet_indirimleri",
        "soru": "Risturn veya korumalı işyeri indirimi var mı? (KVK 5/1-i, 10/1-h)",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": """## Risturn ve Korumalı İşyeri İndirimi

### Risturnlar (KVK 5/1-i)

Kooperatif ortaklarına, muamele hacmi oranında dağıtılan risturnlar kurumlar vergisinden **istisnadır**. Risturnun nakit yerine sermaye payı olarak verilmesi halinde de aynı istisna geçerlidir.

- **Kapsam:** Üretim, kredi, satış kooperatifleri ile bunların üst kuruluşları
- **Oran:** Muamele hacmi oranında dağıtılan kısım tamamen istisna
- **Beyanname satır:** 401

### Korumalı İşyeri İndirimi (KVK 10/1-h)

5378 sayılı Engelliler Hakkında Kanun kapsamında kurulan **korumalı işyeri** statüsünde faaliyet gösteren kurumların, engelli çalışanlara ilişkin giderlerinin bir kısmı ek indirim olarak talep edilebilir.

- **Kapsam:** Çalışan başına asgari ücretin yıllık brüt tutarı kadar ilave indirim
- **Şart:** Korumalı işyeri statüsü belgesi (Çalışma ve Sosyal Güvenlik Bakanlığı)
- **Beyanname satır:** 452""",
        "beyanname_kodlari": [401, 452],
        "sira": 12,
        "aktif": True,
    },
    {
        "kod": "saglik_egitim_hizmet_indirimi",
        "soru": "Çalışanlara sağlık veya eğitim hizmeti indirimi var mı? (KVK 10/1-g)",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": """## Sağlık ve Eğitim Hizmeti İndirimi (KVK Madde 10/1-g)

Kurumların **kendi bünyesinde** çalışanlarına sunduğu sağlık ve eğitim hizmetlerine ilişkin harcamalar, belirli limitler dahilinde matrahtan indirilir.

### Kapsam

- **Yurt içi/yurt dışı sağlık hizmetleri:** Çalışanlara sağlanan sağlık hizmet giderleri (muayene, tedavi, hastane vb.)
- **Eğitim hizmetleri:** Çalışanlara yönelik mesleki eğitim, kurs, seminer giderleri
- **Diğer hizmet indirimleri:** İşçi başına öngörülen limiti aşmayan diğer hizmet giderleri

### Limit

Her bir çalışan başına asgari ücretin aylık brüt tutarı ile sınırlıdır. Bu limiti aşan kısım indirim konusu yapılamaz.

### Beyanname

Sağlık hizmeti → satır **414**, Eğitim hizmeti → satır **415**, Diğer → satır **416**""",
        "beyanname_kodlari": [414, 415, 416],
        "sira": 13,
        "aktif": True,
    },
    # ── ÖNCEDEN OBSOLETE YAPILAN, GERİ AKTİF EDİLEN KATEGORİLER ────────────
    {
        "kod": "portfoy_isletmeciligi",
        "soru": "Portföy işletmeciliği kazancı var mı? (KVK 5/1-d)",
        "grup": "zarar_olsa_dahi",
        "etiket": "Her koşulda indirilir",
        "bilgi": "",
        "beyanname_kodlari": [],
        "sira": 1,
        "aktif": True,
    },
    {
        "kod": "arge_indirimleri",
        "soru": "Ar-Ge veya tasarım indirimi var mı?",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": "",
        "beyanname_kodlari": [],
        "sira": 6,
        "aktif": True,
    },
    {
        "kod": "bagis_yardim_indirimleri",
        "soru": "Bağış ve yardım indirimleri (KVK 10/1-c, ç, d, e, f) var mı?",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": "",
        "beyanname_kodlari": [],
        "sira": 7,
        "aktif": True,
    },
    {
        "kod": "yatirim_indirimi",
        "soru": "Yatırım indirimi (GVK geçici Md. 61) var mı?",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": "",
        "beyanname_kodlari": [],
        "sira": 8,
        "aktif": True,
    },
    {
        "kod": "sponsorluk_indirimi",
        "soru": "Sponsorluk harcaması var mı? (KVK 10/1-b)",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": "",
        "beyanname_kodlari": [],
        "sira": 10,
        "aktif": True,
    },
    {
        "kod": "nakdi_sermaye_indirimi",
        "soru": "Nakdi sermaye artırımından kaynaklanan faiz indirimi var mı? (KVK 10/1-ı)",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": "",
        "beyanname_kodlari": [],
        "sira": 11,
        "aktif": True,
    },
    {
        "kod": "risturn_ve_saglik_indirimleri",
        "soru": "Risturn, sağlık/eğitim hizmeti veya korumalı işyeri indirimi var mı?",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": "",
        "beyanname_kodlari": [],
        "sira": 12,
        "aktif": True,
    },
    {
        "kod": "diger_indirimler",
        "soru": "Diğer KVK indirimleri (İFM, girişim sermayesi fonu, kooperatif risturn vb.) var mı?",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": "",
        "beyanname_kodlari": [],
        "sira": 13,
        "aktif": True,
    },
    {
        "kod": "diger_indirimler_alt",
        "soru": "Türk Petrol Kanunu Md.12/5 itfa payı veya diğer özel sektörel KVK indirimi var mı?",
        "grup": "kazanc_varsa",
        "etiket": "Kazanç varsa indirilecek",
        "bilgi": "",
        "beyanname_kodlari": [450],
        "sira": 14,
        "aktif": True,
    },
    # ── İLAVELER ─────────────────────────────────────────────────────────────
    {
        "kod": "kkeg",
        "soru": "Kanunen kabul edilmeyen gider (KKEG) veya önceki yıl ayrılan finansman fonu var mı?",
        "grup": "ilave",
        "etiket": "Matrah artırıcı",
        "bilgi": """## Kanunen Kabul Edilmeyen Giderler (KKEG)

**Kanunen Kabul Edilmeyen Giderler (KKEG):** KVK Md.11 ve GVK Md.40 kapsamında gider sayılmayan harcamalar ticari kâra **eklenerek** kurumlar vergisi matrahı tespit edilir.

**Sık karşılaşılan KKEG kalemleri:**
- Özel ve aile giderleri ile her türlü para cezaları (KVK Md.11/1-d)
- Finansman gider kısıtlaması kapsamına giren gider tutarları (KVK Md.11/1-i)
- Belgesiz/belgesi yetersiz giderler
- Bağış ve yardımların gider yazılan kısımları
- Hesaplanan kurumlar vergisi ve cezaları

**Önceki Yıl Ayrılan Finansman Fonu:** Geçmiş dönemlerde GVK Md.41/9 kapsamında ayrılan finansman fonunun amacı dışında kullanılması veya süre dolumu nedeniyle çözülmesi halinde bu tutar da matrahı artırır (beyanname satır 202).""",
        "beyanname_kodlari": [100],
        "sira": -2,
        "aktif": True,
    },
    {
        "kod": "enflasyon_duzeltmesi",
        "soru": "İşletmeden çekilen enflasyon düzeltmesi farkı var mı? (VUK Mük.298/A)",
        "grup": "ilave",
        "etiket": "Matrah artırıcı",
        "bilgi": """## İşletmeden Çekilen Enflasyon Düzeltmesi Farkları (VUK Mük.Md.298/A)

Enflasyon düzeltmesi kapsamında özsermaye hesaplarında (502, 542, 549, 570 vb.) biriken olumlu farkların işletmeden çekilmesi kurumlar vergisi açısından çekim şekline göre değerlendirilir:

- **Sermayeye ekleme:** Nakit kâr dağıtımı sayılmaz → Beyanname matrahını **artırmaz** (VUK Mük.298/A f.6). Genel Kurul Kararı + Ticaret Sicili tescili zorunludur.
- **Nakit dağıtım:** Kurumlar vergisi matrahına **eklenir** (ilave). Gerçek kişi ortağa dağıtımda ayrıca %10 GV stopajı (GVK Md.94/6-b-i) uygulanır.
- **Tam mükellef kuruma dağıtım:** Matrah ilavesi + alıcıda iştirak kazancı istisnası (KVK 5/1-a) değerlendirmesi — YMM teyidi gerekir.

**Önemli:** Bu kalem istisna/indirim değil, matrah **artırıcı** bir kalemdir. Pipeline'da ilaveler adımında işlenir.""",
        "beyanname_kodlari": [450],
        "sira": -1,
        "aktif": True,
    },
    # ── HESAPLANAN KV İNDİRİMLERİ ────────────────────────────────────────────
    {
        "kod": "vergi_indirimleri",
        "soru": "Vergiye uyumlu mükellef vergi indirimi var mı? (GVK Mük.121 — %5)",
        "grup": "hesaplanan_kv_indirimi",
        "etiket": "Hesaplanan KV'den indirilir",
        "bilgi": """## Hesaplanan Vergi İndirimi (GVK Mük.Md.121 — %5)

Vergiye uyumlu mükelleflere hesaplanan kurumlar vergisinin **%5'i** kadar indirim sağlanır.

**Kapsam dışı:** Finans, bankacılık, sigorta, reasürans, emeklilik şirketleri ve emeklilik yatırım fonları.

**Hesaplama:** MIN(Hesaplanan KV × %5, Üst Sınır)
- 2025 üst sınırı: 9.900.000 TL
- 2026 beklenen üst sınırı: ~12.400.000 TL

**5 Şart (tamamı zorunlu):**
1. Son 3 yıl beyannameler kanuni süresinde verilmiş olmalı
2. Beyanname tarihinde 1.000 TL+ vadesi geçmiş vergi borcu yok olmalı
3. Son 3 yılda kesinleşmiş tarhiyat toplamı üst sınırın %1'ini (~124.000 TL) aşmamalı
4. Son 5 yılda VUK Md.359 kapsamı kaçakçılık fiili bulunmamalı
5. Finans/bankacılık/sigorta/emeklilik sektöründe faaliyet gösterilmemeli

**Önemli:** Bu indirim KV matrahından değil, **hesaplanan KV'den** düşülür. Beyannamede ayrı satırda gösterilir.""",
        "beyanname_kodlari": [121],
        "sira": 99,
        "aktif": True,
    },
]

# Eski yanlış/gereksiz kategori kodları — devre dışı bırakılacak
OBSOLETE_KATEGORILER = [
    # Aşağıdakiler yeni konsolide kategorilerle kapsandığı için devre dışı:
    "arge_indirimleri",           # → arge_tasarim_indirimleri
    "bagis_yardim_indirimleri",   # → bagis_yardim_sponsorluk
    "sponsorluk_indirimi",        # → bagis_yardim_sponsorluk
    "yatirim_indirimi",           # → yatirim_tesvikleri
    "nakdi_sermaye_indirimi",     # → yatirim_tesvikleri
    "risturn_ve_saglik_indirimleri",  # → hizmet_indirimleri
]

# Kalem override'larında force-deaktif edilecek ic_kodlar (seed her çalıştığında)
OBSOLETE_KALEMLER = [
    "portfoy_isletmeciligi_5_1_d",  # → 389-401 arası spesifik alt-kalemler ile kapsandı; XML'de 302 kodu yok
]

WIZARD_STEPS = [
    {"key": "donem-acilis", "label": "Dönem Açılışı", "order": 0, "aktif": True},
    {"key": "ana-kategori", "label": "Ana Kategori Tarama", "order": 1, "aktif": True},
    {"key": "alt-kategori", "label": "Alt Kalem Seçimi", "order": 2, "aktif": True},
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
KALEMLER_DIR = BACKEND_DIR.parent / "kalemler"
ENV_PATH = BACKEND_DIR / ".env"


def load_env(path: pathlib.Path) -> None:
    """Parse a simple KEY=VALUE .env file and set os.environ (no-overwrite)."""
    if not path.exists():
        print(f"[warn] .env not found at {path}, relying on existing env vars.")
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def make_sync_url(url: str) -> str:
    """
    Convert an async driver URL to its sync equivalent so SQLAlchemy
    can be used without asyncio in this script.

    Examples:
      sqlite+aiosqlite:///./foo.db  ->  sqlite:///./foo.db
      postgresql+asyncpg://...      ->  postgresql+psycopg2://...
      postgresql://...              ->  unchanged
    """
    replacements = {
        "sqlite+aiosqlite": "sqlite",
        "postgresql+asyncpg": "postgresql+psycopg2",
        "postgres+asyncpg": "postgresql+psycopg2",
    }
    for async_prefix, sync_prefix in replacements.items():
        if url.startswith(async_prefix):
            return sync_prefix + url[len(async_prefix):]
    return url


def resolve_sqlite_path(url: str, base_dir: pathlib.Path) -> str:
    """
    SQLite relative paths (sqlite:///./foo.db) are resolved relative to
    base_dir so the script works from any cwd.
    """
    if not url.startswith("sqlite"):
        return url
    # Extract the file path portion after sqlite:///
    prefix = "sqlite:///"
    if not url.startswith(prefix):
        return url
    rel = url[len(prefix):]
    # Absolute path — leave as-is
    if rel.startswith("/"):
        return url
    # Relative path — resolve against backend dir
    abs_path = (base_dir / rel).resolve()
    return f"sqlite:///{abs_path}"


def now_utc():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------

def seed_ana_kategoriler(conn, meta):
    table = meta.tables["ana_kategori"]
    inserted = updated = 0
    for row in ANA_KATEGORILER:
        # Check if row with this kod exists
        existing = conn.execute(
            sa.select(table.c.id).where(table.c.kod == row["kod"])
        ).fetchone()

        if existing is None:
            conn.execute(
                table.insert().values(
                    kod=row["kod"],
                    soru=row["soru"],
                    grup=row["grup"],
                    etiket=row["etiket"],
                    bilgi=row.get("bilgi"),
                    beyanname_kodlari=row["beyanname_kodlari"],
                    sira=row["sira"],
                    aktif=row["aktif"],
                    created_at=now_utc(),
                    updated_at=now_utc(),
                )
            )
            inserted += 1
        else:
            conn.execute(
                table.update()
                .where(table.c.kod == row["kod"])
                .values(
                    soru=row["soru"],
                    grup=row["grup"],
                    etiket=row["etiket"],
                    bilgi=row.get("bilgi"),
                    beyanname_kodlari=row["beyanname_kodlari"],
                    sira=row["sira"],
                    aktif=row["aktif"],
                    updated_at=now_utc(),
                )
            )
            updated += 1

    # Eski yanlış kodları devre dışı bırak
    deactivated = 0
    for kod in OBSOLETE_KATEGORILER:
        result = conn.execute(
            table.update()
            .where(table.c.kod == kod)
            .values(aktif=False, updated_at=now_utc())
        )
        deactivated += result.rowcount

    print(f"  ana_kategori  : {inserted} inserted, {updated} updated, {deactivated} deactivated")


def seed_admin_config(conn, meta):
    table = meta.tables["admin_config"]
    config_key = "wizard_steps"

    existing = conn.execute(
        sa.select(table.c.id).where(table.c.config_key == config_key)
    ).fetchone()

    if existing is None:
        conn.execute(
            table.insert().values(
                config_key=config_key,
                config_value=WIZARD_STEPS,
                updated_at=now_utc(),
                updated_by=None,
            )
        )
        print(f"  admin_config  : inserted '{config_key}'")
    else:
        conn.execute(
            table.update()
            .where(table.c.config_key == config_key)
            .values(
                config_value=WIZARD_STEPS,
                updated_at=now_utc(),
            )
        )
        print(f"  admin_config  : updated '{config_key}'")


def seed_kalem_override(conn, meta):
    table = meta.tables["kalem_override"]
    inserted = skipped = 0

    yaml_files = sorted(KALEMLER_DIR.glob("*.yaml"))
    if not yaml_files:
        print(f"  kalem_override: no YAML files found in {KALEMLER_DIR}")
        return

    for path in yaml_files:
        try:
            with open(path) as f:
                data = yaml.safe_load(f)
            ic_kod = data.get("ic_kod") if data else None
        except Exception as exc:
            print(f"  [warn] could not read {path.name}: {exc}")
            continue

        if not ic_kod:
            print(f"  [warn] no ic_kod in {path.name}, skipping")
            continue

        existing = conn.execute(
            sa.select(table.c.id).where(table.c.ic_kod == ic_kod)
        ).fetchone()

        if existing is None:
            conn.execute(
                table.insert().values(
                    ic_kod=ic_kod,
                    aktif=True,
                    sira=None,
                    updated_at=now_utc(),
                    updated_by=None,
                )
            )
            inserted += 1
        else:
            skipped += 1

    # Force-deaktif: OBSOLETE_KALEMLER listesindeki kalemler aktif=False yapılır
    deactivated = 0
    for ic_kod in OBSOLETE_KALEMLER:
        result = conn.execute(
            table.update()
            .where(table.c.ic_kod == ic_kod)
            .values(aktif=False, updated_at=now_utc())
        )
        deactivated += result.rowcount

    print(
        f"  kalem_override: {inserted} inserted, {skipped} already existed (skipped), {deactivated} deactivated"
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    load_env(ENV_PATH)

    raw_url = os.environ.get("DATABASE_URL")
    if not raw_url:
        print("[error] DATABASE_URL is not set.", file=sys.stderr)
        sys.exit(1)

    sync_url = make_sync_url(raw_url)
    sync_url = resolve_sqlite_path(sync_url, BACKEND_DIR)

    print(f"Connecting to: {sync_url}")

    engine = sa.create_engine(sync_url)
    meta = sa.MetaData()
    meta.reflect(bind=engine)

    required_tables = {"ana_kategori", "kalem_override", "admin_config"}
    missing = required_tables - set(meta.tables.keys())
    if missing:
        print(
            f"[error] Missing tables: {missing}\n"
            "  Run migrations first: alembic upgrade head",
            file=sys.stderr,
        )
        sys.exit(1)

    print("Seeding...")
    with engine.begin() as conn:
        seed_ana_kategoriler(conn, meta)
        seed_admin_config(conn, meta)
        seed_kalem_override(conn, meta)

    print("Done.")


if __name__ == "__main__":
    main()
