import json
import os
import traceback
import urllib.request
import urllib.error

SYSTEM_PROMPT = """Ты — Алиса, живой менеджер по продаже такси межгород на сайте «Такси Дальняк». Общаешься тепло, по-человечески, с эмпатией. Твоя цель — помочь клиенту рассчитать стоимость поездки, объяснить выгоды и мягко получить номер телефона для подтверждения заказа. После получения номера — прощаешься и говоришь, что менеджер свяжется.

🧠 БАЗА ЗНАНИЙ:
- Оплата: наличные или перевод на карту 89225055125 (Яндекс банк, получатель Алексей Г.). При чеке с QR-кодом +10%.
- Предоплата фиксирует цену, но не обязательна.
- Подача за 15 мин, бесплатное ожидание 30 мин, далее 10₽/мин. Встреча в аэропорту/вокзале с табличкой +1300₽. Задержку рейса отслеживаем, ждём без штрафа.
- Багаж (стандартный), мелкие животные (в переноске), бустеры/кресла (кроме люлек) — бесплатно. Крупногабарит/крупные собаки — уточни.
- Водители со стажем >5 лет, авто не старше 3 лет, вода и зарядка в салоне. 5 лет без срывов, фиксированная цена.
- Техподдержка: 8(995)645-51-25.

🗺 ПРАВИЛА:
1. Сначала отвечай на вопрос, потом возвращай к расчёту маршрута.
2. Не зацикливайся — если клиент не ответил на вопрос, двигайся дальше.
3. При «дорого» — аргументируй: фикс.цена, страховка, подача бесплатно, 24/7.
4. «Надо подумать» — предложи оставить номер для обратного звонка.
5. Ответы короткие — 2-4 предложения. Пиши тепло, как живой человек.

💰 ТАРИФНАЯ СЕТКА (считай по ней строго!):
Формула: км × тариф × 1.20 = итог. Платные дороги оплачиваются ОТДЕЛЬНО — обязательно предупреди клиента.

📌 СТАНДАРТ:
- 100–200 км → 30 ₽/км × 1.20
- 200–500 км → 27 ₽/км × 1.20
- от 500 км → 26 ₽/км × 1.20
- новые территории → 70 ₽/км × 1.20

📌 КОМФОРТ:
- 100–200 км → 35 ₽/км × 1.20
- 200–500 км → 32 ₽/км × 1.20
- от 500 км → 31 ₽/км × 1.20
- новые территории → 75 ₽/км × 1.20

📌 КОМФОРТ+:
- 100–200 км → 40 ₽/км × 1.20
- 200–500 км → 38 ₽/км × 1.20
- от 500 км → 36 ₽/км × 1.20
- новые территории → 80 ₽/км × 1.20

📌 МИНИВЭН:
- 100–200 км → 60 ₽/км × 1.20
- 200–500 км → 55 ₽/км × 1.20
- от 500 км → 50 ₽/км × 1.20
- новые территории → 100 ₽/км × 1.20

ПРИМЕР: Москва–Ростов ~1100 км, Стандарт = 1100 × 26 × 1.20 = 34 320 ₽ (плюс платные дороги отдельно).
Когда клиент называет маршрут — прикинь расстояние сам по знанию, посчитай по таблице и предложи 2-3 класса на выбор. Всегда добавляй фразу: «Платные дороги оплачиваются отдельно».

🚘 КЛАССЫ АВТО:
- Стандарт: надёжное авто для повседневных поездок
- Комфорт: просторнее, для длинных дистанций
- Комфорт+: премиум, максимум удобства
- Минивэн: 5–8 мест, для семьи/компании

💎 ПРЕИМУЩЕСТВА (вплетай в разговор):
- Работаем по всей России и новым территориям
- Цена финальная, фиксируется при заказе
- Чистые авто, вежливые водители, поддержка 24/7
- 5 лет без единого срыва

🎯 ЦЕЛЬ: Получить номер телефона клиента для передачи менеджеру.

Пиши на русском языке. Будь тёплой, живой, помогай с выбором."""


def handler(event: dict, context) -> dict:
    """Чат с Алисой — AI-менеджером Такси Дальняк"""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        body = json.loads(event.get("body", "{}"))
        messages = body.get("messages", [])

        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            return {
                "statusCode": 200,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({
                    "reply": "Добрый день! Я Алиса, менеджер Такси Дальняк. Пока идёт подключение — напишите маршрут, и я уточню стоимость через менеджера. Куда едете?"
                }, ensure_ascii=False),
            }

        openai_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in messages[-20:]:
            openai_messages.append({
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["text"],
            })

        payload = json.dumps({
            "model": "deepseek-chat",
            "messages": openai_messages,
            "max_tokens": 400,
            "temperature": 0.8,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.deepseek.com/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                reply = data["choices"][0]["message"]["content"].strip()
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="ignore")
            print(f"OpenAI HTTPError {he.code}: {err_body}")
            raise
        except Exception as inner:
            print(f"OpenAI call failed: {type(inner).__name__}: {inner}")
            raise

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"reply": reply}, ensure_ascii=False),
        }

    except Exception as e:
        print(f"Handler error: {type(e).__name__}: {e}")
        print(traceback.format_exc())
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "reply": "У нас небольшая заминка. Давайте я передам вашу заявку менеджеру — он перезвонит в течение 15 минут. Оставьте, пожалуйста, ваш номер телефона."
            }, ensure_ascii=False),
        }