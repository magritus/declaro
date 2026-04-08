import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardStore } from '@/store/wizardStore'
import { useKatalogKalemler } from '@/api/kalem'
import { renderMarkdown } from '@/lib/renderMarkdown'

interface KategoriInfo {
  id: string
  soru: string
  grup: 'zarar_olsa_dahi' | 'kazanc_varsa'
  etiket: string
  bilgi: string
}

const ANA_KATEGORILER: KategoriInfo[] = [
  {
    id: 'istirak_kazanc_istisnalari',
    soru: 'İştirak kazancı istisnası (KVK 5/1-a, 5/1-b, 5/1-d)?',
    grup: 'zarar_olsa_dahi',
    etiket: 'Her koşulda indirilir',
    bilgi: `## Genel Çerçeve
KVK Madde 5/1-a, 5/1-b ve 5/1-d kapsamındaki iştirak kazancı istisnaları, kurumların diğer kurumlardan elde ettiği **kâr payları** ile bu hisselerden sağlanan **değer artış kazançlarını** kapsayan temel vergi avantajlarından biridir. Zarar edilse dahi beyannamede gösterilir ve matrahtan düşülür.

## Kapsam

### KVK 5/1-a — Tam Mükellef İştiraklerden Kâr Payı
- Tam mükellef kurumlardan elde edilen **kâr paylarının tamamı** istisnadır.
- Kâr payının dağıtıcı kurum bünyesinde vergiye tabi tutulmuş olması koşulu aranır.
- Nakden veya hesaben alınan kâr payları ile tasfiye payları kapsama girer.

### KVK 5/1-b — Yabancı İştirak Kazançları
- Yurtdışı bağlı ortaklıktan elde edilen kâr payları, **en az %10 iştirak payı** ve **en az 1 yıl elde tutma** koşuluna tabidir.
- Yabancı kurumun bulunduğu ülkede **en az %15 oranında kurumlar vergisine benzer vergi** ödemesi zorunludur.

### KVK 5/1-d — Yatırım Fonu ve Ortaklık Kazançları
- GSYF, GSYO, menkul kıymet ve gayrimenkul yatırım fonu/ortaklığı kazançları istisna kapsamındadır.
- Portföy işletmeciliğinden doğan kazançlar ayrıca değerlendirilir (Bkz. Beyanname 302).

## Önemli Sınırlamalar ve Riskler
- **Belge zorunluluğu:** Yabancı iştirakten gelen kâr payı için kâr dağıtım kararı, banka dekontu ve yabancı ülke vergi belgesi saklanmalıdır.
- **1 yıl elde tutma:** 5/1-b için iştirak hissesinin elden çıkarılmadan en az 1 yıl elde tutulması şarttır.
- **Kısmi bölünme riski:** İştirakin kısmi bölünme yoluyla edinilmişse özel şartlar aranmaktadır.
- **Yurt içi iştirak:** Tam mükellef kurumdan alınan kâr payında **kurum bünyesinde vergi ödenmemiş** kısımlar istisna dışındadır.

## YİAKV İlişkisi
İştirak kazancı istisnaları **YİAKV matrahından düşülür** — zarar varsa dahi beyannamede gösterilip matrahtan indirilir, ancak bunlar zaten kurumun vergilendirilmemiş kazançları olduğundan YİAKV matrahına girmeleri söz konusu değildir.

## Pratik Notlar
- **Konsolide** tablolarda grup içi kâr eliminasyonuna dikkat edin; gerçek dışı temettüler istisna dışıdır.
- Kâr payı stopajı (**%15 GVK 94/6-b**) bu istisnadan bağımsız olup kurumlar vergisinden mahsup veya iade edilemez.
- **Yıl sonu muhasebe kaydı:** İstisna kazanç 570/679 hesaplarında değil, 602 hesabında gösterilmeli, beyanname dipnotunda açıklanmalıdır.`,
  },
  {
    id: 'serbest_bolge_tgb_istisnalari',
    soru: 'Serbest bölge veya TGB (Teknoloji Geliştirme Bölgesi) faaliyetin var mı?',
    grup: 'zarar_olsa_dahi',
    etiket: 'Her koşulda indirilir',
    bilgi: `## Genel Çerçeve
**3218 Sayılı Kanun** kapsamındaki Serbest Bölge istisnası ve **4691 Sayılı Kanun** kapsamındaki Teknoloji Geliştirme Bölgesi (TGB) kazanç istisnası, zarar edilse dahi beyannamede indirim konusu yapılabilen istisnalardır.

## Serbest Bölge İstisnası (3218 s.K.)

### Rejim 1 — 06.02.2004 Öncesi Ruhsat
- Ruhsat süresi boyunca **tüm faaliyetlerden** elde edilen kazançlar vergiden istisnadır.
- İmalat zorunluluğu bulunmamaktadır.

### Rejim 2 — 06.02.2004 Sonrası Ruhsat
- **01.01.2025 öncesi:** Yalnızca **imalat faaliyetinden** elde edilen kazançlar istisnadır.
- **01.01.2025 ve sonrası (7524 s.K.):** Ek koşul — satışların **münhasıran yurt dışına** yapılmış olması gerekir.
- Ticaret, alım-satım ve hizmet faaliyetleri artık kapsam dışıdır.

## TGB İstisnası (4691 s.K.)
- Bölgede yürütülen **yazılım, Ar-Ge ve tasarım** faaliyetlerinden elde edilen kazançlar vergiden istisnadır.
- **Yönetici şirket** kazançları da ayrıca istisna kapsamındadır (KVK 5/1-d, Bkz. 311 satırı).
- İstisna süresi: 2028 yılına kadar (kanunla uzatılmaktadır).

## Önemli Sınırlamalar ve Riskler
- **Serbest bölge ruhsatı:** Geçerlilik süresi dolmuş ya da iptal edilmiş ruhsatla istisna uygulanamaz.
- **Münhasıran yurt dışı:** 01.01.2025 sonrasında yurt içi satış veya SB içi firma satışı kapsam dışına çıkmaktadır.
- **Muhasebe ayrımı:** SB ve TGB faaliyetlerinin Türkiye faaliyetlerinden muhasebe bazında ayrı izlenmesi zorunludur (mukteza riski).
- **YMM tasdiki:** Hem SB hem TGB için YMM tam tasdik raporu zorunludur.

## YİAKV İlişkisi
Serbest Bölge istisnası **YİAKV matrahından DÜŞÜLÜR** (beyanname satır 308, zarar_olsa_dahi grubu). TGB yöneticisi istisnası da düşülür. **Ancak 4691 TGB araştırmacı/işçi ücret istisnası** ayrıdır ve YİAKV matrahından düşülemez.

## Pratik Notlar
- Rejim 2 firmalar için **ihracat belgesi** (gümrük beyannamesi, döviz alım belgesi) kritik kanıttır.
- SB'deki taşınmaz satışları için 5/1-e istisnası **ayrıca** değerlendirilmelidir.
- TGB firmaları için yazılım lisansı gelirlerinin **hangi bölgede üretildiği** sorusu vergi incelemelerinde sık sorulmaktadır.`,
  },
  {
    id: 'yurtdisi_istisnalar',
    soru: 'Yurtdışı şube, daimi temsilci veya inşaat/montaj faaliyetin var mı?',
    grup: 'zarar_olsa_dahi',
    etiket: 'Her koşulda indirilir',
    bilgi: `## Genel Çerçeve
KVK Madde **5/1-g** ve **5/1-h** kapsamında yurtdışındaki şube, daimi temsilci ve inşaat/montaj faaliyetlerinden elde edilen kazançlar kurumlar vergisinden istisnadır. Bu istisna zarar edilse dahi beyannamede düşülür.

## KVK 5/1-g — Yurtdışı Şube ve Daimi Temsilci
- Yabancı ülkede şube veya daimi temsilci yoluyla elde edilen kazançlar istisna kapsamındadır.
- Koşul: Bulunulan ülkede **en az %15 oranında kurumlar vergisine benzer vergi** ödemesi.
- Türkiye'ye **fiilen transfer** edilmesi veya transfer edilebilir hâlde olması gerekir.

## KVK 5/1-h — Yurtdışı İnşaat, Onarım, Montaj ve Teknik Hizmet
- Yurt dışında yapılan inşaat, onarım, montaj işleri ile teknik hizmetlerden elde edilen kazançlar istisnadır.
- Bu kazançlar için **yurt dışında vergi ödenmesi koşulu aranmaz** — 5/1-g'den bu yönüyle ayrışır.
- Yüklenici ve alt yüklenici ilişkileri dahilindeki kazançlar da kapsama girer.

## Önemli Sınırlamalar ve Riskler
- **İspat yükü:** Yabancı ülkede ödenen verginin belgelenmesi (vergi makbuzu veya apostilli vergi beyannamesi) zorunludur.
- **Kur farkı:** Şube kazancının Türkiye'ye transferinde oluşan kur farkı geliri istisna dışında kalmaktadır.
- **Zarar mahsubu:** Yurtdışı şube zararları Türkiye matrahından mahsup edilemez (istisnanın ters yüzü).
- **Bağlı ortaklık vs. şube:** İşlemi yürüten birimin şube mi yoksa bağımsız şirket (5/1-b) mi olduğunun ayrımı kritiktir.

## YİAKV İlişkisi
Yurtdışı faaliyet istisnaları **YİAKV matrahından düşülür** — beyannamede zarar_olsa_dahi grubunda gösterilir.

## Pratik Notlar
- Yurt dışı şube defteri **Türkçe veya Türkçe özet** hâlinde tutulmalı ve beyana eklenebilir hâlde saklanmalıdır.
- Çifte vergilendirmeyi önleme anlaşması (ÇVÖA) olan ülkelerde **anlaşma hükümleri** KVK hükümlerine göre öncelikli uygulanır.
- Transfer fiyatlandırması: Merkez ile şube arasındaki hizmet ve maliyet paylaşımında emsallere uygunluk ilkesi aranır.`,
  },
  {
    id: 'doviz_alacak_istisnalari',
    soru: "KKM veya altın hesabı TL'ye dönüştürdün mü? (Geçici Md.14)",
    grup: 'kazanc_varsa',
    etiket: 'Kazanç varsa indirilecek',
    bilgi: `## Genel Çerçeve
KVK **Geçici Madde 14**, 7352 Sayılı Kanun'la yürürlüğe girmiştir (24/12/2021). Yabancı para veya altın cinsinden varlıkların **Türk Lirasına dönüştürülmesi** sürecinde doğan değerleme kazançları ve ardından elde edilen faiz/kâr payları kurumlar vergisinden istisna tutulmaktadır.

## Beyanname Satırları (370–385)

### Md.14/1 — Döviz KKM Dönüşümü (370–374)
- **370:** 31/12/2021 bilançosundaki yabancı parayı KKM'ye çevirirken oluşan kur farkı kazancı
- **371:** KKM hesabı tutulduğu sürede bankadan alınan kur farkı koruma/tazminat ödemeleri
- **372:** KKM hesabı dönem sonunda değerlemeden doğan faiz/kâr payı
- **373:** KKM vadesinde tahsil edilen faiz/kâr payı
- **374:** KKM'de dönem sonu değerleme ve vade sonunda elde edilen diğer kazançlar

### Md.14/2 — Döviz Borçlanma (375–378)
- Döviz cinsinden borçlanma yoluyla elde edilen fonların TL'ye çevrilmesindeki kur farkı ve faiz istisnaları

### Md.14/3 — Altın Hesabı Dönüşümü (379–382)
- Altın hesabının TL'ye dönüştürülmesinden doğan fark ve dönemsel faiz/kâr payları

### Md.14/4 — Katılım Fonu (383–385)
- Katılım bankalarındaki döviz/altın hesaplarının TL'ye dönüşümünden doğan istisna kazançlar

## Önemli Uyarılar
- **YİAKV matrahından DÜŞÜLEMEZ** — Tüm Geçici Md.14 satırları beyanname E.7 bölümünde (düşülemezler) gösterilir.
- Her satır **bağımsız hesaplanır** ve ayrı koşulları vardır; topluca değil satır satır değerlendirilmeli.
- 2024 yılı için geçerli satırlar hangi hesap türüne sahip olduğunuza göre belirlenir.

## Pratik Notlar
- KKM hesabınız yoksa tüm 37x satırları atlanmalıdır.
- Altın hesabınız var ama dönüşüm yapmadıysanız 379-382 satırları ilgisizdir.
- Banka ekstreleri ve KKM sözleşme belgelerini saklayın — vergi incelemesinde ilk istenen belgelerdir.`,
  },
  {
    id: 'varlik_satis_istisnalari',
    soru: 'Taşınmaz, iştirak hissesi veya sat-kirala-geri al işlemi yaptın mı?',
    grup: 'kazanc_varsa',
    etiket: 'Kazanç varsa indirilecek',
    bilgi: `## Genel Çerçeve
KVK **5/1-e**, **5/1-j** ve **5/1-k** kapsamında taşınmaz/iştirak hissesi satışları ile finansal kiralama yapılarından elde edilen kazançların belirli koşullarda kurumlar vergisinden istisna tutulmasını sağlar.

## KVK 5/1-e — Taşınmaz ve İştirak Hissesi Satışı

### Taşınmaz Satışı (Beyanname 351)
- Kurumun **en az 2 tam yıl** aktifinde tuttuğu taşınmazların satışından doğan kazancın istisnası.
- **Oran:** Aktife giriş tarihine göre %75 (2012 öncesi), %50 veya %25 (7456 s.K. geçiş).
- **Kritik:** 15/07/2023 ve sonrası aktife giren taşınmazlar için **istisna tamamen kaldırılmıştır**.
- İstisna tutarı 549 Özel Fonlar hesabına alınmalı, 5 yıl boyunca sermayeye eklenmeden tutulmalıdır.

### İştirak Hissesi Satışı (Beyanname 352)
- **En az 2 yıl** elde tutulan iştirak hisselerinin satış kazancının **%75'i** istisna.
- Hisse senetlerinin nama yazılı ya da hamiline yazılı olması ayrımı önemlidir.
- CB kararıyla **%50'ye indirilmiş** olan oran hâlen geçerlidir (01/03/2023 sonrası).

## KVK 5/1-j — Sat-Kirala-Geri Al (354–356)
- Finansal kiralama yoluyla yaptırılan ve geri alınan varlıklardaki kazançlar istisna kapsamındadır.
- Taşınır (354), taşınmaz (355) ve diğer varlıklar (356) için ayrı satırlar mevcuttur.

## KVK 5/1-k — Kira Sertifikası İhracı (357–359)
- Varlık kiralama şirketi aracılığıyla çıkarılan kira sertifikalarının ihracından doğan kazançlar istisnadır.

## Önemli Riskler
- **549 hesabı zorunluluğu:** İstisna kazancının özel fona alınmaması istisnayı iptal eder.
- **5 yıl bekleme:** Fon tutarının 5 yıl içinde başka amaçla kullanılması (sermaye artışı hariç) tarhiyat doğurur.
- **Taşınmaz ticareti yapanlar:** Ana faaliyeti taşınmaz ticareti veya kiralanması olan kurumlar 5/1-e'den yararlanamaz.

## YİAKV İlişkisi
Bu istisnaların tamamı **YİAKV matrahından düşülemez** (E.7 listesi) — dolayısıyla KKEG niteliğindedir ve YİAKV matrahında kalır.

## Pratik Notlar
- Tapu tescil tarihinin aktife alış tarihiyle çakışıp çakışmadığını kontrol edin.
- Bölünme, birleşme veya ayni sermaye yoluyla edinilen varlıklarda 2 yıl süreci başlangıcı tartışmalıdır.`,
  },
  {
    id: 'ar_ge_istisna',
    soru: 'Patent veya faydalı model belgeli buluşundan kazanç elde ettin mi?',
    grup: 'kazanc_varsa',
    etiket: 'Kazanç varsa indirilecek',
    bilgi: `## Genel Çerçeve
KVK **Madde 5/B** — "Patent Box" istisnası olarak da bilinen bu düzenleme, Türkiye'de yürütülen Ar-Ge faaliyetleri sonucu elde edilen **patent veya faydalı model belgeli** buluşlardan doğan kazancın **%50'sini** kurumlar vergisinden istisna tutar.

## Temel Koşullar
- **Türkiye'de Ar-Ge:** Buluşun Türkiye'deki Ar-Ge/tasarım faaliyeti sonucu ortaya çıkması gerekir.
- **Patent veya Faydalı Model Belgesi:** TÜRKPATENT'ten (veya tanınan yabancı ofisten) tescilli belge zorunludur. Tescilsiz buluş, marka veya tasarım kapsam dışıdır.
- **İstisna oranı %50'dir:** %100 değil — sık yapılan bir hata.
- **NEXUS oranı:** İstisna şu formülle ağırlıklandırılır: NEXUS = min((NARGe × 1.3) / TARGe, 1) × %50

## NEXUS Formülü
- **NARGe:** Türkiye'de yapılan + ilişkili kuruluş dışı taraflara ödenen Ar-Ge harcamaları
- **TARGe:** Tüm Ar-Ge harcamaları (ilişkili taraflara ödenenler + satın alınan buluş bedeli dahil)
- Yüksek NARGe/TARGe oranı → daha yüksek istisna; tamamen dışarıdan satın alınan buluşlarda oran sıfıra yaklaşır.

## Kazanç Türleri
- Buluş sahibi olarak **lisans geliri**
- Buluş kullanılarak üretilen ürünün **satış geliri**
- Buluşun **satışından** doğan kazanç
- Buluş sahibine ödenen **tazminat ve benzeri ödemeler**

## Önemli Riskler
- **NEXUS hesabı hatalı:** TARGe'de satın alınan buluş bedeli unutulursa oran abartılır → vergi ziyaı.
- **Belge eksikliği:** Patent belgesi ibraz edilemezse istisna reddedilir.
- **Lisans geliri vs. satış geliri:** İkisi ayrı hesaplanır; karıştırmak hatalı NEXUS oranına yol açar.

## YİAKV İlişkisi
5/B istisnası **YİAKV matrahından düşülemez** — "kazanç varsa indirilecek" grubunda olmasına rağmen bu sonuç ayrıca tartışmalıdır; ihtiyatla yaklaşılması önerilir.

## Pratik Notlar
- Patent tescil tarihi ile Ar-Ge gider başlangıç tarihinin uyumlu olması önemlidir.
- Birden fazla buluş varsa her biri için ayrı NEXUS hesabı yapılmalıdır.
- YMM tam tasdik raporunda NEXUS hesabı ayrıntılı açıklanmalıdır.`,
  },
  {
    id: 'egitim_saglik_istisnalari',
    soru: 'Özel okul, kreş veya rehabilitasyon merkezi işletiyor musun?',
    grup: 'kazanc_varsa',
    etiket: 'Kazanç varsa indirilecek',
    bilgi: `## Genel Çerçeve
KVK **Madde 5/1-ı** kapsamında, **5580 Sayılı Özel Öğretim Kurumları Kanunu** çerçevesinde faaliyete geçen özel okul, kreş/gündüz bakımevi ve rehabilitasyon merkezlerinin söz konusu faaliyetlerden elde ettiği kazançlar, **faaliyete geçilen hesap döneminden itibaren 5 yıl boyunca** kurumlar vergisinden istisnadır.

## Kapsam Dahilindeki Kurumlar
- Özel okul öncesi eğitim kurumları
- Özel ilkokul, ortaokul ve lise
- Özel kreş ve gündüz bakımevleri
- Özel rehabilitasyon merkezleri
- 5580 s.K. kapsamında kurulan diğer özel öğretim kurumları

## Temel Koşullar
- Kurum **MEB tarafından resmi izin** almış ve faaliyete geçmiş olmalıdır.
- İstisna süresi, **faaliyete başlanan hesap döneminin başından** itibaren işler.
- **5 yıllık süre** içinde devir veya kapanma hâlinde süre kalan yıl üzerinden kesilir.

## Önemli Sınırlamalar
- **Mevcut kurumlar:** Mevcut özel okul/kreşlerin satın alınması hâlinde (devir yoluyla) 5 yıl süresi **devralanın faaliyete başladığı tarihten** değil, kurumun ilk faaliyete geçtiği tarihten hesaplanır — bu nedenle satın alınan kurumda kalan süre kısa olabilir.
- **Karma faaliyet:** Yalnızca eğitim faaliyetine ilişkin kazanç istisna kapsamındadır; yurt, pansiyon, kantin gibi gelirlerin ayrıştırılması gerekmektedir.
- **Süre dolumu:** 5 yıl dolduktan sonra kazancın tamamı vergiye tabi hâle gelir.

## YİAKV İlişkisi
Bu istisna **YİAKV matrahından düşülemez** — "kazanç varsa" grubunda yer alır ve YİAKV matrahında kalır.

## Pratik Notlar
- MEB'in verdiği izin belgesinin tarihini kayıt altına alın — 5 yıl bu tarihten başlar.
- Birden fazla şube/kurum varsa her biri için ayrı izin belgesi ve ayrı faaliyet başlangıcı söz konusudur.
- Kazancın ayrı hesapta izlenmesi ve beyannamede bu şubeye ait ayrı hesap tablosu sunulması denetim açısından kritiktir.`,
  },
  {
    id: 'arge_tasarim_indirimleri',
    soru: 'Ar-Ge, tasarım veya teknogirişim indirimine hak kazandınız mı?',
    grup: 'kazanc_varsa',
    etiket: 'Kazanç varsa indirilecek',
    bilgi: `## Genel Çerçeve
KVK **10/1-a** ve **5746 Sayılı Kanun Madde 3** kapsamında Ar-Ge, yenilik ve tasarım harcamalarının **tamamı** (%100) kurum kazancından indirilir. Teknogirişim sermaye desteği alanlar için ek indirim imkânı mevcuttur.

## Ar-Ge İndirimi (5746 s.K. Md.3)
- Ar-Ge merkezi veya TGB bünyesinde yapılan Ar-Ge ve yenilik harcamalarının **%100'ü** indirim konusu yapılır.
- **Doktoralı veya temel bilimler lisanslı** Ar-Ge personeli için ek **%50 indirim** uygulanır.
- İndirim tutarı kazançla sınırlıdır; aşan kısım sonraki dönemlere devreder.

## Tasarım İndirimi (5746 s.K. Md.3/A)
- Tasarım merkezi bünyesinde yapılan tasarım harcamalarının **%100'ü** indirim konusu yapılır.
- Nitelikli tasarım personeli için ek **%50 indirim** uygulanabilir.

## Teknogirişim Desteği (5746 s.K. Md.3/B)
- Teknogirişim şirketlerine sağlanan sermaye desteğinin **%75'i** indirim konusu yapılır.

## Önemli Sınırlamalar
- **Ar-Ge merkezi belgesi:** 50+ personel şartı ve Sanayi Bakanlığı onayı zorunludur.
- **TGB dışı harcamalar:** TGB dışında yapılan Ar-Ge harcamaları farklı koşullara tabidir.
- **Belge zorunluluğu:** Ar-Ge harcama listesi, proje bazlı zaman çizelgesi ve personel listesi denetimde istenir.

## YİAKV İlişkisi
Ar-Ge ve tasarım indirimleri **YİAKV matrahından düşülür** — beyanname sıralamasında kazanç varsa grubunda yer alır ve YİAKV matrahını azaltır.

## Pratik Notlar
- Ar-Ge merkezi veya tasarım merkezi belgesi olmadan 5746 s.K. indirimi uygulanamaz.
- Proje bazlı maliyet takibi ve zaman çizelgesi vergi incelemesinde kritik kanıttır.
- YMM tam tasdik raporunda Ar-Ge harcama listesi ayrıntılı açıklanmalıdır.`,
  },
  {
    id: 'bagis_yardim_sponsorluk',
    soru: 'Bağış, yardım veya sponsorluk harcamanız var mı?',
    grup: 'kazanc_varsa',
    etiket: 'Kazanç varsa indirilecek',
    bilgi: `## Genel Çerçeve
KVK **10. Madde** kapsamında çeşitli kurumlara yapılan bağış ve yardımlar ile spor sponsorluğu harcamaları kurum kazancından indirilir. İndirim tutarı beyan edilen kurum kazancının belirli bir oranıyla sınırlıdır.

## Genel Bağış ve Yardımlar (KVK 10/1-c)
- Genel bütçeli idareler, belediyeler, köyler ile kamu yararına çalışan dernek ve vakıflara yapılan bağışların **%5'i** indirim konusu yapılır.
- Tam indirimli kurumlar (Cumhurbaşkanlığı kararıyla belirlenen vakıf ve dernekler) için **tamamı** indirilir.

## Spor Sponsorluğu (KVK 10/1-b)
- **Amatör spor dalları** için sponsorluk harcamalarının **tamamı** (%100) indirilir.
- **Profesyonel spor dalları** için sponsorluk harcamalarının **%50'si** indirilir.

## Eğitim ve Sağlık Bağışları
- Okul, sağlık tesisi, yurt, kütüphane inşası veya onarımı için yapılan bağışlar (müstakil satırlar).
- Belirtilen amaçlara özgü kısıtlama şartı aranır.

## Önemli Sınırlamalar
- **Makbuz zorunluluğu:** Her bağış ve yardım için alıcı kurumdan makbuz alınması şarttır.
- **Amaç kısıtı:** Bağışın yalnızca belirlenen amaç için kullanılması gerekir; genel amaçlı bağışlar özel indirimden yararlanamaz.
- **Nakdi/ayni:** Her ikisi de indirim konusu yapılabilir; ayni bağışlarda değer tespiti belgesi gereklidir.

## YİAKV İlişkisi
Bağış ve yardım indirimleri **YİAKV matrahından düşülür** — beyannamede kazanç varsa grubunda yer alır.

## Pratik Notlar
- Kamu yararına dernek veya muafiyetli vakıf statüsü, bağış yapılmadan önce teyit edilmelidir.
- Yıllık bağış toplamının %5 tavanını aşıp aşmadığı dönem sonunda kontrol edilmelidir.
- Sponsorluk sözleşmesi ve reklam özelliği taşımadığına dair belge incelemede istenir.`,
  },
  {
    id: 'yatirim_tesvikleri',
    soru: 'Yatırım indirimi, risturn veya özel teşviklerden yararlandınız mı?',
    grup: 'kazanc_varsa',
    etiket: 'Kazanç varsa indirilecek',
    bilgi: `## Genel Çerçeve
GVK **Geçici Madde 61** kapsamındaki yatırım indirimi, kooperatiflere özgü risturn istisnası ve **KVK 10/1-ı** nakdi sermaye artışı indirimi bu grupta yer alır.

## GVK Geçici Md.61 — Yatırım İndirimi
- **24/04/2003 tarihinden önce** başlanan yatırımlara ait yatırım indirimi istisnası hâlâ uygulanabilir.
- İndirim tutarı, yatırım teşvik belgesi kapsamındaki harcamalar üzerinden hesaplanır.
- Endekslenmiş bakiye tutar beyannamede ayrı satırda gösterilir.

## Risturn İstisnası (KVK 5/1-i)
- **Kooperatifler** tarafından ortaklara dağıtılan risturnlar kurumlar vergisinden istisnadır.
- Üretim, kredi ve pazarlama kooperatifleri için ayrı koşullar geçerlidir.
- Risturnun ortakların kooperatifle yaptığı işlem hacmiyle orantılı olması şarttır.

## Nakdi Sermaye Artışı İndirimi (KVK 10/1-ı)
- Nakdi olarak artırılan sermaye üzerinden TCMB 1 yıllık mevduat faiz oranı esas alınarak hesaplanan tutarın **%50'si** indirim konusu yapılır.
- Finans sektörü kurumları ve BİST'te işlem gören şirketler için farklı oranlar uygulanabilir.

## Önemli Sınırlamalar
- **Yatırım teşvik belgesi:** Geçici Md.61 için belgenin hâlâ geçerli olması ve harcamaların belgede yer alması şarttır.
- **Sermaye tescili:** Nakdi sermaye artışının ticaret siciline tescil edilmiş olması zorunludur.
- **Kooperatif şartları:** Risturn dağıtım kararı genel kurul kararıyla alınmalıdır.

## YİAKV İlişkisi
Bu gruptaki indirimler **YİAKV matrahından düşülür** — kazanç varsa grubunda yer alır.

## Pratik Notlar
- GVK Geçici Md.61 yatırım indirimi bakiyesi enflasyon düzeltmesiyle güncellenmiş olmalıdır.
- Nakdi sermaye artışında banka transferi belgesi ve sermaye tescil tarihi kritik kanıttır.
- Risturn dağıtımında kooperatif defterlerinde ortaklara isabet eden tutarların ayrıştırılması zorunludur.`,
  },
  {
    id: 'hizmet_indirimleri',
    soru: 'Sağlık, eğitim veya diğer hizmet indirimlerinden yararlandınız mı?',
    grup: 'kazanc_varsa',
    etiket: 'Kazanç varsa indirilecek',
    bilgi: `## Genel Çerçeve
KVK **10. Madde** ve ilgili özel kanunlar kapsamında sağlık tesisi işletmeciliği, eğitim-öğretim ve diğer hizmet faaliyetlerine yönelik çeşitli indirimler bu grupta yer almaktadır.

## Sağlık Tesisi İndirimi (KVK 10/1-d)
- **Hastane ve rehabilitasyon merkezi** kurarak işleten şirketler için bu faaliyetten elde edilen kazancın belirli bir kısmı indirim konusu yapılabilir.
- Sağlık Bakanlığı ruhsatı ve faaliyet belgesi zorunludur.

## Eğitim-Öğretim İndirimi (KVK 10/1-e)
- Okul öncesi, ilk ve orta öğretim ile yükseköğretim kurumu işleten kurumlar için eğitim faaliyetinden elde edilen kazanç indirim konusu yapılabilir.
- MEB onayı ve ilgili mevzuat kapsamında kuruluş belgesi zorunludur.

## Diğer KVK 10 Kapsamlı İndirimler
- **KVK 10/1-f:** Girişim sermayesi fonu ayıranlar için fon tutarının %10'u.
- **KVK 10/1-g:** Engelli bireylere yönelik istihdam ve erişilebilirlik harcamaları.
- **KVK 10/1-h:** Türkiye'ye özgü bazı özel teşvik düzenlemeleri.

## Önemli Sınırlamalar
- **Faaliyet ayrımı:** İndirim yalnızca ilgili hizmet faaliyetinden elde edilen kazanca uygulanır; diğer gelirler ayrı tutulmalıdır.
- **Ruhsat ve belgeler:** Her hizmet türü için ilgili bakanlıktan alınmış ruhsat/izin belgesi zorunludur.
- **Kazanç tespiti:** Karma faaliyetlerde hizmet kazancının ayrıştırılması ve belgelenmesi denetimde kritiktir.

## YİAKV İlişkisi
Bu gruptaki indirimler kalem bazında değişmekle birlikte çoğunlukla **YİAKV matrahından düşülür** — her kalemin kendi YAML tanımına ayrıca bakılmalıdır.

## Pratik Notlar
- Girişim sermayesi fonu indirimi için fon ayrım kararı ve muhasebe kaydı dönem sonuna kadar tamamlanmalıdır.
- Sağlık veya eğitim tesisi işletmeciliğinde, tesisin bir bölümünün başka amaçla kullanılması halinde kazanç ayrıştırması özelge alınarak netleştirilmelidir.
- Bu kategoride yer alan indirimler teknik ve niş nitelikte olduğundan vergi danışmanınızla teyit edilmesi önerilir.`,
  },
  {
    id: 'diger_istisnalar',
    soru: 'Diğer özel indirim veya istisna kalemlerin var mı?',
    grup: 'kazanc_varsa',
    etiket: 'Kazanç varsa indirilecek',
    bilgi: `## Genel Çerçeve
Beyannamede yukarıdaki ana kategorilere girmeyen çeşitli özel indirim ve istisna kalemleri bu grupta toplanmaktadır. Bunlar genellikle **alanında uzman danışman desteği** gerektiren, niş uygulamalardır.

## Başlıca Kalemler

### GVK Geçici Md.76 — Ürün Senedi İstisnası (Beyanname 349)
- Lisanslı depolarda depolanan ürünlere ilişkin **ürün senetlerinin** satışından elde edilen kazançlar kurumlar vergisinden istisnadır.
- Tarımsal ürünler için teşvik amaçlı getirilmiştir.
- Lisanslı depo belgesi ve ürün senedi noter onaylı olmalıdır.

### Beyanname 350 — Diğer İndirimler
- Yukarıdaki hiçbir kategoriye girmeyen, özel mevzuat kapsamındaki indirimler.
- Örnek: Bağış ve yardımlar (GVK 89), girişim sermayesi fonu indirimi vb.
- Her kalemin kendi yasal dayanağı bulunmalı; beyan dipnotunda açıklanmalıdır.

### CVOA (Beyanname 386) — Kontrol Edilen Yabancı Kurum İstisnası Düzeltmesi
- KVK Madde 7 kapsamında daha önce Türkiye'de vergilendirilen **kontrol edilen yabancı kurum kazançları** beyanname 386'da gösterilerek çifte vergilendirme önlenir.
- Bu kalem teknik bir "düzeltme" kalemi olup istisna amaçlı değildir.

### Beyanname 387 — Kısmi Yurtdışı İştirak Kazancı İstisnası
- Tam koşulları sağlamayan yabancı iştiraklerin kısmî istisna uygulaması.

## Dikkat Edilmesi Gerekenler
- **Beyanname 350:** "diğer" kalemi olarak kullanılmamalı; her indirimin yasal dayanağı net olmalıdır.
- **Bağış indirimleri:** Makbuz ve amaç kısıtlamalarına (çevre, kültür, eğitim vb.) uygunluk zorunludur.
- **CVOA:** Yanlış uygulanırsa çifte vergilendirme yerine çifte avantaj doğurabilir — bağımsız hukuki görüş alınması önerilir.

## YİAKV İlişkisi
Bu kategorideki kalemler için YİAKV etkisi kalem bazında değişmektedir — her kalemin kendi YAML tanımına bakılmalıdır.

## Pratik Notlar
- Bu kategoriye giren kalemler nadir ve teknik olduğundan, varsa önce mevcut vergi danışmanınızla teyit edin.
- Beyanname 350'de gösterilen kalemler incelemede sıkça sorgulanmaktadır; belge ve yasal dayanak hazır tutun.`,
  },
]

