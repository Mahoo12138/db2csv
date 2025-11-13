<template>
  <div class="hero-container">
    <div class="hero-content">
      <h1 class="hero-title">DB2CSV 转换工具</h1>
      <p class="hero-subtitle">简单高效的数据库到CSV转换解决方案</p>
      <div class="hero-actions">
        <router-link to="/home" class="hero-button">
          开始使用
        </router-link>
      </div>
    </div>
    <div class="hero-features">
      <div class="feature">
        <h3>简单操作</h3>
        <p>只需几步，轻松将数据库文件转换为CSV格式</p>
      </div>
      <div class="feature">
        <h3>安全可靠</h3>
        <p>所有处理在本地完成，保障您的数据安全</p>
      </div>
      <div class="feature">
        <h3>灵活配置</h3>
        <p>支持自定义字段映射，满足您的特定需求</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Hero页面组件
</script>

<style scoped>
.hero-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-button {
  display: inline-block;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  background: white;
  color: #667eea;
  border-radius: 50px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.hero-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  background: #f8f9fa;
}

.hero-features {
  display: flex;
  gap: 2rem;
  max-width: 1000px;
  margin-top: 3rem;
}

.feature {
  flex: 1;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.feature:hover {
  transform: translateY(-5px);
}

.feature h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.feature p {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .hero-features {
    flex-direction: column;
  }
}
</style>