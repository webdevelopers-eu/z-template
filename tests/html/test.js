import { dnaTemplate } from '../../javascript/template.js';

document.querySelectorAll('#tests > li > *:first-child')
  .forEach((test1) => {
    const data = JSON.parse(test1.parentNode.getAttribute('data') || '{}');
    let test2 = test1.nextElementSibling;

    if (!test2) { // Result not created yet, use old DNA Template 1.0 to generate it
      test2 = test1.parentNode.appendChild(test1.cloneNode(true));
      $(test2).template(data);
    }

    for (let i = 0; i < 2; i++) { // try twice
      console.log('Test round %s for %o with data %o', i + 1, test1.parentNode, data);
      dnaTemplate(test1, data);

      // Serialize element including the element itself
      const html1 = serialize(test1);
      test1.setAttribute('data-source', html1);
      const html2 = serialize(test2);
      test2.setAttribute('data-source', html2);

      if (html1 !== html2) {
        test1.parentNode.classList.add('fail');
        console.log('Fail:', test1.parentNode, data);
        console.log('Produced:', html1);
        console.log('Expected:', html2);
        break;
      } else {
        test1.parentNode.classList.add('pass');
      }
    }

    function serialize(el) {
      const div = document.createElement('div');
      div.appendChild(el.cloneNode(true));

      const attrs = div.ownerDocument.evaluate('//@*[starts-with(name(), "z-var-content")]', div, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i = 0; i < attrs.snapshotLength; i++) {
        const attr = attrs.snapshotItem(i);
        attr.ownerElement.removeAttribute(attr.nodeName);
      }

      return div.innerHTML;
    };

  });




