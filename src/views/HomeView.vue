<template>
  <div>
    <TopBar />
    <div class="list-persons">
      <div class="total" v-if="persons.length > 0">
        Total: {{ persons.length }}
      </div>
      <template v-if="showLoading">
        <div
          class="person-load"
          v-for="(_item, index) in 8"
          :key="`item-load-${index}`"
        >
          <b-skeleton type="avatar" height="60px" width="60px"></b-skeleton>
          <div class="data">
            <b-skeleton width="80%" class="my-1"></b-skeleton>
            <b-skeleton width="50%"></b-skeleton>
            <b-skeleton width="30%"></b-skeleton>
          </div>
        </div>
      </template>
      <template v-if="!showLoading && persons.length > 0">
        <div
          class="person"
          v-for="(person, index) in persons"
          :key="`person-${index}`"
        >
          <div class="avatar">
            {{ getInitials(person.name) }}
          </div>
          <div class="data">
            <strong>{{ person.name }}</strong>
            <p>
              <a
                :href="`https://api.whatsapp.com/send?phone=${onlyNumbers(
                  person.whatsapp
                )}&text=`"
                target="_blank"
                >{{ person.whatsapp }}</a
              >
            </p>
            <!-- <p>
              <a :href="`mailto:${person.email}`">{{ person.email }}</a>
            </p> -->
            <p>{{ person.date }}</p>
          </div>
        </div>
      </template>
      <template v-if="!showLoading && persons.length <= 0">
        <b-icon-emoji-frown class="empty-icon"></b-icon-emoji-frown>
        <span class="empty-text"> Nenhuma presença foi confirmada </span>
      </template>
    </div>
    <modal-reader
      @insertPerson="addPerson"
      @close="showReader = false"
      v-if="showReader"
    />
    <button class="add" @click="showReader = true">
      <b-icon-plus></b-icon-plus>
    </button>
  </div>
</template>

<script>
import TopBar from "@/components/TopBar.vue";
import ModalReader from "@/components/ModalReader.vue";
export default {
  name: "HomeView",
  components: {
    TopBar,
    ModalReader,
  },
  data() {
    return {
      showReader: false,
      showLoading: false,
      persons: [],
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
    async getPersons() {
      this.showLoading = true;
      await this.axios
        .get(`${process.env.VUE_APP_API_URL}?acao=lista-confirmados`, {
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
              // email: item.email,
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
    onlyNumbers(number) {
      return number.replace(/\D/g, "");
    },
    addPerson(person) {
      //Check exists
      const check = this.persons.filter(item => item.id === person.id);
      if (!check) {
        this.persons.push({
          id: person.id,
          name: person.nome,
          whatsapp: person.whatsapp,
          // email: person.email,
          date: person.data_alteracao,
        });
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
  },
  created() {
    this.getPersons();
  },
};
</script>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap");
body {
  &::-webkit-scrollbar {
    width: 5px;
    height: 8px;
    background-color: #aaa;
  }
  &::-webkit-scrollbar-thumb {
    background: rgb(67, 67, 67);
  }
}
.add {
  position: fixed;
  right: 20px;
  bottom: 20px;
  border: none;
  outline: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #026379;
  z-index: 10 !important;
  &:hover {
    background-color: #087e99;
  }
  svg {
    color: #ffffff;
    font-size: 30px;
  }
}
.empty-icon {
  display: block;
  margin: auto;
  margin-top: 30vh;
  font-size: 60px !important;
  color: #bdbdbd;
}
.empty-text {
  margin-top: 20px;
  display: block;
  width: 100%;
  color: #bdbdbd;
}
.list-persons {
  margin-top: 80px;
  .total {
    padding: 3px 5px;
    background-color: #d1d1d1;
    border-radius: 6px;
    font-weight: bold;
    font-size: 12px;
    float: right;
    margin-right: 10px;
  }
  .person {
    padding: 15px 10px;
    width: 100%;
    display: flex;
    align-items: center;
    border-bottom: 1px dotted #026379;
    &:last-child {
      border: none !important;
    }
    .avatar {
      background-color: #026379;
      border-radius: 50%;
      padding: 15px;
      width: 60px;
      height: 60px;
      color: #ffffff;
      font-family: "Montserrat";
      font-weight: 800;
      font-size: 20px;
      text-align: center;
      margin-right: 20px;
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
  .person-load {
    padding: 15px 10px;
    width: 100%;
    display: flex;
    border-bottom: 1px dotted #d1d1d1;
    &:last-child {
      border: none !important;
    }
    .avatar {
      padding: 15px;
      width: 60px;
      height: 60px;
      color: #ffffff;
      font-family: "Montserrat";
      font-weight: 800;
      font-size: 20px;
      text-align: center;
      margin-right: 20px;
    }
    .data {
      margin-left: 20px;
      text-align: left;
      width: 85%;
    }
  }
}
</style>
