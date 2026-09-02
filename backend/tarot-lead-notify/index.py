import json
import os
import urllib.request
import urllib.parse


def handler(event: dict, context) -> dict:
    """Отправляет уведомление в Telegram о новой заявке (клик по кнопке MAX/Telegram на сайте таро)"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = {'Access-Control-Allow-Origin': '*'}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        body_data = json.loads(event.get('body', '{}') or '{}')
    except (json.JSONDecodeError, TypeError):
        body_data = {}

    source = body_data.get('source', 'unknown')
    page_url = body_data.get('page_url', '')

    source_labels = {
        'max': 'MAX',
        'telegram': 'Telegram',
    }
    source_label = source_labels.get(source, source)

    text = f"🔔 Новая заявка с сайта!\n\nКлик на кнопку: {source_label}\nСтраница: {page_url}"

    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')

    if bot_token and chat_id:
        telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = json.dumps({
            'chat_id': chat_id,
            'text': text
        }).encode('utf-8')
        req = urllib.request.Request(
            telegram_url,
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        try:
            urllib.request.urlopen(req, timeout=4)
        except Exception:
            pass

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'ok': True})
    }
