(function($) {
   $.fn.resizeToParent = function(opts) {
      var defaults = {
         parent : 'div',
         delay : 100
      }

      var opts = $.extend(defaults, opts);

      function positionImage(obj) {
         // reset image (in case we're calling this a second time, for example on resize)
         obj.css({'width' : '', 'height' : '', 'margin-left' : '', 'margin-top' : ''});

         // dimensions of the parent
         var parentWidth = obj.parents(opts.parent).width();
         var parentHeight = obj.parents(opts.parent).height();

         var imageWidth = obj.width();
         // dimensions of the image
         if ("undefined" !== typeof opts.imageWidth) {
            imageWidth = opts.imageWidth;
         }

         var imageHeight = obj.height();
         if ("undefined" !== typeof opts.imageHeight) {
            imageHeight = opts.imageHeight;
         }

         // step 1 - calculate the percentage difference between image width and container width
         var diff = imageWidth / parentWidth;

         // step 2 - if height divided by difference is smaller than container height, resize by height. otherwise resize by width
         if ((imageHeight / diff) < parentHeight) {
            obj.css({'width' : 'auto', 'height' : parentHeight});

            // set image variables to new dimensions
            imageWidth = imageWidth / (imageHeight / parentHeight);
            imageHeight = parentHeight;
         } else {
            obj.css({'height' : 'auto', 'width' : parentWidth});

            // set image variables to new dimensions
            imageWidth = parentWidth;
            imageHeight = imageHeight / diff;
         }

         // step 3 - center image in container
         var leftOffset = (imageWidth - parentWidth) / -2;
         var topOffset = (imageHeight - parentHeight) / -2;

         obj.css({'margin-left' : leftOffset, 'margin-top' : topOffset});
      }

      // run the position function on window resize (to make it responsive)
      var tid;
      var elems = this;

      $(window).on('resize', function() {
         clearTimeout(tid);
         tid = setTimeout(function() {
            elems.each(function() {
               positionImage($(this));
            });
         }, opts.delay);
      });

      return this.each(function() {
         var obj = $(this);

         // hack to force ie to run the load function... ridiculous bug 
         // http://stackoverflow.com/questions/7137737/ie9-problems-with-jquery-load-event-not-firing
         // obj.attr("src", obj.attr("src")); -- / sathish / need to find a way to get images for ie browswers

         // bind to load of image
         obj.load(function() {
            positionImage(obj);
         });

         // run the position function if the image is cached
         if (this.complete) {
            positionImage(obj);
         }
      });
   }
})(jQuery);