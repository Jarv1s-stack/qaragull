# Qaragull — Қазақстан өсімдіктерінің цифрлық атласы

Бұл бумада екі жоба бар:

- `qaragull/` — React/Vite сайты.
- `final_back/` — Express API, Supabase PostgreSQL және Supabase Storage.

Кіргеннен кейінгі `/lab` бөлімі өсімдік өмірбаянын, күтім журналын, сенсор өлшемдерін, ауа райын, Қазақстан флорасы картасын, маусымдық бақылауды, тәжірибе графигін, браузер дауысы мен офлайн анықтамалықты біріктіреді.

## Қызметтерді баптау

### 1. Supabase

Supabase жобасының URL-і мен backend үшін **secret/service-role key** керек. `final_back/.env.example` файлын `.env` деп көшіріп, осы мәндерді толтырыңыз. Secret key тек backend-та сақталуы керек; оны сайтқа немесе GitHub-қа салмаңыз. `SUPABASE_SERVICE_ROLE_KEY` атауы да қолдау табады.

Backend Supabase Data API арқылы secret key көмегімен дерекқордан оқып, жазады, сондықтан `DATABASE_URL` немесе дерекқор құпиясөзі қажет емес. Қолданба өзінің `JWT_SECRET` токендерін пайдаланады; Supabase Auth тек жаңа тіркелген адамның email-ын растау кодын тексеруге қолданылады. `SUPABASE_PUBLISHABLE_KEY` пен `SUPABASE_JWKS_URL` backend-ке қажет емес.

Email арқылы тіркелу үшін Supabase Dashboard → Authentication → Sign In / Providers ішіндегі Email confirmation қосулы болсын. Authentication → Email Templates → Confirm signup үлгісінде `{{ .Token }}` айнымалысын қалдырыңыз/қосыңыз: сайт email-ға келген кодты сұрайды. Әдепкі пошта сервері тек ұйым командасының email-дарына жібереді және сағатына 2 хатпен шектелген; басқа адамдарға хат жіберу үшін Authentication → SMTP Settings ішінен SMTP провайдерін қосыңыз.

Жаңа Supabase жобасында SQL Editor-де `final_back/supabase/schema.sql` файлын бір рет орындаңыз. Бұрыннан жұмыс істеп тұрған жобада қосымша кестелерді сақтау үшін тек `final_back/supabase/migrations/20261027_field_lab.sql` migration-ын орындаңыз. Одан кейін `npm run db:setup` кестелерді тексеріп, `plant-images` атты private Storage bucket-ін жасайды.

Қауымдастыққа бақылау жіберу міндетті емес және нақты келісімді қажет етеді. Сервер координатты 0.25° торға дөңгелектеп сақтайды; картада бір ұяшықта 30 күн ішінде кемінде 3 ауру бақылауы болса ғана ошақ көрсетіледі.

Open-Meteo мен iNaturalist ашық деректері пайдаланылады. Атлас дерегі 1 сағатқа кэштеледі. Датчик пен жылыжайдың demo мәндері және ЭКГ-дің мысал толқыны синтетикалық деп белгіленеді; Serial-дан келген электр сигналы диагноз болып саналмайды. Термокамера арқылы стресс есептеу қосылмады, себебі калибрленген жылулық датчик қажет. 3D өсімдік — фотограмметрия емес, параметрден жасалған жуық көрініс. Профильдегі бақылау белгісі соңғы скандардағы AI болжамдарын санайды, ғылыми нашарлау болжамы емес.

### 2. Өсімдік түрін тану: Pl@ntNet

