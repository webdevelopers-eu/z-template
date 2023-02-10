// Import zTemplate into zTemplateImport variable
import { zTemplate as zTemplateModule } from '../../javascript/template.js';

const headerVars = {
    "bundle": location.href.match(/bundle/) ? true : false,
    "pass": true,
};

if (!headerVars.bundle) {
    window.zTemplate = zTemplateModule;
}

const callbacks = {
    onTest1: (element, detail) => {
        console.log('onTest1', element, detail);
        element.setAttribute('data-test1', JSON.stringify(detail));
    },
    onTest2: (element, detail) => {
        console.log('onTest2', element, detail);
        element.setAttribute('data-test2', JSON.stringify(detail));
    },
    cbTest2: (element, detail) => { // this should overwrite the global default
        console.log('cbTest2', element, detail);
        $(element).text('Local callback cbTest2: ' + JSON.stringify(detail));
    },
};

zTemplate.callbacks.set('cbTest1', (element, detail) => {
    console.log('cbTest1', element, detail);
    $(element).text('Default callback cbTest1: ' + JSON.stringify(detail));
});
zTemplate.callbacks.set('cbTest2', (element, detail) => {
    console.log('cbTest1', element, detail);
    $(element).text('Default callback cbTest2: ' + JSON.stringify(detail));
});


// Listen on #tests for a custom new Event('test1') event dispatched on the child element.
// When the event is dispatched, the callback will be called with the element and the event detail.
$('#tests')
    .on('printargs', function(event) {
        console.log('printargs', event, event.originalEvent.detail);
        $(event.target).text(JSON.stringify(event.originalEvent.detail));
    })
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
        event.target.setAttribute('data-event-test1', JSON.stringify(event.detail));
    }, false);

document.querySelector('#tests')
    .addEventListener('test2', (event) => {
        console.log('EVENT Native test2', event);
        event.target.setAttribute('data-event-test2', JSON.stringify(event.detail));
    }, false);

const onlyTest = location.href.match(/test=(?<idx>\d+)/)?.groups?.idx;
document.querySelectorAll('#tests > li > *:first-child')
    .forEach((test1, idx) => {
        if (onlyTest != null) {
            if (onlyTest != idx) {
                test1.parentElement.remove();
            } else {
                $(test1.parentElement).append(`<div class="actions"><a href='?'>Show all tests</a></div>`);
            }
        } else {
            $(test1.parentElement).append(`<div class="actions"><a href='?test=${idx}'>Only this</a></div>`);
        }
        const data = JSON.parse(test1.parentNode.getAttribute('data') || '{}');
        // get following <article> element if any
        let test2 = test1.nextElementSibling?.localName === 'article' ? test1.nextElementSibling : null;

        if (!test2) { // Result not created yet, use old Z Template 1.0 to generate it
            test2 = test1.parentNode.appendChild(test1.cloneNode(true));
            $(test2).template(data);
        }

        for (let i = 0; i < 2; i++) { // try twice
            console.log('Test round %s for %o with data %o', i + 1, test1.parentNode, data);
            zTemplate(test1, data, callbacks);

            // the z-content-rev attribute is added after the template is rendered to trigger CSS anim restart.
            // so we wait with the result evaluation until the attribute is added.
            setTimeout(() => { 
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
                } else {
                    test1.parentNode.classList.add('pass');
                }
            }, 10);
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
