__Z Template__

*Introducing a revolutionary new way to simplify your UI development
process. Our templating library allows you to build and manage your
code with ease, without the fear of any layout changes made by
designers breaking your hard-written code.*

*The library's powerful yet simple design makes it easy for developers
to create beautiful, functional interfaces without worrying about the
impact of design changes on their code. This means you can focus on
writing clean, efficient code, while designers can make changes to the
layout without any risk of disrupting your work. Don't let the fear of
layout changes hold you back any longer, try our javascript templating
library today and experience the freedom and flexibility it offers!*

**Table of Contents**
<!-- markdown-toc start - Don't edit this section. Run M-x markdown-toc-refresh-toc -->
**Table of Contents**

- [Features](#features)
- [Usage](#usage)
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
Introducing a cutting-edge features that takes UI development to the next level. With our library, you'll have access to:

- [x] The ability to apply templates multiple times to the same element to update the UI with changed values
- [x] Support for adding/removing classes conditionally (e.g. add this class if value is true)
- [x] Conditional attributes (e.g. check the check-box if value is true)
- [x] Conditional hiding/showing/removal of elements based on values
- [x] Conditional triggering of Javascript events based on values
- [x] Nested templates with for-each-like behavior (recursive templates supported)
- [x] Super lightweight without any dependencies. Include one javascript file and you're ready to go!
- [x] And much more!

**With our library, you'll be able to create beautiful, functional interfaces with ease. Try it out today and see the difference it can make in your development process!**

## Quick Introduction

With Z Template, you can easily turn your JSON data into dynamic,
interactive HTML user interfaces. Simply add special markup,
represented by `z-var` attributes, to your HTML and let Z Template do
the rest. It'll seamlessly insert your data into the right places and
dynamically adjust the UI based on the information it receives.

Say goodbye to manual UI updates and hello to quick and effortless
data-driven interfaces with Z Template!

Simplify the creation of dynamic HTML UI with the intuitive `z-var`
attribute syntax. Just specify `z-var="VAR_NAME WHERE"` to easily insert
data from your JSON object into your HTML. The `VAR_NAME` represents
the data you want to insert, while `WHERE` typically specifies either
`attr ATTRIBUTE_NAME` to insert into an element attribute, or `text`
to insert into the text content of an element.

For example, let's say you have this JSON object:

    {
        "name": "John Doe",
        "age": 42,
        "address": {
            "street": "123 Main St.",
            "city": "Anytown",
            "state": "CA",
            "zip": "12345"
        }
    }

You can use Z Template to turn it into a dynamic HTML UI with ease:

    <div id="user" z-var="name attr title" title="My name is ${name}">
        <h1 z-var="name text"></h1>
        <p z-var="age text"></p>
        <p z-var="address.street text"></p>
        <p z-var="address.city text"></p>
        <p z-var="address.state text"></p>
        <p z-var="address.zip text"></p>
    </div>

To apply your JSON data to the template, simply call the zTemplate function:

    zTemplate(document.getElementById("user"), {
        "name": "John Doe",
        "age": 42,
        "address": {
            "street": "123 Main St.",
            "city": "Anytown",
            "state": "CA",
            "zip": "12345"
        }
    });

And voila! Your JSON data is now dynamically displayed in your HTML
UI. Plus, you can easily update the UI with new data by simply calling
`zTemplate(document.getElementById("user"), newData)` again on the
same element.

With Z Template, you can not only insert data into text content and
attributes, but you can also control the appearance and behavior of
your UI. Want to toggle the visibility of an element based on a
variable or complex condition? No problem! Simply add `z-var="myVar
toggle"` or `z-var="{myVar == 'foo'} toggle"` to your HTML. Want to
set the value of a web form's input control? It's as easy as
`z-var="myVar value"`. The possibilities are endless with Z Template's
powerful [actions](#actions) feature. Check out the complete list to
discover all the ways you can make your UI dynamic and interactive.

## Usage

### Javascript

Non-module version: Include `template.css` and
    `template.bundle.min.js` on your page. Change the "…" to reflect
    the path to the library.  <html> <head> <script
    src="…/javascript/template.css"></script> <script
    src="…/javascript/template.bundle.min.js"></script> </head> <body>
    ...  </body> </html>

If you use modules you can import `zTemplate` from template.js module.

    import { zTemplate } from '…/javascript/template.js';

Either way will make `jQuery.template(…)` method available if jQuery is loaded. The jQuery is not required. You can call `zTemplate(…)` method directly.

## Syntax

Template instructions are stored as comma-separated commands in a `z-var` attribute.

    <div z-var="COMMAND, COMMAND [, …]"></div>


The structure of the COMMAND is as follows: a value or boolean expression is followed by an action selector and an optional condition. 

    COMMAND: VALUE ACTION [ CONDITION ]

The `VALUE` can be an expression enclosed in curly braces, a variable name, a boolean value, or a string. Examples: `{foo < 10}`, `foo.bar`, `bar`, `true`, `"foo"`.
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
    <input type="checkbox" z-var="{foo == 'bar'} value"/>
    <input type="radio" z-var="foo value" value="bar"/>
    <input type="radio" z-var="foo value" value="baz"/>

Result:

    <select>
        <option value="bar" selected>Bar</option>
        <option value="baz">Baz</option>
    </select>
    <input type="checkbox" checked="checked"/>
    <input type="radio" value="bar" checked="checked"/>
    <input type="radio" value="baz"/>

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

You can of course use more complex expressions to control the visibility. For example:

    <div z-var="{foo != 'bar' && person.baz > 23} toggle"></div>

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

Use the "event" action in the "z-var" attribute to trigger a
JavaScript event on the current element and pass the value of the
"VALUE" as the detail parameter to the event. 

Syntax:

    VALUE event EVENT_NAME [ CONDITION ]

Syntax sugar:

    VALUE :EVENT_NAME [ CONDITION ]

Example:

    <script>
        document.querySelector('div')
            .addEventListener('my-event', function(event) {
                console.log('EVENT', event.target, event.detail);
            });
        zTemplate(document.querySelector('div'), {"foo": "bar"});
    </script>
    <div z-var="foo event my-event"></div>


The above code sets up an event listener for the `"my-event"` event on a
`div` element. The zTemplate function is then called, passing in the
`div` and an object with a `foo` property set to `"bar"`. Finally, the
`z-var` attribute on the `div` element is set to `"foo event
my-event"`. This means that the value of the "foo" property will be
passed as the detail parameter to a `"my-event"` event triggered on the
`div` element.

With this feature, you can add dynamic interactivity to your
templates, allowing users to respond to changes in data, toggle
display and visibility, and more.

You can of course use more complex expressions to control the event firing. For example:

    <div z-var="foo event my-event {foo == 'bar'}"></div>

In this case, the event will be fired only if the value of the `foo` variable is equal to `"bar"`.

### Custom Function Call

With Z Template, you can even trigger custom callbacks based on the
values of variables.

The list of callbacks is passed as a third argument to `zTemplate` function.

Syntax:

    VALUE call CALLBACK_NAME [ CONDITION ]

Syntax sugar:

    VALUE *CALLBACK_NAME [ CONDITION ]

Example:
    
        <script>
            function myCallback(element, value) {
                console.log('CALLBACK', element, value);
            }
            zTemplate(
                document.querySelector('div'),
                {"foo": "bar", "baz": 23},
                {"myCallback": myCallback, "myCallback2": myCallback2}
            );
        </script>
        <div z-var="foo call myCallback"></div>
        <div z-var="foo call myCallback2 {baz == 23 && foo = 'bar'}"></div>

In the example above, the `myCallback` function
will be called with the value of the `foo` variable as the second
parameter and the element as the first parameter. The `myCallback2` will
only be called if `baz` is equal to `23` and `foo` is equal to `"bar"`. Both
the element and the `foo` variable value will be passed to the function,
giving you full control over the HTML UI. This feature opens up
endless possibilities for you to enhance your UI, providing even more
flexibility and control over your data-driven UI.

## Boolean Conversion

The value is converted to a boolean as follows:

* If the value is a boolean, it is returned as is.
* If the value is a number, it is converted to a boolean where 0 is false and all other numbers are true.
* If the value is a string, it is converted to a boolean where the empty string is false and all other strings are true.
* If the value is an object, it is converted to a boolean if the object has no properties.
* If the value is an array, it is converted to a boolean if the array has no elements.

Any value can be converted into boolean by enclosing it in curly braces or by prefixing it with "!!" symbols. Example: `{foo}`, `!!foo`.


