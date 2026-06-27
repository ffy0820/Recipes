// 菜谱数据
let recipes = [];

// DOM元素
const recipeGrid = document.querySelector('.recipe-grid');
const modal = document.getElementById('recipeModal');
const modalBody = document.querySelector('.modal-body');
const closeModal = document.querySelector('.close');
const searchInput = document.querySelector('.search-box input');
const searchButton = document.querySelector('.search-box button');

// 加载菜谱数据
async function loadRecipes() {
    try {
        const response = await fetch('data/recipes.json');
        recipes = await response.json();
        displayRecipes(recipes);
    } catch (error) {
        console.error('加载菜谱数据失败:', error);
        recipeGrid.innerHTML = '<p class="error-message">加载菜谱数据失败，请刷新页面重试。</p>';
    }
}

// 显示菜谱卡片
function displayRecipes(recipesToDisplay) {
    recipeGrid.innerHTML = '';
    
    if (recipesToDisplay.length === 0) {
        recipeGrid.innerHTML = '<p class="no-results">没有找到匹配的菜谱。</p>';
        return;
    }
    
    recipesToDisplay.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.innerHTML = `
            <div class="recipe-image">
                <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(recipe.name + ' Chinese food dish on plate')}&image_size=landscape_4_3" 
                     alt="${recipe.name}" 
                     onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(recipe.name)}'">
            </div>
            <div class="recipe-info">
                <span class="recipe-category">${recipe.category}</span>
                <h4 class="recipe-title">${recipe.name}</h4>
                <p class="recipe-desc">${recipe.description}</p>
                <div class="recipe-meta">
                    <span><i class="fas fa-clock"></i> ${recipe.cookingTime}</span>
                    <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                    <span><i class="fas fa-users"></i> ${recipe.servings}</span>
                </div>
                ${recipe.nutrition ? `
                <div class="recipe-nutrition">
                    <span class="nutrition-tag cal"><i class="fas fa-fire"></i> ${recipe.nutrition.calories}kcal</span>
                    <span class="nutrition-tag carb"><i class="fas fa-bread-slice"></i> ${recipe.nutrition.carbs}g</span>
                    <span class="nutrition-tag protein"><i class="fas fa-drumstick-bite"></i> ${recipe.nutrition.protein}g</span>
                    <span class="nutrition-tag fat"><i class="fas fa-oil-can"></i> ${recipe.nutrition.fat}g</span>
                </div>
                ` : ''}
            </div>
        `;
        
        recipeCard.addEventListener('click', () => openRecipeDetail(recipe));
        recipeGrid.appendChild(recipeCard);
    });
}