export default function Faz1AnaKategoriTarama() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const { faz0, setFaz1 } = useWizardStore()
  const [cevaplar, setCevaplar] = useState<Record<string, boolean>>({})
  const [acikModal, setAcikModal] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const { data: katalogKalemler = [] } = useKatalogKalemler()
  const karDurumu = (faz0?.ticari_kar_zarar ?? 0) > 0

  const aktifKatalogKategoriler = useMemo(() => {
    return new Set(
      katalogKalemler.filter((k) => k.durum === 'aktif').map((k) => k.ana_kategori)
    )
  }, [katalogKalemler])

  const gorunurKategoriler = ANA_KATEGORILER.filter(
    (k) =>
      (karDurumu || k.grup !== 'kazanc_varsa') &&
      (aktifKatalogKategoriler.size === 0 || aktifKatalogKategoriler.has(k.id))
  )

  const enAzBirEvet = Object.values(cevaplar).some(Boolean)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAcikModal(null) }
    if (acikModal) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [acikModal])

  const devamEt = async () => {
    setYukleniyor(true)
    try {
      await apiClient.put(`/calisma/${calismaId}/wizard/faz1`, { secilen_kategoriler: cevaplar })
      setFaz1(cevaplar)
      navigate(`/calisma/${calismaId}/wizard/faz2`)
    } finally {
      setYukleniyor(false)
    }
  }

  const modalKategori = ANA_KATEGORILER.find((k) => k.id === acikModal)

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Kategori Tarama</h1>
        {!karDurumu && (
          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 text-sm">
            ⚠️ Zarar nedeniyle "kazanç varsa indirilecek" grup otomatik atlandı
          </div>
        )}
      </div>

      <div className="space-y-4">
        {gorunurKategoriler.map((kat) => (
          <div
            key={kat.id}
            className="flex items-start gap-3 p-4 border border-border-default bg-surface-raised rounded-lg"
          >
            <div className="flex-1">
              <p className="font-medium text-primary">{kat.soru}</p>
              <span className="text-xs text-muted">{kat.etiket}</span>
            </div>
            <button
              onClick={() => setAcikModal(kat.id)}
              className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors px-1.5 py-0.5 rounded border border-border-default hover:border-accent flex-shrink-0 mt-0.5"
              title="Kategori hakkında bilgi"
            >
              ℹ Detay
            </button>
            <div className="flex gap-2 flex-shrink-0">
              {['Evet', 'Hayır'].map((sec) => (
                <label key={sec} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={kat.id}
                    value={sec}
                    checked={cevaplar[kat.id] === (sec === 'Evet')}
                    onChange={() => setCevaplar((p) => ({ ...p, [kat.id]: sec === 'Evet' }))}
                    className="accent-accent"
                  />
                  <span className="text-sm text-primary">{sec}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={devamEt}
        disabled={!enAzBirEvet || yukleniyor}
        className="mt-8 w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium"
      >
        {yukleniyor ? 'Kaydediliyor...' : 'Devam →'}
      </button>

      {/* Info Modal */}
      {acikModal && modalKategori && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setAcikModal(null)}
        >
          <div
            className="bg-surface-raised border border-border-default rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border-subtle flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1.5">Kategori Bilgisi</p>
                  <h2 className="text-lg font-bold text-primary leading-snug">{modalKategori.soru}</h2>
                </div>
                <button
                  onClick={() => setAcikModal(null)}
                  className="w-8 h-8 rounded-full bg-surface-overlay hover:bg-border-subtle flex items-center justify-center text-muted hover:text-primary transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                modalKategori.grup === 'zarar_olsa_dahi'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              }`}>
                {modalKategori.grup === 'zarar_olsa_dahi' ? '✓ Her koşulda uygulanır' : '○ Kazanç varsa uygulanır'}
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {renderMarkdown(modalKategori.bilgi)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
