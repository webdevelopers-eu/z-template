/**
 *
 *
 * @module     DnaTemplate
 * @author     Daniel Sevcik <sevcik@webdevelopers.cz>
 * @copyright  2023 Daniel Sevcik
 * @since      2023-01-23 22:02:02 UTC
 * @access     public
 */
class Evaluator {
  vars;
  tokens;
  targetShortcuts = {
    "@*": "attr",
    ":*": "event",
    "**": "callback",
    ".*": "class",
    "+": "html",
    ".": "text",
    "=": "value",
    "?": "toggle",
    "!": "remove"
  };

  operatorsCompare = [
    '==',
    '!=',
    '>',
    '>=',
    '<',
    '<=',
  ];

  operatorsBoolean = [
    '!', 
    '&&',
    '||'
  ];

  data = {
    "negate": false, // bool
    "condition": null, // token
    "keyword": "", // string
    "target": null, // string
    "value": null, // string or token
    "variable": null, // string variable name in value or condition
  }
  
  constructor(tokens) {
    this.tokens = tokens;
    this.normalize();
  }

  /**
   * Normalize this.tokens so it has fixed elements that reflect the syntax like this:
   *
   * @access private
   * @return void
   */
  normalize() {
    const tokens = Array.from(this.tokens);
    let token = this.nextToken(tokens, ["operator", "generic", "block"]);

    if (tokens.length === 0 && token.value === "debugger") {
      this.data.condition = {"type": "special", "value": "debugger"};
      this.data.keyword = 'debugger';
      return;
    }

    // negate
    if (token.type === 'operator' && ["!", "!!"].includes(token.value)) {
      this.data.negate = token.value.length;
      token = this.nextToken(tokens, ["generic", "block"]);
    }

    // condition
    this.data.condition = token;
    if (this.data.condition.type === 'generic') {
      // first variable if any - used for ${var} replacements
      this.data.variable = this.data.condition.value; 
    }
    token = this.nextToken(tokens, ["generic"]);

    // shortcut: "${keywordShortcut}${target}" or "${keyword}"
    const shortcut = token.value.substr(0, 1) + (token.value.length > 1 ? '*' : '');
    if (typeof this.targetShortcuts[shortcut] != 'undefined') { // shortcut
      this.data['keyword'] = this.targetShortcuts[shortcut];
      switch (this.data['keyword']) {
      case 'attr':
      case 'event':
        tokens.unshift({type: 'block', value: [{"type": "generic", "value": token.value.substr(1)}]}); 
        break;
      case 'class':
        tokens.unshift({"type": "text", "value": token.value.substr(1).replace(/\./g, ' ')});
        break;
      }
    } else if (Object.values(this.targetShortcuts).includes(token.value)) { // full: "${keyword}" next: "${target}"
      this.data['keyword'] = token.value;
    } else {
      throw new Error(`Invalid keyword: ${token.value} . Supported keywords: ${Object.keys(this.targetShortcuts).join(', ')}`);
    }
    token = this.nextToken(tokens, ["block", "text", "generic", null]);

    // Next can be option "block" delimited by "(", ")" or "text" or "generic" or nothing
    // "block": probably "attr(attrName)" or "event(eventName)"
    // "text": the value like in "class 'class1 class2'"
    if (!token) { // the end
      return;
    } else if (token.type === 'block') { // "block"
      this.data['target'] = token.value[0].value;
      token = this.nextToken(tokens, ["text", "generic", null]);
    }

    // text or generic
    if (!token) { // the end
      return;
    } else if (token.type === 'text') { // "text"
      this.data['value'] = token.value;
    } else if (token.type === 'generic') { // "generic"
      this.data.variable = token.value; // for ${var} replacements
      this.data['value'] = token;
    }
  }

  getVariableValue(variable) {
    return typeof this.vars[variable] != 'undefined' ? this.vars[variable] : null;
  }

