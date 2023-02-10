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

    list.unshift({"id": 40, "value": "test4"});
    yield {list};

    list.shift();
    yield {list};

    list.splice(1, 0, {"id": 50, "value": "test5"});
    yield {list};

    list.splice(2, 0, {"id": 60, "value": "test6"});
    list.splice(3, 0, {"id": 70, "value": "test7"});
    yield {list};

    list.push({"id": 80, "value": "test8"});
    yield {list};

    list[0].value = 'test9 changed';
    yield {list};

    // empty list
    yield {list: []};

    // back whole list
    yield {list};
}


