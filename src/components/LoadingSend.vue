<template>
  <div class="overlay">
    <div class="loading">
      <div class="spinner">
        <b-spinner style="width: 8vh; height: 8vh"></b-spinner>
      </div>
      <div class="message">Processando ...</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LoadingSend",
};
</script>

<style lang="scss">
.overlay {
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 20;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  .loading {
    width: 30%;
    height: 35%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    .message {
      margin-top: 10px;
      font-size: 16px;
    }
  }
}
</style>
