from _db import get_all_recipes, json_response, handle_options
import json
import os

def handler(event, context):
    method = event.get('httpMethod', event.get('method', 'GET'))
    
    if method == 'OPTIONS':
        return handle_options()
    
    if method == 'GET':
        recipes = get_all_recipes()
        try:
            json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'recipes.json')
            os.makedirs(os.path.dirname(json_path), exist_ok=True)
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(recipes, f, ensure_ascii=False, indent=2)
        except Exception as e:
            return json_response({'message': '导出完成（仅内存）', 'count': len(recipes), 'error': str(e)})
        return json_response({'message': '已导出到 data/recipes.json', 'count': len(recipes)})
    
    return json_response({'error': '方法不支持'}, 405)
