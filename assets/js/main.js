/*
	Multiverse by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#wrapper');

	// Breakpoints.
		breakpoints({
			xlarge:  [ '1281px',  '1680px' ],
			large:   [ '981px',   '1280px' ],
			medium:  [ '737px',   '980px'  ],
			small:   [ '481px',   '736px'  ],
			xsmall:  [ null,      '480px'  ]
		});

	// Hack: Enable IE workarounds.
		if (browser.name == 'ie')
			$body.addClass('ie');

	// Touch?
		if (browser.mobile)
			$body.addClass('touch');

	// Transitions supported?
		if (browser.canUse('transition')) {

			// Play initial animations on page load.
				$window.on('load', function() {
					window.setTimeout(function() {
						$body.removeClass('is-preload');
					}, 100);
				});

			// Prevent transitions/animations on resize.
				var resizeTimeout;

				$window.on('resize', function() {

					window.clearTimeout(resizeTimeout);

					$body.addClass('is-resizing');

					resizeTimeout = window.setTimeout(function() {
						$body.removeClass('is-resizing');
					}, 100);

				});

		}

	// Scroll back to top.
		$window.scrollTop(0);

	// Panels.
		var $panels = $('.panel');

		$panels.each(function() {

			var $this = $(this),
				$toggles = $('[href="#' + $this.attr('id') + '"]'),
				$closer = $('<div class="closer" />').appendTo($this);

			// Closer.
				$closer
					.on('click', function(event) {
						$this.trigger('---hide');
					});

			// Events.
				$this
					.on('click', function(event) {
						event.stopPropagation();
					})
					.on('---toggle', function() {

						if ($this.hasClass('active'))
							$this.triggerHandler('---hide');
						else
							$this.triggerHandler('---show');

					})
					.on('---show', function() {

						// Hide other content.
							if ($body.hasClass('content-active'))
								$panels.trigger('---hide');

						// Activate content, toggles.
							$this.addClass('active');
							$toggles.addClass('active');

						// Activate body.
							$body.addClass('content-active');

					})
					.on('---hide', function() {

						// Deactivate content, toggles.
							$this.removeClass('active');
							$toggles.removeClass('active');

						// Deactivate body.
							$body.removeClass('content-active');

					});

			// Toggles.
				$toggles
					.removeAttr('href')
					.css('cursor', 'pointer')
					.on('click', function(event) {

						event.preventDefault();
						event.stopPropagation();

						$this.trigger('---toggle');

					});

		});

		// Global events.
			$body
				.on('click', function(event) {

					if ($body.hasClass('content-active')) {

						event.preventDefault();
						event.stopPropagation();

						$panels.trigger('---hide');

					}

				});

			$window
				.on('keyup', function(event) {

					if (event.keyCode == 27
					&&	$body.hasClass('content-active')) {

						event.preventDefault();
						event.stopPropagation();

						$panels.trigger('---hide');

					}

				});

	// Header.
		var $header = $('#header');

		// Links.
			$header.find('a').each(function() {

				var $this = $(this),
					href = $this.attr('href');

				// Internal link? Skip.
					if (!href
					||	href.charAt(0) == '#')
						return;

				// Redirect on click.
					$this
						.removeAttr('href')
						.css('cursor', 'pointer')
						.on('click', function(event) {

							event.preventDefault();
							event.stopPropagation();

							window.location.href = href;

						});

			});

	// Footer.
		var $footer = $('#footer');

		// Copyright.
		// This basically just moves the copyright line to the end of the *last* sibling of its current parent
		// when the "medium" breakpoint activates, and moves it back when it deactivates.
			$footer.find('.copyright').each(function() {

				var $this = $(this),
					$parent = $this.parent(),
					$lastParent = $parent.parent().children().last();

				breakpoints.on('<=medium', function() {
					$this.appendTo($lastParent);
				});

				breakpoints.on('>medium', function() {
					$this.appendTo($parent);
				});

			});

	// Main.
		var $main = $('#main');

		// Thumbs.
			$main.children('.thumb').each(function() {

				var	$this = $(this),
					$image = $this.find('.image'), $image_img = $image.children('img'),
					x;

				// No image? Bail.
					if ($image.length == 0)
						return;

				// Image.
				// This sets the background of the "image" <span> to the image pointed to by its child
				// <img> (which is then hidden). Gives us way more flexibility.

					// Set background.
						$image.css('background-image', 'url(' + $image_img.attr('src') + ')');

					// Set background position.
						if (x = $image_img.data('position'))
							$image.css('background-position', x);

					// Hide original img.
						$image_img.hide();

			});

		// Poptrox.
			$main.poptrox({
				baseZIndex: 20000,
				caption: function($a) {

					var s = '';

					$a.nextAll().each(function() {
						s += this.outerHTML;
					});

					return s;

				},
				fadeSpeed: 300,
				onPopupClose: function() { $body.removeClass('modal-active'); },
				onPopupOpen: function() { $body.addClass('modal-active'); },
				overlayOpacity: 0,
				popupCloserText: '',
				popupHeight: 150,
				popupLoaderText: '',
				popupSpeed: 300,
				popupWidth: 150,
				selector: '.thumb > a.image',
				usePopupCaption: true,
				usePopupCloser: true,
				usePopupDefaultStyling: false,
				usePopupForceClose: true,
				usePopupLoader: true,
				usePopupNav: true,
				windowMargin: 50
			});

		// Image zoom (wheel on desktop, pinch on mobile) inside poptrox popup
		;(function(){
			var SCALE_MIN = 1,
				SCALE_MAX = 4;

			// Helpers
			function dist(t1, t2){
				var dx = t1.pageX - t2.pageX;
				var dy = t1.pageY - t2.pageY;
				return Math.sqrt(dx*dx + dy*dy);
			}

			// When popup opens, attach handlers to the popup element (delegated)
			$(document).on('poptrox_open', '.poptrox-popup', function(e, idx){
				var $popup = $(this);
				var $pic = $popup.find('.pic');
				var $img = $pic.find('img');
				var scale = 1;
				var startDist = 0, startScale = 1;

				// Ensure image can be transformed
				$img.css({
					'transform-origin': '50% 50%',
					'transition': 'transform 0.05s linear',
					'-webkit-transition': 'transform 0.05s linear',
					'max-width': 'none'
				});

				// Wheel to zoom (desktop)
				$popup.on('wheel.zoom', '.pic', function(ev){
					ev.preventDefault();
					ev.stopPropagation();
					var oe = ev.originalEvent;
					var delta = oe.deltaY;
					var factor = delta > 0 ? 0.9 : 1.1;
					scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale * factor));

					// set transform-origin to mouse position so zoom centers under cursor
					var off = $img.offset();
					var iw = $img.width();
					var ih = $img.height();
					if (iw > 0 && ih > 0) {
						var px = ((oe.pageX - off.left) / iw) * 100;
						var py = ((oe.pageY - off.top) / ih) * 100;
						$img.css('transform-origin', px + '% ' + py + '%');
					}
					$img.css('transform', 'scale(' + scale + ')');
				});

				// Touch pinch to zoom (mobile)
				$popup.on('touchstart.zoom', '.pic', function(ev){
					var t = ev.originalEvent.touches;
					if (t && t.length === 2) {
						startDist = dist(t[0], t[1]);
						startScale = scale || 1;
						// midpoint for transform-origin
						var midX = (t[0].pageX + t[1].pageX) / 2;
						var midY = (t[0].pageY + t[1].pageY) / 2;
						var off = $img.offset();
						var iw = $img.width();
						var ih = $img.height();
						if (iw > 0 && ih > 0) {
							var px = ((midX - off.left) / iw) * 100;
							var py = ((midY - off.top) / ih) * 100;
							$img.css('transform-origin', px + '% ' + py + '%');
						}
					}
				});

				$popup.on('touchmove.zoom', '.pic', function(ev){
					var t = ev.originalEvent.touches;
					if (t && t.length === 2) {
						ev.preventDefault();
						ev.stopPropagation();
						var d = dist(t[0], t[1]);
						if (startDist > 0) {
							scale = startScale * (d / startDist);
							scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale));
							$img.css('transform', 'scale(' + scale + ')');
						}
					}
				});

				// Reset on close
				$popup.on('poptrox_close.zoom', function(){
					$popup.off('.zoom');
					$img.css({'transform': '', 'transform-origin': '', 'transition': ''});
					scale = 1; startDist = 0; startScale = 1;
				});
			});
		})();

		// Drag-to-pan when zoomed (mouse drag or single-finger touch)
		;(function(){
			$(document).on('poptrox_open', '.poptrox-popup', function(e, idx){
				var $popup = $(this);
				var $pic = $popup.find('.pic');
				var $img = $pic.find('img');
				if ($img.length === 0) return;

				var scale = 1, translateX = 0, translateY = 0;
				var dragging = false, startX = 0, startY = 0, startTX = 0, startTY = 0;

				function applyTransform(){
					$img.css('transform', 'translate(' + translateX + 'px,' + translateY + 'px) scale(' + scale + ')');
				}

				function clampTranslate(tx, ty){
					// Basic clamping so image cannot be dragged too far beyond the container
					var picW = $pic.width(), picH = $pic.height();
					var imgW = $img.width() * scale, imgH = $img.height() * scale;
					var maxX = Math.max(0, (imgW - picW) / 2);
					var maxY = Math.max(0, (imgH - picH) / 2);
					if (isFinite(maxX)) tx = Math.max(-maxX, Math.min(maxX, tx));
					if (isFinite(maxY)) ty = Math.max(-maxY, Math.min(maxY, ty));
					return [tx, ty];
				}

				// Update scale when wheel/pinch handlers change it elsewhere
				// Observe transform changes by wrapping applyTransform usage in other code paths
				// For safety, check existing transform when opening popup
				var existingTransform = $img.css('transform');
				if (existingTransform && existingTransform !== 'none'){
					// try to parse scale from matrix
					var m = existingTransform.match(/matrix\(([^)]+)\)/);
					if(m){
						var parts = m[1].split(',');
						if(parts.length>=1){
							// a = scaleX, d = scaleY
							var a = parseFloat(parts[0]);
							scale = isFinite(a) ? a : 1;
						}
					}
				}

				// Mouse drag
				$popup.on('mousedown.zoompan', '.pic', function(ev){
					if (scale <= 1) return;
					ev.preventDefault();
					dragging = true;
					startX = ev.pageX; startY = ev.pageY;
					startTX = translateX; startTY = translateY;
					$popup.css('cursor','grabbing');
					$(document).on('mousemove.zoompan', function(e){
						if (!dragging) return;
						var dx = e.pageX - startX, dy = e.pageY - startY;
						var ntx = startTX + dx, nty = startTY + dy;
						var cl = clampTranslate(ntx, nty);
						translateX = cl[0]; translateY = cl[1];
						applyTransform();
					});
					$(document).on('mouseup.zoompan', function(){
						dragging = false;
						$(document).off('.zoompan');
						$popup.css('cursor','');
					});
				});

				// Touch drag (single-finger)
				$popup.on('touchstart.zoompan', '.pic', function(ev){
					var t = ev.originalEvent.touches;
					if (!t || t.length !== 1) return; // ignore multi-touch here
					if (scale <= 1) return;
					var touch = t[0];
					dragging = true;
					startX = touch.pageX; startY = touch.pageY;
					startTX = translateX; startTY = translateY;
					$(document).on('touchmove.zoompan', function(e){
						var tt = e.originalEvent.touches;
						if (!dragging || !tt || tt.length !== 1) return;
						e.preventDefault();
						var t0 = tt[0];
						var dx = t0.pageX - startX, dy = t0.pageY - startY;
						var ntx = startTX + dx, nty = startTY + dy;
						var cl = clampTranslate(ntx, nty);
						translateX = cl[0]; translateY = cl[1];
						applyTransform();
					});
					$(document).on('touchend.zoompan touchcancel.zoompan', function(){
						dragging = false;
						$(document).off('.zoompan');
					});
				});

				// Listen for zoom changes from existing wheel/pinch code and update local scale
				$popup.on('wheel.zoom', '.pic', function(){
					// try to extract scale from computed transform
					var t = $img.css('transform');
					if (t && t !== 'none'){
						var m = t.match(/matrix\(([^)]+)\)/);
						if (m){
							var parts = m[1].split(',');
							if (parts.length>=1){
								scale = parseFloat(parts[0]) || scale;
							}
						}
					}
				});

				// Reset translations on popup close
				$popup.on('poptrox_close.zoompan', function(){
					$popup.off('.zoompan');
					translateX = 0; translateY = 0; scale = 1;
					$img.css({'transform': '', 'transform-origin': '', 'transition': ''});
				});
			});
		})();

			// Hack: Set margins to 0 when 'xsmall' activates.
				breakpoints.on('<=xsmall', function() {
					$main[0]._poptrox.windowMargin = 0;
				});

				breakpoints.on('>xsmall', function() {
					$main[0]._poptrox.windowMargin = 50;
				});

})(jQuery);