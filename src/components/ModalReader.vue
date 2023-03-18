<template>
  <div class="modal">
    <LoadingSend v-if="showLoading" />
    <b-row class="header">
      <b-col cols="10" sm="10" md="10" lg="10" xl="10">
        <span>CONFIRMAÇÃO</span>
      </b-col>
      <b-col cols="2" sm="2" md="2" lg="2" xl="2">
        <button class="close" @click="$emit('close')" title="Fechar">
          <b-icon-x />
        </button>
      </b-col>
    </b-row>
    <b-card no-body>
      <b-tabs content-class="tabs" v-model="currentTab" card justified>
        <b-tab title="QRCode" active>
          <b-row
            :class="{ fullscreen: fullscreen }"
            ref="wrapper"
            @fullscreenchange="onFullscreenChange"
            class="camera"
            v-if="currentTab === 0"
          >
            <qrcode-stream
              :camera="camera"
              :torch="torchActive"
              @init="onInit"
              :track="selectedTrack"
              @decode="onDecode"
            >
              <div class="buttons">
                <b-button
                  variant="light"
                  @click="fullscreen = !fullscreen"
                  title="Tela cheia"
                >
                  <b-icon-fullscreen v-if="!fullscreen" />
                  <b-icon-fullscreen-exit v-else />
                </b-button>
                <b-button
                  variant="light"
                  @click="torchActive = !torchActive"
                  v-if="!torchNotSupported"
                  title="Flash"
                >
                  <b-icon-lightbulb-fill v-if="!torchActive" />
                  <b-icon-lightbulb-off-fill v-else />
                </b-button>
                <b-button
                  variant="light"
                  @click="switchCamera"
                  v-if="!noFrontCamera"
                  title="Alternar camera"
                >
                  <b-icon-arrow-clockwise />
                </b-button>
              </div>
            </qrcode-stream>
          </b-row>
        </b-tab>
        <b-tab title="Código">
          <b-row>
            <b-col>
              <b-container>
                <b-form @submit="sendCode" v-if="currentTab === 1">
                  <b-row>
                    <b-col sm="12">
                      <label class="d-flex">*Número</label>
                      <b-form-input
                        v-model="code"
                        type="tel"
                        placeholder="Informe o número"
                      ></b-form-input>
                    </b-col>
                    <b-col sm="12" class="my-2">
                      <b-button
                        variant="outline-primary"
                        class="d-flex"
                        type="submit"
                        >Confirmar</b-button
                      >
                    </b-col>
                  </b-row>
                </b-form>
              </b-container>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab title="Nome" class="list">
          <template v-if="currentTab === 2">
            <div
              class="person"
              v-for="(person, index) in persons"
              :key="`person-${index}`"
              @click="confirmName(person.name, person.id)"
            >
              <div class="avatar">
                <span>
                  {{ getInitials(person.name) }}
                </span>
              </div>
              <div class="data">
                <strong>{{ person.name }}</strong>
                <p>
                  <a>{{ person.whatsapp }}</a>
                </p>
                <p>
                  <a>{{ person.email }}</a>
                </p>
                <p>{{ person.date }}</p>
              </div>
            </div>
          </template>
        </b-tab>
      </b-tabs>
    </b-card>
  </div>
</template>

<script>
import { QrcodeStream } from "vue-qrcode-reader";
import LoadingSend from "@/components/LoadingSend.vue";

