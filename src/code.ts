const regExpSet: Record<string, RegExp> = {
    english: /\w+/g,
    chinese: /[\u4e00-\u9fa5]+/g,
    portuguese: /[a-zA-Z\u00C0-\u00ff]+/g,
    korean: /([\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff])+/g,
    japanese: /[一-龠]+|[ぁ-ゔ]+|[ァ-ヴー]+|[a-zA-Z0-9]+|[ａ-ｚＡ-Ｚ０-９]+|[々〆〤]+/ug,
    russian: /^[\u0400-\u04FF]+$/g,
    digits: /[0-9]+/g
}

figma.showUI(__html__, {width: 240, height: 340 });

figma.listAvailableFontsAsync().then(result => {
	figma.ui.postMessage({
		type: 'loaded-fonts-list',
		data: result
	})
})

figma.ui.onmessage = msg => {
    
    switch (msg.type) {
        case 'apply':
            
            handleApply(msg.data)

            break;
    
        default:
            break;
    }

}

decideIfApplyEnabled()

figma.on('selectionchange', () => {

    decideIfApplyEnabled()
    
})

function decideIfApplyEnabled () {

    const selectedTextNodes = getCurrentSelectedTextNodes()

    if (selectedTextNodes.length > 0 && selectedTextNodes.some(i => !(i.locked || !i.visible))) {

        figma.ui.postMessage({
            type: 'enable-apply'
        })

    } else {

        figma.ui.postMessage({
            type: 'disable-apply'
        })

    }

}

function getCurrentSelectedTextNodes(): TextNode[] {

    return figma.currentPage.selection.filter((i) => i.type === 'TEXT') as TextNode[]

}

async function handleApply(fontSettings) {

    // console.log(fontSettings)
    
    const selectedTextNodes = getCurrentSelectedTextNodes()

    await Promise.all([preloadFontsOnNodes(selectedTextNodes), preloadFontsOnSettings(fontSettings)])

    selectedTextNodes.forEach((node: TextNode) => {

        fontSettings.forEach((setting: any) => {

            const {fontFamily: family, fontStyle: style} = setting

            if (!family) return

            const fontStyleToBeApplied: FontName = {family, style}
            const targetRegExp = regExpSet[setting.name];

            // console.log(node.characters.match(targetRegExp))
        
            const matchedPart = node.characters.match(targetRegExp)
            
            if (matchedPart) {

                matchedPart.forEach((matchedCharacters) => {
        
                    // console.log(matchedCharacters)
            
                    const index = node.characters.indexOf(matchedCharacters)
            
                    node.setRangeFontName(index, index + matchedCharacters.length, fontStyleToBeApplied)
            
                })    

            }
            
        })

    })

}

function preloadFontsOnNodes(nodes: TextNode[]) {

    return Promise.all(nodes.map(async (node) => {

        // console.log(node)

        if (node.fontName !== figma.mixed) {

            await figma.loadFontAsync(node.fontName)
    
        } else {
    
            const length = node.characters.length
    
            /**
             * todo: use a way like binary search to reduce the traverse time
             */

            for (let currentCharterIndex = 0; currentCharterIndex < length; currentCharterIndex++) {
    
                const fontName = node.getRangeFontName(currentCharterIndex, currentCharterIndex + 1)
                
                // console.log(fontName)

                if (fontName !== figma.mixed) {
    
                    await figma.loadFontAsync(fontName)
    
                }
    
            }
    
        }

    }))

}

function preloadFontsOnSettings(settings) {

    return Promise.all(settings.map((setting) => {

        const {fontFamily: family, fontStyle: style} = setting
        const fontStyleToBeApplied: FontName = {family, style}

        if (family) {

            return figma.loadFontAsync(fontStyleToBeApplied)

        } else {

            return Promise.resolve()

        }

    }))

}