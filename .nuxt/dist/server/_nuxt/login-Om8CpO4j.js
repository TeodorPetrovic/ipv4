import { _ as __nuxt_component_1, a as __nuxt_component_0 } from "./Button-4AGFzmMi.js";
import { _ as __nuxt_component_1$1 } from "./FormGroup-CN0N3-7K.js";
import { _ as __nuxt_component_2, a as __nuxt_component_3 } from "./Alert-C9FQDeUX.js";
import { defineComponent, ref, mergeProps, withCtx, isRef, unref, createVNode, withKeys, openBlock, createBlock, createCommentVNode, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { n as navigateTo } from "../server.mjs";
import "tailwind-merge";
import "@vueuse/core";
import "./nuxt-link-DWjP78pb.js";
import "/home/runner/work/ipv4/ipv4/node_modules/ufo/dist/index.mjs";
import "ohash/utils";
import "./index-BOwImKzn.js";
import "@iconify/vue";
import "@iconify/utils/lib/css/icon";
import "/home/runner/work/ipv4/ipv4/node_modules/perfect-debounce/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/hookable/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/defu/dist/defu.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/home/runner/work/ipv4/ipv4/node_modules/unctx/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/home/runner/work/ipv4/ipv4/node_modules/klona/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/@unhead/vue/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    const name = ref("");
    const studentId = ref("");
    const loading = ref(false);
    const error = ref("");
    async function login() {
      if (!name.value.trim() || !studentId.value.trim()) {
        error.value = "Please enter both name and student ID";
        return;
      }
      loading.value = true;
      error.value = "";
      try {
        await $fetch("/api/auth/login", {
          method: "POST",
          body: { name: name.value.trim(), studentId: studentId.value.trim() }
        });
        navigateTo("/test");
      } catch (e) {
        error.value = e.data?.message || "Login failed";
      } finally {
        loading.value = false;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UCard = __nuxt_component_1;
      const _component_UFormGroup = __nuxt_component_1$1;
      const _component_UInput = __nuxt_component_2;
      const _component_UAlert = __nuxt_component_3;
      const _component_UButton = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50 flex items-center justify-center p-4" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_UCard, { class: "w-full max-w-md" }, {
        header: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="text-center"${_scopeId}><h1 class="text-2xl font-bold text-gray-900"${_scopeId}>IPv4 Test Platform</h1><p class="text-gray-500 mt-1"${_scopeId}>Enter your details to begin</p></div>`);
          } else {
            return [
              createVNode("div", { class: "text-center" }, [
                createVNode("h1", { class: "text-2xl font-bold text-gray-900" }, "IPv4 Test Platform"),
                createVNode("p", { class: "text-gray-500 mt-1" }, "Enter your details to begin")
              ])
            ];
          }
        }),
        footer: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_UButton, {
              block: "",
              size: "lg",
              loading: unref(loading),
              onClick: login
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Start Test`);
                } else {
                  return [
                    createTextVNode("Start Test")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_UButton, {
                block: "",
                size: "lg",
                loading: unref(loading),
                onClick: login
              }, {
                default: withCtx(() => [
                  createTextVNode("Start Test")
                ]),
                _: 1
              }, 8, ["loading"])
            ];
          }
        }),
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}>`);
            _push2(ssrRenderComponent(_component_UFormGroup, { label: "Full Name" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_UInput, {
                    modelValue: unref(name),
                    "onUpdate:modelValue": ($event) => isRef(name) ? name.value = $event : null,
                    placeholder: "Enter your full name",
                    size: "lg",
                    onKeyup: login
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UInput, {
                      modelValue: unref(name),
                      "onUpdate:modelValue": ($event) => isRef(name) ? name.value = $event : null,
                      placeholder: "Enter your full name",
                      size: "lg",
                      onKeyup: withKeys(login, ["enter"])
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_UFormGroup, { label: "Student ID" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_UInput, {
                    modelValue: unref(studentId),
                    "onUpdate:modelValue": ($event) => isRef(studentId) ? studentId.value = $event : null,
                    placeholder: "Enter your student ID",
                    size: "lg",
                    onKeyup: login
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_UInput, {
                      modelValue: unref(studentId),
                      "onUpdate:modelValue": ($event) => isRef(studentId) ? studentId.value = $event : null,
                      placeholder: "Enter your student ID",
                      size: "lg",
                      onKeyup: withKeys(login, ["enter"])
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            if (unref(error)) {
              _push2(ssrRenderComponent(_component_UAlert, {
                color: "red",
                title: unref(error)
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                createVNode(_component_UFormGroup, { label: "Full Name" }, {
                  default: withCtx(() => [
                    createVNode(_component_UInput, {
                      modelValue: unref(name),
                      "onUpdate:modelValue": ($event) => isRef(name) ? name.value = $event : null,
                      placeholder: "Enter your full name",
                      size: "lg",
                      onKeyup: withKeys(login, ["enter"])
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]),
                  _: 1
                }),
                createVNode(_component_UFormGroup, { label: "Student ID" }, {
                  default: withCtx(() => [
                    createVNode(_component_UInput, {
                      modelValue: unref(studentId),
                      "onUpdate:modelValue": ($event) => isRef(studentId) ? studentId.value = $event : null,
                      placeholder: "Enter your student ID",
                      size: "lg",
                      onKeyup: withKeys(login, ["enter"])
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]),
                  _: 1
                }),
                unref(error) ? (openBlock(), createBlock(_component_UAlert, {
                  key: 0,
                  color: "red",
                  title: unref(error)
                }, null, 8, ["title"])) : createCommentVNode("", true)
              ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=login-Om8CpO4j.js.map
