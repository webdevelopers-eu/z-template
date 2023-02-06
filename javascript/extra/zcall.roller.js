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

        // Set css variable --z-roller-speed
        element.style.setProperty('--z-roller-speed', speed + 'ms');
        
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

            const faceSpan = div.appendChild(document.createElement('span'));
            faceSpan.classList.add('z-roller-face');
            faceSpan.textContent = chars.join("\n");
        }

        element.replaceChildren(frag);
        for (i = 0; i < element.childElementCount; i++) {
            // Get i-th child element
            const child = element.children[i];
            setTimeout(() => {
                child.classList.add('z-roller-animate');
                setTimeout(() => {
                    child.replaceWith(child.getAttribute('data-target'));
                }, speed);
            }, i * delay);
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
