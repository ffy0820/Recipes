from _db import get_all_recipes, create_recipe, json_response, parse_body, handle_options

def handler(event, context):
    method = event.get('httpMethod', event.get('method', 'GET'))
    
    if method == 'OPTIONS':
        return handle_options()
    
    if method == 'GET':
        recipes = get_all_recipes()
        return json_response(recipes)
    
    if method == 'POST':
        data = parse_body(event)
        rid = create_recipe(data)
        return json_response({'id': rid, 'message': '创建成功'}, 201)
    
    return json_response({'error': '方法不支持'}, 405)
