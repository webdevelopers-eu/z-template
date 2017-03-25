Rainbow.defer = true;

$(function() {
    $('.example')
        .each(function(k, item) {
            var $item = $(item);
            var $code = $item.find('.code');
            var $html = $item.find('.html');
            var js = $code.text();
            $code.find('code').text(unindent(js.replace(/\$example/g, '$("#example")')));
            var htmlBefore = $html.html();
            (new Function('$example', js))($html.find('> *'));
            var htmlAfter = $html.html();

            $('<pre class="html-before"><code data-language="html"></code></pre>').insertBefore($code).find('code').text(unindent(htmlBefore));
            $('<pre class="html-after"><code data-language="html"></code></pre>').insertAfter($code).find('code').text(unindent(htmlAfter));
        });

    Rainbow.color();

    function unindent(text) {
        text = text.replace(/^\s*\n/, '').replace(/\s*$/, '');
        var indent = text.match(/^(\s*)/)[1];
        text = text.replace(new RegExp('^' + indent, 'mg'), '');

        return text;
    }
});

Rainbow.extend('html', [
    {
        name: 'z-var',
        pattern: /z-var="[^"]*"/gm
    },
    {
        name: 'z-var-template',
        pattern: /template="[^"]*"/gi
    },
    {
        name: 'z-var-template-recursive',
        pattern: /template="\[[^"]*\]"/gi
    }
]);
