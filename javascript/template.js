import { tokenize } from './tokenize.js';
import { prepare } from './prepare.js';

/**
 *
 *
 * @module     ZTemplate
 * @author     Daniel Sevcik <sevcik@webdevelopers.cz>
 * @copyright  2023 Daniel Sevcik
 * @since      2023-01-21 13:31:43 UTC
 * @access     public
 */
class Template {
    /**
     * @param DOMElement scope root element
     */
    #rootElement = null;

    /**
     * @param Object data to apply to the template
     */
    #vars = null;

    /**
     * @param Object of callbacks
     */
    #callbacks = {};

    /**
     * @param int scopeLevel level of the scope used to select elements only from this scope.
     */
    #scopeLevel = 0;

    #templateSelector = "*[starts-with(@template, '{') or starts-with(@template, '[')]";

    #childrenScopeSelector = "*[(@template-scope and @template-scope != 'inherit') or (@z-scope-children and @z-scope-children != 'inherit')]";

    /**
     * @param string scopeSelector selector used to identify scope elements
     */
    #scopeSelector = `*[self::${this.#templateSelector} or @z-scope or parent::${this.#childrenScopeSelector} or @template-clone]`;

    /**
     * @param string zElementSelector used to identify z-var elements that need processing
     */
    #zElementSelector = "*[@z-var]";  

    /**
     * @param string scopeLevelSelector used to identify the scope level.
     */
    #scopeLevelSelector = `count(ancestor-or-self::${this.#scopeSelector})`;

    constructor(rootElement) {
	// If root element is not instance of 
	if (!(rootElement instanceof Element)) {
	    throw new Error('ZTemplate accepts an instance of HTMLElement as constructor argument');
	}
	this.#rootElement = rootElement;
        this.#scopeLevel = this.#query(this.#scopeLevelSelector, rootElement.hasAttribute('template-scope') || rootElement.hasAttribute('z-scope-children') ? rootElement.firstElementChild : rootElement);
    }

    render(vars, callbacks) {
	this.#vars = vars;
        this.#callbacks = callbacks;

	// Run xpath on root element
        const found = this.#query(`self::${this.#zElementSelector}|descendant-or-self::${this.#zElementSelector}[${this.#scopeLevelSelector} = ${this.#scopeLevel}]`);
        for (let i = 0; i < found.length; i++) {
            this.#processZElement(found[i]);
        }

        // Next level of templates
        // If we apply template to the element directly then we ignore its @z-scope and @z-scope-children attributes.
        const foundTemplates = this.#query(`self::${this.#templateSelector}|${this.#templateSelector}|descendant-or-self::${this.#templateSelector}[${this.#scopeLevelSelector} = ${this.#scopeLevel} + 1]`);
        for (let i = 0; i < foundTemplates.length; i++) {
            this.#processTemplate(foundTemplates[i]);
        }
    }

    #processTemplate(zTemplate) {
        const template = zTemplate.getAttribute('template');
        const templateName = template.substring(1, template.length - 1);

        if (!templateName) {
            throw new Error(`Template "${templateName}" not found (attr template="${template}")`);
        }

        const value = this.#getVariableValue(templateName);
        let list = template.substr(0, 1) == '{' ? [value] : Array.from(value);
        if (typeof list[Symbol.iterator] !== 'function') {
            console.warn("Template value %s is not iterable on %o. The referenced value is %o", templateName, zTemplate, value);
            list = [];
        }
        const clones = this.#getTemplateClones(zTemplate, list.length);

        for (let i = 0; i < list.length; i++) {
            const clone = clones[i];
            const vars = typeof list[i] != 'object' ? { value: list[i], key: i } : list[i];
            clone.forEach((element) => {
                const template = new Template(element);
                template.render(vars, this.#callbacks);
                if (element.parentNode instanceof DocumentFragment) {
                    zTemplate.parentNode.insertBefore(element, zTemplate);
                }
            });
        }
    }

    #getTemplateClones(zTemplate, count) {
        // Find all immediate preceding siblings having the same template-clone="${template}" attribute.
        const template = zTemplate.getAttribute('template');
        const clones = [];

