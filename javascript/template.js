import { tokenize } from './tokenize.js';
import { prepare } from './prepare.js';

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
     * @param Object of callbacks
     */
    callbacks = {};

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

    render(vars, callbacks) {
	this.vars = vars;
        this.callbacks = callbacks;

	// Run xpath on root element
        const found = this.query(`descendant-or-self::${this.zElementSelector}[${this.scopeLevelSelector} = ${this.scopeLevel}]`);
        // Cycle found array and process each element
        for (let i = 0; i < found.length; i++) {
            this.processZElement(found[i]);
        }
	// //div[not(ancestor::article[not(ancestor::article)])]
    }

    processZElement(zElement) {
        const zVar = zElement.getAttribute('z-var');
        const tokens = tokenize(zVar);
        const commands = Array
              .from(tokens)
              .map((expression) => prepare(expression, this.vars));
        const later = [];

        // We don't want to apply changes incrementally like adding/removing the same class
        // so we pre-prepare the element and then apply the changes at once.
        const zProto = this.cloneProto(zElement);
        
        // todo: process commands
        commands
            .forEach((command) => {
                if (!command.condition) {
                    return;
                }

                switch (command.action) {
                case "attr":
                    this.cmdAttr(zProto, command);
                    break;
                case "text":
                    this.cmdText(zProto, command);
                    break;
                case "html":
                    this.cmdHtml(zProto, command);
                    break;
                case "value":
                    this.cmdValue(zProto, command);
                    break;
                case "class":
                    this.cmdClass(zProto, command);
                    break;
                case "toggle":
                    this.cmdToggle(zProto, command);
                    break;
                case "debugger":
                    debugger;
                    break;
                case "remove":
                case "event":
                case "callback":
                    later.push(command);
                    break;
                }
            });

        this.mergeProto(zElement, zProto);

        later
            .forEach((command) => {
                if (zElement.parentNode === null) { // Removed
                    return;
                }
                switch (command.action) {
                case "remove":
                    this.cmdRemove(zElement, command);
                    break;
                case "event":
                    this.cmdEvent(zElement, command);
                    break;
                case "callback":
                    this.cmdCallback(zElement, command);
                    break;
                }
            });
    }

    cmdCallback(zElement, command) {
        const callback = this.callbacks[command.param];
        if (typeof callback !== 'function') {
            throw new Error(`Callback ${command.param} is not defined`);
        }
        callback(zElement, command.value);
    }

    cmdEvent(zElement, command) {
        const event = new CustomEvent(command.param, { detail: command.value, bubbles: true, cancelable: true, composed: false });
        zElement.dispatchEvent(event);
    }

    cmdRemove(zElement, command) {
        if (command.valueBool) {
            zElement.remove();
        }
    }


    cmdToggle(zProto, command) {
        if (command.valueBool) {
            zProto.classList.add('dna-template-visible');
            zProto.classList.remove('dna-template-hidden');
        } else {
            zProto.classList.add('dna-template-hidden');
            zProto.classList.remove('dna-template-visible');
        }
    }

    cmdClass(zProto, command) {
        const classList = command.param.trim().split(/[ ,.]+/);
        classList.forEach((className) => {
            let state = command.valueBool;
            if (className.substr(0, 1) === "!") {
                state = !state;
                className = className.substr(1);
            }
            if (state) {
                zProto.classList.add(className);
            } else {
                zProto.classList.remove(className);
            }
        });
    }

    cmdValue(zProto, command) {
        // Set form field's value to command.value be it <select>, <input> or <textarea>
        // Alternative to jQuery.val(value)
        if (zProto.matches('input[type="checkbox"], input[type="radio"]')) {
            const checked = typeof command.value === 'boolean' ? command.value : zProto.value === command.value;
            if (checked) {
                zProto.setAttribute('checked', 'checked');
            } else {
                zProto.removeAttribute('checked');
            }
        } else if (zProto.matches('input')) {
            zProto.setAttribute('value', command.value);
        } else if (zProto.matches('select')) {
            Array.from(zProto) // array of options
                .filter((option) => option.value === command.value)
                .forEach((option) => option.setAttribute('selected', 'selected'));
        } else if (zProto.matches('textarea')) {
            zProto.textContent = command.value;
        } else {
            zProto.setAttribute('value', command.value); // hmm
        }
    }

    cmdHtml(zProto, command) {
        zProto.innerHTML = command.value;
    }

    cmdText(zProto, command) {
        zProto.textContent = this.getReplaceText(zProto, zProto.textContent, command.variable, command.value || '', '');
    }

    cmdAttr(zProto, command) {
        if (command.value === true) {
            zProto.setAttribute(command.param, command.param);
        } else if (command.value === false) {
            zProto.removeAttribute(command.param);
        } else {
            const value = this.getReplaceText(zProto, zProto.getAttribute(command.param), command.variable, command.value, command.param);
            zProto.setAttribute(command.param, value);
        }
    }

    getReplaceText(element, template, varName, value, id = '') {
        const varNameStr = '${' + varName + '}';
        const bakAttrName = 'z-var-content' + (id ? '-' + id : '');

        let result;
        // Does template contain the variable?
        if (varName && template && template.indexOf(varNameStr) !== -1) {
            result = (template || '').replace(varNameStr, value);
        } else {
            result = value;
        }

        // Backup
        if (template !== result && template && !element.hasAttribute(bakAttrName)) {
            element.setAttribute(bakAttrName, template);
        }

        return result;
    }

    mergeProto(zElement, zProto) {
        // Merge text content
        if (zElement.innerHTML !== zProto.innerHTML) {
            zElement.innerHTML = zProto.innerHTML;
        }

        // Merge attributes
        for (let i = 0; i < zProto.attributes.length; i++) {
            const attr = zProto.attributes[i];
            if (zElement.getAttribute(attr.name) !== attr.value) {
                zElement.setAttribute(attr.name, attr.value);
            }
        }

        // Remove removed attributes
        for (let i = 0; i < zElement.attributes.length; i++) {
            const attr = zElement.attributes[i];
            if (!zProto.hasAttribute(attr.name)) {
                zElement.removeAttribute(attr.name);
            }
        }

    }

    cloneProto(zElement) {
        const proto = zElement.cloneNode(true); // we need deep clone because of options and such

        // Restore the original content if any - search for all z-var-content-* attributes
        const contentAttrs = Array.from(zElement.attributes)
              .filter((attr) => {
                  // Restore z-var-content-{ATRR_NAME} attribute
                  const attrName = attr.name.replace(/^z-var-content-?/, '');
                  if (!attrName) { // contents
                      proto.textContent = attr.value;
                  } else {
                      proto.setAttribute(attrName, attr.value);
                  }
              });

        return proto;
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
        default:
            return null;
        }
    }
}

function dnaTemplate (rootElement, vars, callbacks = {}) {
    const template = new Template(rootElement instanceof Document ? rootElement.documentElement : rootElement);
    return template.render(vars, callbacks || {});
}

export { dnaTemplate };

