var recipes = [];
var recipeGrid = document.querySelector('.recipe-grid');
var modal = document.getElementById('recipeModal');
var modalBody = document.querySelector('.modal-body');
var closeModal = document.querySelector('.close');
var searchInput = document.querySelector('.search-box input');
var searchButton = document.querySelector('.search-box button');
var API = 'http://localhost:5000/api';
var STORAGE_KEY = 'caipu_recipes_data';

var foodColors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#f368e0','#ff6348','#7bed9f','#70a1ff','#ffa502'];
var foodEmojis = ['🍖','🍳','🥘','🍲','🥗','🍜','🦐','🥩','🍗','🥬','🥚','🧄'];

function getFoodColor(name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return foodColors[Math.abs(hash) % foodColors.length];
}

function getFoodEmoji(name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return foodEmojis[Math.abs(hash) % foodEmojis.length];
}

function recipeImageHtml(name) {
    var color = getFoodColor(name);
    var emoji = getFoodEmoji(name);
    return '<div class="recipe-img-placeholder" style="background:linear-gradient(135deg,' + color + ',' + color + 'cc)"><span class="recipe-img-emoji">' + emoji + '</span><span class="recipe-img-label">' + name + '</span></div>';
}

function stepImageHtml(name, num) {
    var color = getFoodColor(name);
    var emoji = getFoodEmoji(name);
    return '<div class="step-img-placeholder" style="background:linear-gradient(135deg,' + color + ',' + color + 'cc)"><span class="step-img-emoji">' + num + '</span></div>';
}

function loadRecipes() {
    fetch(API + '/recipes')
        .then(function(res) { return res.json(); })
        .then(function(data) {
            recipes = data;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            displayRecipes(recipes);
        })
        .catch(function() {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try { recipes = JSON.parse(stored); displayRecipes(recipes); return; }
                catch (e) { localStorage.removeItem(STORAGE_KEY); }
            }
            fetch('data/recipes.json').then(function(res) { return res.json(); }).then(function(data) {
                recipes = data;
                displayRecipes(recipes);
            }).catch(function() {
                recipeGrid.innerHTML = '<p class="error-message">加载菜谱数据失败，请刷新页面重试。</p>';
            });
        });
}

function displayRecipes(recipesToDisplay) {
    recipeGrid.innerHTML = '';
    if (recipesToDisplay.length === 0) {
        recipeGrid.innerHTML = '<p class="no-results">没有找到匹配的菜谱。</p>';
        return;
    }
    recipesToDisplay.forEach(function(recipe) {
        var recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        var nutritionHtml = '';
        if (recipe.nutrition) {
            nutritionHtml = '<div class="recipe-nutrition"><span class="nutrition-tag cal"><i class="fas fa-fire"></i> ' + recipe.nutrition.calories + 'kcal</span><span class="nutrition-tag carb"><i class="fas fa-bread-slice"></i> ' + recipe.nutrition.carbs + 'g</span><span class="nutrition-tag protein"><i class="fas fa-drumstick-bite"></i> ' + recipe.nutrition.protein + 'g</span><span class="nutrition-tag fat"><i class="fas fa-oil-can"></i> ' + recipe.nutrition.fat + 'g</span></div>';
        }
        recipeCard.innerHTML = '<div class="recipe-image">' + recipeImageHtml(recipe.name) + '</div><div class="recipe-info"><span class="recipe-category">' + recipe.category + '</span><h4 class="recipe-title">' + recipe.name + '</h4><p class="recipe-desc">' + recipe.description + '</p><div class="recipe-meta"><span><i class="fas fa-clock"></i> ' + recipe.cookingTime + '</span><span><i class="fas fa-signal"></i> ' + recipe.difficulty + '</span><span><i class="fas fa-users"></i> ' + recipe.servings + '</span></div>' + nutritionHtml + '</div>';
        recipeCard.addEventListener('click', function() { openRecipeDetail(recipe); });
        recipeGrid.appendChild(recipeCard);
    });
}

