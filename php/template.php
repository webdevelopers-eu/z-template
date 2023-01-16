<?php
namespace DNA;
use \DOMDocument;
use \DOMXPath;
use \DOMElement;
use \DOMText;
use \DOMAttr;
use \Exception;

/**
 * PHP re-implamentation of jquery.template.php
 *
 * See https://github.com/webdevelopers-eu/jquery-dna-template
 *
 * Usage example:
 *
 * test.html content:
 * <html xmlns="http://www.w3.org/1999/xhtml" xmlns:z="http://www.zolinga.net/parser">
 *     <head>
 * 	      <title z-var="title . "></title>
 *     </head>
 *     <body>
 *       <h1 z-var="content .">Test</h1>
 *     </body>
 * </html>
 * 
 * $template = file_get_contents('test.html');
 * $data = array(
 *   'title' => 'Hello World',
 *   'content' => 'This is a test'
 * );
 * $dnaTemplate=new DNA\Template($template);
 * echo $dnaTemplate->render($data)->saveHTML();
 *
 * There is also procedural wrapper so you can use \DNA\template($template, $data) instead of new (new \DNA\Template($template, $data))->render();
 *
 * You can revert the changes
 *
 * $dnaTemplate->render($data);
 * $dnaTemplate->revert();
 * $dnaTemplate->clean();
 * echo $dnaTemplate->result->saveHTML();
 *
 * @module     DNATemplate
 * @author     Daniel Sevcik <sevcik@webdevelopers.cz>
 * @copyright  2023 Daniel Sevcik
 * @since      2023-01-16 07:20:54 UTC
 * @access     public
 */
class Template {
    /**
     * @var mixed DOMDocument or string with a template passed to a constructor
     */
    protected $template;

    /**
     * @var array Variables passed to a constructor
     */
    protected $data;

    /**
     * @var DOMElement the scope to limit replacements to.
     */
    protected $scope;

    /**
     * @var DOMDocument with processed content
     */
    protected $dom;

    /**
     * @var DOMXpath
     */
    protected $xpath;

    /**
     * @var DOMElement or DOMDocument to be returned.
     */
    private $result;

    /**
     * @var int random number to be used as a suffix for temporary attributes
     */
    private $scopeIdx;

    /**
     * Constructor
     *
     * @param mixed $template DOMDocument or DOMElement or string with template containing "z-var" attributes to be replaced. Note: if DOMDocument is passed, it will be modified.
     */
    public function __construct($template) {
        $this->template = $template;
        $this->scopeIdx = rand(100000000, 999999999); // init random number to be used as a scope id
        
        if ($template instanceof DOMDocument) {
            $this->dom = $template;
            $this->scope = $template->documentElement;
            $this->result = $template;
        } elseif ($template instanceof DOMElement) {
            $this->dom = $template->ownerDocument;
            $this->scope = $template;
            $this->result = $template;
        } else {
            $this->dom = new DOMDocument();
            $this->dom->loadHTML($template);
            $this->scope = $this->dom->documentElement;
            $this->result = $this->dom;
        }
        $this->xpath = new DOMXPath($this->dom);
    }

    /**
     * Render template.
     *
     * @param array $data Array of data to be used for replacing "z-var" attributes
     * @param bool $clean If true, the template will be cleaned of "z-var" attributes after rendering. Warning: You won't be able to call $template->render() with new data on the same object.
     * @return mixed if DOMDocument or DOMElement was passed to constructor then the same modified object will be returned, otherwise new DOMDocument will be returned if $template was string.
     */
    public function render($data, $clean = false) {
        $this->data = $data;
        $this->revert();

        $ctxAttr='data-template-scope-'.$this->scopeIdx++;
        $q="descendant-or-self::*[@z-var]
            [not(
                ancestor-or-self::*[(@template-scope and @template-scope != 'inherit') or starts-with(@template, '[') or starts-with(@template, '{')]
                    [not(descendant-or-self::*[@$ctxAttr])]
            )]";

        $this->scope->setAttribute($ctxAttr, '1'); // helper to limit replacements to the scope
        $elements = $this->xpath->query($q, $this->scope);

        foreach ($elements as $element) {
            $zVar = $element->getAttribute('z-var');
            $this->processElement($element, $zVar);
        }

        $templates = $this->xpath->query("descendant-or-self::*[starts-with(@template, '[') or starts-with(@template, '{')]", $this->scope);

        $this->scope->removeAttribute($ctxAttr);

        foreach ($templates as $template) {
            $this->processTemplate($template);
        }

        if ($clean) {
            $this->clean();
        }

        return $this->result;
    }

