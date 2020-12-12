/**
 * This code handle the UI functionality of inline lookups.  It's written to be stand alone
 * but has several extension points for integrating into different applications.
 *
 * URL - The URL to post queries to.
 * preFlightFunc - A function to turn the basic query message into something
 *                 that the backend can digest.
 * postFlightFunc - A function that can perform extra processing when a reply
 *                  is returned from the back end.
 * selectedFunc - A function to handle extra processing when an item is selected.
 *
 * All of these functions can be null.
 * 
 * context - Extra data passed along in the POST.
 * 
 * In the AJAX handler, the reply MUST be a JSONObject with:
 * o  A JSONArray of JSONObjects called "groups".
 * 
 * Each JSONObject is a result group with:
 * o  An optional String value called "title".
 * o  A JSONArray called "results".  Each entry is a JSONObject with:
 *      + A String called "value".
 *      + An HTML String called "display".
 * 
 * The handler can supply extra information for the integration, if needed.
 * 
 * Bind() Options:
 * ---------------
 * forceSelection: true/false - Force the user to pick from the list else they get nothing
 * emptyText: <string> - Show grey-ed out text when the field is empty.
 * 
 */
_IW.InlineLookup = function()
{
	
	var TYPE_TO_SEARCH_VERBIAGE = "Type to search";
	
	var _url;
	var _preFlightFunc;
	var _postFlightFunc;
	var _remoteAjax = false;
	var _current;
	var _ilDefaultDelay = 750;
	var _delayedActions = {};
	var _isMobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) );

	
	var setRemoteAjax = function(remoteAjax)
	{
		_remoteAjax = remoteAjax;
	}
	
	var init = function(url, preFlightFunc, postFlightFunc)
	{
		_url = url;
		_preFlightFunc = preFlightFunc;
		_postFlightFunc = postFlightFunc;
	}
	
	var bind = function(field, context, selectedFunc, options)
	{
		
		if (typeof field == "string") 
			field = document.getElementById(field);
		
		field.setAttribute('autocomplete', 'off');
		field.setAttribute('placeholder', TYPE_TO_SEARCH_VERBIAGE);
		
		var self = {
			field: field,
			context: context,
			selectedFunc: selectedFunc,
			selected: -1,
			oldVal: "",
			options: options ? options : { }
		};
		
		var $field = jQuery(self.field);

		$field.bind('paste', function(event)
		{
			setTimeout(function()
			{ 
				return _keyUp(self, event);
			},100);
		});
		
		// This is for mobile devices, iOS in particular.
		// Android (and perhaps other devices) doesn't need this hack.
		// Scenario:  The user is entering text into an
		// in-line lookup field.  This results in the phone
		// presenting some predictive words to the user.
		// If the user chooses one of the predictive words,
		// the in-line lookup field should show matching entries
		// to the user.  See NGP-27760.
		$field.bind('input', function(event)
		{
			if (window.innerWidth < 769 )
			{
				setTimeout(function()
				{ 
					return _keyUp(self, event);
				},100);
			}
		});

		$field.keydown(function(event)
		{
			return _keyPress(self, event);
		});
		
		$field.keyup(function(event)
		{
			_keyUp(self, event);
		});
		
		$field.focus(function()
        {
	        if ($field.hasClass('defaultTextActive'))
	        {
	        	$field.removeClass('defaultTextActive');
	            $field.val("");
	        }
        });

		$field.blur(function(event)
		{
			// if mouse is over the div which is dropdown box, let's cancel the onblur event
			// this is the fix for IE10 which when mouse clicks the scrollbar onblur event
			// occurs.
			// Also, for mobile (iOS in particular), the blur event is fired when the "done"
			// button is clicked.  That button has keyCode == 0.  In the case of the "done"
			// button clicked, the inline lookup "popup div" should still be visible to the user.
			if (self.popupDiv && (self.popupDiv.getAttribute("lookupMouseOver") == "true" ||
					(event.keyCode == 0 && _isMobile)))
			{
				// here, we need to keep focused
				$field.focus();
				return false;
			}

			_blur(self);
			return true;
		});
        
		$field.parents("form:first").submit(function() 
        {
	        if ($field.hasClass('defaultTextActive')) {
	        	$field.removeClass('defaultTextActive');
	        	$field.val("");
			}
		});
		
		$field.attr("ilDelay",_ilDefaultDelay);

        // Assume any existing value is 'stuffed'
        var initialVal = $field.val();
        if (initialVal && initialVal != "")
        	$field.attr('stuffedValue', initialVal);

        // Call blur to setup the initial emptyText state (if we have any)
        _blur(self);
	}
	
	var _blur = function(self)
	{
		_popdown(self);

		var $field = jQuery(self.field);

		if (self.options.forceSelection && self.selected < 0)
		{
			if ($field.val() == $field.attr('stuffedValue'))
				return;
			
			$field.removeAttr('stuffedValue');

			if (!$field.hasClass('defaultTextActive'))
			{
				$field.val("");
				if (self.selectedFunc)
					self.selectedFunc(self.field, null);
			}
		}

		if (self.options.emptyText && $field.val() == "")
        {
			$field.addClass('defaultTextActive');
			$field.val(self.options.emptyText);
        }

		// logic here is that if what type in the inputbox matches any of
		// the searched result, populate all related fields, otherwise,
		// clear all related fields
		if (self.selected < 0) {
			var oldVal = self.oldVal;
			var allResults = self.allResults;
			if (oldVal && allResults && allResults.length > 0) {
				var matchFound = false;
				for (var idxAllResults = 0; idxAllResults < allResults.length; idxAllResults++) {
					if (allResults[idxAllResults].value === oldVal) {
						matchFound = true;
						_select(self, idxAllResults);
						break;
					}
				}
				if (!matchFound) {
					processUnMatchedValue(self);
				}
			} else {
				processUnMatchedValue(self);
			}
		}
	}

	var processUnMatchedValue = function(self) {
		var lastResults = self.lastResults;
		if (lastResults && lastResults.otherFields) {
			delete lastResults.otherFields[self.field.fieldId];
			_resetOtherFields(self, lastResults);
		}
	}

	var _keyPress = function(self, event)
	{
		var code = event.keyCode ? event.keyCode : event.which;
		
		if (code == 40) // jQuery.ui.keyCode.DOWN
		{
			_arrowPress(self, 1);
			return false;
		}
		else if (code == 38) // jQuery.ui.keyCode.UP
		{
			_arrowPress(self, -1);
			return false;
		}
		else if (code == 13) // jQuery.ui.keyCode.ENTER
		{
			_blur(self);
			return false;
		}
		else if (code == 9) // jQuery.ui.keyCode.TAB
		{
			_blur(self);
			return true;
		}
		
		return true;
	}
	
	var _popup = function(self)
	{
		// Lazy create the popup
		if (!self.popupDiv)
		{
			var popupDiv = document.createElement("div");
			popupDiv.style.fontSize = jQuery(self.field).css('fontSize');
			popupDiv.style.fontFamily = jQuery(self.field).css('fontFamily');
			popupDiv.style.fontWeight = jQuery(self.field).css('fontWeight');
			popupDiv.style.position = "absolute";
			popupDiv.style.background = "white";
			popupDiv.style.display = "none";
			popupDiv.style.border = "solid 1px black";
			popupDiv.style.overflowY = "scroll";
			popupDiv.style.overflowX = "hidden";
			popupDiv.style.height = "auto";
			
			popupDiv.onmouseout = function(e)
			{
				popupDiv.setAttribute("lookupMouseOver", "false");
			}
			popupDiv.onmouseover = function(e)
			{
				popupDiv.setAttribute("lookupMouseOver", "true");
			}
			
			self.field.parentNode.appendChild(popupDiv);
			
			self.popupDiv = popupDiv;
		}
				
		if (self.popupDiv.style.display == "none") 
		{
			self.popupDiv.innerHTML = "";
			
            var offset = jQuery(self.field).position();
            var height = jQuery(self.field).outerHeight({"margin": true});

            offset.top += height;

            //jQuery(self.popupDiv).position(offset);
            jQuery(self.popupDiv).css("left", offset.left + "px").css("top", offset.top + "px");
            
            jQuery(self.popupDiv).css("display", "block");
		}
		
		_current = self;
	}
	
	var _popdown = function(self)
	{
		jQuery(self.popupDiv).css("display", "none");
		
		_current = undefined;
	}
	
	var _arrowPress = function(self, direction)
	{
		if (self.popupDiv.style.display == "none") 
			return;
		
		var toSelect = self.selected + direction;
		
		var numDivs = self.allDivs.length;
		
		if (toSelect < 0) 
			toSelect = numDivs - 1;
		
		toSelect %= numDivs;
		
		_select(self, toSelect);
	}
	
	var _unselect = function(self)
	{
		if (self.selected >= 0) 
			self.allDivs[self.selected].style.background = "white";
		
		self.selected = -1;
	}

	var _resetOtherFields = function(self, resetResult)
	{
		_unselect(self);

		if (self.selectedFunc)
			self.selectedFunc(self.field, resetResult);
	}

	var _select = function(self, toSelect)
	{
		_unselect(self);
		
		self.selected = toSelect;
		
		var selectedDiv = self.allDivs[self.selected];
		
		selectedDiv.style.background = "rgb(213, 226, 255)";
		
		self.field.value = self.allResults[self.selected].value;
		
		// Pretend this was the last search value so that we don't search on it.
		self.oldVal = self.field.value;
		
		if (self.selectedFunc)
			self.selectedFunc(self.field, self.allResults[self.selected]);
	}
	
	var _keyUp = function(self, event)
	{
		var $field = jQuery(self.field);
		
		var newVal = $field.val();
		
		// trim()
		newVal = newVal.replace(/^\s+|\s+$/g,"");
		
		// We only care about keys that aren't white space.	
		if (newVal == self.oldVal || newVal == $field.attr('stuffedValue')) 
			return;
		
		$field.removeAttr('stuffedValue');
		var delay = $field.attr("ilDelay");

		_unselect(self);
		
		if (newVal && newVal.length > 2) 
		{
			if(_delayedActions[$field.attr('id')]!=undefined){
				clearTimeout(_delayedActions[$field.attr('id')]);
			}
			_delayedActions[$field.attr('id')] = window.setTimeout(function(){_search(self, newVal)}, delay);
		}
		else 
		{
			_popdown(self);
		}
		
		self.oldVal = newVal;
	}
	
	var _search = function(self, newVal)
	{
		var message = {
			context: self.context,
			search: newVal
		};
		
		// Give the integrator a chance to massage the message
		if (_preFlightFunc) 
			message = _preFlightFunc(message);
		
		ajax(self, message);
	}
	
	var ajax = function(self, message)
	{
		if(_remoteAjax){
			var bjaxRefId = null;
			
			if(message.bjaxRefId){
				bjaxRefId = message.bjaxRefId;
				
				delete message.bjaxRefId;
			}
			
			jQuery.bjax({
				url: _url,
				data: jQuery.toJSON(message),
				bjaxRefId: bjaxRefId,
				success: function(data){
					if (data.status != "ok" && data.msg) 
						alert(data.msg);
					else 
						_processResults(self, data);
				},
				error: function()
				{
					alert("An error occurred while trying to communicate with the server");
				}
			});
		}
		else{
			jQuery.ajax({
				url: _url,
				type: "POST",
				cache: false,
				data: jQuery.toJSON(message),
				dataType: "json",
				processData: false,
				contentType: "application/json",
				success: function(data, textStatus)
				{
					if (data.status != "ok" && data.msg) 
						alert(data.msg);
					else 
						_processResults(self, data);
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
					alert("An error occurred while trying to communicate with the server");
				}
			});
		}
	}
	
	var _processResults = function(self, data)	
	{
		if (_postFlightFunc)
			data = _postFlightFunc(data);
			
		self.selected = -1;
		self.lastResults = data;
		self.allDivs = [ ];
		self.allResults = [ ];
		
		if (data.groups && data.groups.length) 
		{
			_popup(self);

			self.popupDiv.innerHTML = "";			
			self.popupDiv.style.height = "auto";

			var totalNumResults = 0;
			
			var ul = document.createElement("ul");
			ul.style.padding = "0px";
			ul.style.listStyleType = "none";
			ul.style.cursor = "pointer";
			
			self.popupDiv.appendChild(ul);

			for (var k = 0; k < data.groups.length; k++) 
			{
				var oneGroup = data.groups[k];
				
				if (oneGroup.title)
				{
					var oneLi = document.createElement("li");
					oneLi.style.padding = "5px";
					oneLi.style.whiteSpace = "nowrap";
					oneLi.style.cursor = "auto";
					oneLi.innerHTML = "<center><i style='display:block;border-bottom:solid 1px black'>" +
						jQuery(document.createElement("div")).text(oneGroup.title).html() +
						"</i></center>";
					jQuery(oneLi).mousedown(function(e)
					{
						e.preventDefault();
					});
					ul.appendChild(oneLi);
				}
								
				for (var i = 0; i < oneGroup.results.length; i++) 
				{
					var oneResult = oneGroup.results[i];
					
					self.allResults.push(oneResult);
					
					var oneLi = document.createElement("li");
					oneLi.style.padding = "5px";
					oneLi.style.whiteSpace = "nowrap";
					oneLi.style.cursor = "pointer";
					oneLi.innerHTML = oneResult.display;
					
					self.allDivs.push(oneLi);
					
					// We use mousedown rather than click because click will wait for
					// mouse up before firing and that's potentially too late because
					// the on blur handler will have fired already and will try to 
					// popdown the div.
					jQuery(oneLi).mousedown(_bind(function(self2, toSelect)
					{
						_select(self2, toSelect);
						_popdown(self2);
					}, self, self.allResults.length - 1));
					
					ul.appendChild(oneLi);
					
					// If we reach 10, then fix the height
					if (totalNumResults++ == 9)
						self.popupDiv.style.height = jQuery(self.popupDiv).height() + "px";
				}
			}
		}
		else 
		{
			if (self.options.forceSelection)
			{
				_popup(self);
				
				self.popupDiv.innerHTML = "";			
				self.popupDiv.style.height = "auto";
			
				var ul = document.createElement("ul");
				ul.style.padding = "0px";
				ul.style.listStyleType = "none";
				ul.style.cursor = "pointer";
			
				self.popupDiv.appendChild(ul);
				
				var oneLi = document.createElement("li");
				oneLi.style["font-style"] = "italic";
				oneLi.style["margin"] = "3px";
				oneLi.innerHTML = "-No Results-";
				
				ul.appendChild(oneLi);
				
				// We use mousedown rather than click because click will wait for
				// mouse up before firing and that's potentially too late because
				// the on blur handler will have fired already and will try to 
				// popdown the div.
				jQuery(oneLi).mousedown(_bind(function(self2)
				{
					self2.field.value = "";
					_popdown(self2);
				}, self));
			}
			else
			{
				_popdown(self);
			}
		}
	}
	
	/**
	 * This functions creates a function.  We use it to break the closure.
	 * This mimics the prototype.js bind() function.  Read about it there for more info
	 */
	var _bind = function()
	{
		var obj = this;
		var func = arguments[0];
		var args = [];
		for (var i = 1; i < arguments.length; i++) 
			args.push(arguments[i]);
		return function()
		{
			return func.apply(obj, args);
		}
	}
	
	jQuery(function() {
		jQuery(document.body).click(function(e) {
			if (_current)
			{
				// Ignore clicks within current div
				for (var target = e.target; target; target = target.parentNode)
				{
					if (target == _current.popupDiv)
						return;
				}
				
				_blur(_current);
			}
		});
	});
	
	return {
		init: init,
		bind: bind,
		setRemoteAjax: setRemoteAjax
	}
}();
