import { zTemplate as zTemplate } from '../../javascript/template.js';

const genVar = test();
document
    .addEventListener('click', (ev) => {
        if (ev.target.localName == 'button') {
            zTemplate(document.querySelector('#test'), genVar.next().value || {});
        }
    });

function *test() {
    const list = [22, 33, 44];
    yield {list};

    list.unshift(11);
    yield {list};

    list.shift();
    yield {list};

    list.splice(1, 0, 'aa');
    yield {list};

    list.splice(1, 0, 'cc');
    list.splice(1, 0, 'bb');
    yield {list};


}


