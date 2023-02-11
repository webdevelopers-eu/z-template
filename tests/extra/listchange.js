import { zTemplate as zTemplate } from '../../javascript/template.js';

const genVar = test();
document
    .addEventListener('click', (ev) => {
        if (ev.target.localName == 'button') {
            zTemplate(document.querySelector('#test'), genVar.next().value || {});
        }
    });

function *test() {
    const list = [
        {"id": 10, "value": "test1"},
        {"id": 20, "value": "test2"},
        {"id": 30, "value": "test3"}
    ];
    yield {list};

    list.shift();
    list.push({"id": 40, "value": "test4"});
    yield {list};

    list.splice(1, 0, {"id": 50, "value": "test5"});
    yield {list};

    list.pop();
    yield {list};
}


