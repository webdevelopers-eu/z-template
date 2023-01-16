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
 * $template=file_get_contents('test.html');
 * $dnaTemplate=new DNA\Template($template, array(
 *   'title' => 'Hello World',
 *   'content' => 'This is a test'
 * ));
 * echo $dnaTemplate->render()->saveHTML();
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
     * Constructor
     *
     * @param mixed $template DOMDocument or DOMElement or string with template containing "z-var" attributes to be replaced. Note: if DOMDocument is passed, it will be modified.
     * @param array $data Array of data to be used for replacing "z-var" attributes
     */
    public function __construct($template, $data = array()) {
        $this->template = $template;
        $this->data = $data;
        
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
     * @return DOMDocument Rendered template - if DOMDocument or DOMElement was passed to constructor it will be modified returned otherwise new DOMDocument will be returned.
     */
    public function render() {
        $ctxAttr='data-template-scope-'.rand(10000000, 999999999);
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

        return $this->result;
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
            $this->processTemplateInclude($clone, $data);
        }
    }

    private function processTemplateInclude($template, $data) {
        $dnaTemplate = new Template($template, $data);
        $dnaTemplate->render();
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
            $element->nodeValue = $this->replaceText($var, $value, $element->nodeValue);
            break;
        case '+': // embed value as HTML content
            $element->nodeValue = '';
            $fragment = $this->dom->createDocumentFragment();
            $fragment->appendXML($value);
            $element->appendChild($fragment);
            break;
        case '!': // remove element
            if (!$positiveAction) {
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
            if (strlen($newValue)) {
                $oldValue = $element->getAttribute($attr);
                $element->setAttribute($attr, $this->replaceText($var, $newValue, $oldValue));
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


