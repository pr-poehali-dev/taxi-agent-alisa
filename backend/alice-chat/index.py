import json
import os
import re
import traceback
import urllib.request
import urllib.error
from typing import Optional

import psycopg2

TG_BOT_TOKEN = "8294092024:AAG29J99kYrTw5iCYy-f7afgO7T1iubyPSs"
TG_CHAT_ID = "-4725554768"


def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def log_session(session_id: str, utm: dict, user_ip: str) -> None:
    try:
        with db_conn() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO alice_sessions (session_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, user_ip) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (session_id) DO UPDATE SET last_activity = NOW(), messages_count = alice_sessions.messages_count + 1",
                (
                    session_id,
                    (utm or {}).get("utm_source"),
                    (utm or {}).get("utm_medium"),
                    (utm or {}).get("utm_campaign"),
                    (utm or {}).get("utm_term"),
                    (utm or {}).get("utm_content"),
                    user_ip,
                ),
            )
    except Exception as e:
        print(f"log_session failed: {e}")


def log_message(session_id: str, role: str, content: str) -> None:
    try:
        with db_conn() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO alice_messages (session_id, role, content) VALUES (%s, %s, %s)",
                (session_id, role, content[:5000]),
            )
            field = "last_user_message" if role == "user" else "last_alice_message"
            cur.execute(
                f"UPDATE alice_sessions SET {field} = %s WHERE session_id = %s",
                (content[:1000], session_id),
            )
    except Exception as e:
        print(f"log_message failed: {e}")


def get_custom_prompt() -> Optional[str]:
    try:
        with db_conn() as conn, conn.cursor() as cur:
            cur.execute("SELECT value FROM alice_settings WHERE key = 'system_prompt'")
            row = cur.fetchone()
            if row and row[0] and row[0].strip():
                return row[0]
    except Exception as e:
        print(f"get_custom_prompt failed: {e}")
    return None


def mark_order(session_id: str, order: dict) -> None:
    try:
        route = f"{order.get('from') or '?'} → {order.get('to') or '?'}"
        with db_conn() as conn, conn.cursor() as cur:
            cur.execute(
                "UPDATE alice_sessions SET order_sent = TRUE, order_phone = %s, order_route = %s, order_price = %s WHERE session_id = %s",
                (order.get("phone"), route, order.get("price"), session_id),
            )
    except Exception as e:
        print(f"mark_order failed: {e}")


def log_error(session_id: Optional[str], error_type: str, error_message: str, user_message: str = "") -> None:
    try:
        with db_conn() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO alice_errors (session_id, error_type, error_message, user_message) VALUES (%s, %s, %s, %s)",
                (session_id, error_type[:128], error_message[:2000], user_message[:1000]),
            )
            cur.execute(
                "UPDATE alice_sessions SET has_error = TRUE WHERE session_id = %s",
                (session_id,),
            )
    except Exception as e:
        print(f"log_error failed: {e}")
    # Сразу шлём алёрт в Telegram
    try:
        alert_text = (
            f"🚨 *АЛИСА СЛОМАЛАСЬ*\n\n"
            f"❌ *Тип ошибки:* `{error_type}`\n"
            f"📝 *Сообщение:* {error_message[:400]}\n\n"
            f"💬 *Что писал клиент:* {user_message[:200] or '—'}\n"
            f"🆔 *Сессия:* `{session_id or '—'}`"
        )
        url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"
        data_bytes = json.dumps({
            "chat_id": TG_CHAT_ID,
            "text": alert_text,
            "parse_mode": "Markdown",
        }).encode("utf-8")
        r = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(r, timeout=8) as resp:
            resp.read()
    except Exception as e:
        print(f"alert send failed: {e}")

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

🎯 ФОРМАТ ОТВЕТА — ВСЕГДА СТРОГО JSON:
Каждый твой ответ — это JSON-объект:
{
  "reply": "твой текст для клиента",
  "order_ready": true/false,
  "order": {
    "from": "город откуда (или null)",
    "to": "город куда (или null)",
    "date": "дата и время (или null)",
    "passengers": "число (или null)",
    "car_class": "Стандарт/Комфорт/Комфорт+/Минивэн (или null)",
    "price": "итоговая цена с ₽ (или null)",
    "phone": "телефон клиента в формате +7XXXXXXXXXX (или null)"
  }
}

