import { defineStore } from "pinia";
import { ref } from "vue";
import { ConnectionAdmin } from "../objects/Connection/ConnectionAdmin";
import { EntitySync } from "../objects/EntitySync/EntitySync";

export const useEntitySyncStore = defineStore('entitySync', () => {
  const isInit = ref(false);
  const store = ref(null);
  const object = ref(null);
  const connection = new ConnectionAdmin();

  async function init() {
    if (isInit.value) return;

    object.value = new EntitySync({ connection });
    store.value = await object.value.get();
    isInit.value = true;
  }

  async function get() {
    await init();
    return store.value;
  }

  async function del() {
    await object.value.delete();
    await connection.destroy();
  }

  return { store, get, del };
});