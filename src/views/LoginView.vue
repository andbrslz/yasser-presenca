<template>
  <div class="page">
    <div class="box-login">
      <b-img
        src="img/logo_admin.jpg"
        class="logo"
      />
      <div class="data">
        <label>Informe o código</label>
        <b-form @submit="Entrar">
          <b-form-input v-model="code" :disabled="sending"></b-form-input>
          <b-button
            type="submit"
            variant="success"
            class="my-2"
            :disabled="sending"
            >{{ textSend }}</b-button
          >
        </b-form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LoginView",
  data() {
    return {
      code: null,
      textSend: "Entrar",
      sending: false,
      Toast: this.$swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", this.$swal.stopTimer);
          toast.addEventListener("mouseleave", this.$swal.resumeTimer);
        },
      }),
    };
  },
  methods: {
    async Entrar(event) {
      event.preventDefault();
      if (!this.code || this.code.trim().length <= 0)
        this.ToastError("Preencha o campo código");
      else {
        this.textSend = "Processando ...";
        this.sending = true;
        await this.axios
          .post(process.env.VUE_APP_API_URL, {
            acao: "login-presenca",
            codigo: this.code,
          })
          .then(({ data }) => {
            if (data.acao === "OK") {
              localStorage.setItem("token_presenca", data.token);
              this.$router.push({ name: "home" });
            } else {
              this.ToastError(data.mensagem);
            }
            this.sending = false;
            this.textSend = "Entrar";
          })
          .catch(() => {
            this.sending = false;
            this.textSend = "Entrar";
            this.ToastError(
              "Falha na comunicação com o servidor! Tente novamente mais tarde."
            );
          });
      }
    },
    ToastError(msg) {
      this.Toast.fire({
        icon: "error",
        title: msg,
      });
    },
  },
};
</script>

<style lang="scss">
.page {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #f5f5f5;
  background-size: cover;
  background-attachment: fixed;
  background-position: center;
  .box-login {
    background-color: #ffffff;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
    -webkit-box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
    height: 280px;
    width: 300px;
    margin: auto;
    .logo {
      margin-top: 30px;
      margin-bottom: 20px;
    }
    .data {
      margin-top: 20px;
      width: 70%;
      margin: auto;
      text-align: left;
    }
    label {
      font-weight: bold;
      margin-bottom: 5px;
    }
  }
}
</style>
