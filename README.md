__jQuery DNA Template__

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

<!-- markdown-toc start - Don't edit this section. Run M-x markdown-toc-generate-toc again -->
**Table of Contents**

- [Features](#features)
- [Quick Introduction](#quick-introduction)
- [Interactive Examples](#interactive-examples)
- [Syntax](#syntax)
	- [Javacript](#javacript)
	- [HTML](#html)
- [More](#more)

<!-- markdown-toc end -->


# Features
Introducing a cutting-edge features that takes UI development to the
next level. With our library, you'll have access to:

- [x] The ability to apply templates multiple times to the same element to update the UI with changed values
- [x] Support for adding/removing classes conditionally (e.g. add this class if value is true)
- [x] Conditional attributes (e.g. check the check-box if value is true)
- [x] Conditional hiding/showing/removal of elements based on values
- [x] Conditional triggering of Javascript events on any element (e.g. focus/scroll, not available in PHP implementation)
- [x] Nested templates with for-each-like behavior (recursive templates supported)
- [x] Super lightweight
- [x] A PHP class to process the HTML in PHP the same way as in javascript
- [x] And much more! With our library, you'll be able to create beautiful, functional interfaces with ease. Try it out today and see the difference it can make in your development process!

# Quick Introduction

To get started, simply include our provided javascript and CSS file on your page.

Example: Replace `…` with the real path pointing to your files.

```HTML
<!doctype html>
<html>
	<head>
		<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>

		<link rel="stylesheet" type="text/css" href="…/template.css"/>
		<script src="…/jquery.template.min.js"></script>
	</head>
	<body>

	</body>
</html>
```

To use the templating library, add the `z-var="{{PROPERTY}}
{{TARGET/ACTION}}"` attribute to any element in your HTML. Then call
`$(element).template(...)` on that element or any parent element. The
z-var attribute holds instructions, separated by commas, specifying
what should be replaced and where, or what action should be taken.

The TARGET/ACTION is usually `.` (dot) to insert the value as text in
the element or `@ATTR_NAME` to insert a variable into an attribute. It's
simple and easy to understand, as you'll see in the examples below or
in the syntax section.

Let's see how the library works in a real-world scenario. In the
examples below, we pass a complex data object to the template. The
values in the object will be inserted in various points defined by
`z-var` in the HTML.

Here is the javascript code with variables to apply the template:

```javascript
$('.target').template({
	'name': 'John Smith',
	'validated': true,
	'list': ['aa', 'bb'],
	'listExt': [
		{'first': 'John', 'last': 'Doe', 'validated': true},
		{'first': 'Jane', 'last': 'Smith', 'validated': false}
	],
	'propObj': {
		'first': 'Baby',
		'last': 'Doe'
	}
});
```

Now the examples that we apply the code to.

**Example:**
```HTML
<div class="target" z-var="name ., validated .lock-icon"></div>
<input class="target" type="checkbox" z-var="validated @checked"/><label>Checked</label>
```
Result:
```HTML
<div class="target lock-icon" z-var="name ., validated .lock-icon">John Smith</div>
<input class="target" type="checkbox" z-var="validated @checked" checked="checked"/><label>Checked</label>
```
Explanation:
- "`name .`" - add value `name` as the text value
- "`validated .lock-icon`" - add class `lock-icon` if `validated` is true
- "`validated @checked`" - add `checked="checked"` attribute if true

[Try it now!](https://codepen.io/webdevelopers/pen/NaezoB)

**Example:**
```HTML
<div class="target" z-var="validated ?">Validated</div>
<div class="target" z-var="!validated ?">Not Validated</div>
<div class="target" z-var="!validated !">Insecure</div>
```
Result:
```HTML
<div class="target" z-var="validated ?">Validated</div>
<div class="target" z-var="!validated ?" style="display: none;">Not Validated</div>
```
Explanation:
- "`validated ?`" - show element if `validated` is true, hide otherwise
- "`!validated ?`" - the oposite of above - hide if true, show if false
- "`!validated !`" - remove (destructive) the element if `validated` is false

[Try it now!](https://codepen.io/webdevelopers/pen/JrwZqX)

**Example:**
```HTML
<div class="target" z-var="name .">My name is ${name}</div>
```
Result:
```HTML
<div class="target" z-var="name .">My name is John Smith</div>
```
Explanation:
- "`name .`" - add value of `name` in place of `${name}` placeholder

[Try it now!](https://codepen.io/webdevelopers/pen/OxrEYv)

**Example:**
```HTML
<ul class="target">
  <li template="[list]" z-var="value ."></li>
</ul>
```
Result:
```HTML
<ul class="target">
  <li z-var="value ." class="template-clone" template-clone="[list]">aa</li>
  <li z-var="value ." class="template-clone" template-clone="[list]">bb</li>
  <li template="[list]" z-var="value ."></li><!-- invisible -->
</ul>
```
Explanation:

Duplicate the element with `template="[list]"` attribute for each value inside `list` array and
- `value .` insert the array value as plain text into the element
- All elements with an attribute `template` are automatically hidden by `template.css` you've included on the page (see [above](#quick-introduction))

[Try it now!](https://codepen.io/webdevelopers/pen/dVwKBN)

**Example:**
```HTML
<ul class="target">
  <li template="[listExt]" z-var="first ., last ., last @title">${first} ${last}</li>
</ul>
```
Result:
```HTML
<ul class="target">
  <li z-var="first ., last ., last @title" class="template-clone" template-clone="[listExt]" title="Doe">John Doe</li>
  <li z-var="first ., last ., last @title" class="template-clone" template-clone="[listExt]" title="Smith">Jane Smith</li>
  <li template="[listExt]" z-var="first ., last ., last @title">${first} ${last}</li><!-- invisible -->
</ul>
```
Explanation:

Duplicate the element with `template="[listExt]"` attribute for each
value inside `listExt` array and use respective value object to insert
variables into duplicated element as follows
- "`first ., last .`" - add first and last name as text in positions indicated by `${PROP_NAME}` placeolders
- "`last @title`" - add last name into `title` attribute

**Example:**
```HTML
<ul class="target">
  <li template="{listExt}" z-var="first ., last .">${first} ${last}</li>
</ul>
```
Result:
```HTML
<ul class="target">
  <li z-var="first ., last ., last @title" class="template-clone" template-clone="[listExt]" title="Doe">Baby Doe</li>
  <li template="{listExt}" z-var="first ., last .">${first} ${last}</li><!-- invisible -->
</ul>
```
Explanation:

Duplicate the element with `template="{propObj}"` and use `propObj`
to apply templates recursively to cloned element. It behaves as if you called
`$('*[template="{propObj}"]').template(data.propObj, true);`
- "`first ., last .`" - add first and last name as text in positions indicated by `${PROP_NAME}` placeolders
- "`last @title`" - add last name into `title` attribute

[Try it now!](https://codepen.io/webdevelopers/pen/MEZBWN)


# Interactive Examples

The best example is the one you can play with.

- [Basic example](https://codepen.io/webdevelopers/pen/PpVGde?editors=1010#0) - insert variable into attribute and text
- [Simple list example](https://codepen.io/webdevelopers/pen/PpVZOQ?editors=1010#0) - iterate through the array and generate list
- [Simple Paging](https://codepen.io/webdevelopers/pen/XePggZ?editors=1010) - simple list with paging
- [Mixed list example](https://codepen.io/webdevelopers/pen/jBdMXR?editors=1010#0) - simple variables with nested array to generate list
- [Form example](https://codepen.io/webdevelopers/pen/XMOjGm?editors=1010#0) - toggle check-boxes, set values on select-boxes, change button labels and classes...
- [UI Updates](https://codepen.io/webdevelopers/pen/jBdyVm?editors=1010#0) - example of continuous live UI updates

# Syntax

## Javacript
```javascript
 $(SELECTOR).template(DATASET [, IN_PLACE]);
```

- __`DATASET`__ - Object or Array of Objects or Object with nested Arrays or Objects with properties and their values to be used when resolving `z-var` attributes.
- __`IN_PLACE`__ - boolean value. `true`: don't clone the element prior to replacing variables, `false`: clone the element, `undefined`: clone if element has the attribute `template` otherwise replace vars in-place without cloning.

## HTML

```html
	<element z-var="[!]DATASET_PROPERTY (TARGET|ACTION)[, ...]">...</element>
```

- __`DATASET_PROPERTY`__ - property name on the object passed to `$(selector).template(DATASET)` method.
- __`TARGET`__ - use following notation
	* `.` - to insert value as TextNode,
	* `@ATTR_NAME` to insert value into attribute (Note: If `DATASET_PROPERTY` si `true` then attribute's value will be same as attribute's name, e.g. `checked="checked"` for `z-var="isChecked @checked"` if `isChecked = true`.)
	* `+` - load serialized HTML text in variable as child HTML,
	* `=` - set variable's value as form field's value. If the field is a check-box or radio-box then (un)check it if value is boolean otherwise check it only if value equals to input's `value` attribute.
- __`ACTION`__ - following actions are available
	* `?` - hide element if value is false,
	* `!` - remove element if value is false (note: this is destructive action - you cannot re-apply new dataset again with the same effect),
	* `.CLASS_NAME` - add/remove class if value is true/false.
	* `:EVENT_NAME` - fire the DOM event `EVENT_NAME` on the element. E.g. `value :change` or `visible :scroll-into-view, !visible :hidden`. You have to implement your Javascript listeners on custom events (for example `$(el).on('scroll-into-view', function(ev, vars) {this.scrollIntoView();})` event).
- __`!`__ - "not" - negates the `DATASET_PROPERTY` value for the purpose of evaluation what `ACTION` should be taken.

To determine if `ACTION` should be taken `DATASET_PROPERTY` is converted into boolean `true` or `false`. Following values are considered `false`:
* an empty `Array`
* an empty `Object`
* number `0`
* string representing numeric value zero (e.g. `"0.00"`)
* boolean `false`
* `null`
* empty string

If you try to insert the plain Array object as text or value then its length gets inserted instead. You can use it to insert item counts.

```html
	<element template="(NAME|[PROPERTY]|{PROPERTY})">...</element>
```

- __`NAME`__ - any name of your choice. All elements having attribute `template` are hidden by default (make sure to include the ```template.css```). Applying template to such element will clone it, remove the `template` attribute and then apply the dataset. See [Simple list example](https://codepen.io/webdevelopers/pen/PpVZOQ?editors=1010#0).
- __`[PROPERTY]`__ - name of the property on `DATASET` object that holds nested Array or Object to be automatically applied to this template. See [Mixed list example](https://codepen.io/webdevelopers/pen/jBdMXR?editors=1010#0).
- __`{PROPERTY}`__ - name of the property that contains an object. Take this object and apply variables into it to this element.


```html
	<element template-scope>...</element>
	<element template-scope="my-name">...</element>
	<element template-scope="inherit">...</element>
```

- __`template-scope`__ - protect children of an element with attribute `template-scope` from being modified by template applied to such element's ancestor. DNA Template will ignore any `z-var` attributes on elements inside element with `template-scope` attribute.

The value of this attribute can be any keyword or even empty. Although if the keyword is `inherit` then templates will behave as there was no @template-scope attribute at all.

## PHP

```php
require('template.php');

$template=file_get_contents('test.html');

$dnaTemplate=new DNA\Template($template, array(
    'title' => 'Hello World',
    'content' => 'This is a test',
    'bad' => true,
));

echo $dnaTemplate->render()->saveXML();
```

# More

For more advanced examples and explanations see file
<code>tutorial/index.html</code> or just drop me a message what part
is unclear and I will update this documentation...
