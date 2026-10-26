(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 744 ], {
    /***/ 8272: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 2846, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 9107, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 1060, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 4707, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 80, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 6423, 23));
        /***/    },
    /***/ 9485: 
    /***/ function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {
        "use strict";
        // EXTERNAL MODULE: ./node_modules/next/dist/client/app-webpack.js
                var app_webpack = __webpack_require__(9506);
        // CONCATENATED MODULE: ./src/runtime/readable-dom.ts
        /** Restore only formatter-recorded text nodes, before the first React hydrate. */ function restoreReadableDocument(document) {
            const helper = document.getElementById("__readable_whitespace__");
            if (!helper) return;
            const manifest = JSON.parse(helper.textContent || "{}");
            if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.changes)) throw new Error("Unsupported readable HTML manifest");
            // Resolve all addresses before removing a node shifts any child index.
                        const targets = manifest.changes.map((change => {
                let parent = document;
                for (const index of change.path) parent = parent.children[index];
                const node = parent.childNodes[change.childIndex];
                if (!node || node.nodeType !== 3 || node.textContent !== change.formatted) throw new Error("Readable HTML whitespace differs from its build manifest: " + JSON.stringify({
                    path: change.path,
                    childIndex: change.childIndex,
                    actual: node === null || node === void 0 ? void 0 : node.textContent,
                    expected: change.formatted
                }));
                return {
                    node: node,
                    original: change.original
                };
            }));
            for (const {node: node, original: original} of targets) {
                if (original === null) node.parentNode.removeChild(node); else node.textContent = original;
            }
            helper.remove();
        }
        // CONCATENATED MODULE: ./src/runtime/readable-app.ts
        // This must run first: it installs Next's chunk loading and public-path setup.
        function startApplication() {
            restoreReadableDocument(document);
            // A literal require is bundled synchronously. Flight pushes stay queued
            // until app-index installs its consumer after the complete DOM is restored.
                        __webpack_require__(4278);
        }
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", startApplication, {
                once: true
            });
        } else {
            startApplication();
        }
        /***/    }
}, 
/******/ function(__webpack_require__) {
    // webpackRuntimeModules
    /******/ var __webpack_exec__ = function(moduleId) {
        return __webpack_require__(__webpack_require__.s = moduleId);
    }
    /******/;
    __webpack_require__.O(0, [ 971, 117 ], (function() {
        return __webpack_exec__(9485), __webpack_exec__(8272);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=readable-app_1.js.map