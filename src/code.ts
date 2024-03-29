import { hexToFigmaRgb } from './utils'

const regExpSet: Record<string, RegExp> = {
    english: /[\w!"'\(\)*+,-./:;<=>?\[\]^_`{|}~]+/g,
    chinese: /[\u4e00-\u9fa5\u3001-\u3004\u3008-\u3011\u3014-\u301F\uff01-\uff03\uff05-\uff0C\uff0e\uff1a-\uff1b\uff1f\uff20\uff3b-\uff40\uff5b-\uff5e\uffe5]+/g,
    portuguese: /[a-zA-Z\u00C0-\u00ff]+/g,
    korean: /([\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff])+/g,
    japanese: /([一-龠]|[ぁ-ゔ]|[ァ-ヴー]|[々〆〤])+/ug,
    russian: /[\u0400-\u04FF]+/g,
    thai: /[\u0E00-\u0E7F]+/g,
    digits: /[0-9]+/g,
    chineseSymbol: /[\u3001-\u3004\u3008-\u3011\u3014-\u301F\uff01-\uff03\uff05-\uff0C\uff0e\uff1a-\uff1b\uff1f\uff20\uff3b-\uff40\uff5b-\uff5e\uffe5]+/g,
    englishSymbol: /[!"'\(\)*+,-./:;<=>?\[\]^_`{|}~]+/g,
}
let sessionSetting: Record<string, any>[] | null = null

figma.showUI(__html__, {width: 260, height: 368 });

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

            break
        
        case 'save-setting':

            handleSaveSessionSetting(msg.data)

            break

        case 'get-setting':

            const setting = handleGetSetting()

            figma.ui.postMessage({
                type: 'restore-setting',
                data: setting
            })
    
        default:
            break
    }

}

decideIfApplyEnabled()

figma.on('selectionchange', () => {

    decideIfApplyEnabled()
    
})

figma.on('close', () => {

    saveSettingIntoPluginData(sessionSetting)

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

            const targetRegExp = regExpSet[setting.name]
            let figmaFontName: FontName, figmaColor: RGB, figmaOpacity: number, figmaSize: number
            let singleMatchedPart: RegExpExecArray | undefined

            const {fontFamily: family, fontStyle: style, fontSize: size, fontColor: hexColor, fontOpacity: opacity} = setting

            if (family && style) figmaFontName = {family, style}
            figmaColor = hexToFigmaRgb(hexColor)
            figmaOpacity = (+opacity.replace('%', ''))/100
            figmaSize = +size

            while ((singleMatchedPart = targetRegExp.exec(node.characters)) !== null) {
                
                const startIndex = singleMatchedPart.index
                const endIndex = targetRegExp.lastIndex
                
                if (figmaFontName) node.setRangeFontName(startIndex, endIndex, figmaFontName)
                if (figmaSize) node.setRangeFontSize(startIndex, endIndex, figmaSize)
                if (figmaColor) node.setRangeFills(startIndex, endIndex, [{type: 'SOLID', color: figmaColor, opacity: figmaOpacity}])

            }
            
        })

    })

    figma.ui.postMessage({
        type: 'apply-done'
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
        const figmaFontName: FontName = {family, style}

        if (family) {

            return figma.loadFontAsync(figmaFontName)

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


function handleSaveSessionSetting(setting) {

    sessionSetting = setting

}

function saveSettingIntoPluginData(setting) {

    figma.root.setPluginData('setting', JSON.stringify(setting))

}

function handleGetSetting() {

    const data = figma.root.getPluginData('setting')

    if (data) {
        return JSON.parse(data)
    } else {
        return null
    }

}