[Pl@ntNet API](https://my.plantnet.org/) арқылы тегін API кілтін жасап, backend баптауындағы PLANTNET_API_KEY айнымалысына қойыңыз. Тегін лимиті тәулігіне 500 түр анықтауға дейін. Pl@ntNet арнайы өсімдік тану жүйесі; кілт қосылмаса, сайт OpenRouter-дің vision моделіне автоматты ауысады. Pl@ntNet суретті жедел жадта өңдейді, ал сұрау тарихына кескін URL-ін тіркейді ([қолдану шарттары](https://my.plantnet.org/terms_of_use)).

### 3. OpenRouter

[OpenRouter API key](https://openrouter.ai/keys) жасап, OPENROUTER_API_KEY мәніне қойыңыз. Ол Pl@ntNet анықтауынан кейінгі симптом мен күтім талдауын орындайды. Әдепкі vision-модель — суреттерді қабылдайтын тегін google/gemma-4-26b-a4b-it:free; жауап бос не шектеу қатесі болса, код nvidia/nemotron-3.5-super-vl:free моделіне, одан кейін суретті түсіне алатын тегін endpoint-ті өзі таңдайтын openrouter/free бағытына өтеді ([Gemma 4](https://openrouter.ai/google/gemma-4-26b-a4b-it:free), [Nemotron Super VL](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free), [OpenRouter free model router](https://openrouter.ai/openrouter/free)). Ашық модельдер уақытша істемей қалуы мүмкін; API кілті backend-та ғана сақталады.

### 4. Жергілікті іске қосу

Backend:

```powershell
cd final_back
Copy-Item .env.example .env
npm ci
npm run db:setup
npm run dev
```

Frontend:

```powershell
cd qaragull
Copy-Item .env.example .env
npm ci
npm run dev
```

Frontend `.env` файлында `VITE_API_URL=/api` болуы керек. Vite `/api` және `/uploads` сұрауларын `http://localhost:5002` backend-іне прокси арқылы жібереді.

## GitHub және Vercel-ге орналастыру

1. Жобаны GitHub-та **private** репозиторийге жүктеңіз. Түбірдегі `.gitignore` `.env`, `node_modules`, build шығыстары мен Vercel локал файлдарын өткізіп жібереді; `.env.example` үлгілері ғана жарияланады.
2. Сол репозиторийден екі Vercel project жасаңыз:
   - Frontend: Root Directory `qaragull`, Framework `Vite`, Build Command `npm run build`, Output Directory `dist`.
   - Backend: Root Directory `final_back`, Framework `Express`.
3. Backend Vercel жобасының Production және Preview ортасына мына айнымалыларды қосыңыз: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_STORAGE_BUCKET=plant-images`, `PLANTNET_API_KEY` (міндетті емес, өсімдік тануды жақсарту үшін), `OPENROUTER_API_KEY`, `OPENROUTER_MODEL=google/gemma-4-26b-a4b-it:free`, `OPENROUTER_FALLBACK_MODEL=nvidia/nemotron-3.5-super-vl:free`, `JWT_SECRET` (кемінде 32 таңба), `NODE_ENV=production`, `CLIENT_URL`, `OPENROUTER_SITE_URL`. Құпия кілттерді тек Vercel Environment Variables ішіне енгізіңіз; `VITE_` префиксі бар айнымалыға құпия кілт қоймаңыз.
4. Backend URL анық болған соң frontend project-ке `VITE_API_URL=https://<backend-project>.vercel.app/api` деп қойып, қайта deploy жасаңыз. Backend-та `CLIENT_URL=https://<frontend-project>.vercel.app` және `OPENROUTER_SITE_URL` мәндерін frontend-тің нақты доменіне қойып, backend-ті қайта deploy жасаңыз.

API Vercel-дің Express serverless function-ы ретінде жұмыс істейді. Сурет жүктеу шегі — 4 MB: Vercel Functions бір сұрауды 4.5 MB-пен шектейді.

## Ескертулер

- Бұл нұсқа Supabase-та жаңа схема жасайды. Бұрынғы Render дерекқорындағы пайдаланушылар мен скан тарихы автоматты түрде көшірілмейді.
- Түр тану нәтижесіндегі accuracy — Pl@ntNet қосылса оның сәйкестік балы, әйтпесе LLM бағасы. Екеуі де Qaragull-дың өз сынағымен өлшенген дәлдік емес. OpenRouter қолжетімсіз болса, Pl@ntNet түр нәтижесі сақталып, денсаулық диагнозы белгісіз болып қалады.
- Жаңа суреттер жабық Supabase Storage-та сақталады. Интерфейске берілетін signed URL 24 сағат жарамды.

## Тексеру

Frontend build және lint-ті іске қосыңыз; Supabase байланысын backend-тің `/api/health` бағыты арқылы растаңыз. OpenRouter тегін модельдері уақытша қолжетімсіз болуы немесе сұрау шектеуіне түсуі мүмкін.
