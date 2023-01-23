import { tokenize } from './tokenize.js';
import { evaluate } from './evaluate.js';

/**
 *
 *
 * @module     DnaTemplate
 * @author     Daniel Sevcik <sevcik@webdevelopers.cz>
 * @copyright  2023 Daniel Sevcik
 * @since      2023-01-21 13:31:43 UTC
 * @access     public
 */
class Template {
  /**
   * @param DOMElement scope root element
   */
  rootElement = null;

  /**
   * @param Object data to apply to the template
   */
  vars = null;

  /**
   * @param int scopeLevel level of the scope used to select elements only from this scope.
   */
  scopeLevel = 0;

  /**
   * @param string scopeSelector selector used to identify scope elements
   */
  scopeSelector = "*[@template or (@template-scope and @template-scope != 'inherit')]";

  /**
   * @param string zElementSelector used to identify z-var elements that need processing
   */
  zElementSelector = "*[@z-var]";  

  /**
   * @param string scopeLevelSelector used to identify the scope level.
   */
  scopeLevelSelector = `count(ancestor-or-self::${this.scopeSelector})`;

  constructor(rootElement) {
	  // If root element is not instance of 
	  if (!(rootElement instanceof Element)) {
	    throw new Error('DnaTemplate accepts an instance of HTMLElement as constructor argument');
	  }
	  this.rootElement = rootElement;
    this.scopeLevel = this.query(this.scopeLevelSelector, rootElement);
  }

  render(vars) {
	  this.vars = vars;

	  // Run xpath on root element
    const found = this.query(`descendant-or-self::${this.zElementSelector}[${this.scopeLevelSelector} = ${this.scopeLevel}]`);
    console.log('found', found);
    // Cycle found array and process each element
    for (let i = 0; i < found.length; i++) {
      this.processZElement(found[i]);
    }
	  // //div[not(ancestor::article[not(ancestor::article)])]
  }

  processZElement(zElement) {
    const zVar = zElement.getAttribute('z-var');
    const tokens = tokenize(zVar);
    const commands = Array.from(tokens).map((expression) => evaluate(expression, this.vars));

    commands.forEach((command) => console.log('zVar', command, zVar, zElement));
    // todo: process commands
  }

  query(xpath, context = null) {
    const found = this.rootElement
          .ownerDocument
	        .evaluate(
		        xpath,
		        context || this.rootElement,
		        null,
		        XPathResult.ANY_TYPE,
		        null
		      );
    switch (found.resultType) {
    case XPathResult.NUMBER_TYPE: // 1 
	    return found.numberValue;
    case XPathResult.STRING_TYPE: // 2
	    return found.stringValue;
    case XPathResult.BOOLEAN_TYPE: // 3
	    return found.booleanValue;
    case XPathResult.UNORDERED_NODE_ITERATOR_TYPE: // 4
	    for (var ret = [], n; n = found.iterateNext(); ret.push(n));
	    return ret;
    }
  }
}

function dnaTemplate (rootElement, vars) {
  const template = new Template(rootElement instanceof Document ? rootElement.documentElement : rootElement);
  return template.render(vars);
}

export { dnaTemplate };

