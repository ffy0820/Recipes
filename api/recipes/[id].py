import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from _db import get_recipe, update_recipe, delete_recipe, json_response, parse_body, handle_options

def handler(event, context):
    method = event.get('httpMethod', event.get('method', 'GET'))
    
    if method == 'OPTIONS':
        return handle_options()
    
    params = event.get('queryStringParameters', {}) or {}
    path_params = event.get('pathParameters', {}) or {}
    rid_str = path_params.get('id') or params.get('id')
    
    if not rid_str:
        return json_response({'error': '缺少 id 参数'}, 400)
    
    try:
        rid = int(rid_str)
    except ValueError:
        return json_response({'error': '无效的 id'}, 400)
    
    if method == 'GET':
        recipe = get_recipe(rid)
        if recipe:
            return json_response(recipe)
        return json_response({'error': '未找到'}, 404)
    
    if method == 'PUT':
        data = parse_body(event)
        success = update_recipe(rid, data)
        if success:
            return json_response({'message': '更新成功'})
        return json_response({'error': '未找到'}, 404)
    
    if method == 'DELETE':
        success = delete_recipe(rid)
        if success:
            return json_response({'message': '删除成功'})
        return json_response({'error': '未找到'}, 404)
    
    return json_response({'error': '方法不支持'}, 405)
