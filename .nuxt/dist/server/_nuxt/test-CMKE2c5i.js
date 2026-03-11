import { _ as __nuxt_component_1, a as __nuxt_component_0, b as __nuxt_component_0$1 } from "./Button-4AGFzmMi.js";
import { _ as __nuxt_component_2, a as __nuxt_component_3 } from "./Alert-C9FQDeUX.js";
import { defineComponent, ref, withAsyncContext, computed, reactive, watch, mergeProps, unref, withCtx, openBlock, createBlock, createVNode, createCommentVNode, isRef, createTextVNode, withKeys, toDisplayString, Fragment, renderList, withDirectives, vModelText, vModelSelect, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { u as useFetch } from "./fetch-C4-Qf9a6.js";
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
import "/home/runner/work/ipv4/ipv4/node_modules/ohash/dist/index.mjs";
import "@vue/shared";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "test",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    function decimalToBinary(decimal) {
      return decimal.toString(2).padStart(8, "0");
    }
    function ipToBinary(ip) {
      return ip.split(".").map((o) => decimalToBinary(parseInt(o))).join(".");
    }
    function binaryToIp(binary) {
      return binary.split(".").map((o) => parseInt(o, 2).toString()).join(".");
    }
    function isValidIp(ip) {
      const parts = ip.split(".");
      if (parts.length !== 4) return false;
      return parts.every((p) => {
        const n = parseInt(p);
        return !isNaN(n) && n >= 0 && n <= 255;
      });
    }
    function compareIps(a, b) {
      return a.trim() === b.trim();
    }
    const decInput = ref("");
    const binInput = ref("");
    const convResult = ref("");
    const convError = ref("");
    function convertDecToBin() {
      convError.value = "";
      convResult.value = "";
      if (!isValidIp(decInput.value.trim())) {
        convError.value = "Invalid IP format";
        return;
      }
      convResult.value = ipToBinary(decInput.value.trim());
    }
    function convertBinToDec() {
      convError.value = "";
      convResult.value = "";
      const parts = binInput.value.trim().split(".");
      if (parts.length !== 4 || !parts.every((p) => /^[01]{8}$/.test(p))) {
        convError.value = "Use format: xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx";
        return;
      }
      convResult.value = binaryToIp(binInput.value.trim());
    }
    const { data: config } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/test/config",
      "$KqTKBFf2HI"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const now = ref(/* @__PURE__ */ new Date());
    const gateStatus = computed(() => {
      const cfg = config.value;
      if (!cfg?.start_date || !cfg?.end_date) return "open";
      const start = new Date(cfg.start_date);
      const end = new Date(cfg.end_date);
      const dur = cfg.duration_minutes || 60;
      if (new Date(start.getTime() + dur * 6e4) > end) return "invalid_config";
      if (now.value < start) return "not_started";
      if (now.value > end) return "ended";
      return "open";
    });
    const sessionId = ref(null);
    const tasks = ref(null);
    const submitted = ref(false);
    const submitting = ref(false);
    const gradeResult = ref(null);
    const loadError = ref("");
    const loading = ref(true);
    const answers = reactive({
      level1: [""],
      level2: ["", "", "", "", ""],
      level3: Array.from({ length: 5 }, () => ({ network: "", broadcast: "" })),
      level4: ["", "", "", "", ""],
      level5: ["", "", "", "", ""],
      level6: []
    });
    async function startTest() {
      loading.value = true;
      loadError.value = "";
      try {
        const res = await $fetch("/api/test/start", { method: "POST" });
        sessionId.value = res.sessionId;
        tasks.value = res.tasks;
        answers.level6 = Array.from({ length: res.tasks.level6.subnets.length }, () => ({ network: "", mask: "", broadcast: "" }));
      } catch (e) {
        loadError.value = e.data?.message || "Failed to load test";
      } finally {
        loading.value = false;
      }
    }
    async function submitAnswers() {
      if (!sessionId.value) return;
      submitting.value = true;
      try {
        const res = await $fetch("/api/test/submit", {
          method: "POST",
          body: { sessionId: sessionId.value, answers }
        });
        gradeResult.value = res;
        submitted.value = true;
      } catch (e) {
        loadError.value = e.data?.message || "Failed to submit";
      } finally {
        submitting.value = false;
      }
    }
    function isCorrect(level, idx, field) {
      if (!submitted.value || !tasks.value) return null;
      if (level === "level1") return compareIps(answers.level1[idx], tasks.value.level1[idx].decimal);
      if (level === "level2") return answers.level2[idx] === tasks.value.level2[idx].class;
      if (level === "level3") {
        if (field === "network") return compareIps(answers.level3[idx].network, tasks.value.level3[idx].networkAddr);
        if (field === "broadcast") return compareIps(answers.level3[idx].broadcast, tasks.value.level3[idx].broadcastAddr);
      }
      if (level === "level4") return parseInt(answers.level4[idx]) === tasks.value.level4[idx].hostCount;
      if (level === "level5") return answers.level5[idx] === (tasks.value.level5[idx].sameNetwork ? "Yes" : "No");
      if (level === "level6") {
        if (field === "network") return compareIps(answers.level6[idx].network, tasks.value.level6.subnets[idx].networkAddr);
        if (field === "mask") return compareIps(answers.level6[idx].mask, tasks.value.level6.subnets[idx].mask);
        if (field === "broadcast") return compareIps(answers.level6[idx].broadcast, tasks.value.level6.subnets[idx].broadcastAddr);
      }
      return null;
    }
    function fieldClass(correct) {
      if (correct === null) return "border-gray-300";
      return correct ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50";
    }
    watch(gateStatus, (val) => {
      if (val === "open" && !tasks.value && !loading.value) {
        loading.value = true;
        startTest();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UCard = __nuxt_component_1;
      const _component_UInput = __nuxt_component_2;
      const _component_UButton = __nuxt_component_0;
      const _component_UIcon = __nuxt_component_0$1;
      const _component_UAlert = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))}>`);
      if (unref(gateStatus) !== "open") {
        _push(`<div class="min-h-screen flex items-center justify-center p-4">`);
        _push(ssrRenderComponent(_component_UCard, { class: "max-w-md w-full text-center" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (unref(gateStatus) === "not_started") {
                _push2(`<div class="py-8"${_scopeId}><p class="text-xl font-semibold text-gray-700"${_scopeId}>Test Has Not Started Yet</p><p class="text-gray-500 mt-2"${_scopeId}>Please wait for the test to begin.</p></div>`);
              } else if (unref(gateStatus) === "ended") {
                _push2(`<div class="py-8"${_scopeId}><p class="text-xl font-semibold text-gray-700"${_scopeId}>Test Has Ended</p><p class="text-gray-500 mt-2"${_scopeId}>Submissions are no longer accepted.</p></div>`);
              } else if (unref(gateStatus) === "invalid_config") {
                _push2(`<div class="py-8"${_scopeId}><p class="text-xl font-semibold text-red-600"${_scopeId}>Invalid Test Configuration</p><p class="text-gray-500 mt-2"${_scopeId}>Test duration exceeds the allowed window. Please contact your administrator.</p></div>`);
              } else {
                _push2(`<!---->`);
              }
            } else {
              return [
                unref(gateStatus) === "not_started" ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "py-8"
                }, [
                  createVNode("p", { class: "text-xl font-semibold text-gray-700" }, "Test Has Not Started Yet"),
                  createVNode("p", { class: "text-gray-500 mt-2" }, "Please wait for the test to begin.")
                ])) : unref(gateStatus) === "ended" ? (openBlock(), createBlock("div", {
                  key: 1,
                  class: "py-8"
                }, [
                  createVNode("p", { class: "text-xl font-semibold text-gray-700" }, "Test Has Ended"),
                  createVNode("p", { class: "text-gray-500 mt-2" }, "Submissions are no longer accepted.")
                ])) : unref(gateStatus) === "invalid_config" ? (openBlock(), createBlock("div", {
                  key: 2,
                  class: "py-8"
                }, [
                  createVNode("p", { class: "text-xl font-semibold text-red-600" }, "Invalid Test Configuration"),
                  createVNode("p", { class: "text-gray-500 mt-2" }, "Test duration exceeds the allowed window. Please contact your administrator.")
                ])) : createCommentVNode("", true)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<div class="flex gap-0"><aside class="hidden lg:block w-72 shrink-0"><div class="sticky top-4 m-4">`);
        _push(ssrRenderComponent(_component_UCard, null, {
          header: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<h3 class="font-semibold text-gray-800"${_scopeId}>IP Converter</h3>`);
            } else {
              return [
                createVNode("h3", { class: "font-semibold text-gray-800" }, "IP Converter")
              ];
            }
          }),
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="space-y-4"${_scopeId}><div${_scopeId}><p class="text-sm font-medium text-gray-700 mb-1"${_scopeId}>Decimal → Binary</p><div class="flex gap-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_UInput, {
                modelValue: unref(decInput),
                "onUpdate:modelValue": ($event) => isRef(decInput) ? decInput.value = $event : null,
                placeholder: "192.168.1.1",
                size: "sm",
                class: "flex-1",
                onKeyup: convertDecToBin
              }, null, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UButton, {
                size: "sm",
                onClick: convertDecToBin
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`Go`);
                  } else {
                    return [
                      createTextVNode("Go")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div></div><div${_scopeId}><p class="text-sm font-medium text-gray-700 mb-1"${_scopeId}>Binary → Decimal</p><div class="flex gap-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_UInput, {
                modelValue: unref(binInput),
                "onUpdate:modelValue": ($event) => isRef(binInput) ? binInput.value = $event : null,
                placeholder: "11000000.10101000.00000001.00000001",
                size: "sm",
                class: "flex-1",
                onKeyup: convertBinToDec
              }, null, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_UButton, {
                size: "sm",
                onClick: convertBinToDec
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`Go`);
                  } else {
                    return [
                      createTextVNode("Go")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div></div>`);
              if (unref(convResult)) {
                _push2(`<div class="p-2 bg-green-50 border border-green-200 rounded text-sm font-mono break-all text-green-800"${_scopeId}>${ssrInterpolate(unref(convResult))}</div>`);
              } else {
                _push2(`<!---->`);
              }
              if (unref(convError)) {
                _push2(`<div class="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700"${_scopeId}>${ssrInterpolate(unref(convError))}</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              return [
                createVNode("div", { class: "space-y-4" }, [
                  createVNode("div", null, [
                    createVNode("p", { class: "text-sm font-medium text-gray-700 mb-1" }, "Decimal → Binary"),
                    createVNode("div", { class: "flex gap-2" }, [
                      createVNode(_component_UInput, {
                        modelValue: unref(decInput),
                        "onUpdate:modelValue": ($event) => isRef(decInput) ? decInput.value = $event : null,
                        placeholder: "192.168.1.1",
                        size: "sm",
                        class: "flex-1",
                        onKeyup: withKeys(convertDecToBin, ["enter"])
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_UButton, {
                        size: "sm",
                        onClick: convertDecToBin
                      }, {
                        default: withCtx(() => [
                          createTextVNode("Go")
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  createVNode("div", null, [
                    createVNode("p", { class: "text-sm font-medium text-gray-700 mb-1" }, "Binary → Decimal"),
                    createVNode("div", { class: "flex gap-2" }, [
                      createVNode(_component_UInput, {
                        modelValue: unref(binInput),
                        "onUpdate:modelValue": ($event) => isRef(binInput) ? binInput.value = $event : null,
                        placeholder: "11000000.10101000.00000001.00000001",
                        size: "sm",
                        class: "flex-1",
                        onKeyup: withKeys(convertBinToDec, ["enter"])
                      }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                      createVNode(_component_UButton, {
                        size: "sm",
                        onClick: convertBinToDec
                      }, {
                        default: withCtx(() => [
                          createTextVNode("Go")
                        ]),
                        _: 1
                      })
                    ])
                  ]),
                  unref(convResult) ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "p-2 bg-green-50 border border-green-200 rounded text-sm font-mono break-all text-green-800"
                  }, toDisplayString(unref(convResult)), 1)) : createCommentVNode("", true),
                  unref(convError) ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700"
                  }, toDisplayString(unref(convError)), 1)) : createCommentVNode("", true)
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></aside><main class="flex-1 p-4 max-w-4xl"><div class="mb-6 bg-slate-800 rounded-lg p-4 text-white text-center"><h1 class="text-xl font-semibold">IPv4 Network Exercises</h1><p class="text-slate-300 text-sm mt-1">Computer Science | Network Engineering</p></div>`);
        if (unref(loading)) {
          _push(`<div class="flex justify-center py-16">`);
          _push(ssrRenderComponent(_component_UIcon, {
            name: "i-heroicons-arrow-path",
            class: "animate-spin w-8 h-8 text-gray-500"
          }, null, _parent));
          _push(`</div>`);
        } else if (unref(loadError)) {
          _push(`<div class="py-8">`);
          _push(ssrRenderComponent(_component_UAlert, {
            color: "red",
            title: unref(loadError)
          }, null, _parent));
          _push(`</div>`);
        } else if (unref(tasks)) {
          _push(`<div class="space-y-6">`);
          if (unref(submitted) && unref(gradeResult)) {
            _push(ssrRenderComponent(_component_UCard, {
              class: ["border-2", unref(gradeResult).percentage >= 70 ? "border-green-400" : "border-orange-400"]
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="text-center py-2"${_scopeId}><p class="${ssrRenderClass([unref(gradeResult).percentage >= 70 ? "text-green-600" : "text-orange-600", "text-3xl font-bold"])}"${_scopeId}>${ssrInterpolate(unref(gradeResult).percentage)}%</p><p class="text-gray-600"${_scopeId}>${ssrInterpolate(unref(gradeResult).score)} / ${ssrInterpolate(unref(gradeResult).total)} correct answers</p></div>`);
                } else {
                  return [
                    createVNode("div", { class: "text-center py-2" }, [
                      createVNode("p", {
                        class: ["text-3xl font-bold", unref(gradeResult).percentage >= 70 ? "text-green-600" : "text-orange-600"]
                      }, toDisplayString(unref(gradeResult).percentage) + "%", 3),
                      createVNode("p", { class: "text-gray-600" }, toDisplayString(unref(gradeResult).score) + " / " + toDisplayString(unref(gradeResult).total) + " correct answers", 1)
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(ssrRenderComponent(_component_UCard, null, {
            header: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<h2 class="font-semibold text-gray-800"${_scopeId}>Level 1 – Binary to Decimal Conversion</h2><p class="text-sm text-gray-500"${_scopeId}>Convert the binary network address to decimal format</p>`);
              } else {
                return [
                  createVNode("h2", { class: "font-semibold text-gray-800" }, "Level 1 – Binary to Decimal Conversion"),
                  createVNode("p", { class: "text-sm text-gray-500" }, "Convert the binary network address to decimal format")
                ];
              }
            }),
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<table class="w-full text-sm"${_scopeId}><thead${_scopeId}><tr class="bg-gray-50"${_scopeId}><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Binary</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Decimal</th></tr></thead><tbody${_scopeId}><!--[-->`);
                ssrRenderList(unref(tasks).level1, (task, i) => {
                  _push2(`<tr class="border-t"${_scopeId}><td class="p-2 font-mono text-gray-700"${_scopeId}>${ssrInterpolate(task.binary)}</td><td class="p-2"${_scopeId}><input${ssrRenderAttr("value", unref(answers).level1[i])}${ssrIncludeBooleanAttr(unref(submitted)) ? " disabled" : ""} placeholder="xxx.xxx.xxx.xxx" class="${ssrRenderClass([fieldClass(isCorrect("level1", i)), "w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"])}"${_scopeId}>`);
                  if (unref(submitted) && !isCorrect("level1", i)) {
                    _push2(`<p class="text-xs text-green-700 mt-1"${_scopeId}>✓ ${ssrInterpolate(task.decimal)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
              } else {
                return [
                  createVNode("table", { class: "w-full text-sm" }, [
                    createVNode("thead", null, [
                      createVNode("tr", { class: "bg-gray-50" }, [
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Binary"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Decimal")
                      ])
                    ]),
                    createVNode("tbody", null, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(tasks).level1, (task, i) => {
                        return openBlock(), createBlock("tr", {
                          key: i,
                          class: "border-t"
                        }, [
                          createVNode("td", { class: "p-2 font-mono text-gray-700" }, toDisplayString(task.binary), 1),
                          createVNode("td", { class: "p-2" }, [
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(answers).level1[i] = $event,
                              disabled: unref(submitted),
                              placeholder: "xxx.xxx.xxx.xxx",
                              class: ["w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400", fieldClass(isCorrect("level1", i))]
                            }, null, 10, ["onUpdate:modelValue", "disabled"]), [
                              [vModelText, unref(answers).level1[i]]
                            ]),
                            unref(submitted) && !isCorrect("level1", i) ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-xs text-green-700 mt-1"
                            }, "✓ " + toDisplayString(task.decimal), 1)) : createCommentVNode("", true)
                          ])
                        ]);
                      }), 128))
                    ])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_UCard, null, {
            header: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<h2 class="font-semibold text-gray-800"${_scopeId}>Level 2 – IPv4 Class Identification</h2><p class="text-sm text-gray-500"${_scopeId}>Determine the class of each IP address</p>`);
              } else {
                return [
                  createVNode("h2", { class: "font-semibold text-gray-800" }, "Level 2 – IPv4 Class Identification"),
                  createVNode("p", { class: "text-sm text-gray-500" }, "Determine the class of each IP address")
                ];
              }
            }),
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<table class="w-full text-sm"${_scopeId}><thead${_scopeId}><tr class="bg-gray-50"${_scopeId}><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>IP Address</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Class</th></tr></thead><tbody${_scopeId}><!--[-->`);
                ssrRenderList(unref(tasks).level2, (task, i) => {
                  _push2(`<tr class="border-t"${_scopeId}><td class="p-2 font-mono text-gray-700"${_scopeId}>${ssrInterpolate(task.ip)}</td><td class="p-2"${_scopeId}><select${ssrIncludeBooleanAttr(unref(submitted)) ? " disabled" : ""} class="${ssrRenderClass([fieldClass(isCorrect("level2", i)), "w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(answers).level2[i]) ? ssrLooseContain(unref(answers).level2[i], "") : ssrLooseEqual(unref(answers).level2[i], "")) ? " selected" : ""}${_scopeId}>Select class</option><!--[-->`);
                  ssrRenderList(["A", "B", "C", "D", "E"], (c) => {
                    _push2(`<option${ssrRenderAttr("value", c)}${ssrIncludeBooleanAttr(Array.isArray(unref(answers).level2[i]) ? ssrLooseContain(unref(answers).level2[i], c) : ssrLooseEqual(unref(answers).level2[i], c)) ? " selected" : ""}${_scopeId}>${ssrInterpolate(c)}</option>`);
                  });
                  _push2(`<!--]--></select>`);
                  if (unref(submitted) && !isCorrect("level2", i)) {
                    _push2(`<p class="text-xs text-green-700 mt-1"${_scopeId}>✓ Class ${ssrInterpolate(task.class)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
              } else {
                return [
                  createVNode("table", { class: "w-full text-sm" }, [
                    createVNode("thead", null, [
                      createVNode("tr", { class: "bg-gray-50" }, [
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "IP Address"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Class")
                      ])
                    ]),
                    createVNode("tbody", null, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(tasks).level2, (task, i) => {
                        return openBlock(), createBlock("tr", {
                          key: i,
                          class: "border-t"
                        }, [
                          createVNode("td", { class: "p-2 font-mono text-gray-700" }, toDisplayString(task.ip), 1),
                          createVNode("td", { class: "p-2" }, [
                            withDirectives(createVNode("select", {
                              "onUpdate:modelValue": ($event) => unref(answers).level2[i] = $event,
                              disabled: unref(submitted),
                              class: ["w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400", fieldClass(isCorrect("level2", i))]
                            }, [
                              createVNode("option", { value: "" }, "Select class"),
                              (openBlock(), createBlock(Fragment, null, renderList(["A", "B", "C", "D", "E"], (c) => {
                                return createVNode("option", {
                                  key: c,
                                  value: c
                                }, toDisplayString(c), 9, ["value"]);
                              }), 64))
                            ], 10, ["onUpdate:modelValue", "disabled"]), [
                              [vModelSelect, unref(answers).level2[i]]
                            ]),
                            unref(submitted) && !isCorrect("level2", i) ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-xs text-green-700 mt-1"
                            }, "✓ Class " + toDisplayString(task.class), 1)) : createCommentVNode("", true)
                          ])
                        ]);
                      }), 128))
                    ])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_UCard, null, {
            header: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<h2 class="font-semibold text-gray-800"${_scopeId}>Level 3 – Network &amp; Broadcast Address</h2><p class="text-sm text-gray-500"${_scopeId}>Calculate the network and broadcast addresses</p>`);
              } else {
                return [
                  createVNode("h2", { class: "font-semibold text-gray-800" }, "Level 3 – Network & Broadcast Address"),
                  createVNode("p", { class: "text-sm text-gray-500" }, "Calculate the network and broadcast addresses")
                ];
              }
            }),
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<table class="w-full text-sm"${_scopeId}><thead${_scopeId}><tr class="bg-gray-50"${_scopeId}><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Host Address</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Network Address</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Broadcast Address</th></tr></thead><tbody${_scopeId}><!--[-->`);
                ssrRenderList(unref(tasks).level3, (task, i) => {
                  _push2(`<tr class="border-t"${_scopeId}><td class="p-2 font-mono text-gray-700"${_scopeId}>${ssrInterpolate(task.hostIp)}</td><td class="p-2"${_scopeId}><input${ssrRenderAttr("value", unref(answers).level3[i].network)}${ssrIncludeBooleanAttr(unref(submitted)) ? " disabled" : ""} placeholder="xxx.xxx.xxx.xxx" class="${ssrRenderClass([fieldClass(isCorrect("level3", i, "network")), "w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"])}"${_scopeId}>`);
                  if (unref(submitted) && !isCorrect("level3", i, "network")) {
                    _push2(`<p class="text-xs text-green-700 mt-1"${_scopeId}>✓ ${ssrInterpolate(task.networkAddr)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td><td class="p-2"${_scopeId}><input${ssrRenderAttr("value", unref(answers).level3[i].broadcast)}${ssrIncludeBooleanAttr(unref(submitted)) ? " disabled" : ""} placeholder="xxx.xxx.xxx.xxx" class="${ssrRenderClass([fieldClass(isCorrect("level3", i, "broadcast")), "w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"])}"${_scopeId}>`);
                  if (unref(submitted) && !isCorrect("level3", i, "broadcast")) {
                    _push2(`<p class="text-xs text-green-700 mt-1"${_scopeId}>✓ ${ssrInterpolate(task.broadcastAddr)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
              } else {
                return [
                  createVNode("table", { class: "w-full text-sm" }, [
                    createVNode("thead", null, [
                      createVNode("tr", { class: "bg-gray-50" }, [
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Host Address"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Network Address"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Broadcast Address")
                      ])
                    ]),
                    createVNode("tbody", null, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(tasks).level3, (task, i) => {
                        return openBlock(), createBlock("tr", {
                          key: i,
                          class: "border-t"
                        }, [
                          createVNode("td", { class: "p-2 font-mono text-gray-700" }, toDisplayString(task.hostIp), 1),
                          createVNode("td", { class: "p-2" }, [
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(answers).level3[i].network = $event,
                              disabled: unref(submitted),
                              placeholder: "xxx.xxx.xxx.xxx",
                              class: ["w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400", fieldClass(isCorrect("level3", i, "network"))]
                            }, null, 10, ["onUpdate:modelValue", "disabled"]), [
                              [vModelText, unref(answers).level3[i].network]
                            ]),
                            unref(submitted) && !isCorrect("level3", i, "network") ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-xs text-green-700 mt-1"
                            }, "✓ " + toDisplayString(task.networkAddr), 1)) : createCommentVNode("", true)
                          ]),
                          createVNode("td", { class: "p-2" }, [
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(answers).level3[i].broadcast = $event,
                              disabled: unref(submitted),
                              placeholder: "xxx.xxx.xxx.xxx",
                              class: ["w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400", fieldClass(isCorrect("level3", i, "broadcast"))]
                            }, null, 10, ["onUpdate:modelValue", "disabled"]), [
                              [vModelText, unref(answers).level3[i].broadcast]
                            ]),
                            unref(submitted) && !isCorrect("level3", i, "broadcast") ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-xs text-green-700 mt-1"
                            }, "✓ " + toDisplayString(task.broadcastAddr), 1)) : createCommentVNode("", true)
                          ])
                        ]);
                      }), 128))
                    ])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_UCard, null, {
            header: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<h2 class="font-semibold text-gray-800"${_scopeId}>Level 4 – Network Capacity</h2><p class="text-sm text-gray-500"${_scopeId}>Calculate the maximum number of hosts for each subnet mask</p>`);
              } else {
                return [
                  createVNode("h2", { class: "font-semibold text-gray-800" }, "Level 4 – Network Capacity"),
                  createVNode("p", { class: "text-sm text-gray-500" }, "Calculate the maximum number of hosts for each subnet mask")
                ];
              }
            }),
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<table class="w-full text-sm"${_scopeId}><thead${_scopeId}><tr class="bg-gray-50"${_scopeId}><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Subnet Mask</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Number of Hosts</th></tr></thead><tbody${_scopeId}><!--[-->`);
                ssrRenderList(unref(tasks).level4, (task, i) => {
                  _push2(`<tr class="border-t"${_scopeId}><td class="p-2 font-mono text-gray-700"${_scopeId}>${ssrInterpolate(task.mask)}</td><td class="p-2"${_scopeId}><input${ssrRenderAttr("value", unref(answers).level4[i])}${ssrIncludeBooleanAttr(unref(submitted)) ? " disabled" : ""} type="text" placeholder="Number of hosts" class="${ssrRenderClass([fieldClass(isCorrect("level4", i)), "w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"])}"${_scopeId}>`);
                  if (unref(submitted) && !isCorrect("level4", i)) {
                    _push2(`<p class="text-xs text-green-700 mt-1"${_scopeId}>✓ ${ssrInterpolate(task.hostCount)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
              } else {
                return [
                  createVNode("table", { class: "w-full text-sm" }, [
                    createVNode("thead", null, [
                      createVNode("tr", { class: "bg-gray-50" }, [
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Subnet Mask"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Number of Hosts")
                      ])
                    ]),
                    createVNode("tbody", null, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(tasks).level4, (task, i) => {
                        return openBlock(), createBlock("tr", {
                          key: i,
                          class: "border-t"
                        }, [
                          createVNode("td", { class: "p-2 font-mono text-gray-700" }, toDisplayString(task.mask), 1),
                          createVNode("td", { class: "p-2" }, [
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(answers).level4[i] = $event,
                              disabled: unref(submitted),
                              type: "text",
                              placeholder: "Number of hosts",
                              class: ["w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400", fieldClass(isCorrect("level4", i))]
                            }, null, 10, ["onUpdate:modelValue", "disabled"]), [
                              [vModelText, unref(answers).level4[i]]
                            ]),
                            unref(submitted) && !isCorrect("level4", i) ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-xs text-green-700 mt-1"
                            }, "✓ " + toDisplayString(task.hostCount), 1)) : createCommentVNode("", true)
                          ])
                        ]);
                      }), 128))
                    ])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_UCard, null, {
            header: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<h2 class="font-semibold text-gray-800"${_scopeId}>Level 5 – Same Network Check</h2><p class="text-sm text-gray-500"${_scopeId}>Determine if the two addresses are on the same network</p>`);
              } else {
                return [
                  createVNode("h2", { class: "font-semibold text-gray-800" }, "Level 5 – Same Network Check"),
                  createVNode("p", { class: "text-sm text-gray-500" }, "Determine if the two addresses are on the same network")
                ];
              }
            }),
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<table class="w-full text-sm"${_scopeId}><thead${_scopeId}><tr class="bg-gray-50"${_scopeId}><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Address 1</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Address 2</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Subnet Mask</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Same Network?</th></tr></thead><tbody${_scopeId}><!--[-->`);
                ssrRenderList(unref(tasks).level5, (task, i) => {
                  _push2(`<tr class="border-t"${_scopeId}><td class="p-2 font-mono text-gray-700"${_scopeId}>${ssrInterpolate(task.ip1)}</td><td class="p-2 font-mono text-gray-700"${_scopeId}>${ssrInterpolate(task.ip2)}</td><td class="p-2 font-mono text-gray-700"${_scopeId}>${ssrInterpolate(task.mask)}</td><td class="p-2"${_scopeId}><select${ssrIncludeBooleanAttr(unref(submitted)) ? " disabled" : ""} class="${ssrRenderClass([fieldClass(isCorrect("level5", i)), "w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"])}"${_scopeId}><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(answers).level5[i]) ? ssrLooseContain(unref(answers).level5[i], "") : ssrLooseEqual(unref(answers).level5[i], "")) ? " selected" : ""}${_scopeId}>Select</option><option value="Yes"${ssrIncludeBooleanAttr(Array.isArray(unref(answers).level5[i]) ? ssrLooseContain(unref(answers).level5[i], "Yes") : ssrLooseEqual(unref(answers).level5[i], "Yes")) ? " selected" : ""}${_scopeId}>Yes</option><option value="No"${ssrIncludeBooleanAttr(Array.isArray(unref(answers).level5[i]) ? ssrLooseContain(unref(answers).level5[i], "No") : ssrLooseEqual(unref(answers).level5[i], "No")) ? " selected" : ""}${_scopeId}>No</option></select>`);
                  if (unref(submitted) && !isCorrect("level5", i)) {
                    _push2(`<p class="text-xs text-green-700 mt-1"${_scopeId}>✓ ${ssrInterpolate(task.sameNetwork ? "Yes" : "No")}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
              } else {
                return [
                  createVNode("table", { class: "w-full text-sm" }, [
                    createVNode("thead", null, [
                      createVNode("tr", { class: "bg-gray-50" }, [
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Address 1"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Address 2"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Subnet Mask"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Same Network?")
                      ])
                    ]),
                    createVNode("tbody", null, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(tasks).level5, (task, i) => {
                        return openBlock(), createBlock("tr", {
                          key: i,
                          class: "border-t"
                        }, [
                          createVNode("td", { class: "p-2 font-mono text-gray-700" }, toDisplayString(task.ip1), 1),
                          createVNode("td", { class: "p-2 font-mono text-gray-700" }, toDisplayString(task.ip2), 1),
                          createVNode("td", { class: "p-2 font-mono text-gray-700" }, toDisplayString(task.mask), 1),
                          createVNode("td", { class: "p-2" }, [
                            withDirectives(createVNode("select", {
                              "onUpdate:modelValue": ($event) => unref(answers).level5[i] = $event,
                              disabled: unref(submitted),
                              class: ["w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400", fieldClass(isCorrect("level5", i))]
                            }, [
                              createVNode("option", { value: "" }, "Select"),
                              createVNode("option", { value: "Yes" }, "Yes"),
                              createVNode("option", { value: "No" }, "No")
                            ], 10, ["onUpdate:modelValue", "disabled"]), [
                              [vModelSelect, unref(answers).level5[i]]
                            ]),
                            unref(submitted) && !isCorrect("level5", i) ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-xs text-green-700 mt-1"
                            }, "✓ " + toDisplayString(task.sameNetwork ? "Yes" : "No"), 1)) : createCommentVNode("", true)
                          ])
                        ]);
                      }), 128))
                    ])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_UCard, null, {
            header: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<h2 class="font-semibold text-gray-800"${_scopeId}>Level 6 – VLSM Subnetting</h2><p class="text-sm text-gray-500"${_scopeId}>Subnet ${ssrInterpolate(unref(tasks).level6.baseNetwork)}/${ssrInterpolate(unref(tasks).level6.baseCidr)} using VLSM to accommodate the following requirements:</p>`);
              } else {
                return [
                  createVNode("h2", { class: "font-semibold text-gray-800" }, "Level 6 – VLSM Subnetting"),
                  createVNode("p", { class: "text-sm text-gray-500" }, "Subnet " + toDisplayString(unref(tasks).level6.baseNetwork) + "/" + toDisplayString(unref(tasks).level6.baseCidr) + " using VLSM to accommodate the following requirements:", 1)
                ];
              }
            }),
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<table class="w-full text-sm"${_scopeId}><thead${_scopeId}><tr class="bg-gray-50"${_scopeId}><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Subnet</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Hosts</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Network Address</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Subnet Mask</th><th class="text-left p-2 font-medium text-gray-600"${_scopeId}>Broadcast Address</th></tr></thead><tbody${_scopeId}><!--[-->`);
                ssrRenderList(unref(tasks).level6.subnets, (subnet, i) => {
                  _push2(`<tr class="border-t"${_scopeId}><td class="p-2 font-semibold text-gray-700"${_scopeId}>${ssrInterpolate(subnet.name)}</td><td class="p-2 text-gray-700"${_scopeId}>${ssrInterpolate(subnet.hosts)}</td><td class="p-2"${_scopeId}><input${ssrRenderAttr("value", unref(answers).level6[i].network)}${ssrIncludeBooleanAttr(unref(submitted)) ? " disabled" : ""} placeholder="xxx.xxx.xxx.xxx" class="${ssrRenderClass([fieldClass(isCorrect("level6", i, "network")), "w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"])}"${_scopeId}>`);
                  if (unref(submitted) && !isCorrect("level6", i, "network")) {
                    _push2(`<p class="text-xs text-green-700 mt-1"${_scopeId}>✓ ${ssrInterpolate(subnet.networkAddr)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td><td class="p-2"${_scopeId}><input${ssrRenderAttr("value", unref(answers).level6[i].mask)}${ssrIncludeBooleanAttr(unref(submitted)) ? " disabled" : ""} placeholder="255.255.255.x" class="${ssrRenderClass([fieldClass(isCorrect("level6", i, "mask")), "w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"])}"${_scopeId}>`);
                  if (unref(submitted) && !isCorrect("level6", i, "mask")) {
                    _push2(`<p class="text-xs text-green-700 mt-1"${_scopeId}>✓ ${ssrInterpolate(subnet.mask)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td><td class="p-2"${_scopeId}><input${ssrRenderAttr("value", unref(answers).level6[i].broadcast)}${ssrIncludeBooleanAttr(unref(submitted)) ? " disabled" : ""} placeholder="xxx.xxx.xxx.xxx" class="${ssrRenderClass([fieldClass(isCorrect("level6", i, "broadcast")), "w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"])}"${_scopeId}>`);
                  if (unref(submitted) && !isCorrect("level6", i, "broadcast")) {
                    _push2(`<p class="text-xs text-green-700 mt-1"${_scopeId}>✓ ${ssrInterpolate(subnet.broadcastAddr)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</td></tr>`);
                });
                _push2(`<!--]--></tbody></table>`);
              } else {
                return [
                  createVNode("table", { class: "w-full text-sm" }, [
                    createVNode("thead", null, [
                      createVNode("tr", { class: "bg-gray-50" }, [
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Subnet"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Hosts"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Network Address"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Subnet Mask"),
                        createVNode("th", { class: "text-left p-2 font-medium text-gray-600" }, "Broadcast Address")
                      ])
                    ]),
                    createVNode("tbody", null, [
                      (openBlock(true), createBlock(Fragment, null, renderList(unref(tasks).level6.subnets, (subnet, i) => {
                        return openBlock(), createBlock("tr", {
                          key: i,
                          class: "border-t"
                        }, [
                          createVNode("td", { class: "p-2 font-semibold text-gray-700" }, toDisplayString(subnet.name), 1),
                          createVNode("td", { class: "p-2 text-gray-700" }, toDisplayString(subnet.hosts), 1),
                          createVNode("td", { class: "p-2" }, [
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(answers).level6[i].network = $event,
                              disabled: unref(submitted),
                              placeholder: "xxx.xxx.xxx.xxx",
                              class: ["w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400", fieldClass(isCorrect("level6", i, "network"))]
                            }, null, 10, ["onUpdate:modelValue", "disabled"]), [
                              [vModelText, unref(answers).level6[i].network]
                            ]),
                            unref(submitted) && !isCorrect("level6", i, "network") ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-xs text-green-700 mt-1"
                            }, "✓ " + toDisplayString(subnet.networkAddr), 1)) : createCommentVNode("", true)
                          ]),
                          createVNode("td", { class: "p-2" }, [
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(answers).level6[i].mask = $event,
                              disabled: unref(submitted),
                              placeholder: "255.255.255.x",
                              class: ["w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400", fieldClass(isCorrect("level6", i, "mask"))]
                            }, null, 10, ["onUpdate:modelValue", "disabled"]), [
                              [vModelText, unref(answers).level6[i].mask]
                            ]),
                            unref(submitted) && !isCorrect("level6", i, "mask") ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-xs text-green-700 mt-1"
                            }, "✓ " + toDisplayString(subnet.mask), 1)) : createCommentVNode("", true)
                          ]),
                          createVNode("td", { class: "p-2" }, [
                            withDirectives(createVNode("input", {
                              "onUpdate:modelValue": ($event) => unref(answers).level6[i].broadcast = $event,
                              disabled: unref(submitted),
                              placeholder: "xxx.xxx.xxx.xxx",
                              class: ["w-full px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400", fieldClass(isCorrect("level6", i, "broadcast"))]
                            }, null, 10, ["onUpdate:modelValue", "disabled"]), [
                              [vModelText, unref(answers).level6[i].broadcast]
                            ]),
                            unref(submitted) && !isCorrect("level6", i, "broadcast") ? (openBlock(), createBlock("p", {
                              key: 0,
                              class: "text-xs text-green-700 mt-1"
                            }, "✓ " + toDisplayString(subnet.broadcastAddr), 1)) : createCommentVNode("", true)
                          ])
                        ]);
                      }), 128))
                    ])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`<div class="flex justify-center pb-8">`);
          if (!unref(submitted)) {
            _push(ssrRenderComponent(_component_UButton, {
              size: "lg",
              loading: unref(submitting),
              onClick: submitAnswers
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Submit Answers `);
                } else {
                  return [
                    createTextVNode(" Submit Answers ")
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(ssrRenderComponent(_component_UButton, {
              variant: "outline",
              to: "/login"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Done `);
                } else {
                  return [
                    createTextVNode(" Done ")
                  ];
                }
              }),
              _: 1
            }, _parent));
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</main></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/test.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=test-CMKE2c5i.js.map
