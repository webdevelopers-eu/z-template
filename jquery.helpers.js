/**
 * This javascript contains basic DNA Template helpers.
 */


/**
 * Event 'scroll-into-view' handler allowing to use
 *
 * <element z-var="something :scroll-into-view">
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
	// (/* not smooth yet in Chrome 83: scrollToElement.scrollIntoViewIfNeeded || */ scrollToElement.scrollIntoView)
	//     .bind(scrollToElement)({
	//	block: scrollToElement.getAttribute('scroll-align') || "start",
	//	behavior: 'smooth'
	//     });
    }
})();