function openRecipeDetail(recipe) {
    var nutritionSection = '';
    if (recipe.nutrition) {
        nutritionSection = '<div class="recipe-section nutrition-section"><h3><i class="fas fa-chart-pie"></i> 营养成分（每100克）</h3><div class="nutrition-grid"><div class="nutrition-item calories"><div class="nutrition-value">' + recipe.nutrition.calories + '</div><div class="nutrition-label">千卡(kcal)</div></div><div class="nutrition-item carbs"><div class="nutrition-value">' + recipe.nutrition.carbs + '<span>g</span></div><div class="nutrition-label">碳水化合物</div></div><div class="nutrition-item protein"><div class="nutrition-value">' + recipe.nutrition.protein + '<span>g</span></div><div class="nutrition-label">蛋白质</div></div><div class="nutrition-item fat"><div class="nutrition-value">' + recipe.nutrition.fat + '<span>g</span></div><div class="nutrition-label">脂肪</div></div></div></div>';
    }
    var headerImg = '<div class="recipe-header-placeholder" style="background:linear-gradient(135deg,' + getFoodColor(recipe.name) + ',' + getFoodColor(recipe.name) + 'cc)"><span class="recipe-header-emoji">' + getFoodEmoji(recipe.name) + '</span><span class="recipe-header-title">' + recipe.name + '</span></div>';

    var stepsHtml = recipe.steps.map(function(step) {
        return '<div class="step-item"><div class="step-number">' + step.step + '</div><div class="step-content"><p class="step-description">' + step.description + '</p></div><div class="step-image">' + stepImageHtml(recipe.name, step.step) + '</div></div>';
    }).join('');

    var modalContent = '<div class="recipe-detail"><div class="recipe-header">' + headerImg + '<div class="recipe-header-overlay"><span class="recipe-category">' + recipe.category + '</span><h2>' + recipe.name + '</h2><p class="recipe-desc">' + recipe.description + '</p></div></div><div class="recipe-content"><div class="recipe-stats"><div class="stat-item"><i class="fas fa-clock"></i><div class="stat-label">烹饪时间</div><div class="stat-value">' + recipe.cookingTime + '</div></div><div class="stat-item"><i class="fas fa-signal"></i><div class="stat-label">难度</div><div class="stat-value">' + recipe.difficulty + '</div></div><div class="stat-item"><i class="fas fa-users"></i><div class="stat-label">人份</div><div class="stat-value">' + recipe.servings + '</div></div></div>' + nutritionSection + '<div class="recipe-section"><h3><i class="fas fa-carrot"></i> 食材清单</h3><div class="ingredients-grid">' + recipe.ingredients.map(function(i) { return '<div class="ingredient-item"><span class="ingredient-name">' + i.name + '</span><span class="ingredient-amount">' + i.amount + ' (' + i.weight + ')</span></div>'; }).join('') + '</div></div><div class="recipe-section"><h3><i class="fas fa-pepper-hot"></i> 调料用量</h3><div class="seasonings-grid">' + recipe.seasonings.map(function(s) { return '<div class="seasoning-item"><span class="seasoning-name">' + s.name + '</span><div class="seasoning-detail"><span class="seasoning-amount">' + s.amount + '</span><span class="seasoning-weight">' + s.weight + '</span></div></div>'; }).join('') + '</div></div><div class="recipe-section"><h3><i class="fas fa-list-ol"></i> 制作步骤</h3><div class="steps-list">' + stepsHtml + '</div></div>' + (recipe.tips && recipe.tips.length > 0 ? '<div class="recipe-section"><h3><i class="fas fa-lightbulb"></i> 烹饪小贴士</h3><div class="tips-list">' + recipe.tips.map(function(t) { return '<div class="tip-item"><i class="fas fa-exclamation-circle"></i><p>' + t + '</p></div>'; }).join('') + '</div></div>' : '') + '</div></div>';
    modalBody.innerHTML = modalContent;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeRecipeDetail() { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }

function searchRecipes() {
    var term = searchInput.value.trim().toLowerCase();
    if (term === '') { displayRecipes(recipes); return; }
    var filtered = recipes.filter(function(r) {
        return r.name.toLowerCase().indexOf(term) >= 0 || r.category.toLowerCase().indexOf(term) >= 0 || r.description.toLowerCase().indexOf(term) >= 0 || r.ingredients.some(function(i) { return i.name.toLowerCase().indexOf(term) >= 0; }) || r.seasonings.some(function(s) { return s.name.toLowerCase().indexOf(term) >= 0; });
    });
    displayRecipes(filtered);
}

function filterByCategory(category) {
    var filtered = recipes.filter(function(r) { return r.category === category; });
    displayRecipes(filtered);
    document.getElementById('popular').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showAllRecipes() { displayRecipes(recipes); }

closeModal.addEventListener('click', closeRecipeDetail);
window.addEventListener('click', function(event) { if (event.target === modal) closeRecipeDetail(); });
searchButton.addEventListener('click', searchRecipes);
searchInput.addEventListener('keypress', function(event) { if (event.key === 'Enter') searchRecipes(); });

document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    loadRecipes();
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.category-card, .recipe-card, .stat-item').forEach(function(el) {
        el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') closeRecipeDetail();
});
