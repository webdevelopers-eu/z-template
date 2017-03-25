# jQuery Template
Incredibly simple and yet powerful javascript templating system written by a lazy programmer so he can stay lazy and yet be able to effortlessly build and manage UIs.

## Features
- [x] Supports nested templates
- [x] You can apply template multiple times to update only some values
- [x] Support for conditional classes
- [x] Support for conditional attributes (e.g. check checkbox if value is true)
- [x] Support for conditional inserting values into strings in both attributes and text contents

## Example

Original HTML.

```html
<div id="example">
  <b z-var="date ."></b>
  <ul>
    <li template="[people]">
      <a href="mailto:${email}" z-var="email @href, name ."></a>
    </li>
  </ul>
  <ul>
    <li template="[numbers]" z-var="value ."></li>
  </ul>
</div>
```

Applying template.

```javascript
$("#example").template({
    'date': new Date,
    'people': [
      {'name': 'John Doe', 'email': 'doe@example.com'},
      {'name': 'Jane Roe', 'email': 'jane@example.com'},
      {'name': 'Mary Major', 'email': 'mary@example.com'}
    ],
    'numbers': [23423, 9841, 20]
});
```

Resulting HTML.

```html
<div id="example">
  <b z-var="date .">Sat Mar 25 2017 19:01:56 GMT+0100 (CET)</b>
  <ul>
    <li class="template-clone" template-clone="[people]">
      <a href="mailto:doe@example.com" z-var="email @href, name .">John Doe</a>
    </li>
    <li class="template-clone" template-clone="[people]">
      <a href="mailto:jane@example.com" z-var="email @href, name .">Jane Roe</a>
    </li>
    <li class="template-clone" template-clone="[people]">
      <a href="mailto:mary@example.com" z-var="email @href, name .">Mary Major</a>
    </li>
    <li template="[people]">
      <a href="mailto:${email}" z-var="email @href, name ."></a>
    </li>
  </ul>
  <ul>
    <li z-var="value ." class="template-clone" template-clone="[numbers]">23423</li>
    <li z-var="value ." class="template-clone" template-clone="[numbers]">9841</li>
    <li z-var="value ." class="template-clone" template-clone="[numbers]">20</li>
    <li template="[numbers]" z-var="value ."></li>
  </ul>
</div>
```

For more examples and explanations see file <code>tutorial/index.html</code>.
