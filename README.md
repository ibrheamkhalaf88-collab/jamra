# جَمْرَة — موقع الفريق الرقمي

موقع عربي متكامل لفريق جَمْرَة: صفحات تعريفية ومشاريع وخدمات، استقبال طلبات ومحادثات، ولوحة إدارة لإضافة المشاريع وصورها وفيديوهاتها. يعمل الموقع على Cloudflare Workers، مع قاعدة D1 للبيانات وR2 للوسائط. يمكن ربط مستودع GitHub بالنشر التلقائي عبر GitHub Actions.

## قبل النشر

- Node.js 22 أو أحدث وpnpm 11.25.0.
- حساب Cloudflare مع Worker وD1 وR2.
- مستودع GitHub للفريق.
- لا ترفع ملفات `.env` أو `.dev.vars` أو كلمات المرور أو مفاتيح الحساب إلى Git.

## تجربة محلية

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

هذا يشغّل نسخة محلية من Worker. بيانات التجربة المحلية تبقى في `.wrangler/state` داخل جهازك.

## إعداد Cloudflare مرة واحدة

1. سجّل الدخول إلى Wrangler ثم أنشئ قاعدة D1 وR2 bucket مخصصين لجَمْرَة:

```bash
pnpm exec wrangler login
pnpm exec wrangler d1 create jamra-db
pnpm exec wrangler r2 bucket create jamra-portfolio
```

2. خذ معرّف قاعدة D1 الذي يظهر بعد إنشائها.
3. نفّذ المخطط الموحّد مرة واحدة فقط على قاعدة D1 الجديدة:

```bash
pnpm exec wrangler d1 execute jamra-db --remote --file drizzle/jamra_initial.sql
```

هذا المخطط الموحّد ينشئ الجداول والفهارس الحالية. لا تكرره على قاعدة قديمة أو تحتوي بيانات. إذا كانت قاعدة Jamra أُنشئت سابقًا باستخدام Drizzle migrations، فلا تعِد تشغيله؛ طبّق فقط ملفات الترحيل التي لم تُطبّق بعد.

للتوضيح: `drizzle/jamra_initial.sql` هو إعداد مختصر لقاعدة جديدة. ملفات `drizzle/0000_*.sql` و`0001_*.sql` و`0002_*.sql` تشكّل سلسلة الترحيل التاريخية لمن يتتبع Drizzle. على قاعدة جديدة استخدم طريقة واحدة فقط: المخطط الموحّد، أو سلسلة الترحيل كاملة بالترتيب. لا تخلط الطريقتين.

4. أنشئ كلمة مرور إدارة قوية ومفتاح جلسات:

```bash
pnpm run admin:secrets
```

سيطبع الأمر قيمتين سريتين. احتفظ بهما مؤقتًا إلى ما بعد أول نشر، لأن Worker `jamra` لا يظهر في لوحة Cloudflare قبل نشره. لا تضع القيم السرية داخل المستودع.

المتغيرات السرية المطلوبة:

| الاسم | المحتوى |
| --- | --- |
| `JAMRA_ADMIN_EMAIL` | بريد مدير الموقع المسموح له |
| `JAMRA_ADMIN_PASSWORD_HASH` | القيمة التي طبعها مولّد كلمة المرور |
| `JAMRA_SESSION_SECRET` | مفتاح الجلسات العشوائي الذي طبعه المولّد |

أكمل أول نشر من الجهاز أو GitHub Actions، ثم أضف القيم الثلاث في Cloudflare Dashboard تحت Worker `jamra` → Settings → Variables and Secrets بوصفها **Secrets**. إضافة الأسرار تنشئ نسخة Worker جديدة. دخول لوحة الإدارة سيكون من `/admin-login.html`، والجلسة تُحفظ في Cookie محمية لمدة 7 أيام. يبقى دخول ChatGPT الحالي متاحًا على نسخة Sites عند عدم ضبط أسرار كلمة المرور.

## نشر مباشر من الجهاز

سجّل الدخول إلى Wrangler مرة واحدة باستخدام `pnpm exec wrangler login`، ثم عيّن معرّف الحساب والموارد في الطرفية:

```bash
export CLOUDFLARE_ACCOUNT_ID="معرف-حساب-Cloudflare"
export CLOUDFLARE_D1_DATABASE_ID="معرف-قاعدة-D1"
export CLOUDFLARE_D1_DATABASE_NAME="jamra-db"
export CLOUDFLARE_R2_BUCKET_NAME="jamra-portfolio"
pnpm run build
pnpm run deploy:cloudflare
```

أمر النشر يملأ إعدادات D1 وR2 في `dist/server/wrangler.json` المتولد ثم ينشر إلى Worker اسمه `jamra`. لا يغيّر الملفات المصدرية ولا يضمّن مفاتيح الإدارة.
يستخدم النشر المحلي جلسة Wrangler المحفوظة؛ أما GitHub Actions فيستخدم `CLOUDFLARE_API_TOKEN` كـSecret.

## النشر التلقائي من GitHub

الملف `.github/workflows/deploy-cloudflare.yml` يبني الموقع وينشره عند كل تحديث إلى فرع `main`، أو يدويًا من تبويب Actions.

أضف إلى إعدادات المستودع:

- **GitHub Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`.
- **GitHub Variables:** `CLOUDFLARE_D1_DATABASE_NAME` بقيمة `jamra-db` و`CLOUDFLARE_R2_BUCKET_NAME` بقيمة `jamra-portfolio`.

أنشئ Cloudflare API Token بصلاحيات نشر Workers وإدارة D1 وR2 ضمن الحساب المقصود فقط. أسرار دخول لوحة الموقع تبقى في Cloudflare Worker Secrets، ولا يحتاج GitHub إلى كلمة المرور أو مفتاح الجلسات.

## المزايا المنشورة

- صفحات الفريق والخدمات والمشاريع وطاقات واستقبال الأفكار.
- لوحة إدارة محمية لإضافة المشاريع وتعديلها وإخفائها، مع رفع أغلفة ومعارض صور وفيديوهات حتى 25 MB للملف.
- استقبال طلبات الزوار ومتابعتها والرد عليها عبر محادثة مرتبطة برمز خاص بالطلب.
- حفظ البيانات في D1 والملفات في R2 بدل الاعتماد على تخزين المتصفح.
- واجهة عربية متجاوبة وحركات ظهور وانتقال، مع احترام إعداد تقليل الحركة في النظام.

## التحقق قبل أول نشر

```bash
pnpm run lint
pnpm run build
```

بعد إضافة موارد Cloudflare والأسرار، افحص الموقع المنشور وصفحات المشاريع ونموذج استقبال الطلبات ودخول الإدارة ورفع صورة وفيديو تجريبيين.

للقواعد المنشأة من `jamra_initial.sql`، عند تحديث المخطط لاحقًا طبّق ملف Drizzle الجديد غير المطبّق فقط، بعد مراجعة أثره ونسخة احتياطية مناسبة. لا تعِد تنفيذ ملفات `0000` و`0001` و`0002` على هذه القاعدة؛ فهي جزء من سلسلة التهيئة التاريخية وليست ترقيات متكررة.
