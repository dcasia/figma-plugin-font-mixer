const regExpSet: Record<string, RegExp> = {
    english: /\w+/g,
    chinese: /[\u4e00-\u9fa5]+/g,
    portuguese: /[a-zA-Z\u00C0-\u00ff]+/g,
    korean: /([\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff])+/g,
    japanese: /([一-龠]|[ぁ-ゔ]|[ァ-ヴー]|[々〆〤])+/ug,
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
    
    const selectedTextNodes = getCurrentSelectedTextNodes()

    await Promise.all([preloadFontsOnNodes(selectedTextNodes), preloadFontsOnSettings(fontSettings)])

    selectedTextNodes.forEach((node: TextNode) => {

        fontSettings.forEach((setting: any) => {

            const {fontFamily: family, fontStyle: style} = setting

            if (!family) return

            const fontStyleToBeApplied: FontName = {family, style}
            const targetRegExp = regExpSet[setting.name]
            let matchedPart = []
            let singleMatchedPart: RegExpExecArray | undefined

            while ((singleMatchedPart = targetRegExp.exec(node.characters)) !== null) {
                
                matchedPart.push([singleMatchedPart.index, targetRegExp.lastIndex])

            }
            
            if (matchedPart.length) {

                matchedPart.forEach((ranges) => {
            
                    node.setRangeFontName(ranges[0], ranges[1], fontStyleToBeApplied)
            
                }) 

            }
            
        })

    })

}

function preloadFontsOnNodes(nodes: TextNode[]) {

    return Promise.all(nodes.map((node) => {

        let fontNames = collectFontNamesOnNode(node)

        fontNames = filterDuplicateFontNames(fontNames)

        return Promise.all(fontNames.map(fontName => figma.loadFontAsync(fontName)))

    }))

}

function collectFontNamesOnNode(node, range?): FontName[] {

    range = range || [0, node.characters.length]

    let result

    if (range[1] > range[0]) {

        result = node.getRangeFontName(...range)

    }

    if (result && result !== figma.mixed) {

        return [result]

    } else if (result && result === figma.mixed) {

        const middlePointInRange = Math.ceil((range[1] + range[0])/2)

        return [
            ...collectFontNamesOnNode(node, [range[0], middlePointInRange]),
            ...collectFontNamesOnNode(node, [middlePointInRange, range[1]])
        ]

    } else {

        return []

    }

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

function filterDuplicateFontNames (fontNameList: FontName[]) {

    return fontNameList.reduce((result: FontName[], item: FontName) => {

        if (!result.find(resultItem => resultItem.family === item.family && resultItem.style === item.style)) {

            result.push(item)

        }

        return result

    }, [])

}