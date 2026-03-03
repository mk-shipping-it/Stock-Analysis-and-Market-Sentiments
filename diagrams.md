```mermaid
graph TB
    subgraph Client["Browser"]
        HTML[Jinja2 Templates<br/>index / login / register<br/>dashboard / admin / results]
        CSS[style.css]
        JS[app.js]
    end

    subgraph Flask["Flask Application (main.py)"]
        AUTH[auth_bp<br/>register / login / logout]
        DASH[dashboard_bp<br/>portfolio overview]
        TRADE[trade_bp<br/>buy / sell / dividend / topup]
        ADMIN[admin_bp<br/>brokers / stats]
        PREDICT[predict_bp<br/>forecast + chart]
    end

    subgraph External["External APIs"]
        YF[yfinance<br/>historical prices]
        EOD[OpenRouter / OpenAI<br/>web search sentiment]
    end

    subgraph ML["ML Pipeline"]
        LR[scikit-learn<br/>LinearRegression]
        CHART[matplotlib<br/>chart generator]
    end

    DB[(SQLite<br/>sams_database.db<br/>users / companies / brokers<br/>portfolio_items / transactions / dividends)]

    Client --> Flask
    Flask --> DB
    PREDICT --> YF
    PREDICT --> EOD
    PREDICT --> ML
    ML --> CHART
    CHART -->|static/charts/*.png| HTML
    AUTH --> DB
    DASH --> DB
    TRADE --> DB
    ADMIN --> DB
    ```