  evaluate(vars) {
    if (typeof vars !== 'object') {
      throw new Error(`The variables must be an object. Current argument: ${typeof vars}.`);
    }
    this.vars = vars;
    const result = {...this.data};

    // Before resolving conditions
    if (result.condition.type === 'special') {
      result.keyword = result.condition.value;
      result.condition = true;
      return result;
    } else if (result.value === null && result.condition.type == "generic") {
      result.value = this.toValue(result.condition, result.negate);
    } else if (typeof result.value == 'object') {
      result.value = this.toValue(result.value, result.negate);
    } 

    // Resolve conditions
    switch(result.condition.type) {
    case "block":
      result.condition = !!this.evaluateBlock(result.condition.value);
      break;
    case "generic":
      result.condition = !!this.evaluateVariable(result.condition.value);
      break;
    }

    if (result.negate == 1) {
      result.condition = !result.condition;
    }

    return result;
  }

  evaluateVariable(varName) {
    const val = this.getVariableValue(varName);
    if (val === null) {
      return null;
    }
    return this.isEmpty(val);
  }

  isEmpty(val) {
    return !!((typeof val !== 'object' || (val.constructor === Object && Object.keys(val).length === 0)) && (!Number.isFinite(val) || val !== 0) && val);
  }

  evaluateBlock(tokens) {
    const expression = this.mkExpression(tokens);
    // console.log("expression", expression);
    return eval(expression);
  }

  mkExpression(tokens) {
    // We could do eval of the whole expression with vars but it's not
    // safe and it's not needed and we want it to be portable to other langs.
    let result = '';
    while (true) {
      const token = this.nextToken(tokens, ["generic", "block", "text", "operator", null]);
      if (!token) {
        break;
      }

      // Arithmetic operators look ahead
      if (tokens.length > 1 && tokens[0].type === 'operator' && this.operatorsCompare.includes(tokens[0].value)) {
        const operator = this.nextToken(tokens, ["operator"]);
        const token2 = this.nextToken(tokens, ["generic", "text"]);
        result += this.compare(token, operator, token2) ? 1 : 0;
        continue;
      }

      switch (token.type) {
      case "operator":
        if (this.operatorsBoolean.includes(token.value)) {
          result += token.value;
        } else {
          throw new Error(`Invalid operator: ${token.value}. Supported operators: ${this.operatorsBoolean.join(', ')}`);
        }
        break;
      case "block":
        result += this.mkExpression(token.value);
        break;
      case "generic":
        result += this.evaluateVariable(token.value) ? 1 : 0;
        break;
      case "text":
        result += this.isEmpty(token.value) ? 1 : 0;
        break;
      }
    }
    return "(" + (result || '0') + ")";
  }

  toValue(token, negate = 0) {
    let value;
    switch (token.type) {
    case "generic":
      value = this.getVariableValue(token.value);
      break;
    case "text":
      value = token.value;
      break;
    case "block":
      value = this.evaluateBlock(token.value);
      break;
    default:
      throw new Error(`Invalid token type: ${token.type} (value: ${JSON.stringify(token)}).`);
    }
    if (value === null) {
      return value; // Number(null) === 0a
    }
    const num = Number(value);
    let ret = isNaN(num) ? value : num;

    for (let c = negate; c; c--) {
      ret = !ret;
    }

    return ret;
  }

  compare(token1, operator, token2) {
    const val1 = this.toValue(token1);
    const val2 = this.toValue(token2);

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
      throw new Error(`Invalid operator: ${operator.value} . Supported operators: ${this.operatorsCompare.join(', ')}`);
    }
  }

  nextToken(tokens, expectType = []) {
    const token = tokens.shift();
    if (!expectType.includes(token ? token.type : null)) {
      throw new Error(`Invalid z-var value: (${token && token.type}) "${token && token.value}". Generic or block expected: "${this.tokens.input}"`);
    }
    return token;
  }
}

function evaluate(tokens, vars) {
  return (new Evaluator(tokens)).evaluate(vars);
}

export { evaluate };
