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
     * @var DOMDocument with processed content
     */
    protected $dom;

    /**
     * @var DOMXpath
     */
    protected $xpath;

    /**
     * Constructor
     *
     * @param mixed $template DOMDocument or string with template containing "z-var" attributes to be replaced. Note: if DOMDocument is passed, it will be modified.
     * @param array $data Array of data to be used for replacing "z-var" attributes
     */
    public function __construct($template, $data = array()) {
        $this->template = $template;
        $this->data = $data;
        
        if ($template instanceof DOMDocument) {
            $this->dom = $template;
        } else {
            $this->dom = new DOMDocument();
            $this->dom->loadHTML($template);
        }
        $this->xpath = new DOMXPath($this->dom);
    }

    /**
     * Render template.
     *
     * @return DOMDocument Rendered template - if DOMDocument was passed to constructor, it will be returned, otherwise new DOMDocument with rendered template
     */
    public function render() {
        $elements = $this->xpath->query("//*[@z-var]");
        foreach ($elements as $element) {
            $zVar = $element->getAttribute('z-var');
            $this->processElement($element, $zVar);
            $element->removeAttribute('z-var');
        }
        return $this->dom;
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
            if (strpos($var, 0, 1) == '!') {
                $var = substr($var, 1);
                $negate = true;
            } else {
                $negate = false;
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
            $element->nodeValue = $value;
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
            $style = $element->getAttribute('style');
            if (!$positiveAction) {
                $style = preg_replace('/display\s*:[^;]+;/', '', $style);
                $style = 'display:none; '.$style;
            } else {
                $style = preg_replace('/display\s*:\s*none\s*;/', '', $style);
            }
            $element->setAttribute('style', $style);
            break;
        case '=': // set form element value
            $tagName = strtolower($element->localName);
            if ($tagName == 'select') { // <select>
                foreach($this->xpath->query("option[@selected]", $element) as $selectedNode) {
                    $selectedNode->removeAttribute('selected');
                }
                $this->xpath->evaluate("node((option[@value='".addslashes($value)."'])[1])", $element)->setAttribute('selected', 'selected');
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
            $strValue = $value === true ? $attr : $value;
            if (strlen($strValue)) {
                $element->setAttribute($attr, $strValue);
            } else {
                $element->removeAttribute($attr);
            }
            break;
        case '.*': // set class
            $className = substr($instruction, 1);
            $classList = $this->getAttribute('class');
            $classList = $positiveAction ? $this->addToken($classList, $className) : $this->removeToken($classList, $className);
            $element->setAttribute('class', $classList);
            break;
        case ':*': // Not implementable in PHP - should fire named event on this element. We store it as "data-fire-event" attribute on the element.
            $eventName = substr($instruction, 1);
            $eventList = $this->getAttribute('fire-event');
            $eventList = $positiveAction ? $this->addToken($eventList, $eventName) : $this->removeToken($eventList, $eventName);
            $element->setAttribute('data-fire-event', $eventList);
            break;
        }
    }

    /**
     * Add token to a list of tokens
     *
     * @param string $listString List of white-space separated tokens
     * @param string $token Token to add
     * @return string New token list value
     */
    private function addToken($listStr, $token) {
        $listStr = trim($listStr);
        $list = strlen($list) ? explode(' ', $listStr) : array();
        $list[] = $token;
        unique($list);
        return implode(' ', $list);
    }

    /**
     * Remove token to a list of tokens
     *
     * @param string $listString List of white-space separated tokens
     * @param string $token Token to remove
     * @return string New token list value
     */
    private function removeToken($listStr, $token) {
        $listStr = trim($listStr);
        $list = strlen($list) ? explode(' ', $listStr) : array();
        $list = array_diff($list, array($token));
        return implode(' ', $list);
    }
}


