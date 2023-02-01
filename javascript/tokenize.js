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

export { tokenize };