    /**
     * Undo all changes made by previous call to $this->render() method.
     */
    public function revert() {
        foreach ($this->xpath->query("descendant::*[@template-clone]", $this->scope) as $element) {
            $element->parentNode->removeChild($element);
        }
        foreach ($this->xpath->query("descendant-or-self::*/@*[starts-with(local-name(), 'dna-template-orig')]", $this->scope) as $attr) {
            $attrName=preg_replace('/^dna-template-orig-?/', '', $attr->nodeName);
            if ($attrName) {
                $attr->parentNode->setAttribute($attrName, $attr->nodeValue);
            } else {
                $attr->parentNode->nodeValue = $attr->nodeValue;
            }
            $attr->parentNode->removeAttributeNode($attr);
        }
        return $this->result;
    }

    /**
     * Clean up the result of template markup.
     *
     * @param DOMElement $element
     * @param string $zVar
     */
    public function clean() {
        foreach ($this->xpath->query("descendant-or-self::*/@*[starts-with(local-name(), 'dna-template-orig')]|descendant-or-self::*/@z-var|descendant-or-self::*/@template-clone", $this->scope) as $attr) {
            $attr->parentNode->removeAttributeNode($attr);
        }

        foreach ($this->xpath->query("descendant-or-self::*[@template]", $this->scope) as $element) {
            $element->parentNode->removeChild($element);
        }
    }

    private function processTemplate(DOMElement $template) {
        $nameFull = $template->getAttribute('template');
        $name = substr($nameFull, 1, -1);
        $type = substr($nameFull, 0, 1);

        if (!isset($this->data[$name]) || !is_array($this->data[$name])) {
            return;
        }

        $list=$this->data[$name];

        if ($type == '[') {
            $this->processTemplateRepeat($template, $list);
        } elseif ($type == '{') {
            $this->processTemplateInclude($template, $list);
        }
    }

    private function processTemplateRepeat($template, $list) {
        foreach($list as $data) {
            if (!is_array($data)) $data=array('value' => $data);
            $clone = $template->cloneNode(true);
            $clone->setAttribute('template-clone', $clone->getAttribute('template'));
            $clone->removeAttribute('template');
            $template->parentNode->insertBefore($clone, $template);

            $dnaTemplate = new Template($clone);
            $dnaTemplate->render($data, false);
        }
    }

    private function processTemplateInclude($template, $data) {
        $this->processTemplateRepeat($template, array($data));
    }

    /**
     * Return the scope element to limit replacements to.
     *
     * @param DOMNode scope
     */
    public function getScope() {
        return $this->scope;
    }
    
    /**
     * Process element
     *
     * @param DOMElement $element
     * @param string $zVar z-var attribute value - comma separated list of instructions
     */
    private function processElement(DOMElement $element, $zVar) {
        $rules = explode(',', $zVar);
        foreach ($rules as $rule) {
            $rule = trim($rule);
            list($var, $instruction) = explode(' ', $rule);
            if (substr($var, 0, 1) == '!') {
                $var = substr($var, 1);
                $negate = true;
            } else {
                $negate = false;
            }

            if (!isset($this->data[$var])) {
                trigger_error("Variable '$var' not found in data: ".json_encode($this->data)." while processing element ".$element->ownerDocument->saveXML($element), E_USER_WARNING);
                continue;
            }
            $value = $this->data[$var];
            $this->replaceElement($element, $var, $value, $instruction, $negate);
        }
    }

