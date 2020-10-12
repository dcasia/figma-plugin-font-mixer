'use strict';

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
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const regExpSet = {
    english: /\w+/g,
    chinese: /[\u4e00-\u9fa5]+/g,
    portuguese: /[a-zA-Z\u00C0-\u00ff]+/g,
    digits: /[0-9]+/g
};
figma.showUI(__html__, { width: 300, height: 270 });
figma.listAvailableFontsAsync().then(result => {
    figma.ui.postMessage({
        type: 'loaded-fonts-list',
        data: result
    });
});
figma.ui.onmessage = msg => {
    switch (msg.type) {
        case 'apply':
            handleApply(msg.data);
            break;
    }
};
figma.on('selectionchange', () => {
    const selectedTextNodes = getCurrentSelectedTextNodes();
    if (selectedTextNodes.length > 0 && selectedTextNodes.some(i => !(i.locked || !i.visible))) {
        figma.ui.postMessage({
            type: 'enable-apply'
        });
    }
    else {
        figma.ui.postMessage({
            type: 'disable-apply'
        });
    }
});
function getCurrentSelectedTextNodes() {
    return figma.currentPage.selection.filter((i) => i.type === 'TEXT');
}
function handleApply(fontSettings) {
    return __awaiter(this, void 0, void 0, function* () {
        const selectedTextNodes = getCurrentSelectedTextNodes();
        yield Promise.all([preloadFontsOnNodes(selectedTextNodes), preloadFontsOnSettings(fontSettings)]);
        selectedTextNodes.forEach((node) => {
            fontSettings.forEach((setting) => {
                const { fontFamily: family, fontStyle: style } = setting;
                if (!family)
                    return;
                const fontStyleToBeApplied = { family, style };
                const targetRegExp = regExpSet[setting.name];
                console.log(node.characters.match(targetRegExp));
                node.characters.match(targetRegExp)
                    .forEach((matchedCharacters) => {
                    console.log(matchedCharacters);
                    const index = node.characters.indexOf(matchedCharacters);
                    node.setRangeFontName(index, index + matchedCharacters.length, fontStyleToBeApplied);
                });
            });
        });
    });
}
function preloadFontsOnNodes(nodes) {
    return Promise.all(nodes.map((node) => __awaiter(this, void 0, void 0, function* () {
        // console.log(node)
        if (node.fontName !== figma.mixed) {
            yield figma.loadFontAsync(node.fontName);
        }
        else {
            const length = node.characters.length;
            /**
             * todo: use a way like binary search to reduce the traverse time
             */
            for (let currentCharterIndex = 0; currentCharterIndex < length; currentCharterIndex++) {
                const fontName = node.getRangeFontName(currentCharterIndex, currentCharterIndex + 1);
                // console.log(fontName)
                if (fontName !== figma.mixed) {
                    yield figma.loadFontAsync(fontName);
                }
            }
        }
    })));
}
function preloadFontsOnSettings(settings) {
    return Promise.all(settings.map((setting) => {
        const { fontFamily: family, fontStyle: style } = setting;
        const fontStyleToBeApplied = { family, style };
        if (family) {
            return figma.loadFontAsync(fontStyleToBeApplied);
        }
        else {
            return Promise.resolve();
        }
    }));
}