Поле order_ready ставь true ТОЛЬКО когда:
1. Клиент дал номер телефона (даже если другие поля не все собраны — главное телефон + откуда/куда)
2. ИЛИ клиент попросил позвать оператора и оставил номер
В остальных случаях order_ready = false.

В поле "phone" нормализуй номер: «89225055125» → «+79225055125», «+7 (922) 505-51-25» → «+79225055125».

ВНИМАНИЕ: возвращай ТОЛЬКО валидный JSON, без markdown-обёрток ```json```, без лишнего текста."""


def send_to_telegram(order: dict, utm: dict = None) -> bool:
    """Отправка заявки в Telegram-бот"""
    try:
        text = (
            "🚖 *НОВАЯ ЗАЯВКА — Такси Дальняк*\n\n"
            f"📍 *Откуда:* {order.get('from') or '—'}\n"
            f"📍 *Куда:* {order.get('to') or '—'}\n"
            f"📅 *Дата/время:* {order.get('date') or '—'}\n"
            f"👥 *Пассажиров:* {order.get('passengers') or '—'}\n"
            f"🚗 *Класс:* {order.get('car_class') or '—'}\n"
            f"💰 *Стоимость:* {order.get('price') or '—'}\n"
            f"📱 *Телефон:* {order.get('phone') or '—'}"
        )
        if utm:
            text += "\n\n📊 *Источник:*"
            if utm.get("utm_source"):
                text += f"\n• Источник: {utm['utm_source']}"
            if utm.get("utm_campaign"):
                text += f"\n• Кампания: {utm['utm_campaign']}"
            term = utm.get("utm_term") or utm.get("utm_content")
            if term:
                text += f"\n• Запрос: {term}"
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


def parse_alice_response(raw: str):
    """Парсит ответ Алисы. Поддерживает JSON и обычный текст.
    Возвращает (reply_text, order_dict_or_none)"""
    if not raw or not raw.strip():
        return "", None

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```\s*$", "", cleaned)

    # Пробуем как JSON
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict) and "reply" in data:
            reply = (data.get("reply") or "").strip()
            order_ready = data.get("order_ready", False)
            order = data.get("order") or {}
            if order_ready and isinstance(order, dict) and order.get("phone"):
                return reply, order
            return reply, None
    except Exception:
        pass

    # fallback: обычный текст (без JSON-mode)
    # ищем телефон в тексте — если есть, считаем заявкой
    phone_match = re.search(r"(?:\+7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}", cleaned)
    if phone_match:
        phone_raw = re.sub(r"\D", "", phone_match.group(0))
        if phone_raw.startswith("8"):
            phone_raw = "7" + phone_raw[1:]
        phone = "+" + phone_raw
        return cleaned, {"phone": phone, "from": None, "to": None, "date": None,
                         "passengers": None, "car_class": None, "price": None}

    return cleaned, None


def handler(event: dict, context) -> dict:
    """Чат с Алисой — AI-менеджером Такси Дальняк"""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    session_id = None
    last_user_msg = ""
    try:
        body = json.loads(event.get("body", "{}"))
        messages = body.get("messages", [])
        utm = body.get("utm") or {}
        session_id = body.get("session_id") or "unknown"
        user_ip = (event.get("requestContext", {}).get("identity", {}) or {}).get("sourceIp", "")

        # последнее сообщение пользователя для логов и алёртов
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("text", "")
                break

        log_session(session_id, utm, user_ip)
        if last_user_msg:
            log_message(session_id, "user", last_user_msg)

        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            log_error(session_id, "NoAPIKey", "OPENAI_API_KEY not set", last_user_msg)
            return {
                "statusCode": 200,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({
                    "reply": "Здравствуйте! Я Алиса. У нас сейчас небольшая техническая пауза, но я могу передать вашу заявку менеджеру. Скажите маршрут и номер — он перезвонит за 15 минут!"
                }, ensure_ascii=False),
            }

        custom = get_custom_prompt()
        system_content = custom if custom else SYSTEM_PROMPT
        if utm:
            utm_lines = []
            term = utm.get("utm_term") or utm.get("utm_content") or utm.get("utm_campaign") or ""
            if term:
                utm_lines.append(f"Поисковый запрос клиента: «{term}»")
            if utm.get("utm_source"):
                utm_lines.append(f"Источник трафика: {utm['utm_source']}")
            if utm_lines:
                system_content += "\n\n📌 КОНТЕКСТ КЛИЕНТА (учитывай в общении):\n" + "\n".join(utm_lines) + "\n\nКлиент пришёл с этого запроса — постарайся опираться на него при первых уточнениях."

        openai_messages = [{"role": "system", "content": system_content}]
        for msg in messages[-20:]:
            openai_messages.append({
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["text"],
            })

        def call_deepseek(use_json_mode: bool) -> str:
            req_payload = {
                "model": "deepseek-chat",
                "messages": openai_messages,
                "max_tokens": 800,
                "temperature": 0.85,
            }
            if use_json_mode:
                req_payload["response_format"] = {"type": "json_object"}
            data_bytes = json.dumps(req_payload).encode("utf-8")
            r = urllib.request.Request(
                "https://api.deepseek.com/v1/chat/completions",
                data=data_bytes,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(r, timeout=25) as resp:
                d = json.loads(resp.read().decode("utf-8"))
                return d["choices"][0]["message"]["content"].strip()

        def try_call(messages_list, use_json: bool) -> str:
            req_payload = {
                "model": "deepseek-chat",
                "messages": messages_list,
                "max_tokens": 800,
                "temperature": 0.85,
            }
            if use_json:
                req_payload["response_format"] = {"type": "json_object"}
            data_bytes = json.dumps(req_payload).encode("utf-8")
            r = urllib.request.Request(
                "https://api.deepseek.com/v1/chat/completions",
                data=data_bytes,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(r, timeout=25) as resp:
                d = json.loads(resp.read().decode("utf-8"))
                return d["choices"][0]["message"]["content"].strip()

        reply = ""
        try:
            reply = try_call(openai_messages, use_json=True)
            if not reply or len(reply) < 5:
                reply = try_call(openai_messages, use_json=False)
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="ignore")
            log_error(session_id, f"DeepSeekHTTP{he.code}", err_body, last_user_msg)
            # Если виноват кастомный промпт — пробуем со встроенным
            if custom and he.code == 400:
                try:
                    fallback_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + openai_messages[1:]
                    reply = try_call(fallback_messages, use_json=False)
                    log_error(session_id, "CustomPromptRejected",
                              "Кастомный промпт отклонён DeepSeek (400). Использован встроенный.",
                              last_user_msg)
                except Exception as fb_err:
                    log_error(session_id, "FallbackFailed", str(fb_err), last_user_msg)
                    raise he
            else:
                raise
        except Exception as inner:
            log_error(session_id, type(inner).__name__, str(inner), last_user_msg)
            raise

        cleaned_reply, order = parse_alice_response(reply)
        order_sent = False
        if order:
            order_sent = send_to_telegram(order, utm)
            mark_order(session_id, order)
            print(f"Order extracted, sent: {order_sent}")

        if not cleaned_reply:
            cleaned_reply = "Секундочку, у меня тут связь моргнула 😅 Повторите, пожалуйста, ваш вопрос?"
            log_error(session_id, "EmptyReply", "DeepSeek returned empty content twice", last_user_msg)

        log_message(session_id, "alice", cleaned_reply)

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
        log_error(session_id, type(e).__name__, str(e) + "\n" + traceback.format_exc()[-1500:], last_user_msg)
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "reply": "Ой, что-то связь прыгнула 😅 Давайте просто оставьте мне номер — менеджер перезвонит за 15 минут и всё посчитаем!"
            }, ensure_ascii=False),
        }