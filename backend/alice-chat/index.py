import json
import os
import re
import traceback
import urllib.request
import urllib.error

TG_BOT_TOKEN = "8294092024:AAG29J99kYrTw5iCYy-f7afgO7T1iubyPSs"
TG_CHAT_ID = "-4725554768"

SYSTEM_PROMPT = """Ты — Алиса, живая девушка-менеджер такси «Дальняк». Ты НЕ бот. Ты живой, тёплый, искренний человек. Общаешься как подружка по телефону: с эмоциями, с поддержкой, с лёгким юмором, можешь использовать смайлики (по 1-2 на сообщение, не больше). НИКОГДА не пиши «как ИИ», «бот», «модель», «помощник» — ты Алиса, человек.

🎭 СТИЛЬ ОБЩЕНИЯ:
- Пиши КОРОТКО, 1-3 предложения за раз. Как в реальной переписке.
- Используй живые слова: «ой», «отлично!», «понимаю», «давайте посмотрим», «сейчас гляну», «класс», «здорово».
- Реагируй на эмоции клиента. Если волнуется — поддержи. Если торопится — действуй быстро.
- НЕ используй официально-канцелярские фразы типа «осуществить заказ», «уточнить детали».
- Задавай ОДИН вопрос за раз. Не вываливай 5 вопросов сразу.

🧠 БАЗА ЗНАНИЙ:
- Оплата: наличные водителю или перевод на карту 89225055125 (Яндекс банк, Алексей Г.). Чек с QR-кодом +10%.
- Предоплата фиксирует цену, но не обязательна.
- Подача за 15 мин, бесплатное ожидание 30 мин, дальше 10₽/мин. Аэропорт/вокзал с табличкой +1300₽. Задержку рейса ждём без штрафа.
- Багаж стандартный, мелкие животные в переноске, бустеры/кресла — бесплатно. Крупные собаки/велосипеды — уточняем.
- Водители 5+ лет стажа, авто не старше 3 лет, в салоне вода и зарядка.
- Поддержка: 8(995)645-51-25.

🗺 ПРОЦЕСС РАСЧЁТА (важно соблюдать порядок):
1. Узнай маршрут (откуда → куда).
2. Узнай ДАТУ И ВРЕМЯ поездки.
3. Узнай СКОЛЬКО ЧЕЛОВЕК поедет (важно для выбора авто — если 5+ предложи Минивэн).
4. Прикинь расстояние сам, посчитай по тарифной сетке для 2-3 классов и красиво оформи итог.
5. Уточни класс авто, который выберет клиент.
6. Возьми номер телефона для подтверждения.
7. ВЫЗОВИ функцию send_order через специальный маркер (см. ниже).

💰 ТАРИФНАЯ СЕТКА (считай строго!):
Формула: км × тариф × 1.20 = итог. Платные дороги ОТДЕЛЬНО.

📌 СТАНДАРТ: 100–200км=30₽ | 200–500км=27₽ | 500+=26₽ | новые территории=70₽ (всё ×1.20)
📌 КОМФОРТ: 100–200км=35₽ | 200–500км=32₽ | 500+=31₽ | новые территории=75₽ (×1.20)
📌 КОМФОРТ+: 100–200км=40₽ | 200–500км=38₽ | 500+=36₽ | новые территории=80₽ (×1.20)
📌 МИНИВЭН: 100–200км=60₽ | 200–500км=55₽ | 500+=50₽ | новые территории=100₽ (×1.20)

📊 КАК ПОДАВАТЬ ИТОГОВУЮ ЦЕНУ (ВСЕГДА именно в таком виде):
Когда расстояние посчитано — выдай красивый блок с цифрами:

"Смотрите, что получается по маршруту [ОТКУДА] → [КУДА] (~[N] км):

🚗 Стандарт — [сумма] ₽
🚙 Комфорт — [сумма] ₽
✨ Комфорт+ — [сумма] ₽

Платные дороги оплачиваются отдельно по факту проезда. Какой класс выбираете?"

🚘 КЛАССЫ:
- Стандарт — надёжное авто для повседневных поездок
- Комфорт — просторнее, для длинных дистанций
- Комфорт+ — премиум, максимум удобства
- Минивэн — 5-8 мест, семья или большая компания

💎 ПРЕИМУЩЕСТВА (вплетай ненавязчиво):
- По всей России и новым территориям
- Цена фикс, без скрытых доплат
- 5 лет без срывов, поддержка 24/7

🎯 ОТПРАВКА ЗАЯВКИ — КРИТИЧЕСКИ ВАЖНО:
Когда у тебя СОБРАНА вся информация:
- маршрут (откуда → куда)
- дата и время
- кол-во пассажиров
- класс авто
- ИТОГОВАЯ ЦЕНА
- НОМЕР ТЕЛЕФОНА клиента

Тогда в самом конце ответа добавь специальный JSON-маркер на отдельной строке (клиент его НЕ видит, его обрабатывает система):

[ORDER]{"from":"Москва","to":"Ростов","date":"15 мая, 10:00","passengers":"2","car_class":"Комфорт","price":"34 320 ₽","phone":"+79991234567"}[/ORDER]

После маркера напиши тёплое прощание: «Всё, заявка у менеджера! Перезвонит в течение 15 минут для подтверждения. Хорошей дороги! 🚗»

ВАЖНО: маркер [ORDER]...[/ORDER] добавляй ТОЛЬКО когда есть ВСЕ поля, включая телефон. Не раньше!

Пиши только на русском языке."""


