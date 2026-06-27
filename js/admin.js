const ADMIN_PASSWORD = 'caipu888';
let recipes = [];
let currentPage = 'list';
let editingId = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ========== 登录 ==========
function login() {
    const pwd = $('#login-password').value;
    if (pwd === ADMIN_PASSWORD) {
        $('#login-overlay').style.display = 'none';
        $('#app').style.display = 'flex';
        loadData();
    } else {
        $('#login-error').textContent = '密码错误，请重试';
        $('#login-password').value = '';
    }
}

$('#login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});

function logout() {
    $('#login-overlay').style.display = 'flex';
    $('#app').style.display = 'none';
    $('#login-password').value = '';
    $('#login-error').textContent = '';
    editingId = null;
}

// ========== 数据加载 ==========
async function loadData() {
    try {
        const res = await fetch('data/recipes.json');
        recipes = await res.json();
        $('#total-count').textContent = recipes.length;
        renderList();
    } catch (e) {
        showToast('加载数据失败', 'error');
    }
}

// ========== Toast ==========
let toastTimer;
function showToast(msg, type = 'success') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast ' + type + ' show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.className = 'toast', 2000);
}

// ========== 页面切换 ==========
function switchPage(page) {
    currentPage = page;
    editingId = null;
    $$('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    $(`.sidebar-nav a[data-page="${page}"]`).classList.add('active');

    const titles = { list: '菜谱列表', add: '新增菜谱', edit: '编辑菜谱', export: '导出数据' };
    $('#page-title').textContent = titles[page] || page;
    $('#search-input').style.display = page === 'list' ? 'inline-block' : 'none';

    if (page === 'list') renderList();
    else if (page === 'add') renderForm(null);
    else if (page === 'export') renderExport();
}

function handleSearch() {
    if (currentPage !== 'list') return;
    renderList($('#search-input').value);
}

// ========== 列表页 ==========
function renderList(search = '') {
    let list = recipes;
    if (search) {
        const s = search.toLowerCase();
        list = recipes.filter(r =>
            r.name.toLowerCase().includes(s) ||
            r.category.toLowerCase().includes(s) ||
            r.description.toLowerCase().includes(s)
        );
    }

    let html = '<div class="recipe-table"><div class="table-header">' +
        '<span>ID</span><span>菜名</span><span>分类</span><span>难度</span><span>时间</span><span>热量</span><span>操作</span></div>';

    if (list.length === 0) {
        html += '<div class="table-empty"><i class="fas fa-inbox"></i>暂无菜谱</div>';
    } else {
        list.forEach(r => {
            const cal = r.nutrition ? r.nutrition.calories + 'kcal' : '-';
            html += `<div class="table-row">
                <span class="col-hide">${r.id}</span>
                <span class="col-name">${r.name}</span>
                <span><span class="category-badge cat-${r.category}">${r.category}</span></span>
                <span class="col-hide">${r.difficulty}</span>
                <span class="col-hide">${r.cookingTime}</span>
                <span>${cal}</span>
                <span class="col-actions">
                    <button class="btn btn-sm btn-primary" onclick="editRecipe(${r.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-secondary" onclick="previewRecipe(${r.id})"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDelete(${r.id})"><i class="fas fa-trash"></i></button>
                </span>
            </div>`;
        });
    }
    html += '</div>';
    $('#content-area').innerHTML = html;
    $('#total-count').textContent = recipes.length;
}

// ========== 删除确认 ==========
function confirmDelete(id) {
    const recipe = recipes.find(r => r.id === id);
    $('#content-area').innerHTML = `
        <div class="confirm-overlay" onclick="if(event.target===this) this.parentElement.innerHTML=''">
            <div class="confirm-box">
                <h4>确认删除？</h4>
                <p>确定要删除「${recipe.name}」吗？此操作不可撤销。</p>
                <div class="btn-group" style="justify-content:center">
                    <button class="btn btn-secondary" onclick="switchPage('list')">取消</button>
                    <button class="btn btn-danger" onclick="deleteRecipe(${id})">确认删除</button>
                </div>
            </div>
        </div>`;
}

function deleteRecipe(id) {
    recipes = recipes.filter(r => r.id !== id);
    showToast('已删除', 'success');
    switchPage('list');
}

// ========== 新增/编辑表单 ==========
function editRecipe(id) {
    editingId = id;
    currentPage = 'edit';
    $$('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    $('#page-title').textContent = '编辑菜谱';
    $('#search-input').style.display = 'none';
    const recipe = recipes.find(r => r.id === id);
    renderForm(recipe);
}

function renderForm(recipe) {
    const isEdit = !!recipe;
    const r = recipe || {
        id: recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1,
        name: '', category: '家常菜', description: '',
        ingredients: [{ name: '', amount: '', weight: '' }],
        seasonings: [{ name: '', amount: '', weight: '' }],
        steps: [{ step: 1, description: '' }],
        tips: [''],
        cookingTime: '', difficulty: '简单', servings: '',
        nutrition: { calories: '', carbs: '', protein: '', fat: '' }
    };

    let html = `
    <form onsubmit="saveRecipe(event, ${isEdit})">
        <div class="card">
            <div class="card-title"><i class="fas fa-info-circle"></i> 基本信息</div>
            <div class="form-row">
                <div class="form-group">
                    <label>菜名 *</label>
                    <input type="text" name="name" value="${esc(r.name)}" required>
                </div>
                <div class="form-group">
                    <label>分类</label>
                    <select name="category">
                        <option ${r.category==='家常菜'?'selected':''}>家常菜</option>
                        <option ${r.category==='川菜'?'selected':''}>川菜</option>
                        <option ${r.category==='减脂餐'?'selected':''}>减脂餐</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>难度</label>
                    <select name="difficulty">
                        <option ${r.difficulty==='简单'?'selected':''}>简单</option>
                        <option ${r.difficulty==='中等'?'selected':''}>中等</option>
                        <option ${r.difficulty==='困难'?'selected':''}>困难</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>烹饪时间</label>
                    <input type="text" name="cookingTime" value="${esc(r.cookingTime)}" placeholder="如：15分钟">
                </div>
                <div class="form-group">
                    <label>人数</label>
                    <input type="text" name="servings" value="${esc(r.servings)}" placeholder="如：2人份">
                </div>
            </div>
            <div class="form-group">
                <label>简介</label>
                <textarea name="description" rows="2">${esc(r.description)}</textarea>
            </div>
        </div>

        <div class="card">
            <div class="card-title"><i class="fas fa-carrot"></i> 食材清单</div>
            <div class="dynamic-list" id="ingredients-list">
                ${renderDynamicItems(r.ingredients, ['食材名', '用量(生活)', '用量(克/毫升)'], 'ingredients')}
            </div>
            <button type="button" class="btn-add-item" onclick="addDynamicItem('ingredients', ['', '', ''])">
                <i class="fas fa-plus"></i> 添加食材
            </button>
        </div>

        <div class="card">
            <div class="card-title"><i class="fas fa-pepper-hot"></i> 调料清单</div>
            <div class="dynamic-list" id="seasonings-list">
                ${renderDynamicItems(r.seasonings, ['调料名', '用量(生活)', '用量(克/毫升)'], 'seasonings')}
            </div>
            <button type="button" class="btn-add-item" onclick="addDynamicItem('seasonings', ['', '', ''])">
                <i class="fas fa-plus"></i> 添加调料
            </button>
        </div>

        <div class="card">
            <div class="card-title"><i class="fas fa-list-ol"></i> 制作步骤</div>
            <div id="steps-list">`;

    r.steps.forEach((s, i) => {
        html += `<div class="step-item-admin">
            <div class="step-num">${i + 1}</div>
            <textarea name="step_${i}" placeholder="描述第${i + 1}步...">${esc(s.description)}</textarea>
            <button type="button" class="btn-remove" onclick="removeStep(this)" title="删除"><i class="fas fa-times"></i></button>
        </div>`;
    });

    html += `</div>
            <button type="button" class="btn-add-item" onclick="addStep()">
                <i class="fas fa-plus"></i> 添加步骤
            </button>
        </div>

        <div class="card">
            <div class="card-title"><i class="fas fa-lightbulb"></i> 烹饪小贴士</div>
            <div class="dynamic-list" id="tips-list">
                ${renderSimpleDynamicItems(r.tips, '小贴士', 'tips')}
            </div>
            <button type="button" class="btn-add-item" onclick="addSimpleDynamicItem('tips','')">
                <i class="fas fa-plus"></i> 添加小贴士
            </button>
        </div>

        <div class="card">
            <div class="card-title"><i class="fas fa-chart-pie"></i> 营养成分（每100克）</div>
            <div class="nutrition-grid-admin">
                <div class="nutrition-field">
                    <label>热量 (kcal)</label>
                    <input type="number" name="nutrition_cal" value="${r.nutrition?.calories || ''}" step="1" min="0" placeholder="kcal">
                </div>
                <div class="nutrition-field">
                    <label>碳水化合物 (g)</label>
                    <input type="number" name="nutrition_carbs" value="${r.nutrition?.carbs || ''}" step="0.1" min="0" placeholder="g">
                </div>
                <div class="nutrition-field">
                    <label>蛋白质 (g)</label>
                    <input type="number" name="nutrition_protein" value="${r.nutrition?.protein || ''}" step="0.1" min="0" placeholder="g">
                </div>
                <div class="nutrition-field">
                    <label>脂肪 (g)</label>
                    <input type="number" name="nutrition_fat" value="${r.nutrition?.fat || ''}" step="0.1" min="0" placeholder="g">
                </div>
            </div>
        </div>

        <div class="btn-group" style="margin-bottom:40px">
            <button type="submit" class="btn btn-success"><i class="fas fa-save"></i> 保存</button>
            <button type="button" class="btn btn-secondary" onclick="switchPage('list')">取消</button>
            ${isEdit ? `<button type="button" class="btn btn-primary" onclick="previewRecipe(${r.id}, true)"><i class="fas fa-eye"></i> 预览</button>` : ''}
        </div>
    </form>`;

    $('#content-area').innerHTML = html;
}

function renderDynamicItems(items, placeholders, prefix) {
    return items.map((item, i) => `
        <div class="dynamic-item">
            <input type="text" value="${esc(item.name || '')}" placeholder="${placeholders[0]}" data-prefix="${prefix}_name" data-idx="${i}">
            <input type="text" value="${esc(item.amount || '')}" placeholder="${placeholders[1]}" data-prefix="${prefix}_amount" data-idx="${i}" style="flex:0.7">
            <input type="text" value="${esc(item.weight || '')}" placeholder="${placeholders[2]}" data-prefix="${prefix}_weight" data-idx="${i}" style="flex:0.7">
            <button type="button" class="btn-remove" onclick="removeDynamicItem(this)" title="删除"><i class="fas fa-times"></i></button>
        </div>`).join('');
}

function renderSimpleDynamicItems(items, placeholder, prefix) {
    return items.map((item, i) => `
        <div class="dynamic-item">
            <input type="text" value="${esc(typeof item === 'string' ? item : '')}" placeholder="${placeholder}" data-prefix="${prefix}" data-idx="${i}">
            <button type="button" class="btn-remove" onclick="removeDynamicItem(this)" title="删除"><i class="fas fa-times"></i></button>
        </div>`).join('');
}

function addDynamicItem(prefix, defaults) {
    const listId = prefix + '-list';
    const list = document.getElementById(listId);
    const idx = list.querySelectorAll('.dynamic-item').length;
    const placeholders = { ingredients: ['食材名', '用量(生活)', '用量(克/毫升)'], seasonings: ['调料名', '用量(生活)', '用量(克/毫升)'] };

    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <input type="text" value="" placeholder="${placeholders[prefix][0]}" data-prefix="${prefix}_name" data-idx="${idx}">
        <input type="text" value="" placeholder="${placeholders[prefix][1]}" data-prefix="${prefix}_amount" data-idx="${idx}" style="flex:0.7">
        <input type="text" value="" placeholder="${placeholders[prefix][2]}" data-prefix="${prefix}_weight" data-idx="${idx}" style="flex:0.7">
        <button type="button" class="btn-remove" onclick="removeDynamicItem(this)" title="删除"><i class="fas fa-times"></i></button>`;
    list.appendChild(div);
    reindexDynamicItems(prefix);
}

function addSimpleDynamicItem(prefix, defaultValue) {
    const listId = prefix + '-list';
    const list = document.getElementById(listId);
    const idx = list.querySelectorAll('.dynamic-item').length;
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <input type="text" value="${esc(defaultValue)}" placeholder="小贴士" data-prefix="${prefix}" data-idx="${idx}">
        <button type="button" class="btn-remove" onclick="removeDynamicItem(this)" title="删除"><i class="fas fa-times"></i></button>`;
    list.appendChild(div);
}

function removeDynamicItem(btn) {
    const item = btn.closest('.dynamic-item');
    const parent = item.parentElement;
    item.remove();
    const prefix = parent.id ? parent.id.replace('-list', '') : '';
    if (prefix) reindexDynamicItems(prefix);
}

function reindexDynamicItems(prefix) {
    const list = document.getElementById(prefix + '-list');
    if (!list) return;
    const items = list.querySelectorAll('.dynamic-item');
    items.forEach((item, i) => {
        item.querySelectorAll('input').forEach(input => {
            input.dataset.idx = i;
        });
    });
}

function addStep() {
    const list = document.getElementById('steps-list');
    const idx = list.querySelectorAll('.step-item-admin').length;
    const div = document.createElement('div');
    div.className = 'step-item-admin';
    div.innerHTML = `
        <div class="step-num">${idx + 1}</div>
        <textarea name="step_${idx}" placeholder="描述第${idx + 1}步..."></textarea>
        <button type="button" class="btn-remove" onclick="removeStep(this)" title="删除"><i class="fas fa-times"></i></button>`;
    list.appendChild(div);
    reindexSteps();
}

function removeStep(btn) {
    btn.closest('.step-item-admin').remove();
    reindexSteps();
}

function reindexSteps() {
    const items = document.querySelectorAll('#steps-list .step-item-admin');
    items.forEach((item, i) => {
        item.querySelector('.step-num').textContent = i + 1;
        item.querySelector('textarea').name = 'step_' + i;
        item.querySelector('textarea').placeholder = '描述第' + (i + 1) + '步...';
    });
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========== 保存 ==========
function saveRecipe(event, isEdit) {
    event.preventDefault();
    const form = event.target;

    const collectDynamicList = (prefix) => {
        const inputs = form.querySelectorAll(`input[data-prefix^="${prefix}_name"]`);
        const items = [];
        inputs.forEach(inp => {
            const idx = inp.dataset.idx;
            const name = inp.value.trim();
            const amount = form.querySelector(`input[data-prefix="${prefix}_amount"][data-idx="${idx}"]`);
            const weight = form.querySelector(`input[data-prefix="${prefix}_weight"][data-idx="${idx}"]`);
            if (name) {
                items.push({ name, amount: amount ? amount.value.trim() : '', weight: weight ? weight.value.trim() : '' });
            }
        });
        return items;
    };

    const collectSimpleList = (prefix) => {
        const inputs = form.querySelectorAll(`input[data-prefix="${prefix}"]`);
        return Array.from(inputs).map(inp => inp.value.trim()).filter(v => v);
    };

    const steps = [];
    form.querySelectorAll('textarea[name^="step_"]').forEach(t => {
        const val = t.value.trim();
        if (val) { const idx = parseInt(t.name.split('_')[1]); steps.push({ step: idx + 1, description: val }); }
    });

    const nutrition = {
        calories: parseFloat(form.querySelector('[name="nutrition_cal"]').value) || 0,
        carbs: parseFloat(form.querySelector('[name="nutrition_carbs"]').value) || 0,
        protein: parseFloat(form.querySelector('[name="nutrition_protein"]').value) || 0,
        fat: parseFloat(form.querySelector('[name="nutrition_fat"]').value) || 0
    };

    const recipeData = {
        id: isEdit ? editingId : (recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1),
        name: form.name.value.trim(),
        category: form.category.value,
        description: form.description.value.trim(),
        ingredients: collectDynamicList('ingredients'),
        seasonings: collectDynamicList('seasonings'),
        steps: steps,
        tips: collectSimpleList('tips'),
        cookingTime: form.cookingTime.value.trim(),
        difficulty: form.difficulty.value,
        servings: form.servings.value.trim(),
        nutrition: nutrition
    };

    if (!recipeData.name) { showToast('请输入菜名', 'error'); return; }

    if (isEdit) {
        const idx = recipes.findIndex(r => r.id === editingId);
        if (idx >= 0) {
            recipeData.id = editingId;
            recipes[idx] = recipeData;
        }
    } else {
        recipes.push(recipeData);
    }

    showToast(isEdit ? '已更新' : '已新增', 'success');
    switchPage('list');
}

// ========== 预览 ==========
function previewRecipe(id, fromEdit) {
    const recipe = fromEdit
        ? buildRecipeFromForm()
        : recipes.find(r => r.id === id);

    if (!recipe) return;

    let html = `
    <div class="preview-overlay" onclick="if(event.target===this) this.remove()">
        <div class="preview-box">
            <div class="preview-header">
                <h3><i class="fas fa-eye"></i> ${recipe.name}</h3>
                <button class="btn btn-sm btn-secondary" onclick="this.closest('.preview-overlay').remove()"><i class="fas fa-times"></i></button>
            </div>
            <div class="preview-content">
                <h4>基本信息</h4>
                <p>分类：<span class="category-badge cat-${recipe.category}">${recipe.category}</span> | 难度：${recipe.difficulty} | 时间：${recipe.cookingTime} | ${recipe.servings}</p>
                <p>${recipe.description}</p>

                <h4>食材</h4>
                ${recipe.ingredients.filter(i=>i.name).map(i => `<p>${i.name} - ${i.amount} (${i.weight})</p>`).join('') || '<p>无</p>'}

                <h4>调料</h4>
                ${recipe.seasonings.filter(i=>i.name).map(i => `<p>${i.name} - ${i.amount} (${i.weight})</p>`).join('') || '<p>无</p>'}

                <h4>步骤</h4>
                ${recipe.steps.map(s => `<p><strong>${s.step}.</strong> ${s.description}</p>`).join('') || '<p>无</p>'}

                ${recipe.tips.length ? '<h4>小贴士</h4>' + recipe.tips.map(t => `<p>💡 ${t}</p>`).join('') : ''}

                ${recipe.nutrition && recipe.nutrition.calories ? `<h4>营养（每100g）</h4><p>热量：${recipe.nutrition.calories}kcal | 碳水：${recipe.nutrition.carbs}g | 蛋白质：${recipe.nutrition.protein}g | 脂肪：${recipe.nutrition.fat}g</p>` : ''}
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function buildRecipeFromForm() {
    const form = document.querySelector('form');
    const collectDynamicList = (prefix) => {
        const inputs = form.querySelectorAll(`input[data-prefix^="${prefix}_name"]`);
        const items = [];
        inputs.forEach(inp => {
            const idx = inp.dataset.idx;
            const name = inp.value.trim();
            const amount = form.querySelector(`input[data-prefix="${prefix}_amount"][data-idx="${idx}"]`);
            const weight = form.querySelector(`input[data-prefix="${prefix}_weight"][data-idx="${idx}"]`);
            if (name) items.push({ name, amount: amount?.value?.trim() || '', weight: weight?.value?.trim() || '' });
        });
        return items;
    };
    const collectSimpleList = (prefix) => {
        const inputs = form.querySelectorAll(`input[data-prefix="${prefix}"]`);
        return Array.from(inputs).map(inp => inp.value.trim()).filter(v => v);
    };
    const steps = [];
    form.querySelectorAll('textarea[name^="step_"]').forEach(t => {
        const val = t.value.trim();
        if (val) { const idx = parseInt(t.name.split('_')[1]); steps.push({ step: idx + 1, description: val }); }
    });
    return {
        name: form.name.value.trim(), category: form.category.value, description: form.description.value.trim(),
        ingredients: collectDynamicList('ingredients'), seasonings: collectDynamicList('seasonings'),
        steps, tips: collectSimpleList('tips'), cookingTime: form.cookingTime.value.trim(),
        difficulty: form.difficulty.value, servings: form.servings.value.trim(),
        nutrition: {
            calories: parseFloat(form.querySelector('[name="nutrition_cal"]').value) || 0,
            carbs: parseFloat(form.querySelector('[name="nutrition_carbs"]').value) || 0,
            protein: parseFloat(form.querySelector('[name="nutrition_protein"]').value) || 0,
            fat: parseFloat(form.querySelector('[name="nutrition_fat"]').value) || 0
        }
    };
}

// ========== 导出 ==========
function renderExport() {
    const json = JSON.stringify(recipes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const size = (blob.size / 1024).toFixed(1);

    $('#content-area').innerHTML = `
        <div class="export-area">
            <i class="fas fa-download"></i>
            <h3>导出菜谱数据</h3>
            <p>共 ${recipes.length} 道菜谱，JSON 文件大小约 ${size} KB<br>
            下载后替换 <code>data/recipes.json</code> 文件</p>
            <div class="export-btns">
                <a class="btn btn-primary" href="${url}" download="recipes.json"><i class="fas fa-download"></i> 下载 JSON</a>
                <button class="btn btn-secondary" onclick="copyJSON()"><i class="fas fa-copy"></i> 复制到剪贴板</button>
            </div>
            <div style="margin-top:30px;text-align:left">
                <h4 style="margin-bottom:10px">更新网站步骤：</h4>
                <ol style="color:#888;line-height:2;font-size:14px;padding-left:20px">
                    <li>下载 JSON 文件</li>
                    <li>替换 <code>d:/菜谱/data/recipes.json</code></li>
                    <li>终端执行: <code>git add . && git commit -m "更新菜谱" && git push</code></li>
                    <li>等待 1-2 分钟刷新网站即可</li>
                </ol>
            </div>
        </div>`;
}

function copyJSON() {
    const json = JSON.stringify(recipes, null, 2);
    navigator.clipboard.writeText(json).then(() => showToast('已复制到剪贴板'), () => showToast('复制失败，请手动操作', 'error'));
}

// ========== 导航事件 ==========
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        switchPage(page);
    });
});

// 快捷键
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const form = document.querySelector('form');
        if (form) {
            e.preventDefault();
            form.requestSubmit();
        }
    }
});
