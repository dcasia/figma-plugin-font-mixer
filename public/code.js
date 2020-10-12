"use strict";
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */function e(e,t,n,a){return new(n||(n=Promise))((function(i,o){function s(e){try{l(a.next(e))}catch(e){o(e)}}function c(e){try{l(a.throw(e))}catch(e){o(e)}}function l(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(s,c)}l((a=a.apply(e,t||[])).next())}))}const t={english:/\w+/g,chinese:/[\u4e00-\u9fa5]+/g,portuguese:/[a-zA-Z\u00C0-\u00ff]+/g,digits:/[0-9]+/g};function n(){return figma.currentPage.selection.filter(e=>"TEXT"===e.type)}function a(t){return Promise.all(t.map(t=>e(this,void 0,void 0,(function*(){if(t.fontName!==figma.mixed)yield figma.loadFontAsync(t.fontName);else{const e=t.characters.length;for(let n=0;n<e;n++){const e=t.getRangeFontName(n,n+1);e!==figma.mixed&&(yield figma.loadFontAsync(e))}}}))))}figma.showUI(__html__,{width:260,height:270}),figma.listAvailableFontsAsync().then(e=>{figma.ui.postMessage({type:"loaded-fonts-list",data:e})}),figma.ui.onmessage=i=>{switch(i.type){case"apply":!function(i){e(this,void 0,void 0,(function*(){const e=n();var o;yield Promise.all([a(e),(o=i,Promise.all(o.map(e=>{const{fontFamily:t,fontStyle:n}=e,a={family:t,style:n};return t?figma.loadFontAsync(a):Promise.resolve()})))]),e.forEach(e=>{i.forEach(n=>{const{fontFamily:a,fontStyle:i}=n;if(!a)return;const o={family:a,style:i},s=t[n.name];e.characters.match(s).forEach(t=>{const n=e.characters.indexOf(t);e.setRangeFontName(n,n+t.length,o)})})})}))}(i.data)}},figma.on("selectionchange",()=>{const e=n();e.length>0&&e.some(e=>!(e.locked||!e.visible))?figma.ui.postMessage({type:"enable-apply"}):figma.ui.postMessage({type:"disable-apply"})});
