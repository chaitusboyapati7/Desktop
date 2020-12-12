_IW.FormsRuntime = function()
{
	var $_busyDialog;
	var _busyTime;
	var $_tabsDiv;
	var $_tabs;
	var _fileExtensionWhitelist = {};
	var _runtimeURL;
	var _seed = 0;
	var _templates = {};
	var _formId;
	var _filesUploaded = [];
	var _deleteAttachments = [];
	var _requiresLogin = false;
	var _multiPage = true;
	var _remoteAjax = false;
	var _serverURL = "";
	var _cancelConfirmationMsg = "Are you sure you want to stop and/or withdraw your application";
    var _dbUniqueIdClass = "dbUniqueId";
	var _loaded = false;
	var _PROTOCOL_SEP = "://";
	var _SCHEME_HTTP = "http";
	var _fileUploadTimeouts = [];
	var _postSubmitRedirectOverride;
	var _submitting = false;
	var _removedSectionIds =[];
	var _timeoutTable = [500,1000,2000,1000];
	
	var getServerURL = function()
	{
		return _serverURL;
	}
	
	var setServerURL = function(serverURL)
	{
		_serverURL = serverURL;
	}
	
	var setRemoteAjax = function(remoteAjax)
	{
		_remoteAjax = remoteAjax;
		
		_IW.InlineLookup.setRemoteAjax(remoteAjax);
		
		_etph();
	}
	
	var getRuntimeURL = function()
	{
		return _runtimeURL;
	}
	
	var setRuntimeURL = function(url)
	{
		_runtimeURL = url;
		
		// Now that we have the URL, tell the inline lookup about it
		// NOTE that we pass a function with a function call just so we can 
		// override the inlineLookupPreflight function in derived files.
		_IW.InlineLookup.init(url, function(m) { return inlineLookupPreflight(m); });
	}
	
	var getRuntimeURL = function()
	{
		return _runtimeURL;
	}
	
	var getSeed = function()
	{
		return _seed;
	}
	
	var setSeed = function(newSeed)
	{
		_seed = newSeed;
	}
	
	var getRequiresLogin = function()
	{
		return _requiresLogin;
	}
	
	var getUniqueId = function()
	{
		return ++_seed;
	}
	
	var getTabs = function()
	{
		return $_tabsDiv;
	}

	var isMultiPage = function()
	{
		return _multiPage;
	}
	
	var setCancelConfirmationMessage = function(msg)
	{
		_cancelConfirmationMsg = msg;
	}
	
	var setPostSubmitRedirectOverride = function(action)
	{
		_postSubmitRedirectOverride = action;
	}

	var performSaveOnNextPrevButton = function(selectedTabIndex)
	{
		return true;
	}
	
	var resizeForm = function()
	{
		// Wrap a try/catch around this code.  We don't want older grumpy browsers to choke.
		try{
			// Calculate a new page with and apply the width to each page.
			//
			// The calculation should look like this: (calculating for X Axis)
			//
			// pageWidth = form wrapper - widths of form element padding, border, margin - widths of page padding, border, margin - tab width (if tab is on left).		
			var newWidth;
			var isTabsLeft = jQuery("#form-wrapper.ui-tabs-left");
			
			var formWrapperWidth = jQuery("#form-wrapper").first().width();
			var tabWidth = jQuery(".ui-tabs-nav").first().outerWidth(true);

			// Get the forms left, right padding, left border, right border, left margin and right margin.  We need these numbers
			// because this is what is between form-wrapper and the form page.
			var dynamicForm = jQuery("[id^=iwdf-dynamicform-]").first();
			var formPaddingR = dynamicForm.css("padding-right").replace("px", "");
			var formPaddingL = dynamicForm.css("padding-left").replace("px", "");
			var formBorderL = dynamicForm.css("border-left-width").replace("px", "");
			var formBorderR = dynamicForm.css("border-right-width").replace("px", "");
			var formMarginL = dynamicForm.css("margin-left").replace("px", "");
			var formMarginR = dynamicForm.css("margin-right").replace("px", "");

			// Get the page's left, right padding, left border, right border, left margin and right margin.  We also need these
			// numbers because setting a width of a page wouldn't include padding, margins or border.
			var formPage = jQuery("[id^=iwdf-page-]").first();
			var pagePaddingR = formPage.css("padding-right").replace("px", "");
			var pagePaddingL = formPage.css("padding-left").replace("px", "");
			var pageBorderL = formPage.css("border-left-width").replace("px", "");
			var pageBorderR = formPage.css("border-right-width").replace("px", "");
			var pageMarginL = formPage.css("margin-left").replace("px", "");
			var pageMarginR = formPage.css("margin-right").replace("px", "");
			
			// Subtract form and page stuff to get a new width (not including tabs).
			newWidth = (Math.ceil(formWrapperWidth) - 
				Math.ceil(formPaddingR) - Math.ceil(formPaddingL) - Math.ceil(formBorderL) - Math.ceil(formBorderR) - Math.ceil(formMarginL) - Math.ceil(formMarginR) -
				Math.ceil(pagePaddingR) - Math.ceil(pagePaddingL) - Math.ceil(pageBorderL) - Math.ceil(pageBorderR) - Math.ceil(pageMarginL) - Math.ceil(pageMarginR)
			);

			// if the tabs are on the left subtract that width too.
			if(isTabsLeft.length > 0)
			{
				newWidth = newWidth - Math.ceil(tabWidth);
			}

			// Set the new width.
			jQuery("[id^=iwdf-page-]").first().width(newWidth);
			
			// Set button attributes to change type to either submit or button, 
			// depending upon mobile or desktop (determined by screen width).
			var submitButtons = jQuery("button[class*='submit']");
			if (window.innerWidth < 769 && submitButtons.length > 0)
			{
				// change type attribute to "submit"
				if (submitButtons.length == 1)
				{ 
					 // one page form only has one submit button
					submitButtons[0].setAttribute("type", "submit");
				}
				else
				{	
					// the bottom button bar needs have one type changed to "submit"
					// We can't have 2 with type submit, otherwise user won't be
					// able to submit form via phone's GO button
					submitButtons[1].setAttribute("type", "submit");
					submitButtons[0].setAttribute("type", "button");
				}
			}
			else
			{
				// change type attribute to "button"
				if (submitButtons.length == 1) 
				{ 
					// one page form only has one submit button
					submitButtons[0].setAttribute("type", "button");
				}
				else 
				{	submitButtons[0].setAttribute("type", "button");
					submitButtons[1].setAttribute("type", "button");	
				}
			}
		}
		catch(e){
			// Don't cause a JS failure.
		}
	}
	
	var bootstrap = function(seed, tabsDivId, formId, fileExtensionWhitelist, formParams)
	{
		_seed = seed;
		_multiPage = formParams.MultiPage;
		
		jQuery( window ).resize(function()
		{
			resizeForm();
		});
		//if form is within iframe and the width is less than 300 we want to show alert within iframe by shrinking the message..
	    var smallerWindow = false;
		if(window.innerWidth <= 300){
			smallerWindow = true;
		}
		
		$_busyDialog = jQuery("<div><span class=\"msg-wrapper busy\"><span class=\"msg\"></span></span></div>").dialog({ 
			autoOpen: false,
			modal: true,
			resizable: false,
			minHeight: 0,
			width: smallerWindow ? 'auto' : '300px',
			title: "Please wait",
			open:function() { 
				jQuery(this).parents(".ui-dialog:first").find(".ui-dialog-titlebar-close").remove(); 
			}
		}).css("text-align", "center");
		
		$_tabsDiv = jQuery('#' + tabsDivId);
		if(_multiPage == true){
			$_tabs = $_tabsDiv.tabs({
				select: function(event, ui){
					// Install content class setters based on the tab selected.
					if(ui.tab === jQuery(".ui-tabs-nav > li:first > a", $_tabsDiv).get(0)){
						jQuery("#form-wrapper").addClass("first-page");
					}
					else{
						jQuery("#form-wrapper").removeClass("first-page");
					}
					
					if(ui.tab === jQuery(".ui-tabs-nav > li:last > a", $_tabsDiv).get(0)){
						jQuery("#form-wrapper").addClass("last-page");
					}
					else{
						jQuery("#form-wrapper").removeClass("last-page");
					}
				},
				show: function(event, ui){
					jQuery("html, body").scrollTop(0);
				},
				selected: 0
			});
		}
		else{
			$_tabsDiv.children("ul:first").css("display", "none");
		}
		
		// Initialize content class setters based on the tabs selected.
		var _tab_length = (_multiPage) ? $_tabs.tabs("length") : 0;
		
		if(_tab_length >= 1)
		{
			var $_tab_selected = jQuery(".ui-tabs-nav > li.ui-tabs-selected > a", $_tabsDiv).get(0);
			
			// We are already in the first 
			if($_tab_selected === jQuery(".ui-tabs-nav > li:first > a", $_tabsDiv).get(0)){
				jQuery("#form-wrapper").addClass("first-page");
			}
			
			if($_tab_selected === jQuery(".ui-tabs-nav > li:last > a", $_tabsDiv).get(0)){
				jQuery("#form-wrapper").addClass("last-page");
			}
		}
		else
		{
			jQuery("#form-wrapper").addClass("no-pages");
		}
		
		_formId = formId;
		_fileExtensionWhitelist = fileExtensionWhitelist;
		_requiresLogin = formParams.RequiresLogin;
		
		// All hover and click logic for buttons
		_installButtonActions(".fg-button:not(.ui-state-disabled)");
		
		_loadingComplete();
		
		resizeForm();
	}
	
	var _loadingComplete = function()
	{
		_loaded = true;
	}
	
	var isLoaded = function()
	{
		return _loaded;
	}
	
	var _etph = function() 
	{
		// Don't let any errors here propagate out
		try
		{
			var url = document.location.href;
			var title = document.title;
			
			var head = document.getElementsByTagName("head")[0];
	
			var scripturl = _serverURL + '/crm/etph.sas?formid=' + _formId +
				"&title=" + escape(title) + "&url=" + escape(url);
			
		    var script = document.createElement("script");
		    script.setAttribute("src", scripturl);
		    script.setAttribute("type", "text/javascript");
		    head.appendChild(script);
		}
		catch(e)
		{
		}
	}
	
	var _newButton = function(label)
	{
		var button = document.createElement("button");
		//button.type = "button";
		button.className = "fg-button ui-state-default ui-corner-all";
		button.innerHTML = label;

		_installButtonActions(button);
		
		return button;
	}
	
	var _installButtonActions = function(selector)
	{
		jQuery(selector).hover(function()
			{
				jQuery(this).addClass("ui-state-hover");
			}, function()
			{
				jQuery(this).removeClass("ui-state-hover");
			}).mousedown(function()
			{
				jQuery(this).parents('.fg-buttonset-single:first').find(".fg-button.ui-state-active").removeClass("ui-state-active");
				if (jQuery(this).is('.ui-state-active.fg-button-toggleable, .fg-buttonset-multi .ui-state-active')) 
				{
					jQuery(this).removeClass("ui-state-active");
				}
				else 
				{
					jQuery(this).addClass("ui-state-active");
				}
			}).mouseup(function()
			{
				if (!jQuery(this).is('.fg-button-toggleable, .fg-buttonset-single .fg-button, .fg-buttonset-multi .fg-button')) 
				{
					jQuery(this).removeClass("ui-state-active");
				}
			});
	}
	
	var notBusy = function(immediate)
	{
		if (immediate)
		{
			$_busyDialog.dialog("close");
			return;
		}
		
		// Don't show the dialog for less than 2 seconds
		var now = new Date().getTime();
		var elapsed = now - _busyTime;
		var delay = elapsed < 2000 ? 2000 : 0;
		
		setTimeout(function() {
			$_busyDialog.dialog("close");
		}, delay);
		
		return;
	}
	
	var busy = function(message, immediate)
	{
		// Record the time we popup the dialog
		_busyTime = new Date().getTime();
		
		jQuery("span.msg", $_busyDialog).html(message);
		
		$_busyDialog.dialog("open");
	}
	
	var setTemplate = function(sectionType, templateMarkup)
	{
		_templates[sectionType] = templateMarkup;
	}
	
	var getTemplate = function(sectionType)
	{
		return _templates[sectionType];
	}
	
	var duplicateSection = function(sectionWrapperId, sectionType)
	{
		// Find the template
		var markup = _templates[sectionType];
		
		// Substitute the proper IDs for the magic string.
		var newSectionId = getUniqueId();
		markup = markup.replace(/RepeatingSectionControlMagicString/g, newSectionId);
		
		// Put the cloned section at the end of our wrapper.
		var sectionWrapper = jQuery(document.getElementById(sectionWrapperId));
		sectionWrapper.append(markup);
	}
	
	var removeSection = function(sectionId, addLinkId)
	{
		// Find the section DIV that contains the link.
		var sourceSection = document.getElementById(sectionId);
		var parent = sourceSection.parentNode;
		
		//Find the dbUniqueId for the remove entry
		var $descendants = jQuery(parent).children();
		for (var i=0; i<$descendants.length; i++)
		{
			var obj = $descendants[i];
			if(obj.className == _dbUniqueIdClass)
			{
				if ( obj.nextSibling && obj.nextSibling.id == sectionId ) {
					_removedSectionIds.push(obj.value);
				}
			}
		}
		
		parent.removeChild(sourceSection);
		
		// Are there any children left that aren't hidden inputs?
		var $children = jQuery(parent).children();
        var sectionFound = false;
		for (var i=0; i<$children.length; i++)
		{
            var obj = $children[i];
            if(obj.className!=_dbUniqueIdClass)
            {
                sectionFound = true;
                break;
            }
		}
        if(!sectionFound)
        {
            // Press the "add section" link
            jQuery(document.getElementById(addLinkId)).click();
        }
	}
	
	var getElementValue = function(element)
	{
		// jQuery doesn't do a good job when dealing with different input types.  *sigh*
		var $this = jQuery(element);
		
		var val;
		
		if ($this.get(0).tagName.toLowerCase() == "select")
		{
			if ($this.attr("multiple"))
			{
				val = [ ];
				
				$this.children("option:selected").each(function(){
				    val.push(jQuery(this).text());
				});
			}
			else
			{
                //.val() doesn't work for the disabled fields so we have to get the values like this
                //$this.children("option:selected").val() also is working, so leaving as it is
                //for the multiple select
                var selectedindex = $this.get(0).selectedIndex;
                if (selectedindex > -1 && selectedindex < $this.get(0).length)
                {
                    val = $this.children().get(selectedindex).value;
                }

			}
		}
		else if ($this.attr("type").toLowerCase() == "checkbox") 
		{
			val = $this.get(0).checked ? $this.val() : "";
		}
		else 
		{
			val = $this.val();
		}
		
		return val;
	}

	var _collectFormValues = function($inputElements, formValues, excludeElements)
	{
		$inputElements.each(function()
		{
			if (this.name && (excludeElements == null || jQuery.inArray(this, excludeElements) == -1)) 
			{
				// Names can be dotted, which means that we want to create
				// intermediate objects.
				// e.g.  foo.bar.baz = 1492 results in,
				// foo['bar']['baz'] = 1492;
				
				var topObject = formValues;
				
				// Split on dot, and create all but the last object (if needed)
				var parts = this.name.split(".");
				for (var i = 0; i < parts.length - 1; i++) 
				{
					if (!topObject[parts[i]]) 
						topObject[parts[i]] = {};
					topObject = topObject[parts[i]];
				}
				
				// Find the input value and stuff it into the hash.
				var val = getElementValue(this);
				
				var leaf = parts[i];
				
				if (leaf.substring(leaf.length - 2) == '[]')
				{
					if (!topObject[leaf])
						topObject[leaf] = [ ];
					topObject[leaf].push(val);
				}
				else
				{
					topObject[leaf] = val;
					if(this.acctId)
					{
						topObject.acctId = this.acctId;
					}
				}
			}
		});
		
		return formValues;
	}

	var collectFormValues = function(container)
	{
		var formValues = {};
		
		if (typeof container == 'string') 
			container = document.getElementById(container);
		
		// Find the input elements in the form
		var $inputElements = jQuery("input,select,textarea,button", container);

		// Find all the input elements that is in the hidden section
		var $hiddenSecElements = jQuery('div.conditionallyHidden').find('input, textarea, button, select');
		
		var excludeElements = [ ];
		$hiddenSecElements.each(function(index, element){
			excludeElements.push(element);
		});

		_collectFormValues($inputElements, formValues, excludeElements);
		
		return formValues;
	}
	
	// Find the upload entry for each saved attachment and add
	// the attachment id.  That will make sure that the remove
	// link does the right thing.
	var _updateUploadEntries = function(attachmentReuslts)
	{
		if (!attachmentReuslts)
			return;
		var savedAttachments = attachmentReuslts.savedAttachments;

		if(!savedAttachments)
			return;

		for (var i = 0; i < savedAttachments.length; i ++)
		{
			var oneAttachment = savedAttachments[i];

			for (var j = 0; j < _filesUploaded.length; j ++)
			{
				var oneUpload = _filesUploaded[j];
				
				if (oneUpload.tmpName == oneAttachment.tmpName)
				{
					oneUpload.attachmentId = oneAttachment.attachmentId;
					break;
				}
			}
		}
	}
	
	var onSave = function(reply)
	{
		_updateUploadEntries(reply.attachmentResults);
	}
	
	var onSaveSuccessNotOK = function(reply)
	{
	}

	var _findInputs = function(sections, currentTabName, currentSection, container)
	{
		var $container = jQuery(container);
		if ($container.hasClass("ui-tabs-panel"))
		{
			var pageId = $container.attr("id");
			currentTabName = jQuery("li > a[href=#" + pageId + "]", $_tabsDiv).text();		
		}

		if (container.childNodes)
		{
			for (var i = 0; i < container.childNodes.length; i ++)
			{
				var oneChild = container.childNodes[i];
				var $oneChild = jQuery(oneChild);
				
				if (oneChild.nodeName == "INPUT" || oneChild.nodeName == "SELECT" ||
						oneChild.nodeName == "TEXTAREA" ||oneChild.nodeName == "BUTTON")
				{
					currentSection.inputs.push(oneChild);
				}
				else if ($oneChild.hasClass("section-control"))
				{
					_foundSection(sections, currentTabName, $oneChild.attr("sectionTitle"), oneChild);
				}
				else
				{
					_findInputs(sections, currentTabName, currentSection, oneChild)
				}
			}
		}
	}
	
	var _foundSection = function(sections, currentTabName, name, container)
	{
		var oneSection = {
			tabName: currentTabName,
			name: name,
			inputs: [ ],
			container: container
		};
		sections.push(oneSection);
		
		_findInputs(sections, currentTabName, oneSection, container);
	}
	
	var nextpage = function(form, saveForm)
	{
		var tabCount = $_tabs.tabs("length");
		var tabSelectedIndex = $_tabs.tabs("option", "selected");
		
		if((tabSelectedIndex) < (tabCount - 1))
		{
			var performSave= performSaveOnNextPrevButton(tabSelectedIndex + 1)
			$_tabs.tabs("select", tabSelectedIndex + 1);

			if ((typeof invoiceCreationExcluded !== 'undefined') && invoiceCreationExcluded == true) {
				tabSelectedIndex = $_tabs.tabs("option", "selected");

				if ((tabSelectedIndex) == (tabCount - 2)) {
					jQuery("#form-wrapper").addClass("last-page");
				}
			}

			if(saveForm == true)
			{
				if(getRequiresLogin() && performSave){
					save(form, true);
				}
			}
		}
	}
	
	var prevpage = function(form, saveForm)
	{
		var tabCount = $_tabs.tabs("length");
		var tabSelectedIndex = $_tabs.tabs("option", "selected");
		
		if((tabSelectedIndex) > 0)
		{
			var performSave= performSaveOnNextPrevButton(tabSelectedIndex - 1)
			$_tabs.tabs("select", tabSelectedIndex - 1);
			
			if(saveForm == true)
			{
				if(getRequiresLogin() && performSave){
					save(form, true);
				}
			}
			
		}
	}
	var gotoPageByName = function(pageName)
	{
		var tabIndex = -1;
		jQuery('ul.ui-tabs-nav > li > a', getTabs()).each(function(index, element) {
			//Firefox does not support innerText but textContent; IE doesn't support textContent.
			var aInnerContent = element.innerText || element.textContent;
			if (aInnerContent === pageName) 
			{
				tabIndex = index;
			}
		});
		if(tabIndex > -1 )
		{
			$_tabs.tabs("select", tabIndex);
		}
	}

	var save = function(form, silent, afterSave)
	{
		// Perform DATA VALIDATION first..
		var failingValidators = getFailingValidators(form);
		if (failingValidators.length) 
		{
			var oneValidator = failingValidators[0];

			for (var i = 0; i < failingValidators.length; i++) 
			{
				var oneValidator = failingValidators[i];
				
				if (!oneValidator.options || !oneValidator.options.isReqFunc) 
				{
					showValidatorError(oneValidator);
					return;
				}
			}
		}
		
		busy("Saving...");
		
		// We want to collect fields and validators by section.  Any section
		// that fails validation will have its fields omitted from the POST.
		// Any fields that don't belong to any section will be sent along
		// if they pass validation on their own.

		// Collect input fields, grouped into sections.
		var sections = [ ];
		_foundSection(sections, "", "root", form);

		// Collect a list of validated fields and values.
		var formValues = { };
		
		// Collect a list of failed sections
		var failed = [ ];

		// Collect a list of saved sections
		var notFailed = [ ];

		// For each section, do the do..
		for (var i = 0; i < sections.length; i ++)
		{
			var oneSection = sections[i];
			
			// Ignore hidden sections
			if (jQuery(oneSection.container).closest('.conditionallyHidden').length)
				continue;
			
			// Validate this section
			var failingValidators = getFailingValidators(form, oneSection.inputs);
			
			if (failingValidators.length) 
			{
				failed.push(oneSection);
			}
			else
			{
				if ((typeof invoiceCreationExcluded !== 'undefined') && invoiceCreationExcluded == true) {
					if (oneSection.tabName != 'Charges and Additional Items') {
						notFailed.push(oneSection);
					}
				} else {
					notFailed.push(oneSection);
				}

				_collectFormValues(jQuery(oneSection.inputs), formValues);
			}
		}
				
		var message = {
			formValues: formValues,
			filesUploaded: _filesUploaded,
			deleteAttachments: _deleteAttachments,
			removedSectionIds: _removedSectionIds
		};
		
		ajax("save", message, 
			function(reply)			// executed on Success with status OK
			{
				onSave(reply);
							
				_filesUploaded = reply.attachmentResults.attachmentsInError;

				if(_filesUploaded)
				{
					jQuery.each(_filesUploaded, function(index, item)
					{
						var id = item.controlId;
						if(notFailed)
						{
							jQuery.each(notFailed, function(index, item)
							{
								try
								{
									if(item.container.id == id){
										item.error = "Unable to save file.";
										failed.push(item);
										notFailed.splice(index, 1);
									}
								}
								catch (err){}
							});
						}
					});
				}

				_deleteAttachments = [];

				notBusy(true);

				if (!silent)
					_showSaveStatus(failed, notFailed, afterSave);
				else if (afterSave)
					afterSave();
                populateDbUniques(reply);
			},
			function(reply)			// executed on Success with status NOT ok
			{
				onSaveSuccessNotOK(reply);
			}
		);
	}
	
	var _showSaveStatus = function(failed, notFailed, afterSave)
	{
		var markup = "Your form was successfully saved. See below for a list of the form sections " +
			"and their status accordingly. Please note that in order for a section to be saved, " +
			"each and every required field in that section must be completed.<br/><br/>";
		
		if (failed.length)
		{
			for (var i = 0; i < failed.length; i ++)
			{
				var oneSection = failed[i];
				markup += "<div class='clearfix'><div class='errorSmall' style='float:left'></div><span style='margin-left:5px;float:left'>" + oneSection.tabName + " > " + oneSection.name + (oneSection.error ? " > " + oneSection.error : "") + "</span></div>";
			}
		}
		
		if (notFailed.length)
		{
			for (var i = 0; i < notFailed.length; i ++)
			{
				var oneSection = notFailed[i];
				if (oneSection.name != "root")
					markup += "<div class='clearfix'><div class='successSmall' style='float:left;'></div><span style='margin-left:5px;float:left'>" + oneSection.tabName + " > " + oneSection.name + "</div></span></div>";
			}
		}
		
		markup += "<br/><br/>";
				
		var div = document.createElement("div");
		div.innerHTML = markup;
		
		var center = document.createElement("center");
		div.appendChild(center);

		// Show the continue button if we have failures or we're in Save mode
		if (failed.length || !afterSave)
		{
			var continueButton = _newButton("Continue");
			center.appendChild(continueButton);
			continueButton.onclick = function() {
				jQuery(div).dialog('close');
			}
		}
		
		if (afterSave)
		{
			var button = _newButton("Logout");
			button.style.marginLeft = '10px';
			center.appendChild(button);
			button.onclick = function() {
				jQuery(div).dialog('close');
				afterSave();
			}
		}
		
		jQuery(div).dialog({ 
			autoOpen: true,
			modal: true,
			resizable: true,
			maxWidth: 700,
			maxHeight: 600,
			width: 500,
			title: "Form Summary"
		});
	}
	
	var showValidatorError = function(oneValidator)
	{
		// If the form has multiple pages then display the tab with a field validation error.ff
		var failingField = oneValidator.field;
		
		if(_multiPage == true){
			// Find the Tab where the field lives.  Make sure it's front.
			var $tabDivs = $_tabsDiv.children("div");
			for (var i = 0; i < $tabDivs.size(); i++) 
			{
				var oneDiv = $tabDivs.get(i);
				
				if (jQuery("*", oneDiv).index(failingField) >= 0) 
				{
					$_tabs.tabs('select', i);

					break;
				}
			}
			
		}
		
		// Disabled due to NGP-28031: validation error popup out of viewport for requirements tab
//		// fixes iOS issue whereby the screen would scroll all the way to the top
//		// if the field in question is on a tab that contains the submit button.
//		if (failingField.id)
//		{
//			document.getElementById(failingField.id).parentElement.scrollIntoView();
//		}
		
		var onFailFunc = oneValidator.onFail;
		if (onFailFunc)
			onFailFunc();
			
	}
    
	/**
	 * get a jQuery ($) rowField
	 * @param key - the key for a hidden input field
	 * @return the jquery result for the corresponding row 
	 */
	var inputKeyTo$RowField = function(key) {
        var parts = key.split(".");
        var rowId = parts[3];
        var $rowFields = jQuery('[id^="iwdf-control-"]');
        $rowFields = jQuery('[id$="-' + rowId +'"]',$rowFields);
        
        return $rowFields;
	}
	
    var populateDbUniques = function(message)
    {
        var ids = message.formIdToDbIdMap;
        for(key in ids)
        {
            $hiddenObj = jQuery('[name="' + key + '"]');
            if($hiddenObj.val()==undefined)
            {
            	var $rowFields = inputKeyTo$RowField(key);
            	
                $rowFields.before(jQuery('<input class=' + _dbUniqueIdClass + ' name="' + key + '" value="' + ids[key] + '" type="HIDDEN">'));
            }
            else if ($hiddenObj.val() != ids[key]) 
            {
            	// the server has told us the id for this row has changed.
            	// this could be due to the record being deleted
            	// and a new one being created. See NGP-18252
            	
            	//console.log('newid=' + ids[key]);
            	//console.log('oldid=' + $hiddenObj.val());
                
                // delete all with same name: (expect just 1)
                // e.g. EducationHistory.High School.records.IWDF-row-28.dbUniqueId
                // then add new
                var inputKeySelector = 'input[name="' + key + '"]';
                jQuery(inputKeySelector).remove();
                
                // now insert the input key (with the new value)
            	var $rowFields = inputKeyTo$RowField(key);
                $rowFields.before(jQuery('<input class=' + _dbUniqueIdClass + ' name="' + key + '" value="' + ids[key] + '" type="HIDDEN">'));
            }
        }
        
        // delete deleted records
        var deletedRecords = message.formDeletedRecords;
        if (deletedRecords && deletedRecords.length)
        {
	        var idx;
	        for (idx = 0; idx < deletedRecords.length; idx++)
	    	{
	        	var elementKey = deletedRecords[idx];
	        	var inputKeySelector = 'input[name="' + elementKey + '"]';
	        	console.log('removing: ' + inputKeySelector);
	        	jQuery(inputKeySelector).remove();
	    	}
	    }
    }
	
	// getFailingValidators, but filter out failures for sections that are hidden
	var getFailingValidators = function()
	{
		var failingValidators = _IW.FormValidator.getFailingValidators.apply(this, arguments);

		var reallyFailing = [ ];
		for (var i = 0; i < failingValidators.length; i++)
		{
			var field = failingValidators[i].field;
			
			if (typeof field == "String")
				field = document.getElementById(field);
					
			if (jQuery(field).closest('.conditionallyHidden').length == 0)
				reallyFailing.push(failingValidators[i]);
		}
		
		return reallyFailing;
	}
	
	// Calling google recaptcha function on page load to disabled submit buttons
	// After getting google token in response, we are enabling the buttons again
	var googleRecaptcha = function(captchaKey)
	{
		var submitButtons = jQuery("button[class*='submit']");
		for (var i = 0; i < submitButtons.length; i++){
			submitButtons[i].disabled = true;
		}
		grecaptcha.execute(captchaKey, {action: 'formLoad'}).then(function(token){
			for (var i = 0; i < submitButtons.length; i++){
				submitButtons[i].disabled = false;
			}
		},function error(){
		    alert('There was an error loading this page. Please reload the page to continue.');
		});
	}

	// Submit = save, but for every page.
	var submit = function(form, spamProtection, captchaKey, postSubmitCallBack)
	{
		// We don't want the form to submit; the code submits for us.
		if ('undefined' !== typeof event) 
		{
			// this does not work on desktop Firefox.  It is necessary for
			// Mobile Safari.  Otherwise, if an alert appears (like "Error Please Enter a Value"),
			// the user has to click twice to close the alert.  
			event.preventDefault();
		}


		// Don't submit if the form is currently submitting, or if the "submit" button is
		// currently visible to the user (via .css classes).
		// Checking to see if the "submit" button is visible to the user is important,
		// otherwise the form could prematurely submit via the <enter> or phone's "GO" button
		// when the page is viewed at "mobile resolutions" (769px or less).  
		// The submit button is visible to the user if the form-wrapper has either of the 
		// three classes in the IF statement below.
		if (_submitting || 
				(jQuery("#form-wrapper[class*='last-page']").length == 0 &&
						jQuery("#form-wrapper[class*='mobile-responsive']").length == 0 ) &&
						jQuery("#form-wrapper[class*='no-pages']").length == 0 ) 
		{
			return;
		}
		// Prevent a double submit.
		_submitting = true;
		busy("Submitting...");
		
		// Remove the mobile-responsive class, which shows the submit button.
		jQuery("#form-wrapper").removeClass("mobile-responsive");
		
		// Validate the form first
		var failingValidators = getFailingValidators(form);
		
		if (failingValidators.length) 
		{
			showValidatorError(failingValidators[0]);
			notBusy(true);
			_submitting = false;
			return false;
		}
		
		// Submit the form data
		var message = {
			formValues: collectFormValues(form),
			filesUploaded: _filesUploaded,
			deleteAttachments: _deleteAttachments,
			removedSectionIds: _removedSectionIds
		};
		if (spamProtection){
			grecaptcha.execute(captchaKey, {action: 'formSubmit'}).then(function(token){
				 message.gtoken = token;
				_ajaxSubmit(message, postSubmitCallBack);
			}, function error(){
				notBusy(true);
			    _submitting = false;
		        alert('There was a problem with your form submission. Please try submitting again.');
				return false;
		       });
		}else{
			_ajaxSubmit(message, postSubmitCallBack);
		}
	}

	var _ajaxSubmit = function(message, postSubmitCallBack){
		ajax("submit", message, function(reply){
			notBusy(true);
			
			if(reply.attachmentResults)
			{
				_filesUploaded = reply.attachmentResults.attachmentsInError;
			}
			else
			{
				_filesUploaded = [];
			}
			_deleteAttachments = [];

			if (reply.submitAlerts)
			{
				var dialog = document.createElement('DIV');
				
				for (var i = 0; i < reply.submitAlerts.length; i++)
				{
					var oneMessage = document.createElement('DIV');
					oneMessage.innerHTML = reply.submitAlerts[i];
					dialog.appendChild(oneMessage);
				}
				jQuery(dialog).dialog({ 
					autoOpen: true,
					modal: true,
					resizable: false,
					minHeight: 0,
					width:'auto',
					title: "Notice",
					buttons: {
						"Ok": function() {

							jQuery(this).closest('.ui-dialog-content').dialog('close');
							_submitting = false;
							if (!postSubmitCallBack ||postSubmitCallBack(reply) ) {
								if(_filesUploaded.length == 0){
									_postSubmit(reply);
								}
							}
						}
					},
					open:function() { 
						jQuery(this).parents(".ui-dialog:first").find(".ui-dialog-titlebar-close").remove(); 
					}
				});	
			}else
			{
				if (!postSubmitCallBack || postSubmitCallBack(reply)) {
					_postSubmit(reply);
				}
			}
		}, function(reply) {
			notBusy(true);
			_submitting = false;
		});
	}
	
	var _postSubmit = function(reply)
	{
		_submitting = false;
		// Used by facebook
		if (_postSubmitRedirectOverride)
		{
			eval (_postSubmitRedirectOverride);
			return;
		}
		
		// If there is no redirect URL then reset the form.
		if (!reply.redirect || reply.redirect.length == 0)
		{
			document.body.innerHTML = "";
			//document.location = document.location; IW-3798 : Don't do this.
			return;
		}
		
		document.location = buildQualifiedURL(reply.redirect);
	}
	
	var buildQualifiedURL = function(url){
		var needsBaseURL = false;
		var baseURL = "";
		var newLocation = "";
		
		// If the new location is incomplete then we need to build a base url.
		if(!url.match(/^https?:\/\//i))
			needsBaseURL = true;
		
		if(needsBaseURL){
			// If the new location is an absolute or relative URL then add the current scheme, hostname and port
			// , otherwise we'll treat the URL as a full URL.
			if(url.match(/^\//))
			{
				if (_serverURL != null)
				{
					baseURL = _serverURL;
				}
				else
				{
					baseURL = window.location.protocol + "//" + window.location.host;
				}
			}
			else	// If we need some kind of base URL it will always start with http://.
				baseURL = _SCHEME_HTTP + _PROTOCOL_SEP;
		}
		
		// If we need the base url then append the base URL.
		if(needsBaseURL)
			newLocation = baseURL + url;
		else
			newLocation = url;
		
		return newLocation;
	}
	
	var ajax = function(messageType, message, onSuccess, onSuccessNotOK)
	{
		message.messageType = messageType;
		
		// Every ajax call has the option of generating new IDs
		// Send along the seed, and optionally expect a new seed in the reply.
		message.seed = _seed;
		
		// Every ajax call requires the form id
		message.formId = _formId;
		
		if(_remoteAjax){
			var bjaxRefId = null;
			
			if(message.bjaxRefId){
				bjaxRefId = message.bjaxRefId;
				
				delete message.bjaxRefId;
			}
			else{
				bjaxRefId = _formId;
			}
			
			jQuery.bjax({
				url: _runtimeURL,
				data: jQuery.toJSON(message),
				bjaxRefId: bjaxRefId,
				success: function(data){
					// Grab the new seed, if it's there.
					if (data.seed)
						_seed = data.seed;
					
					if (data.status == "ok")
					{
						if (onSuccess)
						{
							onSuccess(data);
							_removedSectionIds = [];
						}
					}
					else if(data.status == "redirect" )
					{
						//maintenance redirect
						if(data.redirectTo){
							var redirectUrl = buildQualifiedURL(data.redirectTo);
							document.location.href = redirectUrl;
						}
					}
					else
					{
						if (onSuccessNotOK)
						{
							onSuccessNotOK(data);
						}
						
						notBusy();
	
						if (data.msg)
						{
							alert(data.msg);
							if(data.redirect)
								document.location.href = buildQualifiedURL(data.redirect);
						}
					}
				},
				error: function(data)
				{
					if (onSuccessNotOK)
					{
						alert(data.msg);						
						onSuccessNotOK(data);
					}
					else
					{
						alert("An error occurred while trying to communicate with the server");						
					}

					notBusy();
				}
			});
		}
		else{
			jQuery.ajax({
				url: _runtimeURL,
				type: "POST",
				cache: false,
				data: jQuery.toJSON(message),
				dataType: "json",
				processData: false,
				contentType: "application/json",
				success: function(data, textStatus)
				{
					// Grab the new seed, if it's there.
					if (data.seed)
						_seed = data.seed;
					
					if (data.status == "ok")
					{
						if (onSuccess)
						{
							onSuccess(data);
							_removedSectionIds = [];
						}
					}
					else if(data.status == "redirect" )
					{
						//maintenance redirect
						if(data.redirectTo){
							var redirectUrl = buildQualifiedURL(data.redirectTo);
							document.location.href = redirectUrl;
						}
					}
					else
					{
						if (onSuccessNotOK)
						{
							onSuccessNotOK(data);
						}
						
						notBusy();

						if (data.msg) 
						{
							alert(data.msg);
							if(data.redirect)
								document.location = buildQualifiedURL(data.redirect);
							
						}
					}
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
					alert("An error occurred while trying to communicate with the server");
					
					notBusy();
				}
			});
		}
	}
	
	/*
	 * ## General strategy for dealing with optional sections ##
	 *
	 * BACKGROUND: Please read the INTRO text in IWFormValidator.js!!
	 *
	 * STRATEGY:
	 * For optional sections, we need to disable and enable form validation on fields
	 * that are marked as "Required".  In order to do that, we need to be able to
	 * identify field validators that do the test for "Required".  Those validators
	 * MUST have the isReqFunc option set.
	 *
	 * The next problem is that we need to be able to determine when any field has a
	 * value, not just the required fields.  If any field gets a value, we need to
	 * make sure required field validation is turned on for required fields.  To do
	 * that, we need to require that EVERY field has a isReqFunc validator.  For fields
	 * that are not required, those validators should also have the "disabled" option
	 * turned on.  That will prevent every field from suddenly becoming "Required".
	 *
	 * For each field in the section, we need to collect the "isReqFunc" validators.
	 * At the same time, we'll note which of those validators are enabled.  That will
	 * be the list of validators that we will toggle on and off when fields change.
	 *
	 */
	var initOptionalSection = function(sectionDivId)
	{
		// Find the input elements on the selected tab
		var $_inputElements = jQuery("input,select,textarea", document.getElementById(sectionDivId));
		
		// Keep a list of every form input for this section.
		var inputs = [];
		
		$_inputElements.each(function()
		{
		
			var oneInput = {
				field: this, // The field in question.
				validators: [], // A list of validators that implement "required".
				toggles: [] // A list of validators to toggle.
			};
			
			// Determine if this field has any validator for "Required".
			var validators = _IW.FormValidator.getAllValidatorsForField(this);
			for (var i = 0; i < validators.length; i++) 
			{
				var oneValidator = validators[i];
				
				if (oneValidator.options.isReqFunc) 
				{
					oneInput.validators.push(oneValidator);
					
					// Enabled isReqFuncs will be toggled when section values change.
					if (!oneValidator.options.disabled) 
						oneInput.toggles.push(oneValidator);
				}
			}
			
			inputs.push(oneInput);
		});
		
		// Collect the fields with class dynamicFormRequired
		var $requiredFieldLabels = jQuery(".dynamic-form-required", document.getElementById(sectionDivId));
		
		// A function to check if any field satisfies "required".
		var hasAnyValues = function()
		{
			for (var i = 0; i < inputs.length; i++) 
			{
				var oneInput = inputs[i];
				
				for (var j = 0; j < oneInput.validators.length; j++) 
				{
					var oneValidator = oneInput.validators[j];
					if (oneValidator.func()) 
						return true;
				}
			}
			return false;
		}
		
		// Purposely set as undefined so that we don't short circuit
		// out in the initial call to setRequiredState();
		var currentRequiredState = undefined;
		
		var setRequiredState = function(isRequired)
		{
			if (currentRequiredState == isRequired) 
				return;
			
			// Enable or disable the validation for "required"
			for (var i = 0; i < inputs.length; i++) 
			{
				var state = inputs[i];
				for (var j = 0; j < state.toggles.length; j++) 
				{
					var oneValidator = state.toggles[j];
					oneValidator.options.disabled = !isRequired;
				}
			}
			
			// Set the proper label classes
			$requiredFieldLabels.toggleClass("dynamic-form-required", isRequired);
			
			// Add or remove the "*"
			$requiredFieldLabels.each(function()
			{
				var label = jQuery(this).html();
				
				// Remove the "* " if it's there
				if (label.substring(0, 2) == "* ") 
					label = label.substring(2);
				
				// Add the "* " if we need it
				if (isRequired) 
					label = "* " + label;
				
				jQuery(this).html(label);
			});
			
			currentRequiredState = isRequired;
		}
		
		setRequiredState(hasAnyValues());
		
		// Install onblur handler for each field.
		// When any change happens, we need to check all the fields
		// against the initial state.
		$_inputElements.each(function()
		{
			jQuery(this).blur(function()
			{
				setRequiredState(hasAnyValues());
			})
		});
	}
	
	var cancel = function()
	{
		if (!confirm(_cancelConfirmationMsg)) 
			return;
		
		ajax("cancel", {}, function(reply)
		{
			if (reply.redirect) 
				document.location = buildQualifiedURL(reply.redirect);
		});
	}
	
	var saveLogout = function(form)
	{
		save(form, false, function() {
			ajax("logout", {}, function(reply)
			{
				if (reply.redirect) 
					document.location = buildQualifiedURL(reply.redirect);
			});
		});
	}
	
	var showFilePicker = function(dialogId)
	{
		var $dialog = jQuery(document.getElementById(dialogId));
		$dialog.find(":file").val("");
		$dialog.find(":text").val("");
        $dialog.find("button").show();
		$dialog.dialog("open");
	}

	var makeDatePicker = function(srcImg, elementId, dateFormat)
	{
		if (elementId && dateFormat)
		{
			jQuery(document.getElementById(elementId)).datepicker(
			{
				showOn : "button",
				buttonImage : srcImg,
				buttonImageOnly : true,
				dateFormat: dateFormat,
				changeMonth : true,
				changeYear : true,
				yearRange : "-200:+200", // last and coming two hundred years
				buttonText : "Select date"
			});
		}
	};

	var initiateUpload = function(iframeId, inputElementId, dialogId, spinnerId, postProccessingFunc)
	{
		var iframe = document.getElementById(iframeId);
		var inputElement = document.getElementById(inputElementId);
		var dialog = document.getElementById(dialogId);
		var spinner = document.getElementById(spinnerId);
        var button = dialog.getElementsByTagName("button")[0];
        jQuery(button).hide();
        
        // Authorize the attachment upload and return it's unique Id.
		var message = {};
		
		// Get the Unique File Id, they continue.
		ajax("authorizeFileUpload", message, function(reply)
		{
			// Show the spinner
			jQuery(spinner).css("display", "inline");
			
			var fileUploadId = reply.tmpName;
			
			var form = inputElement.form;
			
			// Create the hidden input element for the temp file name.
			var hidden = document.createElement("input");
			hidden.type = "hidden";
			hidden.id = hidden.name = "tmpName";
			hidden.value = fileUploadId;
			
			form.appendChild(hidden);
			
			// Submit the form
			form.action = _runtimeURL;
			
			form.submit();
			
			// Next time check the file upload status.
			var pollUploadStatus = function(){
				// Check the upload status and either create another timeout, fail or success.
				_checkUploadStatusAndProcess(iframeId, inputElementId, dialogId, spinnerId, fileUploadId, postProccessingFunc, 0);
			};
			_fileUploadTimeouts[fileUploadId] = setTimeout(pollUploadStatus, _timeoutTable[0]);
			return false;
		});
		
		return;
	}

	var _checkUploadStatusAndProcess = function(iframeId, inputElementId, dialogId, spinnerId, fileUploadId, postProccessingFunc, timeoutIndex)
	{
		var pollUploadStatus = function(){
			// Kill the timeout.
			if(typeof _fileUploadTimeouts[fileUploadId] != "undefined"){
				clearTimeout(_fileUploadTimeouts[fileUploadId]);
				timeoutIndex++;
				if(timeoutIndex >= _timeoutTable.length)
				{
					timeoutIndex = 0;
				}
				delete _fileUploadTimeouts[fileUploadId];
			}
			
			// Check the upload status and either create another timeout, fail or success.
			_checkUploadStatusAndProcess(iframeId, inputElementId, dialogId, spinnerId, fileUploadId, postProccessingFunc, timeoutIndex);
		};
		
		var message = { "tmpName": fileUploadId };
		
		// Check the file upload status with ajax.
		ajax("checkFileUploadStatus", message, function(reply)
		{
			// There are 3 statuses that we could get from our JSON message.
			//
			// ok + transitive - the file is still uploading.
			// ok - we are done!
			// error + msg - failure
			if (reply.status != "ok" && reply.msg) 
			{
				alert(reply.msg);
                var dialog = document.getElementById(dialogId);
                var spinner = document.getElementById(spinnerId);
                jQuery(spinner).css("display", "none");
                dialog.find("button").show();
            }
			else 	// File upload successful do tell the user all about it.
			{
				if (reply.transitive)
				{
					_fileUploadTimeouts[fileUploadId] = setTimeout(pollUploadStatus, _timeoutTable[timeoutIndex]);
					
					// Upload still happening so don't do anything.  We might do something here in the future...
					// 	like progress bar, stop uploading, etc... but currently don't fail because we are ok.
				}
				else {
					var dialog = document.getElementById(dialogId);
					var spinner = document.getElementById(spinnerId);
					
					jQuery(dialog).dialog("close");
					
					// Show the spinner
					jQuery(spinner).css("display", "none");
					
					// Record the uploaded files
					for (var i = 0; i < reply.filesUploaded.length; i++) 
					{
						var oneUpload = reply.filesUploaded[i];
						
						_filesUploaded.push(oneUpload);
					}
					
					// Post process (i.e. GUI updates)
					postProccessingFunc(reply.filesUploaded);
				}
			}
			
			return false;
		}, function(reply)
		{
			var dialog = document.getElementById(dialogId);
			var spinner = document.getElementById(spinnerId);
    		
			jQuery(dialog).dialog("close");
			jQuery(spinner).css("display", "none");
		});
	}
	
	var processUpload = function(filesUploaded, buttonId, preserveButton)
	{
		var $button = jQuery("#" + buttonId);
        if(!preserveButton)
        {
		    $button.hide();
        }
        
        var $orderedList = $button.siblings("ol");
		// There should be exactly 1!
		for (var i = 0; i < filesUploaded.length; i++) 
		{
			var oneUpload = filesUploaded[i];
            var $listEntry = jQuery("<li></li>");
            $orderedList.append($listEntry)
            var $oneUploadDiv = jQuery("<div></div>");
			$listEntry.append($oneUploadDiv);
			$oneUploadDiv.html(oneUpload.originalName);
			var $removeButton = jQuery("<a></a>");
			$oneUploadDiv.append($removeButton);
            $removeButton.attr("style", "padding-left:5px");
			$removeButton.attr("href", "javascript:void(0);");
			$removeButton.html("Remove");
			$removeButton.click(function()
			{
				_removeUploaded($listEntry, oneUpload);
                $button.show();
			});
		}
	}
	
	/*
	 * Remove an existing (saved in a previous session) attachment
	 */
	var removeAttachment = function($listEntry, attachmentId)
	{
		if (typeof $listEntry == 'string') 
			$listEntry = jQuery("#" + $listEntry).parent();

        $listEntry.remove();

		_deleteAttachments.push(attachmentId);
	}
	
	/*
	 * Remove an existing (saved in a previous session) upload
	 */
	var removeUpload = function(attachButtonId, oneUploadDiv, attachmentId)
	{
		removeAttachment(oneUploadDiv, attachmentId);
		document.getElementById(attachButtonId).style.display = "inline";
	}
	
	var removeOneUpload = function(oneUpload)
	{
		for (var j = 0; j < _filesUploaded.length; j++) 
		{
			if (_filesUploaded[j] == oneUpload) 
			{
				_filesUploaded.splice(j, 1);
				break;
			}
		}
	}
	
	/*
	 * Remove an attachment that was uploaded (and maybe saved).
	 */
	var _removeUploaded = function($listEntry, oneUpload)
	{
		// If we have an attachment id, then this upload has already
		// been saved.
		if (oneUpload.attachmentId)
		{
			removeAttachment($listEntry, oneUpload.attachmentId);
			return;
		}

		// Else, this file was uploaded, but not saved.  Just remove
		// the DIV and the entry in _filesUploaded.
		removeOneUpload(oneUpload);
		$listEntry.remove();
	}
    
	var addValidatorForFileUpload = function(buttonId, fieldLabel)
	{
		var button = document.getElementById(buttonId);

		_IW.FormValidator.insertValidator(button, 
			function() {
				var numChildren = jQuery("div", button.parentNode).size();
				return numChildren > 0;
			}, 
			function() {
				alert("You must upload a file for " + fieldLabel);
			},
			{ 
				isReqFunc: true
			});
	}
	
	var checkFileType = function(input)
	{
		var fname = jQuery(input).val();
		var dot = fname.lastIndexOf('.');
		if (dot > 0) 
		{
			var ext = fname.substring(dot, fname.length).toLowerCase();
			if (_fileExtensionWhitelist[ext]) 
				return;
		}
		
		alert(fname + " is not a supported file type.");
		
		jQuery(input).val("");
	}
	
	var inlineLookupPreflight = function(message)
	{
		// Make the inline lookup message look like one of ours.
		message.messageType = "lookup";
		message.formId = _formId;
		
		if(_remoteAjax)
			message.bjaxRefId = _formId;
		
		return message;
	}
	
	var _override = function(funcName, newFunc)
	{
		var oldFunc = eval(funcName);
		eval(funcName + " = newFunc;");
		return oldFunc;
	}

	var inlineLookupSelected = function(field, oneResult, orgNameReadOnly, fieldId)
	{
		if(!oneResult)
			return;
		
		// For each subling (text) field, look for a value from lastResults.
		var otherFields = oneResult.otherFields;
		
		// Find the id from the field.  We'll use that as a template for finding the others
		var idTemplate = field.id;
		
		for (var otherFieldId in otherFields) 
		{
			var idToFind = idTemplate.replace(fieldId, otherFieldId);
			var input = document.getElementById(idToFind);
			if (input)
			{
				var value = otherFields[otherFieldId];
				
				if (input.tagName == "INPUT" && input.type == "text") 
				{
					// while searching text, if records does not exist we will get value as empty
					// we do not want to reset the input value for the field we entered text 
					if (otherFieldId != fieldId)
					{
						input.value = value;
					}

					input.acctId = oneResult.acctId;
					field.acctId = oneResult.acctId;
					field.fieldId = fieldId;

					// set the Organization Name field as read only if Org. Name
					// read only after lookup selection is selected on the form
					if (orgNameReadOnly && otherFieldId == fieldId)
						input.readOnly = true;
				}
				else if (input.tagName == "SELECT")
				{
					var values = { };
					if (input.multiple)
					{
						var allValues = value.split(";");
						for (var i = 0; i < allValues.length; i++)
							values[allValues[i]] = true;
					}
					else
						values[value] = true;

					for (var j = 0; j < input.options.length; j ++)					
						input.options[j].selected = values[input.options[j].text]
				}
			}
		}
	}
	
	return {
		_override: _override,
		setRuntimeURL: setRuntimeURL,
		getSeed: getSeed,
		setSeed: setSeed,
		getUniqueId: getUniqueId,
		getTabs: getTabs,
		isMultiPage: isMultiPage,
		busy: busy,
		notBusy: notBusy,
		ajax: ajax,
		collectFormValues: collectFormValues,
		bootstrap: bootstrap,
		setTemplate: setTemplate,
		getTemplate: getTemplate,
		duplicateSection: duplicateSection,
		removeSection: removeSection,
		initOptionalSection: initOptionalSection,
		save: save,
		saveLogout: saveLogout,
		cancel: cancel,
		submit: function() { submit.apply(this, arguments);},
		showValidatorError: showValidatorError,
		nextpage: nextpage,
		prevpage: prevpage,
		gotoPageByName : gotoPageByName,
		showFilePicker: showFilePicker,
		makeDatePicker : makeDatePicker,
		initiateUpload: initiateUpload,
		processUpload: processUpload,
		removeAttachment: removeAttachment,
		removeOneUpload: removeOneUpload,
		removeUpload: removeUpload,
		checkFileType: checkFileType,
		addValidatorForFileUpload: addValidatorForFileUpload,
		inlineLookupSelected: inlineLookupSelected,
		getRuntimeURL: getRuntimeURL,
		setRemoteAjax: setRemoteAjax,
		setServerURL: setServerURL,
		getServerURL: getServerURL,
		setCancelConfirmationMessage: setCancelConfirmationMessage,
		setPostSubmitRedirectOverride : setPostSubmitRedirectOverride,
		isLoaded: isLoaded,
		getElementValue: getElementValue,
		googleRecaptcha:googleRecaptcha,
		performSaveOnNextPrevButton: performSaveOnNextPrevButton
	}
}();

_IW.FormsRuntime.TestScores = function()
{
	var _registry = { };
	
	var register = function(testTypeFieldId, context, options){
		if (!_registry[testTypeFieldId])
			_registry[testTypeFieldId] = true;
		else
			alert('Test Type control already registered.  There\'s a problem!');
		
		bind(testTypeFieldId);
		updateScores(testTypeFieldId);
	}
	
	var bind = function(testTypeFieldId){
		var select = document.getElementById(testTypeFieldId);
		jQuery(select).bind('change.testscores', function(event){
			updateScores(testTypeFieldId);
		});
	}
	
	var updateScores = function(testTypeFieldId){
		var select = document.getElementById(testTypeFieldId),
			testTypeId = jQuery(select).val();
		
		jQuery('.test-score-values-container').each(function(){
			var div = jQuery(this);
			
			if(div.attr('id').indexOf('TestScoreValues.for.' + testTypeFieldId) != -1){
				jQuery(this).css('display', 'none').addClass('conditionallyHidden');
			}
		});
		
		var div = document.getElementById('TestScoreValues.for.' + testTypeFieldId + '.TypeId.' + testTypeId);
		jQuery(div).css('display', 'block').removeClass('conditionallyHidden');
	}
	
	var unregister = function(testTypeFieldId, callback){
		delete _registry[testTypeFieldId];
		
		if(typeof callback == "function")
			callback();
	}
	
	return {
		register: register,
		unregister: unregister
	}
}();
