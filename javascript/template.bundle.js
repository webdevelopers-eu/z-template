/*! Z Template | (c) Daniel Sevcik | MIT License | https://github.com/webdevelopers-eu/z-template */
window.zTemplate = (function() {
/**
 *
 *
 * @module     ZTemplate
 * @author     Daniel Sevcik <sevcik@webdevelopers.cz>
 * @copyright  2023 Daniel Sevcik
 * @since      2023-01-23 22:01:46 UTC
 * @access     public
 */
class Tokenizer extends Array {
  #operatorChars = ["!", "=", "<", ">", "~", "|", "&" ];
  #quoteChars = ["'", '"'];
  #blockChars = {"{": "}", "[": "]", "(": ")"};
  #hardSeparatorChars = [","];
  #softSeparatorChars = [" ", "\t", "\r", "\n"];
  #input;
  #pointer = 0;

  constructor(input) {
    super();
    this.#input = (input || "") + ""; // convert all into string
  }


  tokenize() {
    // Cycle parse() and add values until it returns null
    while (!this.#endOfInput()) {
      const command = this.#tokenizeUntil();
      if (command === null) {
        break;
      }
      this.push(command);
    }
  }

  #endOfInput() {
    return this.#pointer >= this.#input.length;
  }

  #next() {
    if (this.#endOfInput()) {
      return null;
    }
    return this.#input[this.#pointer++];
  }

  #prev() {
    if (this.#pointer <= 0) {
      return null;
    }
    return this.#input[--this.#pointer];
  }

  #tokenizeUntil(until=",") {
    const result = new Tokenizer(this.#input);
    let current = {type: "generic", value: ""};
    let escaped = false;

    for (let value = this.#next(); value !== null; value = this.#next()) {
      if (escaped || (current.type == "text" && value != current.delimiter)) { // Inside string or escaped current
        current.value += value;
        escaped = false;
      } else if (value === '\\') { // Escape next
        escaped = true;
      } else if (current.type == "text" && value == current.delimiter) { // End of string
        this.#pushSmart(result, current);
        current = {type: "generic", value: ""};
      } else if (value === until) { // End of subrequest
        break;
      } else if (value in this.#blockChars) {// Statement start
        this.#pushSmart(result, current);
        result.push({"type": "block", "value": this.#tokenizeUntil(this.#blockChars[value]), "start": value, "end": this.#blockChars[value]});
        current = {type: "generic", value: ""};
      } else if (this.#quoteChars.includes(value)) { // String start
        this.#pushSmart(result, current);
        current = {type: "text", value: "", delimiter: value};
      } else if (current.type == 'generic' && this.#hardSeparatorChars.includes(value)) { // Significant separator
        this.#pushSmart(result, current);
        this.#pushSmart(result, {type: "separator", value: value});
        current = {"type": 'generic', "value": ""};
      } else if (current.type == 'generic' && this.#softSeparatorChars.includes(value)) { // Insignificant separator
        this.#pushSmart(result, current);
        current = {"type": 'generic', "value": ""};
      } else if (current.type !== 'operator' && this.#operatorChars.includes(value)) { // Operator
        this.#pushSmart(result, current);
        current = {"type": 'operator', "value": value};
      } else if (current.type === 'operator' && !this.#operatorChars.includes(value)) { // End of operator
        this.#pushSmart(result, current);
        current = {"type": "generic", "value": ""};
        this.#prev();
      } else {
        current.value += value;
      }
    }
    this.#pushSmart(result, current);
    return result;
  }

  #pushSmart(result, current) {
    if (current.type == 'generic') {
      current.value = current.value.trim();
      if (!current.value.length) {
        return;
      }
      // If numeric then it is not a generic but 'text'
      if (!isNaN(current.value)) {
        current.type = 'text';
        current.value = new Number(current.value);
      }
    }

    result.push(current);
  }
}

function tokenize(input) {
  const result = new Tokenizer(input);
  result.tokenize();
  return result;
}
/**
 *
 *
 * @module     ZTemplate
 * @author     Daniel Sevcik <sevcik@webdevelopers.cz>
 * @copyright  2023 Daniel Sevcik
 * @since      2023-01-23 22:02:02 UTC
 * @access     public
 */
