<div class="wrapper pr-xxsmall pl-xxsmall">

    <div class="setting-area pt-xxsmall pb-xxsmall">
        {#each settings as {label, fontFamily, fontStyle}, index }
            <Type class="item-label" weight="bold">{label}</Type>
            <div class="input-selector">
                <Input id="input-{index}"
                       class="input ml-xxsmall mr-xxsmall"
	        	       placeholder='Type a font name to search'
                       bind:value={fontFamily}
                       on:input={handleInput}
                       on:keydown={handleInputKeydown}/>
                <SelectMenu bind:menuItems={fontStylesForMenu[hasMatchedFontFamily ? fontFamily : '_default']}
                            disabled={!hasMatchedFontFamily}
                            bind:value={fontStyle}/>
	        	<!-- <Icon class="arrow-down" iconName={IconBack}/> -->
	        </div>
        {/each}
    </div>

	<div class="bottom-area pt-xxsmall pb-xxsmall">
        <!-- <Button on:click={cancel} variant="secondary" class="mr-xsmall">Add</Button> -->
        <span class="enable-apply-tips mr-xxsmall"
              class:hidden={!isApplyButtonDisabled}>
            Select nodes contain editable text
        </span>
		<Button on:click={apply} bind:disabled={isApplyButtonDisabled}>
            Apply
        </Button>
    </div>
    
    <!-- <div class="add-panel">
        <Type class="item-label" weight="bold">Add a match </Type>
        <SelectMenu bind:menuItems={optionalMatchType} bind:value={selectedOptionalMatchType} showGroupLabels/>
    </div> -->

</div>

<script>

    import { tick } from 'svelte';
	import { GlobalCSS } from 'figma-plugin-ds-svelte';
	import { Button, Input, SelectMenu, SelectItem, Type, OnboardingTip } from 'figma-plugin-ds-svelte';
	// import { Icon, IconBack } from 'figma-plugin-ds-svelte';

	let fontsNameCache = [] 
    let fontsList = []
    let fontStylesForMenu = {}
    let hasMatchedFontFamily = false
    let optionalMatchType = [
        {"value":"english","label":"English","group":'Language',"selected":false},
        {"value":"chinese","label":"Chinese","group":'Language',"selected":false},
        {"value":"portuguese","label":"Portuguese","group":'Language',"selected":false},
        {"value":"digits","label":"Digits","group":'Content Type',"selected":true}
    ]
    let selectedOptionalMatchType
    let isApplyButtonDisabled = true
    let settings = [
        {
            label: 'English',
            name: 'english',
            fontFamily: '',
            fontStyle: ''
        },
        {
            label: 'Chinese',
            name: 'chinese',
            fontFamily: '',
            fontStyle: ''
        },
        {
            label: 'Digits',
            name: 'digits',
            fontFamily: '',
            fontStyle: ''
        }
    ]
    let settingsValueOldCache = []

    $: console.log(fontStylesForMenu._default)

	onmessage = (event) => {

		const eventType = event.data.pluginMessage.type
		const eventData = event.data.pluginMessage.data

		switch (eventType) {
            case 'enable-apply':
                isApplyButtonDisabled = false
                break
            case 'disable-apply':
                isApplyButtonDisabled = true
                break
			case 'loaded-fonts-list':
				fontsList = eventData.reduce((result, item) => {

                    const fontFamily = item.fontName.family
                    const fontStyle = item.fontName.style

					if (!fontsNameCache.includes(fontFamily)) {
						fontsNameCache.push(fontFamily)
						result.push({family: fontFamily, styles: [fontStyle]})
					} else {
                        result.find(font => font.family === fontFamily).styles.push(fontStyle)
                    }
					return result
                }, [])

                fontStylesForMenu = fontsList.reduce((result, font) => {

                    if (font.family) {

                        result[font.family] = font.styles.map((style, index) => {
                            return {value: style, label: style, group: null, selected: style === 'Regular'}
                        })

                    }

                    return result

                }, {})

                fontStylesForMenu._default = [{value: '', label: 'Regular', selected: true}]

                // console.log(fontsList)
				break
			default:
				break
		}

	}

    function apply() {

        parent.postMessage({ pluginMessage: { type: 'apply', data: settings } }, '*')

    }
    
    function handleInput(e) {

        const index = getInputElementIndex(e)
        const value = settings[index].fontFamily
        const regExp = new RegExp(`^${value}`, 'i')

        settingsValueOldCache[index] = settingsValueOldCache[index] || ''

        if(!regExp.test(settingsValueOldCache[index])) {

            settingsValueOldCache[index] = value

            const targetFont = fontsList.find((item) => regExp.test(item.family))

            if (targetFont) {
            
                const targetFontName = targetFont.family
                const selectionStartIndex = value.length
                const selectionEndIndex = targetFontName.length

                hasMatchedFontFamily = true
                settings[index].fontFamily = targetFontName
            
                tick().then(() => {
                    // console.log('set')
                    getInputElement(index).setSelectionRange(selectionStartIndex, selectionEndIndex)
                })
            
            } else {

                hasMatchedFontFamily = false

            }

        } else {

            hasMatchedFontFamily = false

        }

        settingsValueOldCache[index] = value
    }

    function handleInputKeydown(e){

        const index = getInputElementIndex(e)
        const element = getInputElement(index)

        switch (e.key) {
            case 'Enter':
                element.blur()
                break;
        
            default:
                break;
        }

    }

    function getInputElementIndex(e) {

        return +e.currentTarget.id.match(/\d/g)[0]

    }

    function getInputElement(index) {

        return document.querySelector(`#input-${index}`)

    }

</script>

<style>

.wrapper {

    display: flex;
    flex-direction: column;
    height: 100vh;

}

.setting-area {

    flex: auto;
    overflow: auto;

}

.bottom-area {

    flex: none;
    display: flex;
    justify-content: flex-end;
    /* position: fixed; */
    /* bottom: 0;
    left: 0;
    width: 100%; */
    /* background-color: rgba(255, 255, 255, .9); */
    /* z-index: 1; */

}

:global(.item-label) {

	font-size: var(--font-size-xsmall);
    font-weight: var(--font-weight-normal);
    letter-spacing: var( --font-letter-spacing-pos-xsmall);
    line-height: var(--line-height);
    color: var(--black8-opaque) !important;
    height: var(--size-medium);
    width: 100%;
    display: flex;
    align-items: center;
    cursor: default;
    user-select: none;
    padding: 0 calc(var(--size-xxsmall) / 2) 0 var(--size-xxsmall);

}

.input-selector {

    display: flex;
    align-items: center;

}

.input-selector:hover > :global(.arrow-down) {

    background-color: var(--silver);
    opacity: 1;
    pointer-events: auto;

}

:global(.input) {

    flex: auto;
    margin: 0;

}

:global(.arrow-down) {

    flex: none;
    width: 30px !important;
    height: 26px !important;
    transform: rotate(-90deg);
    border-radius: 3px;
    background-color: var(--silver);
    opacity: 0;
    pointer-events: none;
    cursor: pointer;

}

.enable-apply-tips {

    font-size: 10px;
    color: var(--black3-opaque);
    width: 100px;
    text-align: right;
    transform: translateY(6px);

}

.enable-apply-tips.hidden {

    display: none;

}

</style>