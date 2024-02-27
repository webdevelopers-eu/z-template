/*! Z Template | (c) Daniel Sevcik | MIT License | https://github.com/webdevelopers-eu/z-template | build 2024-02-27T07:32:05+00:00 */
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
        const parts = variable.split('.');

        // reserved keywords
        switch(parts[0]) {
        case 'true':
        case 'always':
            return true;
        case 'false':
        case 'never':
            return false;
        case 'null':
        case 'none':
            return null;
        case 'undefined':
        case 'z':
            return undefined;
        }

        // Split the variable into parts separated by dot and get the corresponding value from this.#vars object.
        // Example: "user.name" => this.#vars.user.name
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

    #childrenScopeSelector = "*[@z-removed or (@template-scope and @template-scope != 'inherit') or (@z-scope-children and @z-scope-children != 'inherit')]";

    /**
     * @param string scopeSelector selector used to identify scope elements
     */
    #scopeSelector = `*[self::${this.#templateSelector} or @z-scope or parent::${this.#childrenScopeSelector} or @template-clone or ancestor::*/@z-removed]`;

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
        if (value === null) {
            console.warn(`Template "${templateName}" not found in data`, this.#vars);
            return;
        }
        
        let list;
        if (template.substr(0, 1) == '{') {
            list = [value];
        } else if (value && value[Symbol.iterator]) {
            list = Array.from(value);
        } else if (typeof value == 'object') {
            list = Object.entries(value).map(([key, value]) => ({key, value}));
        } else {
            console.warn("Template value '%s' is not iterable: %o. Template: %o", templateName, value, zTemplate);
            list = [];
        }

        const clones = this.#getTemplateClones(zTemplate, list);
        let listIdx = list.length;
        let beforeElements = [zTemplate];
        for (let i = clones.length - 1; i >= 0; i--) {
            const clone = clones[i];
            switch (clone.action) {
            case 'reuse':
            case 'add':
                const vars = typeof list[--listIdx] != 'object' ? { value: list[listIdx], key: listIdx } : list[listIdx];
                vars._parent_ = this.#vars;
                for (let i2 = clone.elements.length - 1; i2 >= 0; i2--) {
                    const element = clone.elements[i2];
                    if (clone.action == 'add') {
                        // If before element was removed by something else, we need to find the next one.
                        while(beforeElements.length && !beforeElements[0].parentNode) {
                            beforeElements.shift();
                        }
                        beforeElements[0].before(element);
                    }
                    const template = new Template(element);
                    template.render(vars, this.#callbacks); // must be after before() - some logic relies on it.
                    beforeElements.unshift(element);
                }
                break;
            case 'remove':
                clone.elements.forEach((element) => this.#animateRemove(element));
                break;
            }
        }
    }

    #getTemplateClones(zTemplate, list) {
        // Find all immediate preceding siblings having the same template-clone="${template}" attribute.
        const count = list.length;
        const templateAttrVal = zTemplate.getAttribute('template');
        const clones = [];
        const existingClones = [];

        let previous = zTemplate.previousElementSibling;
        let lastId = -1;
        let maxId = -1;
        while (previous && previous.getAttribute('template-clone') == templateAttrVal) {
            const id = previous.getAttribute('template-clone-id');
            maxId = Math.max(maxId, id);
            if (!previous.hasAttribute('z-removed')) {
                if (lastId == id && id !== null) {
                    existingClones[0].unshift(previous);
                } else {
                    existingClones.unshift([previous]);
                }
            }
            previous = previous.previousElementSibling;
            lastId = id;
        }

        // We are trying to figure out what elements to remove, what to add and what to reuse
        // so that we can animate the changes.
        const listHashes = list.map((item) => this.#getHash(item));
        const attrHashes = existingClones.map((clone) => clone[0].getAttribute('template-clone-hash'));
        while (listHashes.length || attrHashes.length) {
            const listHash = listHashes.shift();
            const attrHash = attrHashes.shift();
            if (listHash == attrHash) { // same
                clones.push({"elements": existingClones.shift(), "action": "reuse"});
            } else { // same list item?
                const foundAttrIdx = attrHashes.indexOf(listHash);
                const foundListIdx = listHashes.indexOf(attrHash);
                if (listHash && (!attrHash || foundListIdx != -1) && (foundAttrIdx == -1 || foundListIdx < foundAttrIdx)) { // New list item + add element
                    clones.push({"elements": this.#cloneTemplateElement(zTemplate, {
                        "template-clone": templateAttrVal,
                        "template-clone-id": ++maxId,
                        "template-clone-hash": listHash,
                    }), "action": "add"});
                    if (attrHash) attrHashes.unshift(attrHash);
                } else { // Remove element - current listHash is the same as the next attrHash
                    const elements = existingClones.shift();
                    clones.push({"elements": elements, "action": "remove"});
                    if (listHash) listHashes.unshift(listHash);
                }
            }
        }

        return clones;
    }

    // It can be either element itself or <template> with DocumentFragment as content.
    #cloneTemplateElement(zTemplate, attrs) {
        const clone = [];
        if (zTemplate.content instanceof DocumentFragment) { // <template> tag
            clone.push(...Array.from(zTemplate.content.children).map((el) => el.cloneNode(true)));
        } else {
            clone.push(zTemplate.cloneNode(true));
        }
        clone.forEach((el) => {
            el.classList.add('template-clone');
            el.removeAttribute('template');
            for (const [key, value] of Object.entries(attrs)) {
                el.setAttribute(key, value);
            }
        });
        return clone;
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

                if (command.value === null) {
                    console.warn(`The command %o's value is null. Skipping the condition. Variables: %o`, command, this.#vars);
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
                if (!zElement.parentNode) {
                    console.warn("The element %o was removed from the DOM. Something may break when executing the command %o", zElement, command);
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
            this.#animateRemove(zElement);
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
        zProto.textContent = this.#getReplaceText(zProto, zProto.textContent, command.variable, command.value === undefined || command.value === null || command.value === false ? '' : command.value, '');
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
        } else if (varName && template && ['src', 'href'].includes(id) && template.indexOf(encodeURIComponent(varNameStr)) !== -1) { // href and src attributes may be encoded
            result = (template || '').replace(encodeURIComponent(varNameStr), encodeURIComponent(value));
        } else {
            result = value;
        }

        // Backup
        if (template !== result && template && !element.hasAttribute(bakAttrName) && (template.indexOf('${') !== -1 || template.indexOf(encodeURIComponent('${')) !== -1)) {
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
            const rev = parseInt(zElement.getAttribute('z-content-rev') || 0) + 1;
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

    #getHash(data) {
        let str;
        if (typeof data === 'object' && typeof data.id !== 'undefined') {
            if (typeof data.id == 'string' || typeof data.id == 'number') {
                return data.id; // use id right awayn
            }
            str = JSON.stringify(data.id);
        } else {
            str = JSON.stringify(data,  (key, value) => {
                if (key == '_parent_') {
                    // Circular reference found - ignore it
                    return undefined;
                } else {
                    return value;
                }
            });
        }

        // CRC32 hash (not sure if correct, but it works practically for our needs)
        var crcTable = [];
        for (var i = 0; i < 256; i++) {
            var c = i;
            for (var j = 0; j < 8; j++) {
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[i] = c;
        }

        var crc = 0 ^ (-1);
        for (var i = 0; i < str.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
        }

        return '' + ((crc ^ (-1)) >>> 0);
    }

    #animateRemove(element) {
        if (element.hasAttribute('z-removed') || !element.parentNode) { // alredy removed or being removed
            return;
        }

        const computedStyle = window.getComputedStyle(element);
        const origAnimationName = computedStyle.animationName;
        const userSpeed = parseInt(computedStyle.getPropertyValue('--z-anim-speed')); // user customizable speed using CSS variable
        
        element.setAttribute('z-removed', 'true');
        const style = window.getComputedStyle(element);
        const currAnimationName = style.animationName;
        const animationDuration = ((parseFloat(style.animationDuration) || 0) + (parseFloat(style.animationDelay) || 0)) * 1000;
        const duration = userSpeed ? Math.max(200, animationDuration) : 0;

        const animPromise = new Promise((resolve) => {
            if (origAnimationName !== currAnimationName) { // New animation is running after z-removed attr was set
                element.addEventListener('animationend', resolve);
                element.removeEventListener('animationcancel', resolve);
                element.removeEventListener('animationiteration', resolve);
            } else {
                resolve();
            }
        });

        // To be sure we remove the element even if something fails
        const timeoutPromise = new Promise((resolve) => {
            // if element is display:none then animationend nor transitionend will be fired
            setTimeout(resolve, duration);
        });

        // Shrink the space in a flow by setting negative margin.
        const slideUpPromise = new Promise((resolve) => {
            const dim = element.getBoundingClientRect();
            // Fixate the size of the element
            element.style.height = dim.height + 'px';
            element.style.width = dim.width + 'px';

            // We cannot use animation as it cancels the user animation, let's use transition instead
            element.style.transition = 'none';
            element.style.margin = `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`;

            element.addEventListener('transitionend', resolve);

            element.style.transition = `margin ${duration}ms ease-in-out`;
            element.style.marginRight = `-${Math.ceil(dim.height + parseInt(style.marginLeft))}px`;
            element.style.marginBottom = `-${Math.ceil(dim.height + parseInt(style.marginTop))}px`;
        });

        Promise.any([Promise.all([animPromise, slideUpPromise]), timeoutPromise])
            .then(() => element.remove());
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


export default zTemplate;