/**
 * JQUERY DNA TEMPLATE
 * https://github.com/webdevelopers-eu/jquery-template
 *
 * author Daniel Sevcik <sevcik@webdevelopers.cz>
 * copyright 2016 Daniel Sevcik
 * since 2016-07-11 08:57:48 UTC
 *
 * Replace variables according to rules specified in @z-var
 * attribute. Optionaly clone the element before replacing variables.
 * Removes attribute 'template'.
 *
 * $(templ).template(VARS);
 *
 * VARS - object or array of objects or multidimensional object
 *
 * Syntax:
 * <ELEMENT z-var="[!]VAR_NAME (@ATTR|.|!|?|.CLASS), ..." ...>...</ELEMENT
 * <ELEMENT template-scope="inherit|TEMPLATE_SCOPE" ...>...</ELEMENT>
 * <ELEMENT template="TMPL_NAME" ...>...</ELEMENT>
 * <ELEMENT template="[ITERATE_VAR_NAME]" ...>...</ELEMENT>
 * <ELEMENT template="{OBJECT_VAR_NAME}" ...>...</ELEMENT>
 *
 * The HTML <template template="..."> element is supported as well.
 *
 * Note: For debugging purposes the VAR_NAME "debugger" will start
 * Javascript debugging at that point.
 *
 * VAR_NAME - variable name
 * !VAR_NAME - if prefixed by '!' then the boolean NOT is applied on variable. E.g. z-var="!isPaid !" => remove element if element is NOT paid (isPaid=false)
 * @ATTR - attribute name e.g. '@title'
 * .CLASS[.CLASS[...]] - add this class name if variable evaluates to TRUE, remove it if FALSE
 * :EVENT - fire the DOM event EVENT on the element.
 * "." - insert as text content of the current element (overwrites child nodes)
 * "+" - insert as HTML content of the current element (overwrites child nodes)
 * "!" - remove whole element if the VAR_NAME evaluates to FALSE
 * "?" - hide the element if the VAR_NAME evaluates to FALSE and show it if it evaluates to TRUE
 * "=" - set the value as the form field's value (using jQuery's .val())
 *
 * TMPL_NAME - all elements with 'template' attriube are hidden by default.
 * ITERATE_VAR_NAME - recursive iteration of an array. The variable value will be recursively re-applied to this element.
 * OBJECT_VAR_NAME - property that is of type object will be applied to this element alone. You can use properties from this object inside that element.
 * TEMPLATE_SCOPE - protect nested elements with @template-scope attribute from modification unless @template-scope explicitly contains keyword "inherit".
 *
 * Variable is evaluated to false if it is equal to 0 (numeric) or "0" or "0.00"...
 * (string) or empty Object or Array or anything else that evaluates
 * to false in javascript.
 *
 * If element is plain array then the text representation is its length. Example:
 * $('<span z-var="list ."></span>').template({"list": [10, 20]}); // will output <span>2</span>
 *
 * If the element that template is called on has an attribute 'template' then prior to replacement the element
 *
 *  - is cloned and reinserted before original element
 *  - 'template' attribute is removed
 *  - .template-clone CSS class is added to it
 *  - and the cloned element is returned from $.template() in the element set instead of the original element
 *
 * To override cloning/in-place replacement use boolean as the second argument to $.template(obj, bool)
 *
 *  - true: in-place replacement / no-cloning
 *  - false: clone
 *  - undefined: clone '*[template]' elements only, otherwise use in-place variable replacement
 *
 * Examples:
 * <a z-var="url @href, name ."></a>
 * <b z-var="name"></b>
 *
 * $(el).template({'url': '://example.com', 'name': 'Example'});
 *
 * Using variables:
 * <a z-var="url @href, name ." href="mailto:${url}"></a>
 * <b z-var="name">My name is ${name}</b>
 *
 * $(el).template({'url': '://example.com', 'name': 'Example'});
 *
 * Using subtemplates:
 *
 * If the variable is a plain array of scalar values then the scalar
 * values are treated as variables 'value'.
 *
 * <div>
 *    <a z-var="url @href, name ." href="mailto:${url}"></a>
 *    <ul z-var="list ?">
 *      <li template="[list]" z-var="value ."></li>
 *    </ul>
 * </div>
 *
 * $(el).template({
 *      'url': '://example.com',
 *      'name': 'Example',
 *      'list': [11, 22, 33]
 * });
 *
 * The variable can be array of variable objects
 *
 * <div>
 *    <a z-var="url @href, name ." href="mailto:${url}"></a>
 *    <ul z-var="list ?">
 *      <li template="[list]" z-var="label ., tip @title"></li>
 *    </ul>
 * </div>
 *
 * $(el).template({
 *      'url': '://example.com',
 *      'name': 'Example',
 *      'list': [
 *              {'label': 'test1', 'tip': 'help1'},
 *              {'label': 'test2', 'tip': 'help2'}
 *      ]
 * });
 *
 * Or just a variable object (in that case template is cloned only once).
 *
 * <div>
 *    <a z-var="url @href, name ." href="mailto:${url}"></a>
 *    <ul z-var="list ?">
 *      <li template="[list]" z-var="label ., tip @title"></li>
 *    </ul>
 * </div>
 *
 * $(el).template({
 *      'url': '://example.com',
 *      'name': 'Example',
 *      'list': {'label': 'test1', 'tip': 'help1'}
 * });
 *
 * @param {object} vars associated name=>value pairs
 * @param {bool} inPlace do not clone the tmeplate, work directly on it or undefined for 'auto' - clone only if the element is *[template] otherwise work inplace.
 * @return {jQuery} newly created elements based on respective templates.
 */
