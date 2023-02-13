/**
 * @module     Z Template
 * @author     Daniel Sevcik <sevcik@webdevelopers.cz>
 * @copyright  2023 Daniel Sevcik
 * @license    MIT
 * 
 * This is a JavaScript callback function for the Z-Template plugin
 * that creates a rolling letters effect, transforming one text into
 * another by replacing each character one-by-one with a set speed and
 * delay.
 *
 * It will register the "roller" as global default callback function.
 *
 * Using it like this:
 *
 * <element z-var="'some value' call roller">Original Value</element>
 * <element z-var="'some value' call roller(speed, startCharDelay)">Original Value</element>
 * <element z-var="'some value' call roller(1000, 1000)">Original Value</element>
 *
 * You must include also zcall.roller.css in your page.
 */
zTemplate.callbacks
    .set('roller', function(element, detail) {
        const document = element.ownerDocument;
        const speed = detail.arguments[0] || 1000;
        const delay = detail.arguments[1] || 100;
        // Convert value into string
        const sourceText = element.textContent + '';  
        const targetText = detail.value + '';
        const len = Math.max(sourceText.length, targetText.length);
        const frag = document.createDocumentFragment();
        const height = element.getBoundingClientRect().height;

        if (sourceText === targetText || sourceText.length === 0) {
            element.textContent = targetText;
            return;
        }

        // Set css variable --z-roller-speed
        element.classList.add('z-roller-rolling');
        
        for (let i = 0; i < len; i++) {
            const sourceChar = sourceText[i] || '';
            const targetChar = targetText[i] || '';

            const div = frag.appendChild(document.createElement('div'));
            div.setAttribute('data-target', targetChar);
            const {direction, chars} = generateRollerChars(sourceChar, targetChar);
            if (direction === 'up') {
                div.classList.add('z-roller-up', 'z-roller');
            } else {
                div.classList.add('z-roller-down', 'z-roller');
            }

            const charSpan = div.appendChild(document.createElement('span'));
            charSpan.classList.add('z-roller-letter');
            charSpan.textContent = sourceChar;

            // We use :before to avoid multiplying the textContents
            // when multiple callbacks are applied in short succession
            div.style.setProperty('--z-roller-speed', speed + 'ms');
            div.style.setProperty('--z-roller-line-height', height + 'px');
            div.setAttribute('data-z-face', chars.join("\n"));

        }

        element.replaceChildren(frag);
        for (i = 0; i < element.childElementCount; i++) {
            // Get i-th child element
            const child = element.children[i];
            const charDelay = delay * i;
            child.style.setProperty('--z-roller-delay', charDelay + 'ms');
            child.classList.add('z-roller-animate');
            setTimeout(() => child.replaceWith(child.getAttribute('data-target')), charDelay + speed);
        }

        // Generate array of characters between two characters
        function generateRollerChars(fromChar, toChar) {
            let fromCode = (fromChar || ' ').charCodeAt(0);
            let toCode = (toChar || ' ').charCodeAt(0);
            const len = Math.abs(fromCode - toCode);
            const chars = [];

            const direction = fromCode < toCode ? 'up' : 'down';
            if (direction === 'down') {
                [fromCode, toCode] = [toCode, fromCode];
            }

            for (let i = 0; i <= len; i++) {
                chars.push(String.fromCharCode(fromCode + i));
            }
            return {direction, chars};
        }
    });
