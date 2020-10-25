const figmaColorKeys = ['r', 'g', 'b']

export const hexToFigmaRgb = hex => hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16)/255)
    .reduce((figmaColor: RGB, value, index) => {

        figmaColor[figmaColorKeys[index]] = value

        return figmaColor
    }, {})

export const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }).join('')