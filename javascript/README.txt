Document

debugger keyword
!!prop @something

GENERAL SYNTAX
--------------------------------------------
{VALUE|TOGGLE} ACTION [PARAM {CONDITION}]
--------------------------------------------

 remove [cond]                | !
 toggle [cond]                | ?  => shortcut for: {toggle} class "!dna-template-hidden dna-template-visible"
 -----------------------
 text [cond]                  | .
 value [cond]                 | =
 html [cond]                  | +
 -----------------------
 attr attrName [cond]         | @attrName
 class 'class1 class2' [cond] | .class1.class2
 event name [cond]            | :name
 callback name [cond]         | *name

(?<target>"@{attr}"|"+"|"."|"=")|(?<action>":{event}"|"?"|"!"|".{class}")

Examples:
 {test && !test2} toggle
 test toggle
 somevar text
 somevar value
 else html



