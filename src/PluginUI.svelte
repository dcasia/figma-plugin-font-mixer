<div class="wrapper pr-xxsmall pl-xxsmall">

    <div class="main {!isRestoreDone ? '--invisible' : ''}">
        {#if !isAddPanelShown}
            <div class="setting-area">
                {#each settings as {label, name, fontFamily, fontStyle, fontSize, fontColor, fontOpacity}, index }
                    <div class="setting-item pt-xxsmall pb-xxsmall">
                        <Type class="item-label" weight="bold">{label}</Type>
                        <Icon class="remove-button"
                                iconName={IconMinus}
                                on:click={removeSettingItem(name)}/>
                        <div class="item-setting">
                            <Input id="font-family-input-{index}"
                                    class="ml-xxsmall mr-xxsmall {hasMatchedFontFamily[index] ? '' : 'no-matched-font'}"
                                    placeholder='Search a font name'
                                    bind:value={fontFamily}
                                    on:input={handleInput}
                                    on:keydown={handleInputKeydown}
                                    on:focus={handleInputFocus}/>
                            <div class="font-style-flex-area flex justify-content-between align-items-center mt-xxsmall">
                                <Input id="font-weight-input-{index}"
                                        class="font-size-input"
                                        placeholder='Size'
                                        bind:value={fontSize}
                                        on:keydown={handleInputKeydown}
                                        on:focus={handleInputFocus}/>
                                <div class="font-color-container">
                                    <div class="font-color-indicator"
                                            class:has-border={fontColor === 'ffffff' || fontColor === 'fff'}
                                            style="background-color:#{fontColor};"/>
                                    <Input id="font-color-input-{index}"
                                            class="font-color-input"
                                            placeholder='Color'
                                            bind:value={fontColor}
                                            on:keydown={handleInputKeydown}
                                            on:focus={handleInputFocus}/>
                                    <Input id="font-color-opacity-input-{index}"
                                            class="font-color-opacity-input"
                                            bind:value={fontOpacity}
                                            on:keydown={handleInputKeydown}
                                            on:focus={handleInputFocus}
                                            on:blur={handleInputBlur}
                                            on:blur={()=>handleOpacityValue(index)}/>
                                </div>
                            </div>
                            <SelectMenu class="font-weight-selector mt-xxsmall"
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

    {#if !isRestoreDone}
    <div class="main-loading">
        <Loading/>
    </div>
    {/if}

	<div class="bottom-area pt-xxsmall pb-xxsmall">
        <Icon class="add-button"
              iconName={!isAddPanelShown ? IconPlus : IconBack}
              on:click={!isAddPanelShown ? showAddPanel : showSettingPanel}/>
        <span class="tips mr-xxsmall"
              class:hidden={!isApplyButtonDisabled || isAddPanelShown}>
            Select nodes contain editable text to enable
        </span>
        <span class="tips mr-xxsmall"
              class:hidden={!isDuplicateTipShown || !isAddPanelShown}>
            Duplicate types cannot be added
        </span>
        {#if isApplying}
            <Loading />
        {/if}
        <Button class="cta"
                on:click={!isAddPanelShown ? apply : add}
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
    import { rgbToHex } from './utils.ts'
    import { onMount, onDestroy } from 'svelte'
    import { fade } from 'svelte/transition';
    import Loading from './Loading.svelte'

    const defaultFontStyles = ['Regular', 'Plain', 'Book']
    // A middle cache array that is used to remove duplicate font items and never be used to render views
	let _fontsNameCache = [] 
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
        {"value":"thai","label":"Thai","group":'Language',"selected":false},
        {"value":"digits","label":"Digits","group":'Content Type',"selected":false},
        {"value":"chineseSymbol","label":"Chinese symbol","group":'Content Type',"selected":false},
        {"value":"englishSymbol","label":"English symbol","group":'Content Type',"selected":false}
    ]
    let selectedOptionalMatchType
    let isApplyButtonDisabled = true
    let settings = [
        {
            label: 'English',
            name: 'english',
            fontFamily: '',
            fontStyle: '',
            fontSize: '',
            fontColor: '',
            fontOpacity: '100%'
        },
        {
            label: 'Chinese',
            name: 'chinese',
            fontFamily: '',
            fontStyle: '',
            fontSize: '',
            fontColor: '',
            fontOpacity: '100%'
        }
    ]
    let _settingsValueOldCache = []
    let isAddPanelShown = false
    let isDuplicateTipShown = false
    let isRestoreDone = false
    let isApplying = false

    $: selectedOptionalMatchType, hideDuplicateTip()
    $: settings, saveSettingToPluginData()
    $: settings.forEach((setting => {

        // Filter out non-numeric value in font size input box
        setting.fontSize = setting.fontSize.replace(/[^0-9]/g, '')

        if (!setting.fontColor.includes('rgb')) {

            // Filter out hash symbol in color input box
            setting.fontColor = setting.fontColor.replace('#', '')   

        } else {

            // Convert RGBA value to Hex value
            const [r,g,b,a] = setting.fontColor.match(/[0-9\.]+/g) || []
            
            if (r && g && b) setting.fontColor = rgbToHex(+r,+g,+b)

            if (+a) setting.fontOpacity = Math.max(Math.min(+a * 100, 100), 0) + '%'

        }

        setting.fontOpacity = setting.fontOpacity.replace(/[^0-9%\.]/g, '')

    }))

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
            case 'apply-done':
                isApplying = false
            case 'restore-setting':

                // if no setting data transferred we can directly mark restore as done
                // as it will use the default setting data defined in `settings` variable
                if (!eventData) {
                    isRestoreDone = true
                    return
                }

                try {

                    const deepClonedEventData = JSON.parse(JSON.stringify(eventData))

                    if (eventData) {

                        settings = eventData

                        initFontHasMatchedFlag()

                    }

                    if (deepClonedEventData) {

                        deepClonedEventData.forEach(font => {

                            const fontStyleToBeRestored = font.fontStyle.value

                            if (fontStylesForMenu[font.fontFamily]) {

                                fontStylesForMenu[font.fontFamily].forEach(fontStyle => {

                                    if (fontStyle.value === fontStyleToBeRestored) {

                                        fontStyle.selected = true

                                    } else {

                                        fontStyle.selected = false

                                    }

                                })

                            }

                        })
                        
                    }
                    
                } catch (error) {
                    
                    console.error('[Font mixer]: Error when parsing settings', error)

                }

                isRestoreDone = true

                break
			case 'loaded-fonts-list':

                try {
                    // Convert multiple separate font styles under the same font family to one common entry
                    fontsList = eventData.reduce((result, item) => {

                    const fontFamily = item.fontName.family
                    const fontStyle = item.fontName.style

                    if (!_fontsNameCache.includes(fontFamily)) {
                        _fontsNameCache.push(fontFamily)
                        result.push({family: fontFamily, styles: [fontStyle]})
                    } else {
                        result.find(font => font.family === fontFamily).styles.push(fontStyle)
                    }
                    return result

                    }, [])

                    // Convert font styles under each font family to a sepcific shape array that select menu component able to consume
                    fontStylesForMenu = {
                        ...fontStylesForMenu,
                        ...fontsList.reduce((result, font) => {

                            if (font.family) {

                                const defaultFontStyle = decideDefaultFontStyle(font.styles)

                                result[font.family] = font.styles.map((style, index) => {
                                    return {value: style, label: style, selected: style === defaultFontStyle}
                                })

                            }

                            return result

                        }, {})
                    }
                } catch (error) {

                    console.error('[Font mixer]: Load fonts failed', error)

                }

                restoreSettingFromPluginData()

				break
			default:
				break
		}

	}

    function apply() {

        if (isApplying) return

        isApplying = true

        const simplifiedSettings = settings.map((setting, index) => {
            
            let {label, name, fontFamily, fontStyle, fontSize, fontColor, fontOpacity} = setting

            fontFamily = hasMatchedFontFamily[index] ? fontFamily : ''

            return {label, name, fontFamily, fontStyle: fontStyle.value, fontSize, fontColor, fontOpacity}

        })

        parent.postMessage({ pluginMessage: { type: 'apply', data: simplifiedSettings } }, '*')

    }

    function add() {

        if (!selectedOptionalMatchType) return

        const {value, label} = selectedOptionalMatchType

        if (!settings.find(i => i.name === value)) {

            settings = [...settings, {name: value, label, fontFamily: '', fontStyle: '', fontSize: '', fontColor: '', fontOpacity: '100%'}]
            showSettingPanel()

        } else {

            showDuplicateTip()

        }

    }
    
    function handleInput(e) {

        const index = getInputElementIndex(e)
        const value = e.target.value
        const regExp = new RegExp(`^${value}`, 'i')

        _settingsValueOldCache[index] = _settingsValueOldCache[index] || ''

        if(!regExp.test(_settingsValueOldCache[index])) {

            const targetFont = fontsList.find((item) => regExp.test(item.family))

            if (targetFont) {
            
                const targetFontName = targetFont.family
                const selectionStartIndex = value.length
                const selectionEndIndex = targetFontName.length

                /**
                 * For the reason of micro task logic has been updated in Svelte > 3.20.1
                 * The timer here is necessary to make good input&match experience
                */
                setTimeout(async () => {
                    settings[index].fontFamily = targetFontName
                    hasMatchedFontFamily[index] = true
                    await tick()
                    getInputElement(index).setSelectionRange(selectionStartIndex, selectionEndIndex)
                })
            
            } else {

                hasMatchedFontFamily[index] = false

            }

        } else {

            hasMatchedFontFamily[index] = false

        }

        _settingsValueOldCache[index] = value
    }

    function handleInputKeydown(e) {

        const id = e.currentTarget.id
        const inputElement = document.querySelector(`#${id}`)

        switch (e.key) {
            case 'Enter':
                inputElement.blur()
                break;
        
            default:
                break;
        }

    }

    function handleInputFocus(e) {

        const id = e.currentTarget.id
        const inputElement = document.querySelector(`#${id}`)
        const selectionEndIndex = e.currentTarget.value.length

        if (selectionEndIndex > 0) {

            inputElement.setSelectionRange(0, 0)
            inputElement.setSelectionRange(0, selectionEndIndex)

        }
        
    }

    function handleInputBlur(e) {

    }

    function handleOpacityValue(index) {

        const matchResult = settings[index].fontOpacity.match(/[0-9\.]+/)
        const numeric = matchResult && matchResult[0] || 100

        settings[index].fontOpacity = numeric + '%'

    }
    
    function getInputElementIndex(e) {

        return +e.currentTarget.id.match(/\d/g)[0]

    }

    function getInputElement(index) {

        return document.querySelector(`#font-family-input-${index}`)

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
        unselectAll(optionalMatchType)
        
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

    function restoreSettingFromPluginData() {

        parent.postMessage({ pluginMessage: { type: 'get-setting' } }, '*')

    }

    function saveSettingToPluginData() {

        parent.postMessage({ pluginMessage: { type: 'save-setting', data: settings } }, '*')

    }

    function initFontHasMatchedFlag() {

        settings.forEach((font, index) => {

            if (font.fontFamily && font.fontStyle.value) hasMatchedFontFamily[index] = true

        })

    }

    function unselectAll(data) {

        data.forEach(item => {
            item.selected = false
        })

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
    transition: opacity .3s;

}

.main-loading {
    position: fixed;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.main.--invisible {

    opacity: 0;
        
}

.setting-area, .add-area {

    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% + var(--size-xxsmall));
    padding-right: var(--size-xxsmall);
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
    bottom: -1px;
    left: 0;
    width: 100%;
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

:global(.input.no-matched-font input) {

    border: 1px solid var(--red);

}

:global(.input.no-matched-font input:hover) {

    border: 1px solid var(--red);

}

:global(.input.no-matched-font input:active), :global(.input.no-matched-font input:focus) {

    border-color: var(--red);
    outline-color: var(--red);

}

.tips {

    font-size: 10px;
    color: var(--black3-opaque);
    text-align: right;
    width: 120px;

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

.font-style-flex-area > :global(div) {

    flex: auto;

}

.font-style-flex-area > :global(div:nth-child(1)) {

    flex-basis: 27%;

}

.font-style-flex-area > :global(div:nth-child(2)) {

    flex-basis: 73%;
    margin-left: var(--size-xxsmall);

}

:global(.font-color-input.input > input) {

    padding-left: var(--size-medium);

}

:global(.font-color-opacity-input) {

    flex-basis: 40%;

}

.font-color-container {

    position: relative;
    display: flex;

}

.font-color-indicator {

    position: absolute;
    left: 0;
    top: 50%;
    transform: translate(var(--size-xxsmall), -50%);
    width: var(--size-xsmall);
    height: var(--size-xsmall);
    background-color: black;
    z-index: 1;
    border-radius: 1px;

}

.font-color-indicator.has-border {

    box-shadow: 0 0 0 1px var(--black1);;

}



</style>