        let previous = zTemplate.previousElementSibling;
        let lastPos = -1;
        while (previous && previous.getAttribute('template-clone') == template) {
            const pos = previous.getAttribute('template-clone-pos');
            if (lastPos == pos && pos !== null) {
                clones[0].unshift(previous);
            } else {
                clones.unshift([previous]);
            }
            previous = previous.previousElementSibling;
            lastPos = pos;
        }

        // If there are more clones than items in the list, remove the extra clones.
        for(let i = clones.length - count; i > 0; i--) {
            clones.pop().forEach((el) => el.remove());
        }

        // If there are less clones than items in the list, create the missing clones.
        const fragment = new DocumentFragment(); // Do not insert it into the DOM yet to minimize reflow.
        for(let i = clones.length - count; i < 0; i++) {
            const clone = [];
            clones.push(clone);

            if (zTemplate.content instanceof DocumentFragment) { // <template> tag
                clone.push(...Array.from(zTemplate.content.children).map((el) => el.cloneNode(true)));
            } else {
                clone.push(zTemplate.cloneNode(true));
            }
            clone.forEach((el) => {
                el.classList.add('template-clone');
                el.setAttribute('template-clone', template);
                el.setAttribute('template-clone-pos', clones.length);
                el.removeAttribute('template');
                // zTemplate.parentNode.insertBefore(el, zTemplate); - put it into fragment to minimize reflow
                fragment.appendChild(el);
            });
        }