export default {
  name: "ModalReader",
  components: {
    QrcodeStream,
    LoadingSend,
  },
  emits: ["insertPerson"],
  data() {
    return {
      showLoading: false,
      torchActive: false,
      torchNotSupported: false,
      fullscreen: false,
      camera: "rear",
      noRearCamera: false,
      noFrontCamera: false,
      selectedTrack: null,
      code: null,
      currentTab: 0,
      persons: [],
      Toast: this.$swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", this.$swal.stopTimer);
          toast.addEventListener("mouseleave", this.$swal.resumeTimer);
        },
      }),
    };
  },
  watch: {
    fullscreen(enterFullscreen) {
      if (enterFullscreen) {
        this.requestFullscreen();
      } else {
        this.exitFullscreen();
      }
    },
  },
  methods: {
    confirmName(name, code) {
      this.$swal
        .fire({
          title: "Confirmação",
          icon: "question",
          text: `Deseja realmente confirmar a presença de ${name}?`,
          showCancelButton: true,
          confirmButtonColor: "#026379",
          confirmButtonText: "Sim",
          cancelButtonText: `Não`,
        })
        .then(async (result) => {
          if (result.isConfirmed) {
            this.showLoading = true;
            await this.axios
              .post(
                process.env.VUE_APP_API_URL,
                { acao: "registrar-presenca", token: code },
                {
                  headers: {
                    Authorization:
                      "Bearer " + localStorage.getItem("token_presenca"),
                  },
                }
              )
              .then(({ data }) => {
                if (data.acao === "OK") {
                  const hasKey = "refreshToken" in data;
                  if (hasKey)
                    localStorage.setItem("token_presenca", data.refreshToken);
                  this.MessageSuccess(data.mensagem);
                  this.$emit("insertPerson", ...data.dados);
                  this.getPersons();
                } else {
                  this.ToastError(data.mensagem);
                }
                this.showLoading = false;
              })
              .catch(() => {
                this.showLoading = false;
                this.ToastError(
                  "Falha na comunicação com o servidor! Tente novamente mais tarde."
                );
              });
          }
        });
    },
    async getPersons() {
      this.showLoading = true;
      await this.axios
        .get(`${process.env.VUE_APP_API_URL}?acao=lista-nao-confirmados`, {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token_presenca"),
          },
        })
        .then(({ data }) => {
          this.showLoading = false;
          if (data.acao === "OK") {
            this.persons = data.registros.map((item) => ({
              id: item.id,
              name: item.nome,
              whatsapp: item.whatsapp,
              email: item.email,
              date: item.data_alteracao,
            }));
            const hasKey = "refreshToken" in data;
            if (hasKey)
              localStorage.setItem("token_presenca", data.refreshToken);
          } else {
            this.ToastError(data.mensagem);
          }
        })
        .catch(() => {
          this.showLoading = false;
          this.ToastError(
            "Falha na comunicação com o servidor! Tente novamente mais tarde."
          );
        });
    },
    async sendCode(event) {
      event.preventDefault();
      if (this.code && this.code.trim().length > 0) {
        this.showLoading = true;
        await this.axios
          .post(
            process.env.VUE_APP_API_URL,
            { acao: "registrar-presenca", token: this.code },
            {
              headers: {
                Authorization:
                  "Bearer " + localStorage.getItem("token_presenca"),
              },
            }
          )
          .then(({ data }) => {
            if (data.acao === "OK") {
              const hasKey = "refreshToken" in data;
              if (hasKey)
                localStorage.setItem("token_presenca", data.refreshToken);
              this.MessageSuccess(data.mensagem);
              this.$emit("insertPerson", ...data.dados);
              this.getPersons();
            } else {
              this.ToastError(data.mensagem);
            }
            this.showLoading = false;
            this.code = null;
          })
          .catch(() => {
            this.showLoading = false;
            this.ToastError(
              "Falha na comunicação com o servidor! Tente novamente mais tarde."
            );
          });
      } else {
        this.ToastError("Preencha o campo código");
      }
    },
    async onDecode(token) {
      if (token) {
        this.showLoading = true;
        this.pause();
        await this.axios
          .post(
            process.env.VUE_APP_API_URL,
            { acao: "registrar-presenca", token: token },
            {
              headers: {
                Authorization:
                  "Bearer " + localStorage.getItem("token_presenca"),
              },
            }
          )
          .then(({ data }) => {
            if (data.acao === "OK") {
              const hasKey = "refreshToken" in data;
              if (hasKey)
                localStorage.setItem("token_presenca", data.refreshToken);
              this.MessageSuccess(data.mensagem);
              this.$emit("insertPerson", ...data.dados);
              this.getPersons();
            } else {
              this.ToastError(data.mensagem);
            }
            this.showLoading = false;
          })
          .catch(() => {
            this.showLoading = false;
            this.ToastError(
              "Falha na comunicação com o servidor! Tente novamente mais tarde."
            );
          });
        await this.timeout(3000);
        this.unpause();
      }
    },
    unpause() {
      this.camera = "auto";
    },
    pause() {
      this.camera = "off";
    },
    timeout(ms) {
      return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });
    },
    switchCamera() {
      this.camera = this.camera === "rear" ? "front" : "rear";
    },
    async onInit(promise) {
      try {
        const { capabilities } = await promise;
        this.torchNotSupported = !capabilities.torch;
      } catch (error) {
        const triedFrontCamera = this.camera === "front";
        const triedRearCamera = this.camera === "rear";
        const cameraMissingError = error.name === "OverconstrainedError";
        if (triedRearCamera && cameraMissingError) {
          this.noRearCamera = true;
        }
        if (triedFrontCamera && cameraMissingError) {
          this.noFrontCamera = true;
        }
        if (error.name === "NotAllowedError") {
          this.ToastError("Você precisa dar permissão de acesso a camera");
        } else if (error.name === "NotFoundError") {
          this.ToastError("Nenhuma camera foi detectada");
        } else if (error.name === "NotSupportedError") {
          this.ToastError("Você precisa acessar utilizando o protocolo HTTPS");
        } else if (error.name === "NotReadableError") {
          this.ToastError("Sua camera já está sendo utilizada");
        } else if (error.name === "OverconstrainedError") {
          this.ToastError("A sua camera não tem suporte a este recurso");
        } else if (error.name === "StreamApiNotSupportedError") {
          this.ToastError("Seu browser não suporta este recurso");
        } else if (error.name === "InsecureContextError") {
          this.ToastError("Você precisa acessar utilizando o protocolo HTTPS");
        } else {
          this.ToastError(`Ocorreu um erro com a camera (${error.name})`);
        }
      }
    },
    onFullscreenChange() {
      this.fullscreen = document.fullscreenElement !== null;
    },
    requestFullscreen() {
      const elem = this.$refs.wrapper;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        elem.msRequestFullscreen();
      }
    },
    exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        /* IE/Edge */
        document.msExitFullscreen();
      }
    },
    paintOutline(detectedCodes, ctx) {
      for (const detectedCode of detectedCodes) {
        const [firstPoint, ...otherPoints] = detectedCode.cornerPoints;
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(firstPoint.x, firstPoint.y);
        for (const { x, y } of otherPoints) {
          ctx.lineTo(x, y);
        }
        ctx.lineTo(firstPoint.x, firstPoint.y);
        ctx.closePath();
        ctx.stroke();
      }
    },
    getInitials(name) {
      const fullName = name.split(" ");
      const firstName = fullName[0];
      const lastName = fullName[fullName.length - 1];
      if (lastName) {
        return firstName[0] + lastName[0];
      }
      return firstName[0] + firstName[1];
    },
    ToastError(msg) {
      this.Toast.fire({
        icon: "error",
        title: msg,
      });
    },
    MessageSuccess(txt) {
      this.$swal.fire({
        icon: "success",
        title: "Confirmação",
        text: txt,
      });
    },
  },
  created() {
    this.selectedTrack = this.paintOutline;
    this.getPersons();
  },
  mounted() {
    document.querySelector("body").style = "overflow: hidden !important;";
  },
  beforeDestroy() {
    document.querySelector("body").style = "overflow: auto !important;";
  },
};
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap");
.modal {
  position: fixed;
  display: block;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh !important;
  z-index: 90 !important;
  user-select: none;
  background-color: #ffffff;
  overflow: hidden;
  .header {
    position: relative;
    font-family: "Montserrat", sans-serif;
    font-weight: 800;
    font-size: 22px;
    background-color: #026379;
    color: #ffffff;
    text-transform: uppercase;
    height: 50px !important;
    z-index: 99999999999;
    span {
      display: block;
      margin-top: 8px;
      margin-left: 50px;
    }
    button {
      background-color: transparent !important;
      outline: none !important;
      border: none !important;
      float: right;
      margin-right: 5px;
      margin-top: 8px;
      &:hover {
        svg {
          color: #daf3f8;
        }
      }
      svg {
        color: #ffffff;
        font-size: 30px;
      }
    }
  }
  :deep(.qrcode-stream-wrapper) {
    padding: 0 !important;
  }
  :deep(.card-body:first-child),
  :deep(.card-body:last-child) {
    padding: 0 !important;
  }
  :deep(.nav-link) {
    color: #026379 !important;
    font-family: "Montserrat";
    font-weight: 600;
  }
  .tabs {
    height: 94vh !important;
    margin: 0;
    background-color: #ffffff;
    display: block;
    .list {
      background-color: #ffffff;
      width: 100vw;
      height: 85vh;
      overflow: auto;
      &::-webkit-scrollbar {
        width: 5px;
        height: 8px;
        background-color: #aaa;
      }
      &::-webkit-scrollbar-thumb {
        background: rgb(67, 67, 67);
      }
    }
    .person {
      display: block;
      padding: 15px 10px;
      width: 100%;
      display: flex;
      align-items: center;
      border-bottom: 1px dotted #026379;
      cursor: pointer;
      &:hover {
        background-color: #f5f5f5;
      }
      &:last-child {
        border: none !important;
      }
      .avatar {
        background-color: #026379;
        border-radius: 50%;
        padding: 10px;
        width: 60px;
        height: 60px;
        text-align: center;
        margin-right: 20px;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        span {
          font-family: "Montserrat";
          font-weight: 800;
          font-size: 2vh;
          margin: auto;
          display: block;
        }
      }
      .data {
        text-align: left;
        width: 85%;
        color: #313131;
        strong {
          display: block;
          width: 100% !important;
          color: #313131;
        }
        p {
          margin: unset;
          font-size: 14px;
          line-height: 22px !important;
          color: #313131;
          a {
            text-decoration: none;
            color: #313131;
          }
        }
      }
    }
  }
  .camera {
    position: relative;
    height: 84vh !important;
    background-color: #ffffff;
    margin: 0 !important;
    &.fullscreen {
      position: fixed;
      z-index: 1000;
      top: 0;
      bottom: 0;
      right: 0;
      left: 0;
    }
    .buttons {
      position: absolute;
      right: 15px;
      top: 5px;
      button {
        padding: 10px !important;
        width: 40px;
        height: 40px;
        margin: 5px;
      }
    }
  }
}
</style>
