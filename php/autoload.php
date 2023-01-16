<?php

// Autoload classes
spl_autoload_register(function ($class) {
    if ($class == 'DNA\\Template') {
        require_once __DIR__.'/template.php';
        return true;
     }
    return false;
});

