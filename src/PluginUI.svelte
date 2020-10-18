<div class="wrapper pr-xxsmall pl-xxsmall">

    <div class="main">
        {#if !isAddPanelShown}
            <div class="setting-area">
                    {#each settings as {label, name, fontFamily, fontStyle}, index }
                        <div class="setting-item pt-xxsmall pb-xxsmall">
                            <Type class="item-label" weight="bold">{label}</Type>
                            <Icon class="remove-button"
                                  iconName={IconMinus}
                                  on:click={removeSettingItem(name)}/>
                            <div class="item-setting">
                                <Input id="input-{index}"
                                       class="input ml-xxsmall mr-xxsmall"
	                        	       placeholder='Search a font name'
                                       bind:value={fontFamily}
                                       on:input={handleInput}
                                       on:keydown={handleInputKeydown}
                                       on:focus={handleInputFocus}/>
                                <SelectMenu class="font-style-selector"
                                            bind:menuItems={fontStylesForMenu[hasMatchedFontFamily[index] ? fontFamily : '_default']}
                                            disabled={!hasMatchedFontFamily[index]}
                                            bind:value={fontStyle}/>
	                        </div>
                        </div>
                    {/each}
                    {#if !settings.length}
                        <div class="content-in-empty-setting-panel">
                            <Icon class="add-button-in-empty"
                                  iconName={IconPlus}
                                  on:click={showAddPanel}/>
                            <p class="tip-in-empty">
                                Click "+" to add a match type
                            </p>
                        </div>
                    {/if}
            </div>
        {:else}
            <div class="add-area pt-xxsmall pb-xxsmall">
                <Type class="item-label" weight="bold">Add a new match type</Type>
                <SelectMenu bind:menuItems={optionalMatchType}
                            bind:value={selectedOptionalMatchType}
                            showGroupLabels
                            placeholder="Select a type"/>
                <!-- <div class="add-area-advanced">

                </div> -->
            </div>
        {/if}
    </div>

	<div class="bottom-area pt-xxsmall pb-xxsmall">
        <Icon class="add-button"
              iconName={!isAddPanelShown ? IconPlus : IconBack}
              on:click={!isAddPanelShown ? showAddPanel : showSettingPanel}/>
        <span class="tips mr-xxsmall"
              class:hidden={!isApplyButtonDisabled || isAddPanelShown}>
            Select nodes contain editable text
        </span>
        <span class="tips mr-xxsmall"
              class:hidden={!isDuplicateTipShown || !isAddPanelShown}>
            Duplicate types cannot be added
        </span>
        <Button on:click={!isAddPanelShown ? apply : add}
                disabled={!isAddPanelShown && isApplyButtonDisabled || isAddPanelShown && !selectedOptionalMatchType}
                variant={!isAddPanelShown ? 'primary' : 'secondary' }>
            {!isAddPanelShown ? 'Apply' : 'Add'}
        </Button>
    </div>

</div>

<script>

    import { tick } from 'svelte';
	import { GlobalCSS } from 'figma-plugin-ds-svelte';
	import { Button, Input, SelectMenu, Type, Icon, IconPlus, IconBack, IconMinus, Disclosure, DisclosureItem } from 'figma-plugin-ds-svelte';
    // import { fade } from 'svelte/transition';

    const defaultFontStyles = ['Regular', 'Plain', 'Book']
	let fontsNameCache = [] 
    let fontsList = []
    let fontStylesForMenu = {
        _default: [{value: '', label: 'Regular', selected: true}]
    }
    let hasMatchedFontFamily = []
    let optionalMatchType = [
        {"value":"english","label":"English","group":'Language',"selected":false},
        {"value":"chinese","label":"Chinese","group":'Language',"selected":false},
        {"value":"portuguese","label":"Portuguese","group":'Language',"selected":false},
        {"value":"japanese","label":"Japanese","group":'Language',"selected":false},
        {"value":"korean","label":"Korean","group":'Language',"selected":false},
        {"value":"russian","label":"Russian","group":'Language',"selected":false},
        {"value":"digits","label":"Digits","group":'Content Type',"selected":false}
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
        }
    ]
    let settingsValueOldCache = []
    let isAddPanelShown = false
    let isDuplicateTipShown = false

    $: selectedOptionalMatchType, hideDuplicateTip()

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

                fontStylesForMenu = {
                    ...fontStylesForMenu,
                    ...fontsList.reduce((result, font) => {

                    if (font.family) {

                        const defaultFontStyle = decideDefaultFontStyle(font.styles)

                        result[font.family] = font.styles.map((style, index) => {
                            return {value: style, label: style, group: null, selected: style === defaultFontStyle}
                        })

                    }

                    return result

                    }, {})
                }

                // console.log(fontsList)
				break
			default:
				break
		}

	}

    function apply() {

        const simplifiedSettings = settings.map((setting) => {
            
            const {label, name, fontFamily, fontStyle} = setting

            return {label, name, fontFamily, fontStyle: fontStyle.value}

        })

        parent.postMessage({ pluginMessage: { type: 'apply', data: simplifiedSettings } }, '*')

    }

    function add() {

        if (!selectedOptionalMatchType) return

        const {value, label} = selectedOptionalMatchType

        if (!settings.find(i => i.name === value)) {

            settings = [...settings, {name: value, label, fontFamily: '', fontStyle: ''}]
            showSettingPanel()

        } else {

            showDuplicateTip()

        }

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

                hasMatchedFontFamily[index] = true
                settings[index].fontFamily = targetFontName
            
                tick().then(() => {
                    getInputElement(index).setSelectionRange(selectionStartIndex, selectionEndIndex)
                })
            
            } else {

                hasMatchedFontFamily[index] = false

            }

        } else {

            hasMatchedFontFamily[index] = false

        }

        settingsValueOldCache[index] = value
    }

    function handleInputKeydown(e) {

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

    function handleInputFocus(e) {

        const selectionEndIndex = e.currentTarget.value.length
        const index = getInputElementIndex(e)
        const inputElement = getInputElement(index)

        if (selectionEndIndex > 0) {

            inputElement.setSelectionRange(0, selectionEndIndex)

        }
        
    }
    
    function getInputElementIndex(e) {

        return +e.currentTarget.id.match(/\d/g)[0]

    }

    function getInputElement(index) {

        return document.querySelector(`#input-${index}`)

    }

    function decideDefaultFontStyle(fontStyles) {

        const defaultFontStyle = fontStyles.find(i => defaultFontStyles.includes(i))

        if (defaultFontStyle) {
            return defaultFontStyle
        } else {
            return fontStyles[fontStyles.length - 1]
        }

    }

    function showAddPanel() {

        isAddPanelShown = true

    }

    function showSettingPanel() {


        isAddPanelShown = false
        selectedOptionalMatchType = null
        
    }

    function showDuplicateTip() {

        isDuplicateTipShown = true

    }

    function hideDuplicateTip() {

        isDuplicateTipShown = false

    }

    function removeSettingItem(name) {

        const targetIndex = settings.findIndex(i => i.name === name)

        if (targetIndex >= 0) {

            settings.splice(targetIndex, 1)
            settings = settings

        }

    }

</script>

<style>

.wrapper {

    display: flex;
    flex-direction: column;
    height: 100vh;

}

.main {

    flex: auto;
    position: relative;

}

.setting-area, .add-area {

    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: auto;

}

.setting-item {

    position: relative;

}

.setting-item:not(:last-child)::after {

    content: '';
    position: absolute;
    height: 1px;
    width: calc(100% - var(--size-xxsmall));
    bottom: -1px;
    left: calc(var(--size-xxsmall));
    background-color: var(--black1);

}

.bottom-area {

    flex: none;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--black1);
    margin: 0 calc(-1 * var(--size-xxsmall));
    padding: var(--size-xxsmall);

}

:global(.remove-button) {

    position: absolute;
    top: var(--size-xxsmall);
    right: 0;
    opacity: 0;
    border-radius: var(--border-radius-small);

}

.setting-item:hover :global(.remove-button) {

    opacity: 1;

}


:global(.add-button) {

    margin-right: auto;
    border-radius: var(--border-radius-small);

}

:global(.add-button:hover), :global(.remove-button:hover) {

    background-color: var(--hover-fill);

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

.item-setting {

    display: flex;
    flex-direction: column;

}

.item-setting > :global(div:nth-of-type(2)) {

    flex: auto;

}

:global(.input) {

    margin: 0;

}

.tips {

    font-size: 10px;
    color: var(--black3-opaque);
    width: 100px;
    text-align: right;

}

.tips.hidden {

    display: none;

}

.content-in-empty-setting-panel {

    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

}

:global(.add-button-in-empty) {

    background-color: var(--grey);
    margin-bottom: var(--size-xxxsmall);
    border-radius: var(--border-radius-small);

}

:global(.add-button-in-empty:hover) {

    background-color: var(--silver);

}

.tip-in-empty {

    font-size: var(--font-size-large);
    color: var(--black3-opaque);
    white-space: nowrap;

}

</style>