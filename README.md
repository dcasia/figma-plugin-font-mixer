# Figma-plugin-font-mixer

A figma plugin that allows designers to easily mix fonts in complex content type sentences.

## Development
During development, watch your project for changes with the following command.

```bash
npm run dev
```
Start building your plugin UI in `'src/Plugin.svelte'`.


## Build
When ready to package up your final Figma Plugin:
```bash
npm run build
```


## Useful info
To include an external CSS file:
```javascript
import styles from './styles.css';
```

To include an SVG:
```javascript
import SvgName from './image.svg';

//use in your markup
{@html SvgName}
```
