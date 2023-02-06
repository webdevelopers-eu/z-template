*Formerly known as the **jQuery DNA Template**, this solution underwent a
comprehensive revamp in 2023 and is now fully independent of jQuery
while still maintaining full compatibility with the original version.*

**In just 15 minutes, you'll be able to effortlessly turn your JSON or
any other data into organized and structured HTML code.** This
essential tool is a must-have for any developer looking to streamline
their data presentation process.

# Z Template ➋

*Transform your UI development with ease! Our battle-tested templating
library, fine-tuned over the past 6 years through real-life use on
numerous sites, is now better than ever with* **Z Template** ➋.

*Z Template library is here to take your coding to the next level. Say
goodbye to complex and time-consuming development processes. With its
lightweight design and powerful features, our library gives you
complete control over your code. No more worries about design changes
ruining your hard work. Get ready to simplify your UI development with
our **dependency-free** solution.*

*The library's powerful yet simple design makes it easy for developers
to create beautiful, functional interfaces without worrying about the
impact of design changes on their code. This means you can focus on
writing clean, efficient code, while designers can make changes to the
layout without any risk of disrupting your work. Don't let the fear of
layout changes hold you back any longer, try our javascript templating
library today and experience the freedom and flexibility it offers!*

Are you curious what is so special about our library? Check out the
[Choose Z Template Over Other Solutions](#choose-z-template-over-other-solutions)

<!-- markdown-toc start - Don't edit this section. Run M-x markdown-toc-refresh-toc -->
**Table of Contents**

- [Z Template ➋](#z-template-➋)
    - [Features](#features)
    - [Quick Introduction](#quick-introduction)
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
    - [Lists, Contexts, and Scopes](#lists-contexts-and-scopes)
        - [Lists](#lists)
            - [Simple Example](#simple-example)
            - [Advanced Example](#advanced-example)
            - [Nested Lists](#nested-lists)
        - [Contexts](#contexts)
        - [Scopes](#scopes)
    - [Typecasting](#typecasting)
        - [Boolean](#boolean)
        - [Values](#values)
    - [CSS Tricks](#css-tricks)
        - [Disabling Default Animations](#disabling-default-animations)
        - [Animating New List Items](#animating-new-list-items)
        - [Animating Changed Elements](#animating-changed-elements)
        - [Other Animations](#other-animations)
    - [Choose Z Template Over Other Solutions](#choose-z-template-over-other-solutions)
    - [Shape The Future of Z Template](#shape-the-future-of-z-template)
    - [Final Notes](#final-notes)

<!-- markdown-toc end -->

## Features

Introducing a cutting-edge features that takes UI development to the next level. With our library, you'll have access to:

- ⓩ Dynamic UI updates with just one simple reapplication of templates as values change
- ⓩ Effortlessly conditionally apply/remove classes to enhance your UI design
- ⓩ Unleash dynamic control over your UI with conditional attributes, like check-boxes that update based on values
- ⓩ Enjoy smooth and seamless UI transitions with conditional hiding/showing/removal of elements
- ⓩ Respond to changing values with powerful Javascript event triggers
- ⓩ Create complex UI structures with ease through nested templates with for-each-like functionality
- ⓩ Experience lightning-fast performance with a super lightweight library, requiring only a single JavaScript file with no dependencies
- ⓩ And much more! Unleash your UI design potential.

**With our library, you'll be able to create beautiful, functional interfaces with ease. Try it out today and see the difference it can make in your development process!**

## Quick Introduction

Simplify the creation of dynamic HTML UI with the intuitive `z-var`
attribute syntax. Just specify `z-var="VAR_NAME WHERE"` to easily insert
data from your JSON object into your HTML. The `VAR_NAME` represents
the data you want to insert, while `WHERE` typically specifies either
`attr ATTRIBUTE_NAME` to insert into an element attribute, or `text`
to insert into the text content of an element.

For example, let's say you have this JSON object:

    const myData = {
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

    <script src="…/javascript/template.css"></script>
    <script src="…/javascript/template.bundle.min.js"></script>
    
    <div id="user" z-var="name attr title" title="My name is ${name}">
        <h1 z-var="name text"></h1>
        <p z-var="age text">${age} yrs</p>
        <p z-var="address.street text"></p>
        <p z-var="address.city text"></p>
        <p z-var="address.state text"></p>
        <p z-var="address.zip text"></p>
    </div>

To apply your JSON data to the template, simply call the zTemplate function:

    zTemplate(document.querySelector("#user"), myData);

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

If you're interested in trying out the library, you can 
[experiment with it on CodePen](https://codepen.io/webdevelopers/full/vYabQNL).

## Usage

### Javascript

Including `template.css` and `template.bundle.min.js` on your page is
all you need to get started. Simply add the following code to your
HTML file and replace the "…" with the path to the library:

    <html>
        <head>
            <script src="…/javascript/template.css"></script>
            <script src="…/javascript/template.bundle.min.js"></script>
        </head>
        <body>
            ...
        </body>
    </html>

If you're a fan of using modules, you can import zTemplate straight from the `template.js` module. Simply add the following code to your project:

    import { zTemplate } from '…/javascript/template.js';

And, if you have `jQuery` loaded, `jQuery.template(…)` method will also be available. No worries if you don't have `jQuery`, you can call `zTemplate(…)` method directly.

Applying your JSON data to the template is as simple as calling `zTemplate(targetElement, data)`. Start bringing your templates to life with dynamic and interactive content!

## Syntax

Template instructions are stored as comma-separated commands in a `z-var` attribute.

    <div z-var="COMMAND, COMMAND [, …]"></div>


The structure of the COMMAND is as follows: a value or boolean expression is followed by an action selector and an optional condition. 

    COMMAND: VALUE ACTION [ CONDITION ]

Here's what each part of the syntax means:

- The `VALUE` can be an boolean expression enclosed in curly braces, a variable name, a boolean value, or a string. Examples: `{foo < 10}`, `foo.bar`, `bar`, `true`, `"foo"`. 
    - The `!` or `!!` operators can be used to negate the value. Examples: `!{foo < 10}`, `!!foo`. 
    - The `!!` operator is used to convert a value to a boolean.
    - The boolean `VALUE` can be utilized to either [display or hide](#toggle-visibility) an element, [add or remove CSS classes](#toggle-css-class), or set the [boolean attribute](#insert-attribute), such as `checked` or `disabled`, of an element.
- The `ACTION` can be one of the following: `attr ATTR_NAME`, `class CLASS_NAME`, `call CALLBACK_NAME`, `event EVENT_NAME`, `text`, `html`, `value`, `toggle`, or `remove`.
- The *optional* `CONDITION` is an expression in curly braces. If the condition evaluates to `true`, the action will be applied. If the condition evaluates to `false`, the action will be ignored. Supported operators in the expression are `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, and `||`. Examples: `{foo == 'bar'}`, `{foo == 'bar' || foo == 'baz'}`, `{foo == 'bar' && (foo == 'baz' || foo == 'qux')}`.
    - Note that all the values get [converted into scalar values](#values) before comparison in a way that Arrays and Objects convert into a number of their elements. For example, `{"foo": [1, 2, 3]}` input to `foo == 3` evaluates to `true`.

### Examples

Let's take a look at some examples.

Want to insert a variable foo into the title attribute and text content of a div element? Easy:

    <script>zTemplate(document.querySelector('div'), {foo: 'bar'})</script>
    <div z-var="foo attr title, foo text"></div>

What about inserting foo into the title attribute only if `bar` is `true`? Piece of cake:

    <script>zTemplate(document.querySelector('div'), {foo: 'boo', bar: true})</script>
    <div z-var="foo attr title {bar}"></div>

Want to get even more complex? No problem! Evaluate multiple variables with a complex condition and if it's true, insert the `foo` value into the attribute `title`.

    <script>zTemplate(document.querySelector('div'), {foo: 'boo', bar: true, qux: true, baz: 'boo'})</script>
    <div z-var="foo attr title {bar && (!qux || baz == 'boo')}"></div>

There is more you can do with Z Template. Check out the [actions](#actions) section to learn more.

## Actions

### Insert Attribute

Insert the value of a variable into an attribute of the current element or toggle a boolean attribute should [the value be boolean](#boolean) true or false.

Syntax:

    VALUE attr ATTRIBUTE_NAME [ CONDITION ]

Syntax sugar:

    VALUE @ATTRIBUTE_NAME [ CONDITION ]

Example:

    <script>zTemplate(document.querySelector('div'), {"foo": "bar"});</script>
    <div z-var="foo attr title"></div>

Result:

    <div title="bar"></div>

If the [value evaluates to a boolean](#boolean), the [boolean
attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes#boolean_attributes)
will be either removed or added depending on the value. This is most
commonly used to toggle the `checked` attribute of a checkbox, adding
`disabled` attribute to a button, or adding `selected` attribute to an
option element.

    <script>zTemplate(document.querySelector('div'), {"foo": true});</script>
    <input type="checkbox" z-var="foo attr checked"/>

Result:

    <input type="checkbox" checked/>

If the target attribute already exists and the string value contains variable placeholders (e.g. `${foo}`), the placeholders will be replaced with the value of the variable.

    <script>zTemplate(document.querySelector('div'), {"name": "John", "surname": "Doe"});</script>
    <div title="Hello ${name} ${surname}!" z-var="name attr title, surname attr title"></div>

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

    <script>zTemplate(document.querySelector('div'), {"name": "John", "surname": "Doe"});</script>
    <div z-var="name text, surname text">Hello ${name} ${surname}!</div>

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

The `BOOL_EXPRESSION` is converted to a boolean as per the rules in the [Boolean Conversion](#boolean) section. It can be an expression
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

Toggle the visibility of the current element. The visibility is controlled by adding/removing the CSS classes `z-template-hidden` and `z-template-visible`. The CSS definition is in `template.css` file.

If multiple toggle commands are present with different outcomes, the "show" outcome always wins.

Syntax:

    BOOL_EXPRESSION toggle [ CONDITION ]

Syntax sugar:

    BOOL_EXPRESSION ? [ CONDITION ]

Example:

    <script>zTemplate(document.querySelector('div'), {"foo": true});</script>
    <div z-var="foo toggle"></div>

Result:

        <div class="z-template-visible"></div>

You can of course use more complex expressions to control the visibility. For example:

    <div z-var="{foo != 'bar' && person.baz > 23} toggle"></div>

Note: The old `dna-template-hidden` and `dna-template-visible` classes
from version 1.0 are still supported for backward compatibility.

### Remove Element

Remove the element from the DOM if `BOOL_EXPRESSION` [evaluates](#boolean) to `false` and optional `CONDITION` to true.

If multiple remove commands are present with different outcomes, the "remove" outcome always wins.

**WARNING**: This action is destructive. The element is removed from the DOM and cannot be restored and templates cannot be re-applied to update the HTML structure. In most cases [Toggle Visibility](#toggle-visibility) is a better choice.

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

To trigger a JavaScript event on an element, you can use the "event"
action in the "z-var" attribute. This action passes an detail
object as the event's detail property, which contains two properties:
data and value.

- data: The data property holds the current value of the variables.
- value: The value property contains the value of the command that triggered the event.

Syntax:

    VALUE event EVENT_NAME [ CONDITION ]
    VALUE event EVENT_NAME(...ARGUMENTS) [ CONDITION ]

Syntax sugar:

    VALUE :EVENT_NAME [ CONDITION ]

Example:

    <script>
        document.querySelector('div')
            .addEventListener('my-event', function(event) {
                console.log('EVENT my-event fired on %o with info object %o', event.target, event.detail);
            });
        zTemplate(document.querySelector('div'), {"foo": "bar", "baz": [1,2,3]});
    </script>
    <div id="test1" z-var="foo event my-event"></div>
    <div id="test2" z-var="foo event my-event(foo, baz == 3, 'Hello world!')"></div>


The above code sets up an event listener for the `"my-event"` event on a
`div` element. The zTemplate function is then called, passing in the
`div` and an object with a `foo` property set to `"bar"`.

Finally, the `z-var` attribute on the `div#test1` element is set to
`"foo event my-event"`. This means that the value of the "foo"
property will be passed as the detail parameter to a `"my-event"`
event triggered on the `div` element.

The `div#test2` element is similar, but the event is triggered with
additional arguments. The arguments are passed in
`event.detail.arguments` property of the event. You can use variable
references, expressions, or texts as arguments.

With this feature, you can add dynamic interactivity to your
templates, allowing users to respond to changes in data, toggle
display and visibility, and more.

You can of course use more complex expressions to control the event firing. For example:

    <div z-var="foo event my-event {foo == 'bar'}"></div>

In this case, the event will be fired only if the value of the `foo` variable is equal to `"bar"`.

Note that the callback arguments are enclosed in parentheses `(` and
`)`, while boolean expressions such as `CONDITION` are enclosed in
curly braces `{` and `}`.


### Custom Function Call

With Z Template, you can even trigger custom callbacks based on the
values of variables.

The list of callbacks is passed as a third argument to
`zTemplate` function as an object with function names as keys and
functions as values. Such list of callbacks is used only for the
current call to `zTemplate` function. The callbacks are not stored
anywhere and are not available for other calls to `zTemplate`. To add callbacks
to the global list, use the `zTemplate.callbacks.set(NAME, FUNCTION)` function.

The callback function is called with the following arguments:
- `element`: The element that triggered the callback.
- `detail`: The detail object. It contains two properties:
    - `data`: The data property holds the current value of the variables.
    - `value`: The value property contains the `VALUE` of the command.

Syntax:

    VALUE call CALLBACK_NAME [ CONDITION ]
    VALUE call CALLBACK_NAME(...ARGUMENTS) [ CONDITION ]

Syntax sugar:

    VALUE *CALLBACK_NAME [ CONDITION ]

Example:
    
        <script>
            function myCallback(element, detail) {
                console.log('CALLBACK', element, detail);
            }
            
            // Add permanent global callback
            zTemplate.callbacks.set('myCallback3', myCallback);
            
            zTemplate(
                document.querySelector('div'),
                {"foo": "bar", "baz": 23},
                {"myCallback": myCallback, "myCallback2": myCallback2}
            );
        </script>
        
        <div id="test1" z-var="foo call myCallback('some param')"></div>
        <div id="test2" z-var="foo call myCallback2 {baz == 23 && foo = 'bar'}"></div>
        <div id="test3" z-var="foo call myCallback3(foo, baz, 'Hello world!', baz == 23)"></div>

In the example above, the `myCallback2` will only be called if `baz`
is equal to `23` and `foo` is equal to `"bar"`. Both the element and
detail object will be passed to the function, giving you full control
over the HTML UI.

The `div#test3` element is similar, but the callback is called with
additional arguments. The arguments are passed in second argument of
the callback function. You can use variable references, expressions,
or text literals.

This feature opens up endless possibilities for you to enhance your
UI, providing even more flexibility and control over your data-driven
UI.

Note that the callback arguments are enclosed in parentheses `(` and
`)`, while boolean expressions such as `CONDITION` are enclosed in
curly braces `{` and `}`.

*💡 You can use this callback instead of `VALUE text` command to
implement various effects or apply special formatting when changing
the text content of an element. E.g.  `z-var="message call
animateText"`, where `animateText` is your custom function that
animates the text change.*

## Lists, Contexts, and Scopes

### Lists

Z Template supports lists and loops. You can use the
`template="[VAR_NAME]"` attribute to specify a list of items to be
rendered. The `VAR_NAME` is the name of the variable that contains the
list of items. The list can be an array or an object. 

If it is an object, it will be converted into an array of objects,
where each object has a `key` and `value` property.

If the array is a list of scalar values, it will be converted into an
array of objects, where each object has a `key` and `value` property,
where the `key` is the index of the item in the array and the `value`
is the value of the item.

The template will be repeated for each item in the list.

#### Simple Example

Example:

    <script>
        zTemplate(
            document.querySelector('ol),
            {"foo": ["bar", "baz", "qux"]}
        );
    </script>
    <ol>
        <template template="[foo]"><li z-var="value text"></li></template>
    </ol>

Result:

    <ol>
        <li>bar</li>
        <li>baz</li>
        <li>qux</li>
    </ol>

#### Advanced Example

Of course, you can use more complex lists containing objects:

    <script>
        zTemplate(
            document.querySelector('ol),
            {"foo": [{"bar": "baz"}, {"bar": "qux"}]}
        );
    </script>
    <ol>
        <template template="[foo]"><li z-var="bar text"></li></template>
    </ol>

Result:

    <ol>
        <li>baz</li>
        <li>qux</li>
    </ol>

#### Nested Lists

The lists can of course contain other lists so you can create
hierarchical lists:

    <script>
        zTemplate(
            document.querySelector('ol),
            {
                "foo": [
                    {"name": "item1", "bar": ["baz", "qux"]},
                    {"name": "item2", "bar": ["quux", "quuz"]},
                    {"name": "item3", "bar": []}
                ]
            }
        );
    </script>
    <ol>
        <template template="[foo]">
            <li>
                <b z-var="name text"></b>
                <ol z-var="!bar class hidden">
                    <template template="[bar]"><li z-var="value text"></li></template>
                </ol>
            </li>
        </template>
    </ol>

Result:

    <ol>
        <li>
            <b>item1</b>
            <ol>
                <li>baz</li>
                <li>qux</li>
            </ol>
        </li>
        <li>
            <b>item2</b>
            <ol>
                <li>quux</li>
                <li>quuz</li>
            </ol>
        </li>
        <li>
            <b>item3</b>
            <ol class="hidden"></ol>
        </li>
    </ol>

The z-var attribute on the inner ol element is set to `!bar class
hidden`, meaning that the `hidden` class will be added to the inner ol
element if the bar variable is an empty array. The `!` operator
inverts the [boolean value](#boolean) of `bar` (empty array evaluates to `false`)
so that the hidden class will be toggled *on* if `bar` is an empty
array. The same condition can be expressed with the `{bar == 0} class hidden`.

### Contexts

If you have complex JSON data with nested objects, you can use the
`template="{VAR_NAME}"` attribute to specify a context for the template.

The template will reapply the references object to the context, so you
can use the same references in the template as you would in the
top-level template.

Example:

    <script>
        zTemplate(
            document.querySelector('div'),
            {"foo": {"bar": "baz"}}
        );
    </script>
    <div>
        <template template="{foo}">
            <div z-var="bar text"></div>
        </template>
        Same as:
        <div z-var="foo.bar text"></div>
    </div>

### Scopes

Z Template supports scopes. You can use the `z-scope="NAME"`
attribute to specify a scope for the template.  This attribute
protects the template from being applied to other elements inside the
scope. The `NAME` is the name of the scope. Any name can be used,
except for special name `inherit` (`z-scope="inherit"`) that
behaves like no scope.

If you want to apply the template to the scope element you have to
apply data to the scope element directly or any of its children with a
separate call to `zTemplate`.

Example:

    <script>
        zTemplate(
            document.querySelector('div'),
            {"foo": "bar"}
        );
    </script>
    <ol>
        <li template-scope="my-scope">
            <div z-var="foo text"></div>
        </li>
        <li template-scope="inherit">
            <div z-var="foo text"></div>
        </li>
        <li>
            <div z-var="foo text"></div>
        </li>
    </ol>

Result:

    <ol>
        <li>
            <div></div>
        </li>
        <li>
            <div>bar</div>
        </li>
        <li>
            <div>bar</div>
        </li>
    </ol>

The attribute `z-scope-children` behaves like `z-scope`, with a
difference that it does not protect the element itself, but only its
children.

Note: The `z-scope-children` is equivalent to `template-scope`
attribute from the previous version 1.0. The current version is
backward compatible and supports both attributes.

## Typecasting

### Boolean

The value is converted to a boolean as follows:

* If the value is a `boolean`, it is returned as is.
* If the value is a `number`, it is converted to a boolean where 0 is false and all other numbers are true.
* If the value is a `string`, it is converted to a boolean where the empty string is false and all other strings are true.
* If the value is an `object`, it is converted to a boolean if the object has no properties.
* If the value is an `array`, it is converted to a boolean if the array has no elements.

Any value can be converted into boolean by enclosing it in curly braces or by prefixing it with "!!" symbols. Example: `{foo}`, `!!foo`.

### Values

The expressions convert values into scalar values before being evaluated. To convert more complex types following rules are used:

* If the value is a `plain object`, the count of properties is used.
* If the value is an `array`, the length of the array is used.

## CSS Tricks

### Disabling Default Animations

There are two default animations defined in `template.css`. Fade-in
animation for changed elements and slide-in animation for new list
elements. If you prefer to disable it, simply set the `--z-anim-speed`
CSS variable to `0` in either the HTML element or the CSS.

    <style>
        .my-list {
            --z-anim-speed: 0;
        }
    </style>
   
    <ol class="my-list" style="--z-anim-speed: 0">...</ol>

### Animating New List Items

Experience a smooth and seamless slide-in animation for new list items
by default with Z Template. Customize your animation to your heart's
desire. Simply apply it to the `*[template-clone]` selector in your
CSS. Here's an example:

    <style>
        .my-list *[template-clone] {
            animation: my-animation 1s;
        }
    </style>
   
    <ol class="my-list">...</ol>

### Animating Changed Elements

With Z Template, whenever an element's contents change as a result of
processing the z-var command, the element is assigned a new
incremental z-content-rev attribute that triggers the default fade-in
animation defined in template.css. 

This can easily be customized to fit your desired animation by using
the attribute `z-content-rev`.

Here's an example:

    <style>
        .my-list *[z-content-rev] {
            animation: my-animation 1s;
        }
    </style>
    
    <ol class="my-list">...</ol>

*Technical note*: The `z-content-rev` attribute is temporarily removed and
added back to the element, thereby prompting a change in the DOM and
restarting the animation on each content change.

### Other Animations

Unleash your creativity and add any desired animation to your
application with Z Template's [CSS class toggle](#toggle-css-class) or
[insert attribute](#insert-attribute) commands.  Here's how:

    <style>
        .animate-alert {
            animation: my-alert-animation 1s;
        }
    </style>
    
    <div z-var="{isNew && severity == 'danger'} class animate-alert">...</div>

Z Template values your design preferences and offers a flexible
platform, without imposing restrictive styling, so that you can design
your application exactly as you envision it.

## Choose Z Template Over Other Solutions

Confused by the multitude of templating solutions like Handlebars,
Mustache, EJS, Jade/Pug, Dust.js, Underscore.js, Nunjucks, Vue.js,
React.js, Angular.js, Ember.js, Backbone.js, JsRender, Ractive.js,
Marko, HyperHTMLELement, LitElement, Polymer, Svelte, Blaze.js,
DoT.js, Swig, Handlebars.js, Hogan.js, and more? 


Looking for a straightforward solution to transform your data into
HTML without any stress? Tired of worrying about updates that break
your code? Simplify your life with Z Template, a dependable and
self-sufficient templating engine that gets the job done and stays
put.

Z Template stands out from the crowd with its focus on a select number
of carefully crafted DOM manipulation features that meet all your
design requirements. We don't aim to be a jack-of-all-trades; instead,
our decades of experience in web development have taught us what you
need and what you don't, ensuring that we deliver only what truly
matters.  With 6 years of steady development and a laser-focus on
building HTML UI from JSON data, Z Template is the most stable and
feature-complete option for web developers.

With its steadfast use of W3C-endorsed techniques like DOM
manipulation and XPath, Z Template sets itself apart as a superior
solution for HTML/XML compatibility and security. Unlike other
templating options that rely on template-as-a-string manipulation, Z
Template's approach completely eliminates vulnerabilities like XSS,
ensuring top-notch security by design.

Our use of HTML 5 template tags and z-var attributes also provides a
clean and organized view in the browser, with templating instructions
remaining invisible until parsed and applied to data.

Our focus on DOM manipulation not only enhances security, but also
results in a faster and more efficient engine. With our specially
crafted COMMAND syntax, developers can easily create beautiful and
functional interfaces. Unlike other solutions that use generic
javascript syntax, our syntax was built specifically for HTML
manipulation, making it simpler and easier to understand.

The unique "z-var" attribute ensures maximum versatility and
durability, remaining intact during repeated application of templates
to the same element. Our syntax vocabulary and code have been crafted
to ensure that the Z Template engine can be effortlessly translated
into any language. Its JavaScript implementation is just one example
of its limitless possibilities, and it can be adapted to other
languages through transpilation.

Z Template has been battle-tested for over 6 years and has been
successfully implemented in numerous real-life projects. It is a
complete and ultimate solution for transforming data into HTML UI.

And the best part? Z Template is open-sourced under the MIT license,
meaning you can use it freely and without any hidden costs. It doesn't
depend on any external dependencies, ensuring that it won't break due
to updates or changes in other libraries. Our solution uses only fully
supported and widely-accepted W3C standards, making it a stable and
future-proof choice that will never become outdated.
 
## Shape The Future of Z Template

We are always working to improve Z Template and add new features to
make it even more powerful. Here are some ideas we thought of, but we
would love to hear your suggestions for additional features. Please
let us know what you think and what you would like to see in future.

- [ ] Utilizing attribute references in the same manner as
      variables, such as `z-var="@foo text {@title == ''}"` which
      inserts the content of the `foo` attribute into the text based
      on attriubte `title` value, is there any practical use for this?

## Final Notes
- Z Template ➋ is fully compatible with previous versions.
- All examples are simplified. In real life, the example results may contain special attributes, classes, and `<template>` tags that were not mentioned for the sake of simplicity.
- All contributions are welcome. Please submit a pull request or open an issue.
- Should any part of this documentation be unclear, please open an issue with a clarification request or suggestion.


