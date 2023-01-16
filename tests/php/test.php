<?php
// Run as `php test.php`

require(__DIR__.'/../../template.php');

$data=array (
    'name' => 'John Smith',
    'validated' => true,
    'list' => array (
        'aa',
        'bb',
    ),
    'listExt' => array (
        array (
            'first' => 'John',
            'last' => 'Doe',
            'validated' => true,
        ),
        array (
            'first' => 'Jane',
            'last' => 'Smith',
            'validated' => false,
        ),
    ),
    'propObj' => array (
        'first' => 'Baby',
        'last' => 'Doe',
    ),
);

for($testNum=1;; $testNum++) {
    $templateFile = __DIR__.'/test-'.$testNum.'.html';
    if (!file_exists($templateFile)) break;
    $template = file_get_contents($templateFile);

    $dnaTemplate = new DNA\Template($template, $data);
    
    echo str_repeat('=', 80)."\n";
    echo "File: $templateFile\n";
    echo str_repeat('=', 80)."\n";
    echo "INPUT:\n";
    echo rtrim($template)."\n";
    echo str_repeat('-', 80)."\n";
    echo "OUTPUT:\n";
    echo rtrim($dnaTemplate->render()->saveHTML())."\n\n";
}
