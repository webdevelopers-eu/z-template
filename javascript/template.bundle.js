/*! Z Template | (c) Daniel Sevcik | MIT License | https://github.com/webdevelopers-eu/z-template | build 2023-02-08T13:03:04+00:00 */
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
        "!": "remove",
        "`": "debugger"
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
        "arguments": [], // array of optional arguments
        "condition": null, // evaluated {} condition
    }
    
    constructor(tokens, vars) {
        if (typeof vars !== 'object') {
            throw new Error(`The variables must be an object. Current argument: ${typeof vars}.`);
        }
        this.#vars = vars;
        this.#tokens = tokens;
        this.#normalize();
    }

    /**
     * Normalize this.#tokens so it has fixed elements that reflect the syntax like this:
     *
     * The syntax is:
     *
     * VALUE ACTION CONDITION
     *
     * VALUE = [![!]] ( VARIABLE_NAME | { EXPRESSION } )
     * ACTION = ACTION_NAME [ ? PARAM [ ? (...ARGUMENTS) ] ]
     * CONDITION =  { EXPRESSION }
     *
     * @access private
     * @return void
     */
    #normalize() {
        const tokens = Array.from(this.#tokens);
        let token = this.#nextToken(tokens, ["operator", "generic", "block", "text"]);

        // negate
        if (token.type === 'operator' && ["!", "!!"].includes(token.value)) {
            this.#data.negateValue = token.value.length;
            token = this.#nextToken(tokens, ["generic", "block", "text"]);
        }

        // value
        if (token.type === 'generic') {
            this.#data.variable = token.value;
            this.#data.value = this.#getVariableValue(token.value);
        } else if (token.type === 'block') {
            this.#data.value = this.#prepareBlock(token.value);
        } else {
            this.#data.value = token.value;
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
        token = this.#nextToken(tokens, ["text", "generic", null], ["block", "operator"]); // param is optional, we may encounter next "block" or "operator" instead.

        // param
        this.#data.param = token?.value;
        token = this.#nextToken(tokens, ["block", "operator", null]);

        // arguments
        if (token?.type === 'block' && token.start == '(') { // Enclosed in '(' and ')' => arguments
            this.#data.arguments = this.#prepareArguments(token.value);
            token = this.#nextToken(tokens, ["block", "operator", null]);
        }

        // negate
        let negateCondition = 0;
        if (token?.type === 'operator' && ["!", "!!"].includes(token.value)) {
            negateCondition = token.value.length;
            token = this.#nextToken(tokens, ["block", null]);
        }

        // condition
        if (token?.type === 'block' && token.start == '{') {
            this.#data.condition = this.#prepareBlock(token.value);
            token = this.#nextToken(tokens, ["block", null]);
        } else {
            this.#data.condition = true;
        }
        this.#data.condition = this.#negate(this.#data.condition, negateCondition);

        if (this.#data.action === 'debugger' && this.#data.valueBool) {
            debugger;
        }
    }

    #getTokenValue(token) {
        if (token.type === 'generic') {
            return this.#getVariableValue(token.value);
        } else if (token.type === 'block') {
            return this.#prepareBlock(token.value);
        } else {
            return token.value;
        }
    }

    #getVariableValue(variable) {
        // reserved keywords
        switch(variable) {
            case 'true':
                return true;
            case 'false':
                return false;
            case 'null':
                return null;
            case 'undefined':
                return undefined;
        }

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
            result.condition = !!this.#prepareBlock(result.condition.value);
            break;
        case "generic":
            result.condition = !!this.#prepareVariable(result.condition.value);
            break;
        }

        return result;
    }

    #prepareArguments(tokens) {
        let args = [];
        let expr = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type === 'separator') {
                args.push(expr);
                expr = [];
            } else {
                expr.push(token);
            }
        }
        args.push(expr);

        args = args.map(arg =>  arg.length == 1 ? this.#getTokenValue(arg[0]) : this.#getTokenValue({"type": "block", "value": arg}));
        return args;
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
        const expression = this.#mkExpression(tokens);
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
                result += this.#mkExpression(token.value);
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
        let value = token;

        if (typeof token?.type !== 'undefined' && typeof token?.value !== 'undefined') { // @todo we should use Token class instead of Object
            switch (token.type) {
            case "generic":
                value = this.#getVariableValue(token.value);
                break;
            case "text":
                value = token.value;
                break;
            case "block":
                value = this.#prepareBlock(token.value);
                break;
            default:
                throw new Error(`Invalid token type: ${token.type} (value: ${JSON.stringify(token)}).`);
            }
        }

        if (value === null) {
            return value; // Number(null) === 0
        } else if (value instanceof Array) {
            value = value.length;
        } else if (value instanceof Number) {
            value = value.valueOf();
        } else if (typeof value === 'object') {
            value = Object.keys(value).length;
        }

        const num = Number(value);
        let ret = isNaN(num) ? value : num.valueOf();

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

    #nextToken(tokens, expectType = [], skipType = []) {
        const token = tokens.shift();
        if (skipType.includes(token?.type)) {
            tokens.unshift(token);
            return null;
        }
        if (!expectType.includes(token ? token.type : null)) {
            throw new Error(`Invalid z-var value: (${token && token.type}) ${JSON.stringify(token)}. Expected: ${JSON.stringify(expectType)}`);
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
 return zTemplate;})();
