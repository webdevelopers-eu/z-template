------------------------------------------------------------------------

GENERAL SYNTAX
change in evaluate.js normalize() function
rename evaluate.js to prepare.js

--------------------------------------------
[NEGATE]{VALUE} ACTION PARAM? [{CONDITION}]
--------------------------------------------

 remove     [cond]                | !
 toggle     [cond]                | ?  => shortcut for: {toggle} class "!dna-template-hidden dna-template-visible"
 -----------------------
 text [cond]                  | .
 value [cond]                 | =
 html [cond]                  | +
 -----------------------
 attr attrName [cond]                | @attrName
 class value [cond]                  | .class1.class2; support "class1 !class3" to invert toggling
 event name [cond]                   | :name
 callback name [cond]                | *name

(?<target>"@{attr}"|"+"|"."|"=")|(?<action>":{event}"|"?"|"!"|".{class}")

Examples:
 {test && !test2} toggle
 test toggle
 somevar text
 somevar value
 else html

------------------------------------------------------------------------

DOCUMENT

debugger keyword
!!prop @something