        return clones;
    }

    #processZElement(zElement) {
        const zVar = zElement.getAttribute('z-var');
        const tokens = tokenize(zVar);
        const commands = Array
              .from(tokens)
              .map((expression) => prepare(expression, this.#vars));
        const later = [];

        // We don't want to apply changes incrementally like adding/removing the same class
        // so we pre-prepare the element and then apply the changes at once.
        const zProto = this.#cloneProto(zElement);
        
        // todo: process commands
        commands
            .forEach((command) => {
                if (!command.condition) {
                    return;
                }

                switch (command.action) {
                case "attr":
                    this.#cmdAttr(zProto, command);
                    break;
                case "text":
                    this.#cmdText(zProto, command);
                    break;
                case "html":
                    this.#cmdHtml(zProto, command);
                    break;
                case "value":
                    this.#cmdValue(zProto, command);
                    break;
                case "class":
                    this.#cmdClass(zProto, command);
                    break;
                case "toggle":
                    this.#cmdToggle(zProto, command);
                    break;
                case "debugger":
                    if (command.valueBool) debugger;
                    break;
                case "remove":
                case "event":
                case "call":
                    later.push(command);
                    break;
                }
            });

        this.#mergeProto(zElement, zProto);

        later
            .forEach((command) => {
                if (zElement.parentNode === null) { // Removed
                    return;
                }
                switch (command.action) {
                case "remove":
                    this.#cmdRemove(zElement, command);
                    break;
                case "event":
                    this.#cmdEvent(zElement, command);
                    break;
                case "call":
                    this.#cmdCall(zElement, command);
                    break;
                }
            });
    }

    #cmdCall(zElement, command) {
        const callback = this.#callbacks.get(command.param);
        if (!callback || typeof callback != 'function') {
            console.error(`Callback "${command.param}" not found or is not a function in command "${JSON.stringify(command)}"`);
            return;
        }
        const detail = {
            "value": command.value,
            "data": this.#vars,
            "arguments": command.arguments
        };
        if (typeof callback !== 'function') {
            console.error(`Callback ${command.param} is not defined`);
            return;
        }
        callback(zElement, detail);
    }

    #cmdEvent(zElement, command) {
        const detail = {
            "value": command.value,
            "data": this.#vars,
            "arguments": command.arguments
        };
        const event = new CustomEvent(command.param, { detail: detail, bubbles: true, cancelable: true, composed: false });
        zElement.dispatchEvent(event);
    }

    #cmdRemove(zElement, command) {
        if (!command.valueBool) {
            zElement.remove();
        }
    }


    #cmdToggle(zProto, command) {
        if (zProto.classList.contains('z-template-hidden')) {
            return; // already hidden
        } else if (command.valueBool) {
            zProto.classList.add('z-template-visible');
            zProto.classList.remove('z-template-hidden');
        } else {
            zProto.classList.add('z-template-hidden');
            zProto.classList.remove('z-template-visible');
        }
    }

    #cmdClass(zProto, command) {
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

    #cmdValue(zProto, command) {
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

    #cmdHtml(zProto, command) {
        zProto.innerHTML = command.value;
    }

    #cmdText(zProto, command) {
        zProto.textContent = this.#getReplaceText(zProto, zProto.textContent, command.variable, command.value || '', '');
    }

    #cmdAttr(zProto, command) {
        if (command.value === true) {
            zProto.setAttribute(command.param, command.param);
        } else if (command.value === false) {
            zProto.removeAttribute(command.param);
        } else {
            const value = this.#getReplaceText(zProto, zProto.getAttribute(command.param), command.variable, command.value, command.param);
            zProto.setAttribute(command.param, value);
        }
    }

    #getReplaceText(element, template, varName, value, id = '') {
        const varNameStr = '${' + varName + '}';
        const bakAttrName = 'z-var-content' + (id ? '-' + id : '');

        let result;
        // Does template contain the variable?
        if (varName && template && template.indexOf(varNameStr) !== -1) {
            result = (template || '').replace(varNameStr, value);
        } else if (['src', 'href'].match(id) && template.indexOf(encodeURIComponent(varNameStr)) !== -1) { // href and src attributes may be encoded
            result = (template || '').replace(encodeURIComponent(varNameStr), encodeURIComponent(value));
        } else {
            result = value;
        }

        // Backup
        if (template !== result && template && !element.hasAttribute(bakAttrName)) {
            element.setAttribute(bakAttrName, template);
        }

        return result;
    }

    #mergeProto(zElement, zProto) {
        let contentChanged = false;
        // Merge text content
        if (zElement.innerHTML !== zProto.innerHTML) {
            zElement.innerHTML = zProto.innerHTML;
            contentChanged = true;
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

        if (contentChanged) {
            const rev = (zElement.getAttribute('z-content-rev') || 0) + 1;
            zElement.removeAttribute('z-content-rev'); // so we can re-trigger CSS animations
            // When we do it fast the DOM does not get updated, so we need to wait a bit
            setTimeout(() => zElement.setAttribute('z-content-rev', rev), 0);
        }

    }

    #cloneProto(zElement) {
        const proto = zElement.cloneNode(true); // we need deep clone because of options and such
        const restore = [];

        const contentAttrs = Array.from(zElement.attributes)
              .filter((attr) => {
                  // Restore z-var-content-{ATRR_NAME} attribute
                  if (attr.name.match(/^z-var-content-?/)) {
                      restore.push(attr);
                  }
                  proto.setAttribute(attr.name, attr.value);
              });

        // Restore the original content if any - search for all z-var-content-* attributes
        restore.forEach((attr) => {
            const attrName = attr.name.replace(/^z-var-content-?/, '');
            if (attrName) {
                proto.setAttribute(attrName, attr.value);
            } else {
                proto.textContent = attr.value;
            }
        });

        proto.classList.remove(...[
            'dna-template-visible',
            'z-template-visible',
            'dna-template-hidden',
            'z-template-hidden'
        ]);

        return proto;
    }

    #query(xpath, context = null) {
        const found = this.#rootElement
              .ownerDocument
	      .evaluate(
		  xpath,
		  context || this.#rootElement,
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

    #getVariableValue(variable) {
        // Split the variable into parts separated by dot and get the corresponding value from this.#vars object.
        // Example: "user.name" => this.#vars.user.name
        const parts = variable.split('.');
        let value = this.#vars;
        for (let i = 0; i < parts.length; i++) {
            if (typeof value[parts[i]] === 'undefined') {
                console.warn("Can't find variable " + variable + " in data source %o", this.#vars);
                return null;
            }
            value = value[parts[i]];
        }
        return value;
    }
}

function zTemplate (rootElement, vars, callbacks = {}) {
    const localCallbacks = new Map(Object.entries(callbacks || {}));
    const mergedCallbacks = new Map([...zTemplate.callbacks.entries(), ...localCallbacks.entries()]);

    const template = new Template(rootElement instanceof Document ? rootElement.documentElement : rootElement);
    return template.render(vars, mergedCallbacks);
}

zTemplate.callbacks = new Map();

// jQuery plugin support
if (typeof jQuery !== 'undefined' && !jQuery.fn.template) {
    jQuery.fn.template = function(vars) {this.each((i, el) => zTemplate(el, vars)); return this;};
}

export { zTemplate };