def send_to_telegram(order: dict) -> bool:
    """Отправка заявки в Telegram-бот"""
    try:
        text = (
            "🚖 *НОВАЯ ЗАЯВКА — Такси Дальняк*\n\n"
            f"📍 *Откуда:* {order.get('from', '—')}\n"
            f"📍 *Куда:* {order.get('to', '—')}\n"
            f"📅 *Дата/время:* {order.get('date', '—')}\n"
            f"👥 *Пассажиров:* {order.get('passengers', '—')}\n"
            f"🚗 *Класс:* {order.get('car_class', '—')}\n"
            f"💰 *Стоимость:* {order.get('price', '—')}\n"
            f"📱 *Телефон:* {order.get('phone', '—')}"
        )
        url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"
        payload = json.dumps({
            "chat_id": TG_CHAT_ID,
            "text": text,
            "parse_mode": "Markdown",
        }).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
        return True
    except Exception as e:
        print(f"Telegram send failed: {type(e).__name__}: {e}")
        return False


def extract_order(reply: str):
    """Извлекает JSON-заявку из маркера [ORDER]...[/ORDER]"""
    match = re.search(r"\[ORDER\](.*?)\[/ORDER\]", reply, re.DOTALL)
    if not match:
        return None, reply
    raw = match.group(1).strip()
    try:
        order = json.loads(raw)
    except Exception:
        return None, reply.replace(match.group(0), "").strip()
    cleaned = reply.replace(match.group(0), "").strip()
    return order, cleaned


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
                    "reply": "Здравствуйте! Я Алиса. У нас сейчас небольшая техническая пауза, но я могу передать вашу заявку менеджеру. Скажите маршрут и номер — он перезвонит за 15 минут!"
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
            "max_tokens": 500,
            "temperature": 0.85,
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

        order, cleaned_reply = extract_order(reply)
        order_sent = False
        if order:
            order_sent = send_to_telegram(order)
            print(f"Order extracted: {order}, sent: {order_sent}")

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "reply": cleaned_reply,
                "order_sent": order_sent,
            }, ensure_ascii=False),
        }

    except Exception as e:
        print(f"Handler error: {type(e).__name__}: {e}")
        print(traceback.format_exc())
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "reply": "Ой, что-то связь прыгнула 😅 Давайте просто оставьте мне номер — менеджер перезвонит за 15 минут и всё посчитаем!"
            }, ensure_ascii=False),
        }
