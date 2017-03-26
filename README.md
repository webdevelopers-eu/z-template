__Lazy Template__

*Incredibly simple and yet powerful javascript templating system written by a lazy programmer so he can stay lazy and yet be able to effortlessly build and manage UIs.*

<!-- markdown-toc start - Don't edit this section. Run M-x markdown-toc-generate-toc again -->
**Table of Contents**

- [Features](#features)
- [Audience](#audience)
- [Syntax](#syntax)
- [Example](#example)

<!-- markdown-toc end -->


# Features
- [x] Supports nested templates with for-each-like behavior
- [x] You can apply template multiple times to the same element to update UI with changed values
- [x] Support for conditional classes
- [x] Support for conditional attributes (e.g. check check-box if value is true)
- [x] Support for conditional hidding/showing/removal of elements
- [x] Super lightweight with only 2.5kB of compressed Javascript
- [x] And more...

# Audience

It is meant for programmers dynamically building UIs on front end
using AJAX and static HTML templates.  You can keep your code clean
while allowing designers to edit HTML templates without breaking your
Javascript. Allows easy maintenance and updates of UIs.

# Syntax

```javascript
 $(SELECTOR).template(VARIABLES [, IN_PLACE]);
```

- __`VARIABLES`__ - Object or array of Objects with properties and their values to be used when resolving `z-var` attributes.
- __`IN_PLACE`__ - boolean value. `true`: don't clone the element prior to replacing variables, `false`: clone the element, `undefined`: clone if element has the attribute `template` otherwise replace vars in-place without cloning.


```html
    <element z-var="[!]VAR_NAME (TARGET|ACTION)[, ...]">...</element>

    <element template="(NAME|[PROPERTY])">...</element>
```

- __`VAR_NAME`__ - variable Object's property name
- __`TARGET`__ - `.` - to insert value as TextNode, `@ATTR_NAME` to insert value into attribute, `+` - load serialized HTML text in variable as child HTML, `=` - set variable's value as form field's value.
- __`ACTION`__ - `?` - hide element if value is false, `!` - remove element if value is false, `.CLASS_NAME` - add/remove class if value is true/false.
- __`!`__ - "not" - negates the value for the purpose of evaluation what `ACTION` should be taken.


# Example

Original HTML.

```html
<div id="example">
  <div>
      Visit <a z-var="url @href, name ., name @title" title="Home of ${name}"></a>
  </div>
  <small z-var="url ., name .">
      The code above inserts "${url}" into "href" attribute,
      name into sentence in "title" attribute and
      "${name}" as plain text of the link.
  </small>
</div>
```

Applying template.

```javascript
$("#example").template({
    'url': 'http://example.com',
    'name': 'Example Co.'
});
```

Resulting HTML.

```html
<div id="example">
  <div>
      Visit
      <a z-var="url @href, name ., name @title" title="Home of Example Co." href="http://example.com">
        Example Co.
      </a>
  </div>
  <small z-var="url ., name .">
      The code above inserts "http://example.com" into "href" attribute,
      name into sentence in "title" attribute and
      "Example Co." as plain text of the link.
  </small>
</div>
```

Other usage examples.

```html
<div id="example">
  <a href="mailto:${email}" z-var="email @href, email .">Insert "${email}" into "href" and this text.</a>
  <div><input type="checkbox" z-var="action @checked"> Checked if "action" is true</div>
  <div><input type="checkbox" z-var="!action @checked"> Checked if "action" is NOT true</div>
  <div><input type="checkbox" z-var="action @disabled"> Disabled if "action" is true</div>
  <div z-var="action .error">Gains CSS class "error" if "action" is true</div>
  <div z-var="action ?">Show if "action" is true otherwise hide</div>
  <div z-var="action !">Show if "action" is true otherwise remove</div>
  <div z-var="!action ?">Show if "action" is NOT true otherwise hide</div>
  <div z-var="!action !">Show if "action" is NOT true otherwise remove</div>
  <div><input z-var="phone =" /> Insert "phone" variable as value.</div>
</div>
```

For more advanced examples and explanations see file <code>tutorial/index.html</code>.