$.fn.template = function(vars, inPlace) {

    var $ret = $();
    $(this).add($ret).trigger('template:before', [vars, this, $ret, inPlace]);

    if ($.isArray(vars)) {
	for (var i = 0; i < vars.length; i++) {
	    $ret.add($(this).template(vars[i], inPlace));
	}
    } else {
	this.each(function() {
	    var $this = $(this);
	    var noClone = typeof inPlace == 'boolean' ? inPlace : !$this.is('[template]');
	    var $subject = noClone ? $this : clone($this).addClass('template-clone').attr('template-clone', $this.attr('template')).insertBefore(this);
	    var $item = replaceVars(vars, $subject).removeAttr('template');
	    $ret = $ret.add($item);
	});
    }

    $(this).add($ret).trigger('template:after', [vars, this, $ret, inPlace]);
    return $ret;

    function replaceVars(vars, $context) {
	if (typeof vars != 'object') {
	    console.log('replaceVars: Cannot replace variables inside the context', vars, $context);
	    throw new Error('Cannot replace HTML variables.');
	}

	function replaceText(original, name, val) {
	    var ret;

	    // links has "%24%7BVAR_NAME%7D" escaped @href attr
	    if (typeof original == 'string' && original.match('(\\$\\{|%24%7B)' + name + '(\\}|%7D)')) {
		ret = original
		    .replace(new RegExp('\\$\\{' + name + '\\}', 'g'), val)
		    .replace(new RegExp('%24%7B' + name + '%7D', 'g'), val);
	    } else {
		ret = val;
	    }
	    // console.log(ret, arguments);
	    return ret;
	}

	function getOriginalText($el, currentText, target, restored) {
	    if (restored[target]) return currentText; // already done
	    restored[target] = true;

	    var originalText = $el.data('template:' + target);

	    if (typeof originalText == 'string') {
		return originalText;
	    } else {
		$el.data('template:' + target, currentText); // never saved before - save it
		return currentText;
	    }
	}

	var $subtemplDeep = $context
		.find('*[template^="["] *[template^="["], *[template^="{"] *[template^="["], *[template^="["] *[template^="{"], *[template^="{"] *[template^="{"]');

	var $subtempl = $context
		.find('*[template^="["], *[template^="{"]')
		.not($subtemplDeep);

	var cssSelect = $.map(vars, function(val, name) {
	    return '*[z-var*="' + name + ' "]';
	}).join(', ');

	$context
	    .find(cssSelect)
	    .not($subtempl.find(cssSelect).add($subtempl)) // Not subtemplates @template="[...]"
	    .add($context.filter(cssSelect))
	    .not($context.find('*[template-scope]:not([template-scope~="inherit"]) *[z-var]')) // Not elements having @template-scope and their contexts
	    .each(function(k, el) {
		var restored = {};
		var show = null; // one hide is enough - "hide" has higher priority then "show"
		var events = [];
		var processedClass = {};

		var $this = $(el);
		var pairs = $.trim($this.attr('z-var')).split(',');

		// $.each(vars, function(name, val) {
		for (let idx = 0; idx < pairs.length; idx++) {
		    let mappings = $.trim(pairs[idx]).split(/\s+/);
		    if (mappings[0] == "debugger") {
			debugger;
			continue;
		    }

		    let negate, name;
		    if (mappings[0].substr(0, 1) == '!') {
			name = mappings[0].substr(1);
			negate = true;
		    } else {
			name = mappings[0];
			negate = false;
		    }
		    let val = vars[name];
		    if (typeof val == undefined) continue;

		    let target = mappings[1] || '.';
		    let boolVal = !(typeof val == 'object' && $.isEmptyObject(val)) && !($.isNumeric(val) && !parseFloat(val)) && val;
		    boolVal = negate ? !boolVal : !!boolVal;
		    let textVal=$.type(val).match(/string|number/) ? val : '';

		    if ($.isArray(val)) { // To be able to count number of results: <span z-var="list .">Found ${list} records</span>
			textVal = val.length;
		    }

		    if (target == '?') {
			show = (show === null ? true : show) && boolVal;
		    } else if (target == '!') {
			if (!boolVal) $this.remove();
		    } else if (target == '.') {
			$this.text(replaceText(getOriginalText($this, $this.text(), target, restored), name, textVal));
		    } else if (target == '+') {
			// $this.html(val); // this does more then innerHTML... it kills events attached to parent node (wx="editor" problem)
			// $this.get(0).innerHTML=val;// - this does something else though :-( kills XML/html
			$this.get(0).innerHTML=$('<div></div>').html(val).html(); // workround - embed in other HTML let jQuery parse it and then use HTML.
		    } else if (target == '=') {
			if ($this.is(':checkbox, :radio')) {
			    $this.prop('checked', !$.type(val).match(/string|number/) ? boolVal : $this.val() == textVal);
			} else {
			    $this.val(val);
			}
		    } else if (target.substr(0, 1) == ':') { // trigger event
			if (boolVal) {
			    // trigger events after we are all done with this (and element is finally hid/shown)
			    events.push(target.substr(1));
			}
		    } else if (target.substr(0, 1) == '.') { // add/remove class name
			let classNames = target.substr(1).replace('.', ' ');
			if (boolVal) {
			    processedClass[target] = true;
			    $this.addClass(classNames);
			} else if (!processedClass[target]) {
			    processedClass[target] = true;
			    $this.removeClass(classNames);
			}
		    } else if (target.substr(0, 1) == '@') {
			if ($.type(val) == 'boolean') { // if true set attr val with the same name. E.g. selected="selected" otherwise remove attr.
			    $this.attr(target.substr(1), boolVal ? target.substr(1) : null);
			} else {
			    $this.attr(target.substr(1), replaceText(getOriginalText($this, $this.attr(target.substr(1)), target, restored), name, textVal));
			}
		    } else {
			console.log('Error: replaceVars(): invalid target "' + target + '" for variable "' + name + '" in "' + $this.attr('z-var') + '"');
		    }
		}

		// Show/hide once
		if (show !== null) {
		    $(el)
			.toggleClass('dna-template-visible', show)
			.toggleClass('dna-template-hidden', !show);
		    if (show) { // we go with css class, because determining the needed "display" CSS property is problematic
			if (el.style.display == 'none') {
			    $(el).css('display', '');
			}
		    }
		}

		// Trigger events
		events.forEach(function(ev) {
		    $this.trigger(ev, [vars]);
		});
	    });

	// Subtemplates
	$subtempl
	    .each(function() {
		var $this = $(this);
		var templateValue = $this.attr('template');
		var matches = templateValue.match(/^([{\[])(.*)[\]}]$/);
		var isObject = matches[1] == "{";
		var propName = matches[2];
		var subVars = vars[propName];

		if (typeof subVars == 'undefined' || subVars === null) return; // do not deal with subtemplates of this type

		// Remove clones
		$this
		    .prevUntil(':not([template-clone="' + templateValue + '"])', '[template-clone="' + templateValue + '"]') /* only previous siblings as there can be multiple template="[abc]" elements with the same subelent so we need to know whose what */
		    .filter(function() {return $(this).attr('template-clone') == $this.attr('template');})
		    .remove();

		if (isObject) {
		    if ($.type(subVars) != 'object') {
			subVars = {"value": subVars};
		    }
		    $this.template(subVars, false);
		} else {
		    if ($.isEmptyObject(subVars)) {
			subVars=[]; // may be empty {}
		    }

		    switch ($.type(subVars)) {
		    case 'string':
		    case 'number':
		    case 'bool':
		    case 'object':
			subVars = [subVars];
			// break;
		    case 'array':
			$.each(subVars, function(k, v) {
			    $this.template($.isPlainObject(v) ? v : {'value': v});
			});
			break;
		    }
		}
	    });

	return $context;
    };

    function clone($el) {
	if ($el.is('template')) {
	    return $el.contents('*').clone();
	} else {
	    return $el.clone();
	}
    }
};
