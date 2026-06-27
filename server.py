"""
菜谱管理系统 - Flask 后端
数据库: SQLite
API: RESTful CRUD
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os

app = Flask(__name__, static_folder='.')
CORS(app)

DB_PATH = 'recipes.db'
JSON_PATH = 'data/recipes.json'
ADMIN_PASSWORD = 'caipu888'

# ========== 数据库初始化 ==========
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY
        )
    ''')
    conn.commit()

    cursor = conn.execute("SELECT id FROM recipes LIMIT 1")
    if cursor.fetchone() is None:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            recipes = json.load(f)
        for r in recipes:
            conn.execute("INSERT INTO recipes (id) VALUES (?)", (r['id'],))
            recipe_id = r['id']
            for ing in r.get('ingredients', []):
                conn.execute("INSERT INTO ingredients (recipe_id, name, amount, weight) VALUES (?,?,?,?)",
                             (recipe_id, ing['name'], ing['amount'], ing['weight']))
            for sea in r.get('seasonings', []):
                conn.execute("INSERT INTO seasonings (recipe_id, name, amount, weight) VALUES (?,?,?,?)",
                             (recipe_id, sea['name'], sea['amount'], sea['weight']))
            for i, step in enumerate(r.get('steps', [])):
                conn.execute("INSERT INTO steps (recipe_id, step_num, description) VALUES (?,?,?)",
                             (recipe_id, i+1, step['description']))
            for tip in r.get('tips', []):
                conn.execute("INSERT INTO tips (recipe_id, content) VALUES (?,?)", (recipe_id, tip))
            n = r.get('nutrition', {})
            conn.execute("INSERT INTO nutrition VALUES (?,?,?,?,?)",
                         (recipe_id, n.get('calories', 0), n.get('carbs', 0), n.get('protein', 0), n.get('fat', 0)))
            conn.execute("INSERT INTO recipe_info VALUES (?,?,?,?,?,?,?)",
                         (recipe_id, r['name'], r['category'], r.get('description',''), r.get('cookingTime',''), r.get('difficulty',''), r.get('servings','')))
        conn.commit()
    conn.close()

def init_tables():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS recipe_info (
            recipe_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT DEFAULT '家常菜',
            description TEXT DEFAULT '',
            cookingTime TEXT DEFAULT '',
            difficulty TEXT DEFAULT '简单',
            servings TEXT DEFAULT '',
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER,
            name TEXT,
            amount TEXT,
            weight TEXT,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS seasonings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER,
            name TEXT,
            amount TEXT,
            weight TEXT,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER,
            step_num INTEGER,
            description TEXT,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER,
            content TEXT,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS nutrition (
            recipe_id INTEGER PRIMARY KEY,
            calories REAL DEFAULT 0,
            carbs REAL DEFAULT 0,
            protein REAL DEFAULT 0,
            fat REAL DEFAULT 0,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );
        
        PRAGMA foreign_keys = ON;
    ''')
    conn.commit()
    conn.close()

# ========== 数据查询 ==========
def fetch_all_recipes():
    conn = get_db()
    recipes = []
    rows = conn.execute("SELECT r.id, ri.* FROM recipes r LEFT JOIN recipe_info ri ON r.id = ri.recipe_id ORDER BY r.id").fetchall()
    for row in rows:
        rid = row['id']
        ingredients = [dict(r) for r in conn.execute("SELECT name, amount, weight FROM ingredients WHERE recipe_id=?", (rid,)).fetchall()]
        seasonings = [dict(r) for r in conn.execute("SELECT name, amount, weight FROM seasonings WHERE recipe_id=?", (rid,)).fetchall()]
        steps = [dict(r) for r in conn.execute("SELECT step_num as step, description FROM steps WHERE recipe_id=? ORDER BY step_num", (rid,)).fetchall()]
        tips = [r['content'] for r in conn.execute("SELECT content FROM tips WHERE recipe_id=?", (rid,)).fetchall()]
        n = conn.execute("SELECT * FROM nutrition WHERE recipe_id=?", (rid,)).fetchone()
        nutrition = dict(n) if n else {}
        recipe = {
            "id": rid,
            "name": row['name'] or '',
            "category": row['category'] or '家常菜',
            "description": row['description'] or '',
            "ingredients": ingredients,
            "seasonings": seasonings,
            "steps": steps,
            "tips": tips,
            "cookingTime": row['cookingTime'] or '',
            "difficulty": row['difficulty'] or '简单',
            "servings": row['servings'] or '',
            "nutrition": {"calories": nutrition.get('calories', 0), "carbs": nutrition.get('carbs', 0), "protein": nutrition.get('protein', 0), "fat": nutrition.get('fat', 0)}
        }
        recipes.append(recipe)
    conn.close()
    return recipes

# ========== API 路由 ==========
@app.route('/api/recipes', methods=['GET'])
def api_get_recipes():
    recipes = fetch_all_recipes()
    return jsonify(recipes)

@app.route('/api/recipes/<int:rid>', methods=['GET'])
def api_get_recipe(rid):
    conn = get_db()
    recipes = fetch_all_recipes()
    conn.close()
    for r in recipes:
        if r['id'] == rid:
            return jsonify(r)
    return jsonify({"error": "未找到"}), 404

@app.route('/api/recipes', methods=['POST'])
def api_create_recipe():
    data = request.json
    conn = get_db()
    rid = conn.execute("SELECT COALESCE(MAX(id),0)+1 FROM recipes").fetchone()[0]
    conn.execute("INSERT INTO recipes (id) VALUES (?)", (rid,))
    _save_recipe(conn, rid, data)
    conn.commit()
    conn.close()
    return jsonify({"id": rid, "message": "创建成功"}), 201

@app.route('/api/recipes/<int:rid>', methods=['PUT'])
def api_update_recipe(rid):
    data = request.json
    conn = get_db()
    conn.execute("DELETE FROM ingredients WHERE recipe_id=?", (rid,))
    conn.execute("DELETE FROM seasonings WHERE recipe_id=?", (rid,))
    conn.execute("DELETE FROM steps WHERE recipe_id=?", (rid,))
    conn.execute("DELETE FROM tips WHERE recipe_id=?", (rid,))
    conn.execute("DELETE FROM nutrition WHERE recipe_id=?", (rid,))
    conn.execute("DELETE FROM recipe_info WHERE recipe_id=?", (rid,))
    _save_recipe(conn, rid, data)
    conn.commit()
    conn.close()
    return jsonify({"message": "更新成功"})

@app.route('/api/recipes/<int:rid>', methods=['DELETE'])
def api_delete_recipe(rid):
    conn = get_db()
    conn.execute("DELETE FROM recipes WHERE id=?", (rid,))
    conn.commit()
    conn.close()
    return jsonify({"message": "删除成功"})

def _save_recipe(conn, rid, data):
    conn.execute("INSERT INTO recipe_info VALUES (?,?,?,?,?,?,?)",
                 (rid, data['name'], data.get('category', '家常菜'), data.get('description', ''),
                  data.get('cookingTime', ''), data.get('difficulty', '简单'), data.get('servings', '')))
    for ing in data.get('ingredients', []):
        conn.execute("INSERT INTO ingredients (recipe_id, name, amount, weight) VALUES (?,?,?,?)",
                     (rid, ing['name'], ing.get('amount', ''), ing.get('weight', '')))
    for sea in data.get('seasonings', []):
        conn.execute("INSERT INTO seasonings (recipe_id, name, amount, weight) VALUES (?,?,?,?)",
                     (rid, sea['name'], sea.get('amount', ''), sea.get('weight', '')))
    for i, step in enumerate(data.get('steps', [])):
        conn.execute("INSERT INTO steps (recipe_id, step_num, description) VALUES (?,?,?)",
                     (rid, i+1, step['description']))
    for tip in data.get('tips', []):
        conn.execute("INSERT INTO tips (recipe_id, content) VALUES (?,?)", (rid, tip))
    n = data.get('nutrition', {})
    conn.execute("INSERT INTO nutrition VALUES (?,?,?,?,?)",
                 (rid, n.get('calories', 0), n.get('carbs', 0), n.get('protein', 0), n.get('fat', 0)))

@app.route('/api/export', methods=['GET'])
def api_export_json():
    recipes = fetch_all_recipes()
    os.makedirs('data', exist_ok=True)
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    return jsonify({"message": "已导出到 " + JSON_PATH, "count": len(recipes)})

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    if data.get('password') == ADMIN_PASSWORD:
        return jsonify({"token": "admin_authenticated"})
    return jsonify({"error": "密码错误"}), 401

# ========== 静态文件 ==========
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    print("=" * 50)
    print("  菜谱管理系统后端已启动")
    print("  前台: http://localhost:5000")
    print("  后台: http://localhost:5000/admin.html")
    print("  API:  http://localhost:5000/api/recipes")
    print("=" * 50)
    init_tables()
    init_db()
    app.run(port=5000, debug=True)