// 打开菜谱详情
function openRecipeDetail(recipe) {
    const modalContent = `
        <div class="recipe-detail">
            <div class="recipe-header">
                <img class="recipe-header-image" 
                     src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(recipe.name + ' Chinese food dish beautiful presentation')}&image_size=landscape_16_9" 
                     alt="${recipe.name}"
                     onerror="this.src='https://via.placeholder.com/800x300?text=${encodeURIComponent(recipe.name)}'">
                <div class="recipe-header-overlay">
                    <span class="recipe-category">${recipe.category}</span>
                    <h2>${recipe.name}</h2>
                    <p class="recipe-desc">${recipe.description}</p>
                </div>
            </div>
            
            <div class="recipe-content">
                <div class="recipe-stats">
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <div class="stat-label">烹饪时间</div>
                        <div class="stat-value">${recipe.cookingTime}</div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-signal"></i>
                        <div class="stat-label">难度</div>
                        <div class="stat-value">${recipe.difficulty}</div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <div class="stat-label">人份</div>
                        <div class="stat-value">${recipe.servings}</div>
                    </div>
                </div>
                
                ${recipe.nutrition ? `
                <div class="recipe-section nutrition-section">
                    <h3><i class="fas fa-chart-pie"></i> 营养成分（每100克）</h3>
                    <div class="nutrition-grid">
                        <div class="nutrition-item calories">
                            <div class="nutrition-value">${recipe.nutrition.calories}</div>
                            <div class="nutrition-label">千卡(kcal)</div>
                        </div>
                        <div class="nutrition-item carbs">
                            <div class="nutrition-value">${recipe.nutrition.carbs}<span>g</span></div>
                            <div class="nutrition-label">碳水化合物</div>
                        </div>
                        <div class="nutrition-item protein">
                            <div class="nutrition-value">${recipe.nutrition.protein}<span>g</span></div>
                            <div class="nutrition-label">蛋白质</div>
                        </div>
                        <div class="nutrition-item fat">
                            <div class="nutrition-value">${recipe.nutrition.fat}<span>g</span></div>
                            <div class="nutrition-label">脂肪</div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="recipe-section">
                    <h3><i class="fas fa-carrot"></i> 食材清单</h3>
                    <div class="ingredients-grid">
                        ${recipe.ingredients.map(ingredient => `
                            <div class="ingredient-item">
                                <span class="ingredient-name">${ingredient.name}</span>
                                <span class="ingredient-amount">${ingredient.amount} (${ingredient.weight})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="recipe-section">
                    <h3><i class="fas fa-pepper-hot"></i> 调料用量</h3>
                    <div class="seasonings-grid">
                        ${recipe.seasonings.map(seasoning => `
                            <div class="seasoning-item">
                                <span class="seasoning-name">${seasoning.name}</span>
                                <div class="seasoning-detail">
                                    <span class="seasoning-amount">${seasoning.amount}</span>
                                    <span class="seasoning-weight">${seasoning.weight}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="recipe-section">
                    <h3><i class="fas fa-list-ol"></i> 制作步骤</h3>
                    <div class="steps-list">
                        ${recipe.steps.map(step => `
                            <div class="step-item">
                                <div class="step-number">${step.step}</div>
                                <div class="step-content">
                                    <p class="step-description">${step.description}</p>
                                </div>
                                <img class="step-image" 
                                     src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('Cooking step ' + step.step + ' for ' + recipe.name)}&image_size=square" 
                                     alt="步骤${step.step}"
                                     onerror="this.style.display='none'">
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${recipe.tips && recipe.tips.length > 0 ? `
                    <div class="recipe-section">
                        <h3><i class="fas fa-lightbulb"></i> 烹饪小贴士</h3>
                        <div class="tips-list">
                            ${recipe.tips.map(tip => `
                                <div class="tip-item">
                                    <i class="fas fa-exclamation-circle"></i>
                                    <p>${tip}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    modalBody.innerHTML = modalContent;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭模态框
function closeRecipeDetail() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 搜索菜谱
function searchRecipes() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        displayRecipes(recipes);
        return;
    }
    
    const filteredRecipes = recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(searchTerm) ||
        recipe.category.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm) ||
        recipe.ingredients.some(ingredient => 
            ingredient.name.toLowerCase().includes(searchTerm)
        ) ||
        recipe.seasonings.some(seasoning => 
            seasoning.name.toLowerCase().includes(searchTerm)
        )
    );
    
    displayRecipes(filteredRecipes);
}

// 按分类筛选菜谱
function filterByCategory(category) {
    const filteredRecipes = recipes.filter(recipe => recipe.category === category);
    displayRecipes(filteredRecipes);
    
    // 滚动到菜谱区域
    document.getElementById('popular').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// 显示全部菜谱
function showAllRecipes() {
    displayRecipes(recipes);
}

// 事件监听
closeModal.addEventListener('click', closeRecipeDetail);

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeRecipeDetail();
    }
});

searchButton.addEventListener('click', searchRecipes);

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchRecipes();
    }
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();
    
    // 添加滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 观察所有需要动画的元素
    document.querySelectorAll('.category-card, .recipe-card, .stat-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
});

// 键盘事件 - ESC关闭模态框
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'block') {
        closeRecipeDetail();
    }
});