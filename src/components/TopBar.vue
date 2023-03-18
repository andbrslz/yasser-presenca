<template>
  <div class="topbar">
    <b-img
      src="https://mariliaeleonardo.com.br/adm/img/icones/logo_admin.jpg"
      class="logo"
    />
    <button class="close" title="Sair" @click="Close()">
      <b-icon-door-closed></b-icon-door-closed>
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    Close() {
      this.$swal
        .fire({
          title: "Confirmação",
          icon: "question",
          text: "Deseja realmente sair?",
          showCancelButton: true,
          confirmButtonColor: "#026379",
          confirmButtonText: "Sim",
          cancelButtonText: `Não`,
        })
        .then((result) => {
          if (result.isConfirmed) {
            if (localStorage.getItem("token_presenca"))
              localStorage.removeItem("token_presenca");
            this.$router.push({ name: "login" });
          }
        });
    },
  },
};
</script>

<style lang="scss">
.topbar {
  position: fixed;
  top: 0;
  width: 100%;
  height: 60px;
  user-select: none;
  background-color: #ffffff;
  border-bottom: 1px solid #fefefe;
  box-shadow: 0 2px 2px 0 rgb(0 0 0 / 14%), 0 1px 5px 0 rgb(0 0 0 / 12%),
    0 3px 1px -2px rgb(0 0 0 / 20%);
  z-index: 80;
  .logo {
    height: 50px;
  }
  .close {
    position: absolute;
    top: 15px;
    right: 10px;
    border: none;
    outline: none;
    background-color: transparent;
    svg {
      &:hover {
        color: #026379;
      }
    }
  }
}
</style>
