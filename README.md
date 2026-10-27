# Qaragull — Supabase және OpenRouter нұсқасы

Бұл бумада екі жоба бар:

- `qaragull/` — React/Vite сайты.
- `final_back/` — Express API, Supabase PostgreSQL және Supabase Storage.

Кіргеннен кейінгі `/lab` бөлімі өсімдік өмірбаянын, күтім журналын, сенсор өлшемдерін, ауа райын, Қазақстан флорасы картасын, маусымдық бақылауды, тәжірибе графигін, браузер дауысы мен офлайн анықтамалықты біріктіреді.

## Қызметтерді баптау

### 1. Supabase

Supabase жобасының URL-і мен backend үшін **secret/service-role key** керек. `final_back/.env.example` файлын `.env` деп көшіріп, осы мәндерді толтырыңыз. Secret key тек backend-та сақталуы керек; оны сайтқа немесе GitHub-қа салмаңыз. `SUPABASE_SERVICE_ROLE_KEY` атауы да қолдау табады.

Backend Supabase Data API арқылы secret key көмегімен дерекқордан оқып, жазады, сондықтан `DATABASE_URL` немесе дерекқор құпиясөзі қажет емес. Код Supabase Auth емес, `JWT_SECRET` арқылы өзінің токендерін шығарады; `SUPABASE_PUBLISHABLE_KEY` пен `SUPABASE_JWKS_URL` пайдаланылмайды.

Жаңа Supabase жобасында SQL Editor-де `final_back/supabase/schema.sql` файлын бір рет орындаңыз. Бұрыннан жұмыс істеп тұрған жобада қосымша кестелерді сақтау үшін тек `final_back/supabase/migrations/20261027_field_lab.sql` migration-ын орындаңыз. Одан кейін `npm run db:setup` кестелерді тексеріп, `plant-images` атты private Storage bucket-ін жасайды.

Қауымдастыққа бақылау жіберу міндетті емес және нақты келісімді қажет етеді. Сервер координатты 0.25° торға дөңгелектеп сақтайды; картада бір ұяшықта 30 күн ішінде кемінде 3 ауру бақылауы болса ғана ошақ көрсетіледі.

Open-Meteo мен iNaturalist ашық деректері пайдаланылады. Атлас дерегі 1 сағатқа кэштеледі. Датчик пен жылыжайдың demo мәндері және ЭКГ-дің мысал толқыны синтетикалық деп белгіленеді; Serial-дан келген электр сигналы диагноз болып саналмайды. Термокамера арқылы стресс есептеу қосылмады, себебі калибрленген жылулық датчик қажет. 3D өсімдік — фотограмметрия емес, параметрден жасалған жуық көрініс. Профильдегі бақылау белгісі соңғы скандардағы AI болжамдарын санайды, ғылыми нашарлау болжамы емес.

### 2. OpenRouter

[OpenRouter API key](https://openrouter.ai/keys) жасап, `OPENROUTER_API_KEY` мәніне қойыңыз. Әдепкі vision-модель — суреттерді қабылдайтын тегін `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`; жауап бос не қате болса, код `nvidia/nemotron-3.5-super-vl:free` моделіне ауысады ([Nemotron Nano Omni](https://openrouter.ai/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free), [Nemotron Super VL](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free)). Тегін endpoint-тер шектеулі әрі уақытша істемей қалуы мүмкін. NVIDIA тегін endpoint-інің деректерді өңдеу шарттарын ескеріп, жеке не құпия фотоларды жібермеңіз.

### 3. Жергілікті іске қосу

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
3. Backend Vercel жобасының Production және Preview ортасына мына айнымалыларды қосыңыз: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_STORAGE_BUCKET=plant-images`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_FALLBACK_MODEL`, `JWT_SECRET` (кемінде 32 таңба), `NODE_ENV=production`, `CLIENT_URL`, `OPENROUTER_SITE_URL`. Құпия кілттерді тек Vercel Environment Variables ішіне енгізіңіз; `VITE_` префиксі бар айнымалыға құпия кілт қоймаңыз.
4. Backend URL анық болған соң frontend project-ке `VITE_API_URL=https://<backend-project>.vercel.app/api` деп қойып, қайта deploy жасаңыз. Backend-та `CLIENT_URL=https://<frontend-project>.vercel.app` және `OPENROUTER_SITE_URL` мәндерін frontend-тің нақты доменіне қойып, backend-ті қайта deploy жасаңыз.

API Vercel-дің Express serverless function-ы ретінде жұмыс істейді. Сурет жүктеу шегі — 4 MB: Vercel Functions бір сұрауды 4.5 MB-пен шектейді.

## Ескертулер

- Бұл нұсқа Supabase-та жаңа схема жасайды. Бұрынғы Render дерекқорындағы пайдаланушылар мен скан тарихы автоматты түрде көшірілмейді.
- AI қайтарған `accuracy` — модельдің субъектив сенімділік бағасы; нақты сынақпен өлшенген дәлдік емес. AI қатесі болса, жалған нәтиже сақталмайды.
- Жаңа суреттер жабық Supabase Storage-та сақталады. Интерфейске берілетін signed URL 24 сағат жарамды.

## Тексеру

Frontend build нәтижесін тексеріп, Supabase байланысын backend-тің `/api/health` бағыты арқылы растаңыз. OpenRouter-дің тегін моделі уақытша қолжетімсіз болуы немесе сұрау шектеуіне түсуі мүмкін.
