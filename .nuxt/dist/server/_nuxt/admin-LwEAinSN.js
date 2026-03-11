import { _ as __nuxt_component_1, a as __nuxt_component_0 } from "./Button-4AGFzmMi.js";
import { _ as __nuxt_component_1$1 } from "./FormGroup-CN0N3-7K.js";
import { _ as __nuxt_component_2, a as __nuxt_component_3 } from "./Alert-C9FQDeUX.js";
import { defineComponent, ref, mergeProps, withCtx, unref, isRef, createVNode, withKeys, createTextVNode, openBlock, createBlock, createCommentVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import "tailwind-merge";
import "../server.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/home/runner/work/ipv4/ipv4/node_modules/hookable/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/unctx/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/home/runner/work/ipv4/ipv4/node_modules/defu/dist/defu.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/ufo/dist/index.mjs";
import "@vueuse/core";
import "/home/runner/work/ipv4/ipv4/node_modules/klona/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/@unhead/vue/dist/index.mjs";
import "@iconify/vue";
import "./nuxt-link-DWjP78pb.js";
import "ohash/utils";
import "./index-BOwImKzn.js";
import "@iconify/utils/lib/css/icon";
import "/home/runner/work/ipv4/ipv4/node_modules/perfect-debounce/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "admin",
  __ssrInlineRender: true,
  setup(__props) {
    const pin = ref("");
    const pinVerified = ref(false);
    const pinError = ref("");
    const startDate = ref("");
    const endDate = ref("");
    const duration = ref(60);
    const saving = ref(false);
    const saveMsg = ref("");
    const saveError = ref("");
    async function verifyPin() {
      pinError.value = "";
      try {
        await $fetch("/api/test/config", {
          method: "POST",
          body: { pin: pin.value, startDate: null, endDate: null, durationMinutes: 60, verifyOnly: true }
        });
        pinVerified.value = true;
        const config = await $fetch("/api/test/config");
        if (config.start_date) startDate.value = config.start_date.replace(" ", "T").slice(0, 16);
        if (config.end_date) endDate.value = config.end_date.replace(" ", "T").slice(0, 16);
        duration.value = config.duration_minutes || 60;
      } catch {
        pinError.value = "Invalid PIN";
      }
    }
    async function saveConfig() {
      saving.value = true;
      saveMsg.value = "";
      saveError.value = "";
      try {
        await $fetch("/api/test/config", {
          method: "POST",
          body: { pin: pin.value, startDate: startDate.value || null, endDate: endDate.value || null, durationMinutes: duration.value }
        });
        saveMsg.value = "Configuration saved successfully";
      } catch (e) {
        saveError.value = e.data?.message || "Failed to save";
      } finally {
        saving.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UCard = __nuxt_component_1;
      const _component_UFormGroup = __nuxt_component_1$1;
      const _component_UInput = __nuxt_component_2;
      const _component_UAlert = __nuxt_component_3;
      const _component_UButton = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50 flex items-center justify-center p-4" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_UCard, { class: "w-full max-w-lg" }, {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h1 class="text-xl font-bold text-gray-900"${_scopeId}>Admin Settings</h1>`);
          } else {
            return [
              createVNode("h1", { class: "text-xl font-bold text-gray-900" }, "Admin Settings")
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (!unref(pinVerified)) {
              _push2(`<div class="space-y-4"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_UFormGroup, { label: "Admin PIN" }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_UInput, {
                      modelValue: unref(pin),
                      "onUpdate:modelValue": ($event) => isRef(pin) ? pin.value = $event : null,
                      type: "password",
                      placeholder: "Enter PIN",
                      onKeyup: verifyPin
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_UInput, {
                        modelValue: unref(pin),
                        "onUpdate:modelValue": ($event) => isRef(pin) ? pin.value = $event : null,
                        type: "password",
                        placeholder: "Enter PIN",
                        onKeyup: withKeys(verifyPin, ["enter"])
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              if (unref(pinError)) {
                _push2(ssrRenderComponent(_component_UAlert, {
                  color: "red",
                  title: unref(pinError)
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              _push2(ssrRenderComponent(_component_UButton, { onClick: verifyPin }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`Verify PIN`);
                  } else {
                    return [
                      createTextVNode("Verify PIN")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              _push2(`<div class="space-y-4"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_UFormGroup, { label: "Test Start Date/Time" }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_UInput, {
                      modelValue: unref(startDate),
                      "onUpdate:modelValue": ($event) => isRef(startDate) ? startDate.value = $event : null,
                      type: "datetime-local"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_UInput, {
                        modelValue: unref(startDate),
                        "onUpdate:modelValue": ($event) => isRef(startDate) ? startDate.value = $event : null,
                        type: "datetime-local"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UFormGroup, { label: "Test End Date/Time" }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_UInput, {
                      modelValue: unref(endDate),
                      "onUpdate:modelValue": ($event) => isRef(endDate) ? endDate.value = $event : null,
                      type: "datetime-local"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_UInput, {
                        modelValue: unref(endDate),
                        "onUpdate:modelValue": ($event) => isRef(endDate) ? endDate.value = $event : null,
                        type: "datetime-local"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UFormGroup, { label: "Duration (minutes)" }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_UInput, {
                      modelValue: unref(duration),
                      "onUpdate:modelValue": ($event) => isRef(duration) ? duration.value = $event : null,
                      type: "number",
                      min: "1"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode(_component_UInput, {
                        modelValue: unref(duration),
                        "onUpdate:modelValue": ($event) => isRef(duration) ? duration.value = $event : null,
                        type: "number",
                        min: "1"
                      }, null, 8, ["modelValue", "onUpdate:modelValue"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              if (unref(saveMsg)) {
                _push2(ssrRenderComponent(_component_UAlert, {
                  color: "green",
                  title: unref(saveMsg)
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              if (unref(saveError)) {
                _push2(ssrRenderComponent(_component_UAlert, {
                  color: "red",
                  title: unref(saveError)
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
              _push2(ssrRenderComponent(_component_UButton, {
                loading: unref(saving),
                onClick: saveConfig
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`Save Configuration`);
                  } else {
                    return [
                      createTextVNode("Save Configuration")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div>`);
            }
          } else {
            return [
              !unref(pinVerified) ? (openBlock(), createBlock("div", {
                key: 0,
                class: "space-y-4"
              }, [
                createVNode(_component_UFormGroup, { label: "Admin PIN" }, {
                  default: withCtx(() => [
                    createVNode(_component_UInput, {
                      modelValue: unref(pin),
                      "onUpdate:modelValue": ($event) => isRef(pin) ? pin.value = $event : null,
                      type: "password",
                      placeholder: "Enter PIN",
                      onKeyup: withKeys(verifyPin, ["enter"])
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]),
                  _: 1
                }),
                unref(pinError) ? (openBlock(), createBlock(_component_UAlert, {
                  key: 0,
                  color: "red",
                  title: unref(pinError)
                }, null, 8, ["title"])) : createCommentVNode("", true),
                createVNode(_component_UButton, { onClick: verifyPin }, {
                  default: withCtx(() => [
                    createTextVNode("Verify PIN")
                  ]),
                  _: 1
                })
              ])) : (openBlock(), createBlock("div", {
                key: 1,
                class: "space-y-4"
              }, [
                createVNode(_component_UFormGroup, { label: "Test Start Date/Time" }, {
                  default: withCtx(() => [
                    createVNode(_component_UInput, {
                      modelValue: unref(startDate),
                      "onUpdate:modelValue": ($event) => isRef(startDate) ? startDate.value = $event : null,
                      type: "datetime-local"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]),
                  _: 1
                }),
                createVNode(_component_UFormGroup, { label: "Test End Date/Time" }, {
                  default: withCtx(() => [
                    createVNode(_component_UInput, {
                      modelValue: unref(endDate),
                      "onUpdate:modelValue": ($event) => isRef(endDate) ? endDate.value = $event : null,
                      type: "datetime-local"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]),
                  _: 1
                }),
                createVNode(_component_UFormGroup, { label: "Duration (minutes)" }, {
                  default: withCtx(() => [
                    createVNode(_component_UInput, {
                      modelValue: unref(duration),
                      "onUpdate:modelValue": ($event) => isRef(duration) ? duration.value = $event : null,
                      type: "number",
                      min: "1"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]),
                  _: 1
                }),
                unref(saveMsg) ? (openBlock(), createBlock(_component_UAlert, {
                  key: 0,
                  color: "green",
                  title: unref(saveMsg)
                }, null, 8, ["title"])) : createCommentVNode("", true),
                unref(saveError) ? (openBlock(), createBlock(_component_UAlert, {
                  key: 1,
                  color: "red",
                  title: unref(saveError)
                }, null, 8, ["title"])) : createCommentVNode("", true),
                createVNode(_component_UButton, {
                  loading: unref(saving),
                  onClick: saveConfig
                }, {
                  default: withCtx(() => [
                    createTextVNode("Save Configuration")
                  ]),
                  _: 1
                }, 8, ["loading"])
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=admin-LwEAinSN.js.map
