import { defineComponent, useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
import { n as navigateTo } from "../server.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/home/runner/work/ipv4/ipv4/node_modules/hookable/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/unctx/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/home/runner/work/ipv4/ipv4/node_modules/defu/dist/defu.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/ufo/dist/index.mjs";
import "@vueuse/core";
import "tailwind-merge";
import "/home/runner/work/ipv4/ipv4/node_modules/klona/dist/index.mjs";
import "/home/runner/work/ipv4/ipv4/node_modules/@unhead/vue/dist/index.mjs";
import "@iconify/vue";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    navigateTo("/login");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=index-BaYx3zgK.js.map
