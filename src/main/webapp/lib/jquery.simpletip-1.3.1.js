/**
 * jquery.simpletip 1.3.1. A simple tooltip plugin
 * 
 * Copyright (c) 2009 Craig Thompson
 * http://craigsworks.com
 *
 * Licensed under GPLv3
 * http://www.opensource.org/licenses/gpl-3.0.html
 *
 * Launch  : February 2009
 * Version : 1.3.1
 * Released: February 5, 2009 - 11:04am
 */

(function($){
   var curtip;
   function Simpletip(elem, conf)
   {
      var self = this;
	  
      elem = jQuery(elem);
      var doc = elem.get(0).ownerDocument;
	  var win = doc.body;
      var tooltip = jQuery(doc.createElement('div'))
                     .addClass(conf.baseClass)
                     .addClass( (conf.fixed) ? conf.fixedClass : '' )
                     .addClass( (conf.persistent) ? conf.persistentClass : '' )
                     .appendTo(win);
    
	var closeIcon = null;
	if ( conf.closeIcon){
		var closeIcon = jQuery(doc.createElement("img")).css ({'float':'right'}).css('position','relative').css('right','0px');
		closeIcon.attr('src', conf.closeIcon);
		closeIcon.appendTo(tooltip);
	} 
	 if (typeof(conf.content) == 'string') 
	 	tooltip.html(conf.content);
	 else {
	 	tooltip.append(conf.content);
	 }

	tooltip.css(conf.extraStyles);
	tooltip.css("position", "absolute");
	
      if (!conf.hidden) {
         tooltip.show();
      } else {
         tooltip.hide();
      }
      
      if(!conf.persistent)
      {
         elem.hoverIntent(
            function(event){
					if ( event.relatedTarget != tooltip.get(0) &&  (!closeIcon || (closeIcon && event.relatedTarget != closeIcon.get(0)))) 
						self.show(event) 
			},
            function(event){ if (!conf.focus) self.hide() }
         );
         
         if(!conf.fixed)
         {
            elem.mousemove( function(event){ 
               if(tooltip.css('display') !== 'none' && !conf.fixed) self.updatePos(event); 
            });
         };
		 
		 if ( conf.focus) {
		 	  if ( closeIcon){
			  	closeIcon.mousedown(function(event) {
					self.hide();
				});
			  } else {
			     jQuery(win).mousedown(function(event) { 
            		if(tooltip.css('display') !== 'none')
            		{
               		var check = jQuery(event.target).parents('.tooltip').andSelf().filter(function(){ return this === tooltip.get(0) }).length ;
               		if(check === 0) self.hide();
            		};
         		});
			}
		 }
      }
      else
      {
         elem.click(function(event)
         {
            if(event.target === elem.get(0))
            {
               if(tooltip.css('display') !== 'none')
                  self.hide();
               else
                  self.show();
            };
         });
         
         jQuery(win).mousedown(function(event)
         { 
            if(tooltip.css('display') !== 'none')
            {
               var check = (conf.focus) ? jQuery(event.target).parents('.tooltip').andSelf().filter(function(){ return this === tooltip.get(0) }).length : 0;
               if(check === 0) self.hide();
            };
         });
      };
      
      
      jQuery.extend(self,
      {
         getVersion: function()
         {
            return [1, 2, 0];
         },
         
         getParent: function()
         {
            return elem;
         },
         
         getTooltip: function()
         {
            return tooltip;
         },
         
         getPos: function()
         {
            return tooltip.offset();
         },
         
         setPos: function(posX, posY)
         {
            var elemPos = elem.offset();
            
            if(typeof posX == 'string') posX = parseInt(posX) + elemPos.left;
            if(typeof posY == 'string') posY = parseInt(posY) + elemPos.top;
            
            tooltip.css({ position:'absolute', left: posX, top: posY });
            
            return self;
         },
         
         show: function(event)
         {
            if (conf.disabled) {
                return;
            }
            try {
		 	if ( conf.fixed && tooltip.css('display') != 'none' )
				return;
			
			if (conf.onetip) {
				if (curtip) {
					curtip.hide();
				}
				curtip = self;
			}
			
            conf.onBeforeShow.call(self);
            
            switch(conf.showEffect)
            {
               case 'fade': 
                  tooltip.fadeIn(conf.showTime); break;
               case 'slide': 
                  tooltip.slideDown(conf.showTime, self.updatePos); break;
               case 'custom':
                  conf.showCustom.call(tooltip, conf.showTime); break;
               default:
               case 'none':
                  tooltip.show(); break;
            };
            
            self.updatePos( (conf.fixed && conf.position != 'cursor') ? null : event );
            
            tooltip.addClass(conf.activeClass);
            
            conf.onShow.call(self);
            
            } catch (ex) {
                lore.debug.anno("Error in simpletip", ex);
            }
            return self;
         },
         
         hide: function()
         {
            conf.onBeforeHide.call(self);
            
            switch(conf.hideEffect)
            {
               case 'fade': 
                  tooltip.fadeOut(conf.hideTime); break;
               case 'slide': 
                  tooltip.slideUp(conf.hideTime); break;
               case 'custom':
                  conf.hideCustom.call(tooltip, conf.hideTime); break;
               default:
               case 'none':
                  tooltip.hide(); break;
            };
            
            tooltip.removeClass(conf.activeClass);
            
            conf.onHide.call(self);
            
            return self;
         },
         
         update: function(content)
         {
            tooltip.html(content);
            conf.content = content;
            
            return self;
         },
         
         load: function(uri, data)
         {
            conf.beforeContentLoad.call(self);
            
            tooltip.load(uri, data, function(){ conf.onContentLoad.call(self); });
            
            return self;
         },
         
         boundryCheck: function(posX, posY)
         {
            var newX = posX + tooltip.outerWidth();
            var newY = posY + tooltip.outerHeight();

//            For jQuery 1.4.2
//            var w = tooltip.get(0).ownerDocument.defaultView ;
//            var windowWidth = jQuery(w).width() + jQuery(w).scrollLeft();
//            var windowHeight = jQuery(w).height() + jQuery(w).scrollTop();
            
            var doc = tooltip.get(0).ownerDocument.documentElement;
            var windowWidth = doc.clientWidth + doc.scrollLeft;
            var windowHeight = doc.clientHeight + doc.scrollTop;
            
            return [(newX >= windowWidth), (newY >= windowHeight)];
         },
         
         updatePos: function(event)
         {
            var posX;
            var posY;
            var tooltipWidth = tooltip.outerWidth();
            var tooltipHeight = tooltip.outerHeight();
            
            if(!event && conf.fixed)
            {
               if(conf.position.constructor == Array)
               {
                  posX = parseInt(conf.position[0]);
                  posY = parseInt(conf.position[1]);
               }
               else if(jQuery(conf.position).attr('nodeType') === 1)
               {
                  var offset = jQuery(conf.position).offset();
                  posX = offset.left;
                  posY = offset.top;
               }
               else
               {
			     var elemPos = elem.offset();
                 var elemWidth = elem.outerWidth();
                 var elemHeight = elem.outerHeight();

                  switch(conf.position)
                  {
                     case 'top':
                        var posX = elemPos.left - (tooltipWidth / 2) + (elemWidth / 2);
                        var posY = elemPos.top - tooltipHeight;
                        break;
                        
                     case 'bottom':
					 	var posX = elemPos.left - (tooltipWidth / 2) + (elemWidth / 2);
                        var posY = elemPos.top + elemHeight;
						
                        break;
                     
                     case 'left':
                        var posX = elemPos.left - tooltipWidth;
                        var posY = elemPos.top - (tooltipHeight / 2) + (elemHeight / 2);
                        break;
                        
                     case 'right':
                        var posX = elemPos.left + elemWidth;
                        var posY = elemPos.top - (tooltipHeight / 2) + (elemHeight / 2);
                        break;

				             
                     default:
                     case 'default':
                        var posX = (elemWidth / 2) + elemPos.left + 20;
                        var posY = elemPos.top;
                        break;
                  };
               };
            }
            else
            {
			   var posX = event.pageX;
               var posY = event.pageY;
            };
            
            if(typeof conf.position != 'object')
            {
               posX = posX + conf.offset[0];
               posY = posY + conf.offset[1]; 
               
               if(conf.boundryCheck)
               {
					var overflow = self.boundryCheck(posX, posY);
					if (overflow[0]) {
//                      For jQuery 1.4.2
//                        var w = tooltip.get(0).ownerDocument.defaultView ;
//                        var windowWidth = jQuery(w).width() + jQuery(w).scrollLeft();
                        
                        var doc = tooltip.get(0).ownerDocument.documentElement;
                        var windowWidth = doc.clientWidth + doc.scrollLeft;
                        posX = windowWidth - tooltipWidth - 5;
                        if (posX < 0) posX = 5;
					}
					if (overflow[1]) {
						posY = posY - (tooltipHeight / 2) - (2 * conf.offset[1]);
					}
               }
            }
            else
            {
               if(typeof conf.position[0] == "string") posX = String(posX);
               if(typeof conf.position[1] == "string") posY = String(posY);
            };
            self.setPos(posX, posY);
            
            return self;
         },
         
         enable: function() {
            conf.disabled = false;
         },
         disable: function() {
            this.hide();
            conf.disabled = true;
         }
      });
   };
   
   jQuery.fn.simpletip = function(conf)
   { 
      // Check if a simpletip is already present
      var api = jQuery(this).eq(typeof conf == 'number' ? conf : 0).data("simpletip");
      if(api) {
         api.enable();
         return api;
      }
      
      // Default configuration
      var defaultConf = {
         // Basics
         content: 'A simple tooltip',
         persistent: false,
         focus: false,
         hidden: true,
         disabled: false,
         
         // Positioning
         position: 'default',
         offset: [0, 0],
         boundryCheck: true,
         fixed: true,
		 onetip: false,
		 closeIcon: null,
         
         // Effects
         showEffect: 'fade',
         showTime: 150,
         showCustom: null,
         hideEffect: 'fade',
         hideTime: 150,
         hideCustom: null,
         
         // Selectors and classes
         baseClass: 'tooltip',
         activeClass: 'active',
         fixedClass: 'fixed',
         persistentClass: 'persistent',
         focusClass: 'focus',
         
         // Callbacks
         onBeforeShow: function(){},
         onShow: function(){},
         onBeforeHide: function(){},
         onHide: function(){},
         beforeContentLoad: function(){},
         onContentLoad: function(){}
      };
      jQuery.extend(defaultConf, conf);
      
      this.each(function()
      {
         var el = new Simpletip(jQuery(this), defaultConf);
         jQuery(this).data("simpletip", el);  
      });
      
      return this; 
   };
})();