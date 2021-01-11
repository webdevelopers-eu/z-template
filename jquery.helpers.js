/**
 * This javascript contains basic DNA Template helpers.
 */


/**
 * Event 'scroll-into-view' handler allowing to use
 *
 * <element z-var="something :scroll-into-view"> 
 * (if `something` is true scroll the element into view)
 *
 * Requires jQuery SmartScroll https://github.com/webdevelopers-eu/DNA-Smart-Scroll
 */
(function() {
    var scrollToElement;
    var scrollTimeout;

    $('html')
	.on('scroll-into-view.dnaTemplate', function(ev, vars, name) {
	    scrollToElement = ev.target;
	    clearTimeout(scrollTimeout);
	    scrollTimeout = setTimeout(scroll, 500);
	});

    function scroll() {
	console.log("dnaTemplate: Scrolling to %o", scrollToElement);
	$(scrollToElement).smartScroll();
    }
})();
