from _db import verify_password, json_response, parse_body, handle_options

def handler(event, context):
    method = event.get('httpMethod', event.get('method', 'POST'))
    
    if method == 'OPTIONS':
        return handle_options()
    
    if method == 'POST':
        data = parse_body(event)
        password = data.get('password', '')
        if verify_password(password):
            return json_response({'token': 'admin_authenticated'})
        return json_response({'error': '密码错误'}, 401)
    
    return json_response({'error': '方法不支持'}, 405)
