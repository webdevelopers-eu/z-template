<?php
// Run as `php test.php`

require(__DIR__.'/../../php/template.php');

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

    echo str_repeat('=', 80)."\n";
    echo "File: $templateFile\n";
    echo str_repeat('=', 80)."\n";

    echo "VARIABLES:\n";
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";

    echo str_repeat('-', 80)."\n";

    echo "INPUT:\n";
    echo rtrim($template)."\n";

    echo str_repeat('-', 80)."\n";

    echo "OUTPUT:\n";
    echo rtrim(\DNA\template($template, $data, true)->saveHTML())."\n\n";
}