class Preparator {
    #vars;
    #tokens;
    #paramShortcuts = {
        "@*": "attr",
        ":*": "event",
        "**": "call",
        ".*": "class",
        "+": "html",
        ".": "text",
        "=": "value",
        "?": "toggle",
        "!": "remove"
    };

    #operatorsCompare = [
        '==',
        '!=',
        '>',
        '>=',
        '<',
        '<=',
    ];

    #operatorsBoolean = [
        '!', 
        '&&',
        '||'
    ];

    #data = {
        "negateValue": 0, // int how many '!' operators are in front of the expression
        "variable": null, // variable name
        "value": null, // evaluated value
        "valueBool": null, // evaluated value
        "action": "", // string
        "param": null, // string
        "condition": null, // evaluated {} condition
    }
    
    constructor(tokens, vars) {
        if (typeof vars !== 'object') {
            throw new Error(`The variables must be an object. Current argument: ${typeof vars}.`);
        }
        this.#vars = vars;
        this.#tokens = tokens;
        this.#normalize();

        // Reserved keywords
        this['true'] = true;
        this['false'] = false;
        this['null'] = null;
        this['undefined'] = undefined;
        
    }

    /**
     * Normalize this.#tokens so it has fixed elements that reflect the syntax like this:
     *
     * @access private
     * @return void
     */
    #normalize() {
        const tokens = Array.from(this.#tokens);
        let token = this.#nextToken(tokens, ["operator", "generic", "block"]);

        if (tokens.length === 0 && token.value === "debugger") {
            this.#data.value = {"type": "special", "value": "debugger"};
            this.#data.action = 'debugger';
            return;
        }

        // negate
        if (token.type === 'operator' && ["!", "!!"].includes(token.value)) {
            this.#data.negateValue = token.value.length;
            token = this.#nextToken(tokens, ["generic", "block"]);
        }

        // condition
        if (token.type === 'generic') {
            this.#data.value = this.#vars[token.value];
            this.#data.variable = token.value;
        } else {
            this.#data.value = this.prepareBlock(tokens);
        }
        token = this.#nextToken(tokens, ["generic", "operator"]);

        // action shortcut
        const shortcutType = token.value.substr(0, 1) + (token.value.length > 1 ? '*' : '');
        if (typeof this.#paramShortcuts[shortcutType] != 'undefined') { // shortcut
            this.#data.action = this.#paramShortcuts[shortcutType];
            tokens.unshift({"type": "text", "value": token.value.substr(1), "info": "Extracted from shortcut"});
        } else if (Object.values(this.#paramShortcuts).includes(token.value)) {
            this.#data.action = token.value;
        } else {
            throw new Error(`Invalid action: ${token.value} . Supported actions: ${Object.keys(this.#paramShortcuts).join(', ')}`);
        }
        token = this.#nextToken(tokens, ["text", "generic", null]);

        // param
        this.#data.param = token?.value;
        token = this.#nextToken(tokens, ["block", "operator", null]);

        // negate
        let negateCondition = 0;
        if (token?.type === 'operator' && ["!", "!!"].includes(token.value)) {
            negateCondition = token.value.length;
            token = this.#nextToken(tokens, ["block", null]);
        }

        // If it is optional "block" then it is the last condition
        if (token?.type === 'block') {
            this.#data.condition = this.prepareBlock(token.value);
            token = this.#nextToken(tokens, ["block", null]);
        } else {
            this.#data.condition = true;
        }
        this.#data.conditions = this.#negate(this.#data.condition, negateCondition);
    }

    #getVariableValue(variable) {
        return typeof this.#vars[variable] != 'undefined' ? this.#vars[variable] : null;
    }

    prepare() {
        const result = {...this.#data};

        // Before resolving conditions
        if (result.condition.type === 'special') {
            result.action = result.condition.value;
            result.condition = true;
            return result;
        } else if (result.value === null && result.condition.type == "generic") {
            result.value = this.#toValue(result.condition, result.negateValue);
        } else if (typeof result.value == 'object') {
            result.value = this.#toValue(result.value, result.negateValue);
        } else {
            result.value = this.#negate(result.value, result.negateValue);
        }
        result.valueBool = this.#toBool(result.value);

        // Resolve conditions
        switch(result.condition.type) {
        case "block":
            result.condition = !!this.prepareBlock(result.condition.value);
            break;
        case "generic":
            result.condition = !!this.#prepareVariable(result.condition.value);
            break;
        }

        return result;
    }

    #prepareVariable(varName) {
        const val = this.#getVariableValue(varName);
        if (val === null) {
            return null;
        }
        return this.#toBool(val);
    }

    #toBool(val) {
        switch (typeof val) {
        case "string":
            return val.length !== 0;
        case "object":
            return val !== null && Object.keys(val).length !== 0;
        case "number":
            return val !== 0;
        case "boolean":
            return val;
        default:
            return false;
        }
    }

    #prepareBlock(tokens) {
        const expression = this.mkExpression(tokens);
        // console.log("expression", expression);
        return eval(expression);
    }

    #mkExpression(tokens) {
        // We could do eval of the whole expression with vars but it's not
        // safe and it's not needed and we want it to be portable to other langs.
        let result = '';
        while (true) {
            const token = this.#nextToken(tokens, ["generic", "block", "text", "operator", null]);
            if (!token) {
                break;
            }

            // Arithmetic operators look ahead
            if (tokens.length > 1 && tokens[0].type === 'operator' && this.#operatorsCompare.includes(tokens[0].value)) {
                const operator = this.#nextToken(tokens, ["operator"]);
                const token2 = this.#nextToken(tokens, ["generic", "text"]);
                result += this.#compare(token, operator, token2) ? 1 : 0;
                continue;
            }

            switch (token.type) {
            case "operator":
                if (this.#operatorsBoolean.includes(token.value)) {
                    result += token.value;
                } else {
                    throw new Error(`Invalid operator: ${token.value}. Supported operators: ${this.#operatorsBoolean.join(', ')}`);
                }
                break;
            case "block":
                result += this.mkExpression(token.value);
                break;
            case "generic":
                result += this.#prepareVariable(token.value) ? 1 : 0;
                break;
            case "text":
                result += this.#toBool(token.value) ? 1 : 0;
                break;
            }
        }
        return "(" + (result || '0') + ")";
    }

    #toValue(token, negate = 0) {
        let value;
        switch (token.type) {
        case "generic":
            value = this.#getVariableValue(token.value);
            break;
        case "text":
            value = token.value;
            break;
        case "block":
            value = this.prepareBlock(token.value);
            break;
        default:
            throw new Error(`Invalid token type: ${token.type} (value: ${JSON.stringify(token)}).`);
        }
        if (value === null) {
            return value; // Number(null) === 0a
        }
        const num = Number(value);
        let ret = isNaN(num) ? value : num;

        ret = this.#negate(ret, negate);
        return ret;
    }

    #compare(token1, operator, token2) {
        const val1 = this.#toValue(token1);
        const val2 = this.#toValue(token2);

        switch (operator.value) {
        case '==':
            return val1 === val2 ? 1 : 0;
        case '!=':
            return val1 !== val2 ? 1 : 0;
        case '<':
            return val1 < val2 ? 1 : 0;
        case '<=':
            return val1 <= val2 ? 1 : 0;
        case '>':
            return val1 > val2 ? 1 : 0;
        case '>=':
            return val1 >= val2 ? 1 : 0;
        default:
            throw new Error(`Invalid operator: ${operator.value} . Supported operators: ${this.#operatorsCompare.join(', ')}`);
        }
    }

    #nextToken(tokens, expectType = []) {
        const token = tokens.shift();
        if (!expectType.includes(token ? token.type : null)) {
            throw new Error(`Invalid z-var value: (${token && token.type}) "${token && token.value}". Generic or block expected: "${this.#tokens.input}"`);
        }
        return token;
    }

    #negate(value, negate = 0) {
        for (let c = negate; c; c--) {
            value = !value;
        }
        return value;
    }
}

