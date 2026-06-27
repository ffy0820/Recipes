import json
import os

KV_RECIPES_KEY = 'recipes_data'
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'caipu888')

def _get_kv():
    try:
        from upstash_redis import Redis
        url = os.environ.get('KV_REST_API_URL')
        token = os.environ.get('KV_REST_API_TOKEN')
        if url and token:
            return Redis(url=url, token=token)
    except Exception:
        pass
    return None

def _fallback_recipes():
    try:
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'recipes.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def get_all_recipes():
    kv = _get_kv()
    if kv:
        try:
            data = kv.get(KV_RECIPES_KEY)
            if data:
                if isinstance(data, str):
                    return json.loads(data)
                return data
        except Exception:
            pass
    return _fallback_recipes()

def save_all_recipes(recipes):
    kv = _get_kv()
    if kv:
        kv.set(KV_RECIPES_KEY, json.dumps(recipes, ensure_ascii=False))
        return True
    return False

def get_recipe(rid):
    recipes = get_all_recipes()
    for r in recipes:
        if r['id'] == rid:
            return r
    return None

def create_recipe(data):
    recipes = get_all_recipes()
    if recipes:
        rid = max(r['id'] for r in recipes) + 1
    else:
        rid = 1
    recipe = {'id': rid}
    recipe.update(data)
    recipes.append(recipe)
    recipes.sort(key=lambda x: x['id'])
    save_all_recipes(recipes)
    return rid

def update_recipe(rid, data):
    recipes = get_all_recipes()
    for i, r in enumerate(recipes):
        if r['id'] == rid:
            data['id'] = rid
            recipes[i] = data
            save_all_recipes(recipes)
            return True
    return False

def delete_recipe(rid):
    recipes = get_all_recipes()
    new_recipes = [r for r in recipes if r['id'] != rid]
    if len(new_recipes) < len(recipes):
        save_all_recipes(new_recipes)
        return True
    return False

def verify_password(password):
    return password == ADMIN_PASSWORD

def json_response(body, status=200):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }

def parse_body(event):
    try:
        body = event.get('body', '')
        if body:
            if isinstance(body, bytes):
                body = body.decode('utf-8')
            return json.loads(body)
    except Exception:
        pass
    return {}

def handle_options():
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': ''
    }
