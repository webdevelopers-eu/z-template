// Import zTemplate into zTemplateImport variable
import { zTemplate as zTemplateModule } from '../../javascript/template.js';

const headerVars = {
    "bundle": location.href.match(/bundle/),
    "pass": true,
};

if (!headerVars.bundle) {
    window.zTemplate = zTemplateModule;
}

const callbacks = {
    onTest1: (element, test1) => {
        console.log('onTest1', element, test1);
        element.setAttribute('data-test1', test1);
    },
    onTest2: (element, test2) => {
        console.log('onTest2', element, test2);
        element.setAttribute('data-test2', test2);
    },
};


// Listen on #tests for a custom new Event('test1') event dispatched on the child element.
// When the event is dispatched, the callback will be called with the element and the event detail.
$('#tests')
    .on('click', '> li', function(event) {
        $(this).toggleClass('active');
    })
    .on('click', 'article', (event) => {
        // copy the innerHTML of the clicked element to the clipboard
        const text = event.currentTarget.innerHTML;
        const input = document.createElement('textarea');
        input.textContent = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);

        // Show quick message
        const message = document.createElement('div');
        message.classList.add('message');
        message.innerHTML = 'Copied to clipboard';
        document.body.appendChild(message);
        setTimeout(() => {
            message.remove();
        }, 1000);
        return false;
    })
    .on('test1 test2', (event) => {
        console.log('EVENT jQuery test1', event);
    });

document.querySelector('#tests')
    .addEventListener('test1', (event) => {
        console.log('EVENT Native test1', event);
        event.target.setAttribute('data-event-test1', event.detail);
    }, false);

document.querySelector('#tests')
    .addEventListener('test2', (event) => {
        console.log('EVENT Native test2', event);
        event.target.setAttribute('data-event-test2', event.detail);
    }, false);

document.querySelectorAll('#tests > li > *:first-child')
    .forEach((test1) => {
        const data = JSON.parse(test1.parentNode.getAttribute('data') || '{}');
        let test2 = test1.nextElementSibling;

        if (!test2) { // Result not created yet, use old Z Template 1.0 to generate it
            test2 = test1.parentNode.appendChild(test1.cloneNode(true));
            $(test2).template(data);
        }

        for (let i = 0; i < 2; i++) { // try twice
            console.log('Test round %s for %o with data %o', i + 1, test1.parentNode, data);
            zTemplate(test1, data, callbacks);

            const html1 = serialize(test1);
            const html2 = serialize(test2);
            test1.setAttribute('data-source', html1);
            test2.setAttribute('data-source', html2);

            if (html1 !== html2) {
                headerVars.pass = false;
                test1.parentNode.classList.add('fail');
                test1.parentNode.classList.remove('pass');
                console.warn('Fail:', test1.parentNode, data);
                console.warn('Produced:', html1);
                console.warn('Expected:', html2);
                break;
            } else {
                test1.parentNode.classList.add('pass');
            }
        }

        function serialize(el) {
            const div = document.createElement('div');
            const clone = el.cloneNode(true);
            clone.removeAttribute('data-source');
            div.appendChild(clone);

            const attrs = div.ownerDocument.evaluate('//@*[starts-with(name(), "z-var-content")]', div, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
            for (let i = 0; i < attrs.snapshotLength; i++) {
                const attr = attrs.snapshotItem(i);
                attr.ownerElement.removeAttribute(attr.nodeName);
            }
            return div.innerHTML.replace(/^\s*\n/gm, "").replace(/^\s+/gm, "");
        };

    });


zTemplate(document.querySelector('#header'), headerVars);