function prepare(tokens, vars) {
    return (new Preparator(tokens, vars)).prepare();
}


// exports.prepare = prepare;

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

    /**
     * @param string scopeSelector selector used to identify scope elements
     */
    #scopeSelector = "*[@template or (@template-scope and @template-scope != 'inherit') or @template-clone]";

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
        this.#scopeLevel = this.#query(this.#scopeLevelSelector, rootElement);
    }

    render(vars, callbacks) {
	this.#vars = vars;
        this.#callbacks = callbacks;

	// Run xpath on root element
        const found = this.#query(`descendant-or-self::${this.#zElementSelector}[${this.#scopeLevelSelector} = ${this.#scopeLevel}]`);
        for (let i = 0; i < found.length; i++) {
            this.#processZElement(found[i]);
        }

        // Next level of templates
        const foundTemplates = this.#query(`descendant-or-self::*[not(@template-scope) or @template-scope = 'inherit'][starts-with(@template, '{') or starts-with(@template, '[')][${this.#scopeLevelSelector} = ${this.#scopeLevel} + 1]`);
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

        const list = template.substr(0, 1) == '{' ? [this.#vars[templateName]] : Array.from(this.#vars[templateName]);
        const clones = this.#getTemplateClones(zTemplate, list.length);

        for (let i = 0; i < list.length; i++) {
            const clone = clones[i];
            const vars = typeof list[i] != 'object' ? { value: list[i], key: i } : list[i];
            clone.forEach((element) => {
                const template = new Template(element);
                template.render(vars, this.#callbacks);
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
            if (lastPos == pos) {
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
                zTemplate.parentNode.insertBefore(el, zTemplate);
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
                    debugger;
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
        const callback = this.#callbacks[command.param];
        if (typeof callback !== 'function') {
            throw new Error(`Callback ${command.param} is not defined`);
        }
        callback(zElement, command.value);
    }

    #cmdEvent(zElement, command) {
        const event = new CustomEvent(command.param, { detail: command.value, bubbles: true, cancelable: true, composed: false });
        zElement.dispatchEvent(event);
    }

    #cmdRemove(zElement, command) {
        if (command.valueBool) {
            zElement.remove();
        }
    }


    #cmdToggle(zProto, command) {
        if (command.valueBool) {
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

    #cloneProto(zElement) {
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
}

function zTemplate (rootElement, vars, callbacks = {}) {
    const template = new Template(rootElement instanceof Document ? rootElement.documentElement : rootElement);
    return template.render(vars, callbacks || {});
}

// jQuery plugin support
if (typeof jQuery !== 'undefined' && !jQuery.fn.template) {
    jQuery.fn.template = function(vars) {this.each((i, el) => zTemplate(el, vars)); return this;};
}
 return zTemplate;})();