    /**
     * Replace element
     *
     * @param DOMElement $element
     * @param string $var Variable name
     * @param mixed $value Variable value
     * @param string $instruction The z-var instruction
     * @param bool $negate Negate instruction
     */
    private function replaceElement(DOMElement $element, $var, $value, $instruction, $negate) {
        $syntax = substr($instruction, 0, 1).(strlen($instruction) > 1 ? '*' : '');
        $positiveAction = $value ? !$negate : $negate;

        switch ($syntax) {
        case '.': // replace element content
            $backupAttr = 'dna-template-orig';
            if (!$element->hasAttribute($backupAttr)) {
                $element->setAttribute($backupAttr, $element->nodeValue);
            }
            $element->nodeValue = $this->replaceText($var, $value, $element->nodeValue);
            break;
        case '+': // embed value as HTML content
            $element->nodeValue = '';
            if (strlen($value)) {
                $fragment = $this->dom->createDocumentFragment();
                $fragment->appendXML($value);
                $element->appendChild($fragment);
            }
            break;
        case '!': // remove element
            if (!$positiveAction && $element->parentNode) {
                $element->parentNode->removeChild($element);
            }
            break;
        case '?': // hide element
            if ($positiveAction) {
                $this->removeAttrToken($element, 'class', 'dna-template-hidden');
                $this->addAttrToken($element, 'class', 'dna-template-visible');
            } else {
                $this->removeAttrToken($element, 'class', 'dna-template-visible');
                $this->addAttrToken($element, 'class', 'dna-template-hidden');
            }
            break;
        case '=': // set form element value
            $tagName = strtolower($element->localName);
            if ($tagName == 'select') { // <select>
                foreach($this->xpath->query(".//option[@selected]", $element) as $selectedNode) {
                    $selectedNode->removeAttribute('selected');
                }
                $this->xpath->evaluate("node((.//option[@value='".addslashes($value)."'])[1])", $element)->setAttribute('selected', 'selected');
            } elseif ($tagName == 'textarea') { // <textarea>
                $element->nodeValue = $value;
            } elseif (in_array($element->getAttribute('type'), array('checkbox', 'radio'))) { // <input type="checkbox|radio">
                if ($value === true || $elemeng->getAttribute('value') == $value) {
                    $element->setAttribute('checked', 'checked');
                } else {
                    $element->removeAttribute('checked');
                }
            } else { // <input type="text|hidden|...">
                $element->setAttribute('value', $value);
            }
            break;
        case '@*': // set attribute
            $attr = substr($instruction, 1);
            $newValue = $value === true ? $attr : $value;

            $backupAttr = 'dna-template-orig-'.$attr;
            if (!$element->hasAttribute($backupAttr)) {
                $element->setAttribute($backupAttr, $element->getAttribute($attr));
            }

            if (strlen($newValue)) {
                $element->setAttribute($attr, $this->replaceText($var, $newValue, $element->getAttribute($attr)));
            } else {
                $element->removeAttribute($attr);
            }
            break;
        case '.*': // set class
            $className = substr($instruction, 1);
            if ($positiveAction) {
                $this->addAttrToken($element, 'class', $className);
            } else {
                $this->removeAttrToken($element, 'class', $className);
            }
            break;
        case ':*': // Not implementable in PHP - should fire named event on this element. We store it as "data-fire-event" attribute on the element.
            $eventName = substr($instruction, 1);
            $this->addAttrToken($element, 'data-fire-event', $eventName);
            break;
        }
    }

    /**
     * If $oldValue contains ${$var} placholder then return $oldValew with replaced placeholders. Otherwise return $newValue.
     *
     * @param string $var Variable name
     * @param mixed $value Variable value
     * @param string $text Text to replace
     * @return string Replaced text
     */
    private function replaceText($var, $newValue, $oldValue) {
        $newValueText = is_array($newValue) ? count($newValue) : $newValue;

        if (strpos($oldValue, '${'.$var.'}') !== false) { // Old text is a template with ${VAR} placeholders
            return str_replace('${'.$var.'}', $newValueText, $oldValue);
        }

        return $newValueText;
    }

    private function addAttrToken(DOMElement $element, $attrName, $token) {
        $classList = $element->getAttribute($attrName) ?: '';
        $classList = $this->addStringToken($classList, $token);
        $element->setAttribute($attrName, $classList);
    }

    private function removeAttrToken(DOMElement $element, $attrName, $token) {
        $classList = $element->getAttribute($attrName) ?: '';
        $classList = $this->removeStringToken($classList, $token);
        if (strlen($classList)) {
            $element->setAttribute($attrName, $classList);
        } else {
            $element->removeAttribute($attrName);
        }
    }

    /**
     * Add token to a list of tokens
     *
     * @param string $listString List of white-space separated tokens
     * @param string $token Token to add
     * @return string New token list value
     */
    private function addStringToken($listStr, $token) {
        $listStr = trim($listStr);
        $list = strlen($listStr) ? explode(' ', $listStr) : array();
        $list[] = $token;
        array_unique($list);
        return implode(' ', $list);
    }

    public function __get($name) {
        switch ($name) {
        case 'result':
            return $this->result;
        defautl:
            throw new Exception("Unknown property $name");
        }
    }

    /**
     * Remove token to a list of tokens
     *
     * @param string $listString List of white-space separated tokens
     * @param string $token Token to remove
     * @return string New token list value
     */
    private function removeStringToken($listStr, $token) {
        $listStr = trim($listStr);
        $list = strlen($listStr) ? explode(' ', $listStr) : array();
        $list = array_diff($list, array($token));
        return implode(' ', $list);
    }
}


/**
 * The procedural interface to the DNA Template engine.
 * @param string $template Template string
 * @param array $data Data to use in the template
 * @param bool $clen Clean the template after processing of all templating markup
 * @return mixed if DOMDocument or DOMElement was passed to constructor then the same modified object will be returned, otherwise new DOMDocument will be returned if $template was string.
 */
function template($template, $data, $clean = false) {
    return (new Template($template))->render($data, $clean);
}
