import { defineStore } from "pinia";
import { ref } from "vue";
import { ConnectionAdmin } from "../objects/Connection/ConnectionAdmin";
import { EntitySync } from "../objects/EntitySync/EntitySync";

export const useEntitySyncStore = defineStore('entitySync', () => {
  const isInit = ref(false);
  const store = ref(null);
  const object = ref<EntitySync>(null);
  let connection: ConnectionAdmin = null;

  async function init() {
    if (isInit.value) return;

    connection = new ConnectionAdmin();
    object.value = new EntitySync({ connection });
    store.value = await object.value.get();
    isInit.value = true;
  }

  async function get() {
    await init();
    return store.value;
  }

  async function destroy() {
    if (!isInit.value) return;
    await object.value.destroy();
    await connection.destroy();
  }

  return { store, get, destroy };
});