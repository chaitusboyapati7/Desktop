_IW.AppFormRuntime = function()
{
	var _iterationId;
	var _discountType;
	var _discountValue;
	var _singleSelectMode;
	var _addnlItemRequired;
	var _discountSelectMode;
	var _serverUrl = "";
	var _firstNameFieldId;
	var _lastNameFieldId;
	var _tenantCountry;
	var _tenantLanguage;
	var _unofficialRequirementsSectionId;
	var _requirementsPageName;
	var _recommendersPageName;
	var _uploadDialogIds;
	
	var bootstrap = function(iterationId, unofficialRequirementsSectionId, uploadDialogIds, requirementsPageName, recommendersPageName, tenantCountry, tenantLanguage)
	{
		_iterationId = iterationId;
		_tenantCountry = tenantCountry;
		_tenantLanguage = tenantLanguage;
		_unofficialRequirementsSectionId = unofficialRequirementsSectionId;
		_requirementsPageName = requirementsPageName;
		_recommendersPageName = recommendersPageName;
		_uploadDialogIds = uploadDialogIds;

		
		var discountCodeField = document.getElementById('discountCode');
		_discountSelectMode = discountCodeField && discountCodeField.type == "hidden";
		
		// If we have a Additional Items page, add everything up
		if (jQuery("#programChargesTotal").size()) 
		{
			processDiscount(); // Just in case we have one by default
			recalc();
		}

		if(_IW.FormsRuntime.isMultiPage() == true)
		{
			$_tabs = _IW.FormsRuntime.getTabs().tabs({
				select: function(event, ui){
					// Install content class setters based on the tab selected.
					if(ui.tab === jQuery(".ui-tabs-nav > li:first > a", _IW.FormsRuntime.getTabs()).get(0)){
						jQuery("#form-wrapper").addClass("first-page");
					}
					else{
						jQuery("#form-wrapper").removeClass("first-page");
					}
					
					if(ui.tab === jQuery(".ui-tabs-nav > li:last > a", _IW.FormsRuntime.getTabs()).get(0)){
						jQuery("#form-wrapper").addClass("last-page");
					}
					else{
						jQuery("#form-wrapper").removeClass("last-page");
					}
					

				},
				show: function(event, ui){
					jQuery("html, body").scrollTop(0);
					//NGP-24504: Firefox does not support innerText but textContent
					var innerContent = ui.tab.innerText;
					if(!innerContent) {
						innerContent = ui.tab.textContent;
					}

					if(innerContent == _requirementsPageName)
					{
						jQuery("button.save")[0].click();
					}
				},
				selected: 0
			});
		}
	}
	
	var setAdditionalItemRequired = function(b)
	{
		_addnlItemRequired = b;
	}
	
	var setAdditionalItemSingleSelect = function(b)
	{
		_singleSelectMode = b;
	}
	
	var recalc = function()
	{
		var $additionalGrandTotal = jQuery("#additionalGrandTotal");
		var $additionalItemsTotal = jQuery("#additionalItemsTotal");
		
		if ($additionalGrandTotal.length) 
		{
			var additionalTotal = 0;
			for (var i = 0;; i++) 
			{
				var item = document.getElementById("additionalItem_" + i);
				if (!item) 
					break;
				
				var itemSelected = jQuery(item);
				if (!itemSelected.attr("checked")) 
				{
					var total = "";
				}
				else 
				{
					var quantityField = jQuery("#additionalItemQuantity_" + i);
					var quantity = parseInt(quantityField.val(), 10);
					if (isNaN(quantity) || quantity <= 0) 
					{
						quantity = 1;
						quantityField.focus();
					}

					// Push back the parsed (or updated) value
					quantityField.val(quantity);
					
					var price = document.getElementById("additionalItems." + i + ".unitPrice").value;
					
					price = toPennies(price);
					
					var total = quantity * price;
					
					additionalTotal += total;
					
					var total = toDollars(total);
				}
				
				_formatCurrencyField("additionalItemTotal_" + i, total + "");
			}
			
			$additionalItemsTotal.val(toDollars(additionalTotal));
			
			_formatCurrencyField("additionalGrandTotal", toDollars(additionalTotal) + "");
		}
		
		totalAll();
	}
	
	var additionalItemSelectChanged = function(checkbox)
	{
		if (_singleSelectMode) 
		{
			for (var i = 0;; i++) 
			{
				var item = document.getElementById("additionalItem_" + i);
				if (!item) 
					break;
				
				if (item != checkbox) 
					jQuery(item).removeAttr("checked");
			}
		}
		
		recalc();
	}
	
	var additionalItemQuantityChanged = function()
	{
		recalc();
	}
	
	var discountItemSelectChanged = function(checkbox)
	{
		if (_discountSelectMode) 
		{
			for (var i = 0;; i++) 
			{
				var item = document.getElementById("discount_" + i);
				if (!item) 
					break;
				
				if (item != checkbox) 
					jQuery(item).removeAttr("checked");
			}
		}

		recalc();
	}
	
	var _formatCurrencyField = function(field, dollars)
	{
		if (typeof field == 'string') 
			field = document.getElementById(field);
			
		if (!field)
			return;
		
		var color = "black";
		
		// NOTE that dollars IS A STRING ON PURPOSE.
		// There are floating point issues we want to avoid
		if (dollars.substring(0, 1) == '-') 
		{
			dollars = dollars.substring(1);
			color = "red";
		}
		
		var $field = jQuery(field);
		if ($field.get(0).tagName.toLowerCase() == "input")
			$field.val(dollars)
		else
			$field.html(dollars);
		$field.css("color", color);
		
		$field.formatCurrency({ colorize:true, region: _tenantLanguage + "-" + _tenantCountry });
	}
	
	var _computeDiscount = function(programTotal, type, value)
	{
		var discount = 0;
		if (! type)
		{
		    return discount;
		}

		if (type.toLowerCase() === "fixed" || type.toLowerCase() === "fixed amount") 
		{
			discount = - toPennies(value);
		}
		else if (type.toLowerCase() === "percentage") 
		{
			discount = - Math.floor(programTotal * value / 100 + 0.5);
		}

		return discount;
	}
	
	var _getDiscount = function(programTotal)
	{		
		var discount = 0;
		
		if (_discountSelectMode)
		{
			jQuery('#discountCode').val("");

			for (var i = 0; ; i++)
			{
				var radio = document.getElementById('discount_' + i);
				if (!radio)
					break;
			
				if (radio.checked)
				{
					var value = jQuery('#discount_value_' + i).val();
					var type = jQuery('#discount_type_' + i).val();
					jQuery('#discountCode').val(jQuery('#discount_name_' + i).val());
					
					discount = _computeDiscount(programTotal, type, value);
					var discountDollars = toDollars(discount);
					_formatCurrencyField('discount_total_' + i, discountDollars + "");
				}
				else
				{
					jQuery('#discount_total_' + i).html("");
				}
			}
		}
		else
		{
			discount = _computeDiscount(programTotal, _discountType, _discountValue);
			var discountDollars = toDollars(discount);
			_formatCurrencyField("discount", discountDollars + "");
		}
				
		return discount;
	}
	
	var _updateGroupRegistrationTotal = function(programTotal)
	{
		// No _lastNameFieldId means we don't have group registration
		if (!_lastNameFieldId)
			return 0;
		
		// Clear out the rows in the table, excluding the first and last rows
		// which are the headers and total rows.
		var table = document.getElementById('groupRegistrationItemsTable');
		while (table.rows.length > 2)
			table.deleteRow(1);
		
		// Look for any input field who's NAME is like this pattern.
		//
		//		"GroupRegistration.*" + _lastNameFieldId
		var $lastNameFields = jQuery("input[name^='GroupRegistration.']").filter("[name$='" + _lastNameFieldId + "']");
		
		// Find the ones with some data in the first or last name fields, and update the table.
		var total = 0;
		$lastNameFields.each(function() 
			{
				var ln = jQuery(this).val().trim();
			
				// Find the associated first name field
				var sFirstNameId = this.id.replace(_lastNameFieldId, _firstNameFieldId);
				
				var fn = document.getElementById(sFirstNameId).value.trim();
				
				if (fn.length > 0 || ln.length > 0)
				{
					var row = table.insertRow(1);
					
					var nameCell = row.insertCell(0);
					nameCell.setAttribute('align', 'left');
					nameCell.style.backgroundColor = "white";
					nameCell.style.border = "1px solid rgb(255, 255, 255)";
					nameCell.style.color = "black";
					nameCell.innerHTML = jQuery('<div/>').text(fn + " " + ln).html();
					
					var valueCell = row.insertCell(1);
					valueCell.setAttribute('align', 'right');
					valueCell.style.backgroundColor = "white";
					valueCell.style.border = "1px solid rgb(255, 255, 255)";
					valueCell.style.color = "black";
					valueCell.innerHTML = '$' + toDollars(programTotal);
					
					total += programTotal;
				}
			});
				
		jQuery('#groupRegistrationTotalAmount').val('$' + toDollars(total));
		
		return total;
	}
	
	var totalAll = function()
	{
		var totalBalance = 0;
		
		var programTotal = jQuery("#totalProgramCharges").val();
		programTotal = toPennies(programTotal);
		
		totalBalance += programTotal;
		
		var discount = _getDiscount(programTotal);
		
		totalBalance += discount;
		
		var iterationProgramTotal = toPennies(jQuery("#iterationProgramChargesTotal").val());
		totalBalance += _updateGroupRegistrationTotal(iterationProgramTotal);
		
		var $additionalGrandTotal = jQuery("#additionalItemsTotal");
		if ($additionalGrandTotal.length) 
		{
			var additionalTotal = $additionalGrandTotal.val();
			totalBalance += toPennies(additionalTotal);
		}
		
		var $adjustmentsGrandTotal = jQuery("#adjustmentChargesTotal");
		if ($adjustmentsGrandTotal.length) 
		{
			var adjustmentTotal = $adjustmentsGrandTotal.val().substring(1);
			totalBalance += toPennies(adjustmentTotal);
		}

		var grandTotalDollars = toDollars(totalBalance);
		_formatCurrencyField("grandTotal", grandTotalDollars + "");
		jQuery("#hiddenGrandTotal").val(grandTotalDollars);
		
		var $paymentsTotal = jQuery("#paymentsTotal");
		if ($paymentsTotal.length) 
		{
			var paymentsTotal = $paymentsTotal.val().substring(1);
			totalBalance -= toPennies(paymentsTotal);
		}
		
		var zeroTotalBalance = toDollars(totalBalance);
		
		_formatCurrencyField("totalBalanceDue", zeroTotalBalance + "");

		jQuery("#hiddenTotalBalanceDue").val(zeroTotalBalance);
	}
	
	var toPennies = function(dollars)
	{
		// Convert to pennies without using floating point numbers
		
		// Force into a string.
		var pennies = "" + dollars;
		
		// Zero pad and remove the decimal
		var period = pennies.lastIndexOf(".");
		
		if (period >= 0) 
		{
			var numZeros = pennies.length - period - 1;
			while (numZeros++ < 2) 
				pennies += "0";
			pennies = pennies.replace(".", "");
		}
		else 
		{
			pennies += "00";
		}
		
		return parseInt(pennies);
	}
	
	/**
	 * Convert to dollars AS A STRING
	 */
	var toDollars = function(pennies)
	{
		if (pennies == 0) 
			return "0";
		
		// Note that it's easier to deal with positive numbers so we'll make the
		// value positive now and tack on the negative sign at the end.
		if (pennies < 0)
		{
			var negative = "-";
			pennies = -pennies;
		}
		else
		{
			var negative = "";
		}		
		
		// Convert to string
		pennies = "" + pennies;
		
		// We need to have at least 2 digits so we'll zero pad if necessary.
		if (pennies.length < 2)
			pennies = '0' + pennies;
		
		// We just need to add a decimal
		var len = pennies.length;
		var dollars = pennies.substring(0, len - 2);
		dollars += ".";
		dollars += pennies.substring(len - 2);
		
		// Was it negative?
		dollars = negative + dollars;
		
		return dollars;
	}
	
	var clearDiscount = function()
	{
		var discountName = jQuery("#discountCode").val("");
		processDiscount();
	}
	
	var processDiscount = function()
	{
		_discountType = undefined;
		_discountValue = undefined;
		
		var $discountCode = jQuery("#discountCode");
		
		if ($discountCode.size() == 0)
			return;
		
		var discountName = $discountCode.val();
		
		if (discountName.length) 
		{
			ajax("getDiscount", {
				discountName: discountName
			}, function(reply)
			{
				jQuery("#discountStatus").html("");
					
				_discountType = reply.type;
				_discountValue = reply.value;
				
				totalAll();
			}, function(reply)
			{
				jQuery("#discountStatus").html("Invalid code");
			});
		}
		else 
		{
			_discountType = undefined;
			_discountValue = undefined;
			jQuery("#discountStatus").html("");
			totalAll();
		}
	}

	var enableGroupRegistrations = function(firstNameFieldId, lastNameFieldId)
	{
		// Stash away the field id for the name fields.  We'll use them to find
		// fields in the group registration section.
		_firstNameFieldId = firstNameFieldId;
		_lastNameFieldId = lastNameFieldId;
		
		// Whenever we show the charges page, do a recalc in order to pickup any new group registrants.
		$_tabs = _IW.FormsRuntime.getTabs();
		$_tabs.bind("tabsshow", function(event, ui) {
			var tabCount = $_tabs.tabs("length");
			var tabSelectedIndex = $_tabs.tabs("option", "selected");
			if (tabSelectedIndex == tabCount - 1)
				recalc();
		});
	}
	
	var recommenderSend = function(divId)
	{
		var $div = jQuery(document.getElementById(divId));
		var $inputElements = jQuery("input,select,textarea", $div);
		
		var form = $inputElements.get(0).form;
		if (!_IW.FormValidator.validateForm(form, $inputElements.get())) 
			return;

		_IW.FormsRuntime.busy("Sending email...");
		
		ajax("recEmailSend", {
			formValues: _IW.FormsRuntime.collectFormValues($div.get(0))
		}, function(reply) {
			var $ndiv = jQuery(document.getElementById(divId));
			$ndiv.attr('recId', reply.recRowId);
			jQuery("[name$='.recId']", $ndiv).attr('value', reply.recRowId);
			
			_IW.AppFormRuntime.recommenderEnable(divId, false);
			var cId = jQuery("a[id*=recommenderClearBtn]", $ndiv);
			var sId = jQuery("a[id*=recommenderSendBtn]", $ndiv);
			var rId = jQuery("a[id*=recommenderResendBtn]", $ndiv);
			cId.show();
			sId.hide();
			rId.show();
			_IW.FormsRuntime.notBusy();
		});
	}

	var recommenderResend = function(divId)
	{
		var $div = jQuery(document.getElementById(divId));
		var recId = $div.attr('recId');
		
		_IW.FormsRuntime.busy("Sending email...");

		ajax("recEmailResend", {
			recRowId: recId
		}, function() {
			_IW.FormsRuntime.notBusy();
		});
	}

	var recommenderClear = function(divId)
	{
		var $div = jQuery(document.getElementById(divId));
		var recId = $div.attr('recId');
		
		_IW.FormsRuntime.busy("Removing recommender...");

		ajax("recClear", {
			recRowId: recId
		}, function(reply) {
			var $ndiv = jQuery(document.getElementById(divId));
			
			var cId = jQuery("a[id*=recommenderClearBtn]", $ndiv);
			var sId = jQuery("a[id*=recommenderSendBtn]", $ndiv);
			var rId = jQuery("a[id*=recommenderResendBtn]", $ndiv);
			cId.hide();
			sId.show();
			rId.hide();

			// get template: get the field ids for firstname,lastname,email
			var fields = JSON.parse(_IW.FormsRuntime.getTemplate("Recommenders"));
			// reset form fields: first name, last name, emailid
			jQuery("input[id*=" + fields.firstNameFieldId + "]", $ndiv).val('');
			jQuery("input[id*=" + fields.lastNameFieldId + "]", $ndiv).val('');
			jQuery("input[id*=" + fields.emailFieldId + "]", $ndiv).val('');
		
			$div.attr('recId',''); // remove recommender id
			jQuery("[name$='.recId']", $ndiv).attr('value', '');
			
			_IW.AppFormRuntime.recommenderEnable(divId, true);
			_IW.FormsRuntime.notBusy();
		});
	}

	var recommenderEnable = function(divId, bEnabled)
	{
		var $div = jQuery(document.getElementById(divId));
		var $inputElements = jQuery("input,select,textarea", $div);
		if (bEnabled)
		{
			$inputElements.removeAttr("disabled");
		}
		else
		{
			$inputElements.attr("disabled", "disabled");
		}
	}
	
	var recommenderPostSave = function(reply,isOk)
	{

		if (reply.uiRecDivIdsArray)
		{
			for (var i = 0; i < reply.uiRecDivIdsArray.length; ++i)
			{
				var divId = reply.uiRecDivIdsArray[i].uiRecDivIdsDivId;
				var recId = reply.uiRecDivIdsArray[i].uiRecDivIdsRecId;
				var status = reply.uiRecDivIdsArray[i].uiRecDivIdsStatus;
				var formSubmitted = reply.uiRecDivIdsArray[i].uiRecDivIdsFormSubmitted;
				
				if (divId && recId && status)
				{
					var bEditable = false;
					var bShowClear = false;
					var bShowSend = false ;
					var bShowResend = false;
					var bShowSelfFulfill = false;
					
					if (status == 'Received')
					{
						bShowSelfFulfill = false;
					}
					else if (status == 'EmailSent')
					{
						bShowResend = true;
						bShowSelfFulfill = false;
					}
					else
					{
						bEditable = true;
						bShowSend = true;
						bShowSelfFulfill = true;
					}

					if ((!formSubmitted) && (status == 'Received' || status == 'EmailSent')) {
						bShowClear = true;
					}

					var $ndiv = jQuery(document.getElementById(divId));
					$ndiv.attr('recId', recId);
					jQuery("[name$='.recId']", $ndiv).attr('value', recId);
					var cId = jQuery("a[id*=recommenderClearBtn]", $ndiv);
					var sId = jQuery("a[id*=recommenderSendBtn]", $ndiv);
					var rId = jQuery("a[id*=recommenderResendBtn]", $ndiv);
					var fId = jQuery("a[id*=recommenderSelfFulfillLink]", $ndiv);
					var uId = jQuery("a[id*=recommenderUnFulfillLink]", $ndiv);
					var nId = jQuery("[id*=recommenderFulfilledFile]", $ndiv);
					bShowClear ? cId.show() : cId.hide();
					bShowSend ? sId.show() : sId.hide();
					bShowResend ? rId.show() : rId.hide();
					bShowSelfFulfill ? fId.show() : fId.hide();
					uId.hide();
					nId.hide();

					_IW.AppFormRuntime.recommenderEnable(divId, bEditable);
				}
			}
		}
	}
	
	var processRecommenderUpload = function(filesUploaded, divId)
	{
		var $ndiv = jQuery(document.getElementById(divId));
		
		jQuery("a[id*=recommenderSendBtn]", $ndiv).hide();
		jQuery("a[id*=recommenderSelfFulfillLink]", $ndiv).hide();
		jQuery("a[id*=recommenderUnFulfillLink]", $ndiv)
			.show()
			.click(function() {
				_IW.FormsRuntime.removeOneUpload(filesUploaded[0]);
				jQuery("a[id*=recommenderSendBtn]", $ndiv).show();
				jQuery("a[id*=recommenderSelfFulfillLink]", $ndiv).show();
				jQuery("a[id*=recommenderUnFulfillLink]", $ndiv).hide();
				jQuery("[id*=recommenderFulfilledFile]", $ndiv).hide();
			});
		jQuery("[id*=recommenderFulfilledFile]", $ndiv)
			.text('"' + filesUploaded[0].originalName + '"')
			.show();
	}
	
	var requirementsPostSave = function(reply,isOk)
	{
		ajax("getRequirementsSection", 
			{}, 
			function(replyObject) 
			{
				for(var i=0; i<_uploadDialogIds.length; i++)
				{
					jQuery('#' + _uploadDialogIds[i]).find("form").remove();
					jQuery('#' + _uploadDialogIds[i]).dialog('destroy');
					jQuery('#' + _uploadDialogIds[i]).remove();
					jQuery('#' + _uploadDialogIds[i] + '-extramarkup').remove();
				}
				$unofficialReqControl = jQuery("#" + _unofficialRequirementsSectionId);
				if($unofficialReqControl != null)
				{
					$unofficialReqControl.replaceWith(replyObject.unofficialRequirements);
				}
				_unofficialRequirementsSectionId = replyObject.unofficialRequirementsSectionId;
				_uploadDialogIds = replyObject.uploadDialogIds;
				$extraMarkup = jQuery("#extramarkup-wrapper");
				$newExtramarkup = jQuery(replyObject.extraMarkup);
				for(var i=0; i<_uploadDialogIds.length; i++)
				{
					for(var r=0; r<$newExtramarkup.length; r++)
					{
						if($newExtramarkup[r] instanceof Element && $newExtramarkup[r].getAttribute("id") == _uploadDialogIds[i] + '-extramarkup')
						{
							//$wrapper = jQuery($newExtramarkup[r]);
							$extraMarkup.append($newExtramarkup[r]);
							jQuery('#' + _uploadDialogIds[i]).dialog({ autoOpen: false, modal: true, resizable: false });
						}
					}
				}
			});
		
	}
	
	var connectionsPostSave = function(reply)
	{
		if (reply.uiConnectionSyncArray)
		{
			for (var i = 0; i < reply.uiConnectionSyncArray.length; ++i)
			{
				var divId = reply.uiConnectionSyncArray[i].connDivId;
				var recId = reply.uiConnectionSyncArray[i].connRecId;

				var $ndiv = jQuery(document.getElementById(divId));
				jQuery("[name$='.connRecId']", $ndiv).attr('value', recId);
			}
		}
	}
	
	var ajax = function(messageType, message, onSuccess, onSuccessNotOK)
	{
		message.iterationId = _iterationId;
		baseAjax(messageType, message, onSuccess, onSuccessNotOK);
	}
	
	var inlineLookupPreflight = function(message)
	{
		// Add iteration id.
		message.iterationId = _iterationId;
		return basePreflight(message);
	}
	
	var onSave = function(reply)
	{
		baseOnSave(reply);
		recommenderPostSave(reply, true);
		connectionsPostSave(reply);
		if(_unofficialRequirementsSectionId != "")
		{
			requirementsPostSave(reply, true);
		}
	}
	
	var onSaveSuccessNotOK = function(reply)
	{
		recommenderPostSave(reply, false);
		connectionsPostSave(reply);
	}
	
	var _hasAdditionalItemSelected = function()
	{
		for (var i = 0; ; i++) 
		{
			var item = document.getElementById("additionalItem_" + i);
			if (!item) 
				break;
			
			var itemSelected = jQuery(item);
			if (itemSelected.attr("checked"))
				return true;
		}
		
		return false;
	}
	
	var submit = function(_form, _spamProtection, _captchaKey)
	{
		if (_addnlItemRequired)
		{
			if (!_hasAdditionalItemSelected())
			{
				_IW.FormsRuntime.showValidatorError({
					field: document.getElementById('additionalItem_0'),
					onFail: function() {
						alert("Please select at least 1 additional item");
					}
				});

				return false;
			}
		}

		var postSubmitCallBack = function(reply) {
			if (reply && reply.newRecommenders)
			{
				var div = document.createElement('div');
				div.innerHTML = reply.newRecommenders;
				var text = div.textContent;

				var recommendersSection = jQuery(_IW.FormsRuntime.getTabs()).find('.Recommenders');
				jQuery(recommendersSection).append(text);
				//if new ConditionalRecommenders, then goto Recommenders Page
				gotoRecommendersTab();
				return false;
			}
			return true;
		}
	
		baseSubmit.apply(this, [_form, _spamProtection, _captchaKey, postSubmitCallBack])
	}

	var performSaveOnNextPrevButton = function(selectedTabIndex)
	{
		var doSave = true;

		jQuery('ul.ui-tabs-nav > li > a', _IW.FormsRuntime.getTabs()).each(function(index, element) {
			//Firefox does not support innerText but textContent; IE doesn't support textContent.
			//NGP-24603: need to handle the prev/next from the back end.
			var aInnerContent = element.innerText || element.textContent;
			if (selectedTabIndex  === index && aInnerContent === _requirementsPageName) 
			{
				doSave = false;
			}
		});

		return doSave;
	}
	var gotoRecommendersTab = function()
	{
		_IW.FormsRuntime.gotoPageByName(_recommendersPageName);
	}
	
	// Install our callback URL
	_IW.FormsRuntime.setRuntimeURL("/ssc/aform/runtime.ssc"); 
	
	// Override the ajax function with our own
	var baseAjax = _IW.FormsRuntime._override("ajax", ajax);
	
	// Override onSave
	var baseOnSave = _IW.FormsRuntime._override("onSave", onSave);

	// Override submit
	var baseSubmit = _IW.FormsRuntime._override("submit", submit);

	// Override onSaveSuccessNotOK
	var baseOnSaveSuccessNotOK = _IW.FormsRuntime._override("onSaveSuccessNotOK", onSaveSuccessNotOK);

	// Override the inline lookup preflight too
	var basePreflight = _IW.FormsRuntime._override("inlineLookupPreflight", inlineLookupPreflight);

	// Override the performSaveOnNextPrevButton to ensure we don't get a double save when moving 
	// to the requirements page from the next or previous button.
	 _IW.FormsRuntime._override("performSaveOnNextPrevButton", performSaveOnNextPrevButton);
	
	return {
		bootstrap: bootstrap,
		clearDiscount: clearDiscount,
		setAdditionalItemSingleSelect: setAdditionalItemSingleSelect,
		setAdditionalItemRequired: setAdditionalItemRequired,
		additionalItemSelectChanged: additionalItemSelectChanged,
		additionalItemQuantityChanged: additionalItemQuantityChanged,
		processDiscount: processDiscount,
		recommenderClear: recommenderClear,
		recommenderSend: recommenderSend,
		recommenderResend: recommenderResend,
		recommenderEnable: recommenderEnable,
		processRecommenderUpload: processRecommenderUpload,
		discountItemSelectChanged: discountItemSelectChanged,
		enableGroupRegistrations: enableGroupRegistrations
	}
}();
