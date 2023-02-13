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
export { prepare };

