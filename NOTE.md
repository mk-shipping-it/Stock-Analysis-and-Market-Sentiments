1. NOTES IN DEVIN AND OPENCODE
2. what cool ml model could be a replacement?
3. (Jul 2026) SAMS refactor notes — see below

---

What a beginner should know first:

Topic	Why needed
Python - basics	functions, imports, classes, with/try blocks
Flask	- routes, blueprints, request.form, session, render_template
SQL (SQLite) -	SELECT/INSERT/UPDATE/DELETE/JOIN — see db.py for the pattern
Jinja2	- {{ var }}, {% for %}, {% if %}, {% with %} — templates use these
pandas	- reading CSV, DataFrame columns, .iloc, .ffill()
scikit-learn -	train_test_split concept, LinearRegression, StandardScaler
matplotlib	- plot(), savefig(), Axes styling
REST APIs	- requests.get(url) — used for yfinance + EODHD
CLI - basics	- venv, pip, python main.py

The project follows a simple Controller → Service → Database split:
- routes_*.py = controllers (HTTP logic)
- helpers.py + db.py = service/data layer (raw SQL)
- templates/ = views (Jinja2)
- news_sentiment.py + routes_predict.py = ML pipeline


Jinja2 isn't a frontend framework — it's Flask's built-in server-side template engine. The {{ }} tags inject data from Python before the page reaches your browser. The result delivered to the browser is plain HTML/CSS/JS — no Jinja2 runs on the client.
If you want zero server-side templating, every page would need to be a static HTML file that fetches data via fetch() from JSON API endpoints, then renders it with JavaScript. That's a bigger rewrite and adds client-side complexity (a mini-SPA).
The current setup is already the simplest architecture: Flask renders HTML server-side, the tiny app.js (21 lines) just handles async form submits. Want me to keep it as-is, or go full static-HTML + JSON APIs?

You only need ~4 Jinja2 patterns to work with this codebase:
Syntax	Purpose
{{ expr }}	Output a value
{% if cond %}...{% endif %}	Conditionals
{% for x in list %}...{% endfor %}	Loops
{{ url_for('bp.route') }}	Generate URLs
That's it — the rest is standard HTML/CSS/JS. Flask's docs page on Jinja2 is one quick read: https://flask.palletsprojects.com/en/stable/templating/

---

## Jul 2026 — SAMS Refactor Session

### .env Location
`C:\Users\gr0k\Downloads\SAMs-master\SAMs-master\.env`

### Architecture Decisions Made
- **Python eliminated entirely**. Linear regression ported to Node (`server/services/forecast.js`) using yahoo-finance2. No more model-runner server. One `npm run dev` to start everything.
- **OpenRouter** lives in JS only (`server/routes/predict.js`).
- **Charts**: Recharts (JSX components) on the frontend. Python data piped via `chart_data` in forecast response.
- **UI**: Shopify-minimal aesthetic — thin font-weights, muted grays, small type, minimal borders, no shadows.
- **Forecast API slot**: The forecast service can be swapped for any hosted ML API later by changing the `getForecast` implementation.

### Startup
Single terminal: `npm run dev` (Node + Vite concurrently)