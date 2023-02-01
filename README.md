__Z Template__

*Introducing a revolutionary new way to simplify your UI development
process. Our templating library (you can choose PHP or Javascript
implementation) allows you to build and manage your code with ease,
without the fear of any layout changes made by designers breaking your
hard-written code.*

*The library's powerful yet simple design makes it
easy for developers to create beautiful, functional interfaces without
worrying about the impact of design changes on their code. This means
you can focus on writing clean, efficient code, while designers can
make changes to the layout without any risk of disrupting your
work. Don't let the fear of layout changes hold you back any longer,
try our javascript templating library today and experience the freedom
and flexibility it offers!*

**Table of Contents**
<!-- markdown-toc start - Don't edit this section. Run M-x markdown-toc-refresh-toc -->
**Table of Contents**

- [Features](#features)
- [Installation](#installation)
    - [Javascript](#javascript)
- [Syntax](#syntax)
    - [Examples](#examples)
- [Actions](#actions)
    - [Insert Attribute](#insert-attribute)
    - [Insert Text Content](#insert-text-content)
    - [Insert HTML Content](#insert-html-content)
    - [Insert Value](#insert-value)
    - [Toggle CSS Class](#toggle-css-class)
    - [Toggle Visibility](#toggle-visibility)
    - [Remove Element](#remove-element)
    - [Fire Javascript Event](#fire-javascript-event)
    - [Custom Function Call](#custom-function-call)
- [Boolean Conversion](#boolean-conversion)

<!-- markdown-toc end -->


## Features


## Installation

### Javascript

Non-module version:

    <script src="…/javascript/template.bundle.min.js"></script>

Module version:

    import { zTemplate } from '…/javascript/template.js';

## Syntax

Template instructions are stored as comma-separated commands in a `z-var` attribute.

    <div z-var="COMMAND, COMMAND [, …]"></div>


The structure of the COMMAND is as follows: a value or boolean expression is followed by an action selector and an optional condition. 

    COMMAND: VALUE ACTION [ CONDITION ]

The `VALUE` can be an expression enclosed in curly braces, a variable name, a boolean value, or a string. Examples: `{foo < 10}`, `bar`, `true`, `"foo"`.
The `!` or `!!` operators can be used to negate the value. Examples: `!{foo < 10}`, `!!foo`. The `!!` operator is used to convert a value to a boolean.

The `ACTION` can be one of the following: `attr ATTR_NAME`, `class CLASS_NAME`, `call CALLBACK_NAME`, `event EVENT_NAME`, `text`, `html`, `value`, `toggle`, or `remove`.

The `CONDITION` is an expression. Expressions can be nested within parentheses. Operators in the EXPRESSION include `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, and `||`.

A `STRING` is defined within double quotes (".\*") or single quotes ('.*').

### Examples

Simplistic example of the command structure to insert variable `foo` into the `title` attribute of the current element and also as the text content of the current element:

    <script>zTemplate(document.querySelector('div'), {foo: 'bar'})</script>
    <div z-var="foo attr title, foo text"></div>

Example of a more complex command structure to insert variable `foo` into the `title` attribute of the current element if the variable `bar` is true:

    <script>zTemplate(document.querySelector('div'), {foo: 'boo', bar: true})</script>
    <div z-var="foo attr title {bar}"></div>

Example of a more complex command structure to insert variable `foo` into the `title` attribute of the current element if the variable `bar` is true and the variable `qux` is false or the variable `baz` equals the string "boo":

    <script>zTemplate(document.querySelector('div'), {foo: 'boo', bar: true, qux: true, baz: 'boo'})</script>
    <div z-var="foo attr title {bar && (!qux || baz == 'boo')}"></div>


## Actions

### Insert Attribute

Insert the value of a variable into an attribute of the current element or toggle a boolean attribute should the value be boolean true or false.

Syntax:

    VALUE attr ATTRIBUTE_NAME [ CONDITION ]

Syntax sugar:

    VALUE @ATTRIBUTE_NAME [ CONDITION ]

Example:

    <script>zTemplate(document.querySelector('div'), {"foo": "bar"});</script>
    <div z-var="foo attr title"></div>

Result:

    <div title="bar"></div>

If the value evaluates to a boolean, the attribute will be either removed or added depending on the value.

    <script>zTemplate(document.querySelector('div'), {"foo": true});</script>
    <input type="checkbox" z-var="foo attr checked"/>

Result:

    <input type="checkbox" checked/>

If the target attribute already exists and the string value contains variable placeholders (e.g. `${foo}`), the placeholders will be replaced with the value of the variable.

    <script>zTemplate(document.querySelector('div'), {"foo": "bar"});</script>
    <div title="Hello ${foo}!" z-var="foo attr title"></div>

### Insert Text Content

Insert the value of a variable into the text content of the current element.

Syntax:

    VALUE text [ CONDITION ]

Syntax sugar:
    
        VALUE . [ CONDITION ]

Example:

    <script>zTemplate(document.querySelector('div'), {"foo": "bar"});</script>
    <div z-var="foo text"></div>

Result:
    
        <div>bar</div>

If the text content already exists and the string value contains variable placeholders (e.g. `${foo}`), the placeholders will be replaced with the value of the variable.

    <script>zTemplate(document.querySelector('div'), {"foo": "bar"});</script>
    <div z-var="foo text">Hello ${foo}!</div>

### Insert HTML Content

Insert the value of a variable into the HTML content of the current element.

Syntax:

    VALUE html [ CONDITION ]

Syntax sugar:

    VALUE + [ CONDITION ]

Example:

    <script>zTemplate(document.querySelector('div'), {"foo": "<b>bar</b>"});</script>
    <div z-var="foo html">This text will be replaced with inserted HTML.</div>

Result:
    
        <div><b>bar</b></div>

### Insert Value

Insert the value of a variable into the form's field.

Syntax:

    VALUE value [ CONDITION ]

Syntax sugar:

    VALUE = [ CONDITION ]

Example:

    <script>zTemplate(document.querySelector('select'), {"foo": "bar"});</script>
    <select z-var="foo value">
        <option value="bar">Bar</option>
        <option value="baz">Baz</option>
    </select>

Result:
    
        <select>
            <option value="bar" selected>Bar</option>
            <option value="baz">Baz</option>
        </select>

### Toggle CSS Class

Toggle a CSS class on the current element.

Syntax:

    BOOL_EXPRESSION class "[!]CLASS_NAME1 CLASS_NAME2 …" [ CONDITION ]

Syntax sugar:

    BOOL_EXPRESSION .CLASS_NAME1.CLASS_NAME2… [ CONDITION ]

Example:

    <script>zTemplate(document.querySelector('div'), {"foo": true});</script>
    <div z-var="foo class 'bar baz'"></div>

Result:

        <div class="bar baz"></div>

The `BOOL_EXPRESSION` is converted to a boolean as per the rules in the [Boolean Conversion](#boolean-conversion) section. It can be an expression
enclosed in curly braces, a variable name, a boolean value, or a string. Examples: `{foo < 10 || foo == 'bar'}`, `bar`, `true`, `"foo"`.

Example:
    
        <script>zTemplate(document.querySelector('div'), {"foo": true, "bar": "baz"});</script>
        <div z-var="{foo && bar == 'baz'} 'bar-class baz-class'"></div>

Result:

        <div class="bar-class baz-class"></div>

You can inverse the logic of adding/removing the class by prefixing the particular class name with "!" symbol.

Example:

    <script>zTemplate(document.querySelector('div'), {"foo": true});</script>
    <div z-var="foo class 'bar-class !baz-class'"></div>

Result:

        <div class="bar-class"></div>

### Toggle Visibility

Toggle the visibility of the current element. The visibility is controlled by adding/removing the CSS classes `dna-template-hidden` and `dna-template-visible`. The CSS definition is in `template.css` file.

Syntax:

    BOOL_EXPRESSION toggle [ CONDITION ]

Syntax sugar:

    BOOL_EXPRESSION ? [ CONDITION ]

Example:

    <script>zTemplate(document.querySelector('div'), {"foo": true});</script>
    <div z-var="foo toggle"></div>

Result:

        <div class="dna-template-visible"></div>

### Remove Element

Remove the current element from the DOM. 

WARNING: This action is destructive. The element is removed from the DOM and cannot be restored and templates cannot be re-applied to update the HTML structure.

Syntax:

    BOOL_EXPRESSION remove [ CONDITION ]

Syntax sugar:

    BOOL_EXPRESSION ! [ CONDITION ]

Example:

    <script>zTemplate(document.querySelector('div'), {"foo": true});</script>
    <div z-var="foo remove"></div>
    <div z-var="{foo == true} remove"></div>
    <div z-var="!foo remove"></div>

Result:

    <div z-var="!foo remove"></div>

### Fire Javascript Event

Fire a Javascript event on the current element and pass the `VALUE` as the detail paramteter to the event.

Syntax:

    VALUE event EVENT_NAME [ CONDITION ]

Syntax sugar:

    VALUE :EVENT_NAME [ CONDITION ]

Example:

    <script>
        document.querySelector('div').addEventListener('my-event', function(event) {
            console.log('EVENT', event.target, event.detail);
        });
        zTemplate(document.querySelector('div'), {"foo": "bar"});
    </script>
    <div z-var="foo event my-event"></div>

### Custom Function Call

Call a custom callback and pass the element and value as parameters to the callback. The list of callbacks is passed as a third argument to `zTemplate` function.

Syntax:

    VALUE call CALLBACK_NAME [ CONDITION ]

Syntax sugar:

    VALUE *CALLBACK_NAME [ CONDITION ]

Example:
    
        <script>
            function myCallback(element, value) {
                console.log('CALLBACK', element, value);
            }
            zTemplate(document.querySelector('div'), {"foo": "bar"}, {"myCallback": myCallback});
        </script>
        <div z-var="foo call myCallback"></div>

## Boolean Conversion

The value is converted to a boolean as follows:

* If the value is a boolean, it is returned as is.
* If the value is a number, it is converted to a boolean where 0 is false and all other numbers are true.
* If the value is a string, it is converted to a boolean where the empty string is false and all other strings are true.
* If the value is an object, it is converted to a boolean if the object has no properties.
* If the value is an array, it is converted to a boolean if the array has no elements.

Any value can be converted into boolean by enclosing it in curly braces or by prefixing it with "!!" symbols. Example: `{foo}`, `!!foo`.


