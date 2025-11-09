/* Simple Lightbox with zoom & pan
   - Captures clicks on .thumb > a.image and opens a custom modal
   - Supports wheel zoom (desktop), pinch zoom (mobile), and drag-to-pan
   - Minimal dependency: jQuery available in the project
*/
(function(){
    'use strict';
    var SCALE_MIN = 1, SCALE_MAX = 4;

    function createEl(tag, attrs, css){
        var el = document.createElement(tag);
        if (attrs) Object.keys(attrs).forEach(function(k){ el.setAttribute(k, attrs[k]); });
        if (css) Object.assign(el.style, css);
        return el;
    }

    function matchesThumb(el){
        if (!el) return false;
        return el.matches && (el.matches('.thumb > a.image') || el.closest && el.closest('.thumb > a.image'));
    }

    function srcFromLink(a){
        var href = a.getAttribute('href') || '';
        if (href) return href;
        // fallback: try to read background-image from child .image or computed style
        var img = a.querySelector('img');
        if (img && img.src) return img.src;
        var bg = a.style.backgroundImage || (a.querySelector('.image') && a.querySelector('.image').style.backgroundImage);
        if (bg && bg.indexOf('url(') !== -1) return bg.replace(/url\(["']?/, '').replace(/["']?\)/, '');
        return '';
    }

    function SimpleLightbox(){
        this.overlay = null;
        this.img = null;
        this.prevBtn = null;
        this.nextBtn = null;
        this.container = null;
        this.scale = 1;
        this.tx = 0; this.ty = 0;
        this.dragging = false;
        this.startX = 0; this.startY = 0; this.startTX = 0; this.startTY = 0;
        this.startPinchDist = 0; this.startPinchScale = 1;
        this.onKey = this.onKey.bind(this);
        this.gallery = null;
        this.currentIndex = 0;
    }

    function getGalleryAnchors(){
        return Array.prototype.slice.call(document.querySelectorAll('.thumb > a.image'));
    }

    SimpleLightbox.prototype.open = function(src){
        if (!src) return;
        // build DOM
        this.overlay = createEl('div', {class: 'simple-lightbox-overlay'});
        this.container = createEl('div', {class: 'simple-lightbox-container'});
        this.img = createEl('img', {class: 'simple-lightbox-img', src: src, draggable: 'false'});
        // nav buttons
        this.closeBtn = createEl('button', {class: 'simple-lightbox-close', 'aria-label': 'Close'});
        this.closeBtn.textContent = '✕';

        this.container.appendChild(this.img);
        // append control buttons inside the container so they position relative to image
        this.prevBtn = createEl('button', {class: 'simple-lightbox-prev', 'aria-label': 'Previous'});
        this.prevBtn.innerText = '\u2039';
        this.nextBtn = createEl('button', {class: 'simple-lightbox-next', 'aria-label': 'Next'});
        this.nextBtn.innerText = '\u203A';
        this.container.appendChild(this.prevBtn);
        this.container.appendChild(this.nextBtn);
        this.overlay.appendChild(this.container);
        this.overlay.appendChild(this.closeBtn);
    document.body.appendChild(this.overlay);
        // mark body as open; also add a touch/narrow flag so CSS can adapt reliably
        document.body.classList.add('simple-lightbox-open');
        try{
            var isTouch = (('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0));
            var isNarrow = (window.innerWidth && window.innerWidth <= 900);
            if (isTouch || isNarrow) document.body.classList.add('simple-lightbox-touch');
        }catch(e){}

        // Ensure container is a positioning context
        try{ this.container.style.position = this.container.style.position || 'relative'; }catch(e){}

        // Helper to update layout depending on narrow/touch viewport. Use both overlay class and inline important styles
        var self = this;
        this._updateLayout = function(){
            try{
                var narrow = (window.innerWidth && window.innerWidth <= 900);
                var touch = (('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0));
                var mobile = narrow || touch;
                if (mobile) {
                    try{ self.overlay.classList.add('simple-lightbox-mobile'); }catch(e){}
                    // set inline styles with !important to be robust
                    try{
                        self.prevBtn.style.setProperty('position', 'absolute', 'important');
                        self.prevBtn.style.setProperty('bottom', '0.6rem', 'important');
                        self.prevBtn.style.setProperty('left', '0.6rem', 'important');
                        self.prevBtn.style.setProperty('transform', 'none', 'important');
                        self.prevBtn.style.setProperty('width', '2.2rem', 'important');
                        self.prevBtn.style.setProperty('height', '2.2rem', 'important');
                        self.prevBtn.style.setProperty('font-size', '1.2rem', 'important');
                        self.prevBtn.style.setProperty('line-height', '2.2rem', 'important');

                        self.nextBtn.style.setProperty('position', 'absolute', 'important');
                        self.nextBtn.style.setProperty('bottom', '0.6rem', 'important');
                        self.nextBtn.style.setProperty('right', '0.6rem', 'important');
                        self.nextBtn.style.setProperty('transform', 'none', 'important');
                        self.nextBtn.style.setProperty('width', '2.2rem', 'important');
                        self.nextBtn.style.setProperty('height', '2.2rem', 'important');
                        self.nextBtn.style.setProperty('font-size', '1.2rem', 'important');
                        self.nextBtn.style.setProperty('line-height', '2.2rem', 'important');
                    }catch(e){}
                } else {
                    try{ self.overlay.classList.remove('simple-lightbox-mobile'); }catch(e){}
                    try{
                        self.prevBtn.style.setProperty('position', 'fixed', 'important');
                        self.prevBtn.style.setProperty('top', '50%', 'important');
                        self.prevBtn.style.setProperty('left', '1rem', 'important');
                        self.prevBtn.style.setProperty('transform', 'translateY(-50%)', 'important');
                        self.prevBtn.style.setProperty('width', '2.6rem', 'important');
                        self.prevBtn.style.setProperty('height', '2.6rem', 'important');
                        self.prevBtn.style.setProperty('font-size', '1.6rem', 'important');
                        self.prevBtn.style.setProperty('line-height', '2.6rem', 'important');

                        self.nextBtn.style.setProperty('position', 'fixed', 'important');
                        self.nextBtn.style.setProperty('top', '50%', 'important');
                        self.nextBtn.style.setProperty('right', '1rem', 'important');
                        self.nextBtn.style.setProperty('transform', 'translateY(-50%)', 'important');
                        self.nextBtn.style.setProperty('width', '2.6rem', 'important');
                        self.nextBtn.style.setProperty('height', '2.6rem', 'important');
                        self.nextBtn.style.setProperty('font-size', '1.6rem', 'important');
                        self.nextBtn.style.setProperty('line-height', '2.6rem', 'important');
                    }catch(e){}
                }
            }catch(e){}
        };

        // Run once and listen for resize while lightbox is open
        try{ this._updateLayout(); }catch(e){}
        this._onResize = function(){ try{ self._updateLayout(); }catch(e){} };
        window.addEventListener('resize', this._onResize);

        // reset transform state; wait for image load to ensure dimensions are correct
        var self = this;
        this.scale = 1; this.tx = 0; this.ty = 0;
        this.applyTransform();
        this.img.onload = function(){
            try{
                // ensure starting view shows the full image (fit-to-container)
                // let CSS constrain the image to the container and start at scale = 1
                self.img.style.maxWidth = '100%';
                self.img.style.maxHeight = '100%';
                self.img.style.width = 'auto';
                self.img.style.height = 'auto';
                // initial scale is 1 (image fits container due to CSS)
                self.minScale = 1;
                self.scale = 1; self.tx = 0; self.ty = 0;
                self.applyTransform();
            }catch(e){}
        };
        // If the image is already cached and complete, call the onload handler immediately
        if (this.img.complete) {
            try{ this.img.onload(); }catch(e){}
        }

        // listeners
        this.onWheel = this.onWheel.bind(this);
        this.onDown = this.onDown.bind(this);
        this.onMove = this.onMove.bind(this);
        this.onUp = this.onUp.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onOverlayClick = this.onOverlayClick.bind(this);

        this.overlay.addEventListener('wheel', this.onWheel, {passive:false});
        this.container.addEventListener('mousedown', this.onDown);
        document.addEventListener('mousemove', this.onMove);
        document.addEventListener('mouseup', this.onUp);

        this.container.addEventListener('touchstart', this.onTouchStart, {passive:false});
        this.container.addEventListener('touchmove', this.onTouchMove, {passive:false});
        this.container.addEventListener('touchend', this.onTouchEnd);

    this.overlay.addEventListener('click', this.onOverlayClick);
    this.closeBtn.addEventListener('click', this.close.bind(this));
    this.img.addEventListener('dragstart', function(e){ e.preventDefault(); return false; });
    var self = this;
    this.prevBtn.addEventListener('click', function(ev){ ev.stopPropagation(); self.changeToIndex(self.currentIndex - 1); });
    this.nextBtn.addEventListener('click', function(ev){ ev.stopPropagation(); self.changeToIndex(self.currentIndex + 1); });

        document.addEventListener('keydown', this.onKey);
    };

    SimpleLightbox.prototype.close = function(){
        if (this.overlay){
            this.overlay.remove();
            this.overlay = null; this.img = null; this.container = null;
            try{ if (this.prevBtn) { this.prevBtn.remove(); this.prevBtn = null; } }catch(e){}
            try{ if (this.nextBtn) { this.nextBtn.remove(); this.nextBtn = null; } }catch(e){}
            document.body.classList.remove('simple-lightbox-open');
            try{ document.body.classList.remove('simple-lightbox-touch'); }catch(e){}
            document.removeEventListener('mousemove', this.onMove);
            document.removeEventListener('mouseup', this.onUp);
            document.removeEventListener('keydown', this.onKey);
        }
    };

    SimpleLightbox.prototype.onOverlayClick = function(ev){
        // close when clicking overlay but not when clicking the image or close button
        if (ev.target === this.overlay) this.close();
    };

    SimpleLightbox.prototype.onKey = function(ev){
        if (ev.key === 'Escape') this.close();
        if (ev.key === 'ArrowRight') this.changeToIndex(this.currentIndex + 1);
        if (ev.key === 'ArrowLeft') this.changeToIndex(this.currentIndex - 1);
    };

    SimpleLightbox.prototype.applyTransform = function(){
        if (!this.img) return;
        this.img.style.transform = 'translate(' + this.tx + 'px,' + this.ty + 'px) scale(' + this.scale + ')';
    };

    SimpleLightbox.prototype.onWheel = function(ev){
        ev.preventDefault(); ev.stopPropagation();
        var delta = ev.deltaY; var factor = delta > 0 ? 0.9 : 1.1;
        var prev = this.scale; var min = (this.minScale || SCALE_MIN); var cur = Math.max(min, Math.min(SCALE_MAX, prev * factor));
        // zoom about center (simpler and reliable)
        this.scale = cur;
        // optional: clamp translate to keep image inside container
        this.clamp();
        this.applyTransform();
    };

    SimpleLightbox.prototype.onDown = function(ev){
        ev.preventDefault(); ev.stopPropagation();
        if (ev.button !== 0) return;
        var min = (this.minScale || SCALE_MIN);
        if (this.scale <= min + 1e-6) return; // no pan when not zoomed
        this.dragging = true; this.startX = ev.pageX; this.startY = ev.pageY; this.startTX = this.tx; this.startTY = this.ty;
    };

    SimpleLightbox.prototype.onMove = function(ev){
        if (!this.dragging) return;
        ev.preventDefault(); ev.stopPropagation();
        var dx = ev.pageX - this.startX, dy = ev.pageY - this.startY;
        this.tx = this.startTX + dx; this.ty = this.startTY + dy;
        this.clamp(); this.applyTransform();
    };

    SimpleLightbox.prototype.onUp = function(ev){
        if (!this.dragging) return;
        this.dragging = false;
    };

    SimpleLightbox.prototype.onTouchStart = function(ev){
        if (!ev.touches) return;
        if (ev.touches.length === 1){
            var min = (this.minScale || SCALE_MIN);
            if (this.scale <= min + 1e-6) return; // no pan if not zoomed
            var t = ev.touches[0]; this.dragging = true; this.startX = t.pageX; this.startY = t.pageY; this.startTX = this.tx; this.startTY = this.ty;
        } else if (ev.touches.length === 2){
            ev.preventDefault(); ev.stopPropagation();
            var a = ev.touches[0], b = ev.touches[1];
            this.startPinchDist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            this.startPinchScale = this.scale;
        }
    };

    SimpleLightbox.prototype.onTouchMove = function(ev){
        if (!ev.touches) return;
        if (ev.touches.length === 1 && this.dragging){
            ev.preventDefault(); ev.stopPropagation();
            var t = ev.touches[0]; var dx = t.pageX - this.startX, dy = t.pageY - this.startY; this.tx = this.startTX + dx; this.ty = this.startTY + dy; this.clamp(); this.applyTransform();
        } else if (ev.touches.length === 2){
            ev.preventDefault(); ev.stopPropagation();
            var a = ev.touches[0], b = ev.touches[1];
            var d = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            var factor = (d / (this.startPinchDist || d)) || 1;
            var min = (this.minScale || SCALE_MIN);
            this.scale = Math.max(min, Math.min(SCALE_MAX, this.startPinchScale * factor));
            // reset translations so pinch zoom keeps center
            this.clamp(); this.applyTransform();
        }
    };

    SimpleLightbox.prototype.onTouchEnd = function(ev){
        if (ev.touches && ev.touches.length > 0) return; // still fingers
        this.dragging = false;
    };

    SimpleLightbox.prototype.clamp = function(){
        if (!this.img || !this.container) return;
        var contRect = this.container.getBoundingClientRect();
        var imgW = this.img.naturalWidth * this.scale, imgH = this.img.naturalHeight * this.scale;
        // But naturalWidth/height may be large; use displayed size as baseline
        imgW = (this.img.width || contRect.width) * this.scale; imgH = (this.img.height || contRect.height) * this.scale;
        var maxX = Math.max(0, (imgW - contRect.width) / 2);
        var maxY = Math.max(0, (imgH - contRect.height) / 2);
        if (!isFinite(maxX)) maxX = 0; if (!isFinite(maxY)) maxY = 0;
        this.tx = Math.max(-maxX, Math.min(maxX, this.tx));
        this.ty = Math.max(-maxY, Math.min(maxY, this.ty));
    };

    SimpleLightbox.prototype.changeToIndex = function(index){
        if (!this.gallery) this.gallery = getGalleryAnchors();
        if (!this.gallery || this.gallery.length === 0) return;
        // wrap
        var len = this.gallery.length;
        index = ((index % len) + len) % len;
        this.currentIndex = index;
        var src = srcFromLink(this.gallery[this.currentIndex]);
        if (!src) return;
        // update image src and reset transforms
        if (this.img) {
            this.img.style.transition = 'none';
            this.img.src = src;
            this.scale = 1; this.tx = 0; this.ty = 0;
            this.applyTransform();
            // re-enable transition shortly after to keep smoothness
            setTimeout(function(){ try{ if (this.img) this.img.style.transition = ''; }catch(e){} }.bind(this), 50);
        }
        // show/hide nav depending on gallery length
        if (this.gallery.length <= 1) { try{ this.prevBtn.style.display = 'none'; this.nextBtn.style.display = 'none'; }catch(e){} } else { try{ this.prevBtn.style.display = ''; this.nextBtn.style.display = ''; }catch(e){} }
    };

    SimpleLightbox.prototype.openIndex = function(index){
        var anchors = getGalleryAnchors();
        if (!anchors || anchors.length === 0) return;
        this.gallery = anchors;
        this.currentIndex = Math.max(0, Math.min(anchors.length - 1, index || 0));
        // if overlay already open, just change image
        if (this.overlay) {
            this.changeToIndex(this.currentIndex);
            return;
        }
        var src = srcFromLink(this.gallery[this.currentIndex]);
        this.open(src);
    };

    var lb = new SimpleLightbox();

    // Capture clicks on .thumb > a.image at capture phase to prevent other lightboxes
    document.addEventListener('click', function(ev){
        try{
            var t = ev.target;
            var a = t.closest ? t.closest('.thumb > a.image') : null;
            if (!a) return;
            // ignore non-left clicks or modifier-clicks
            if ((ev.button !== undefined && ev.button !== 0) || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
            ev.preventDefault(); ev.stopPropagation();
            // find index among gallery anchors and open at that index
            var anchors = getGalleryAnchors();
            var idx = anchors.indexOf(a);
            if (idx === -1) {
                var src = srcFromLink(a);
                lb.open(src);
            } else {
                lb.openIndex(idx);
            }
        }catch(e){}
    }, true);

})();
