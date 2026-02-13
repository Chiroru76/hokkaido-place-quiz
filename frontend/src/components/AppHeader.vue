<script setup lang="ts">
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <router-link to="/" class="header-brand">
        <img src="/icon.png" alt="よめるべ？北海道" class="brand-icon" />
        <img src="/header_title.png" alt="よめるべ？北海道" class="brand-title" />
      </router-link>

      <div class="header-actions">
        <router-link to="/favorites" custom v-slot="{ navigate }">
          <n-button @click="navigate" size="medium" square class="achievement-button">
            ❤️ お気に入り
          </n-button>
        </router-link>

        <router-link to="/achievement" custom v-slot="{ navigate }">
          <n-button
            @click="navigate"
            size="medium"
            square class="achievement-button">
            <img src="/hokkaido.png" alt="" class="achievement-icon" />
            市町村マップ
          </n-button>
        </router-link>
      </div>

    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 10px 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-icon {
  width: 50px;
  height: 40px;
}

.brand-title {
  height: 40px;
  width: auto;
}

.achievement-button {
  background: #f5f7f4;
  color: rgb(52, 51, 51);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.achievement-icon {
  width: 30px;
  height: 30px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
