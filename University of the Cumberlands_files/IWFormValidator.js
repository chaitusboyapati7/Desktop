/*
 This file has 3 major areas
 
 1.  _IW.Validators is a hash of predicate functions.  They can be used
 stand-alone or with _IW.FormValidator
 
 2.  _IW.FormValidator is a collection of functions for installing, and
 executing form validations.  These routines are generic in that they
 don't assume any IW business rules.
 
 3.  _IW.UITypeValidator is a collection of functions for implementing
 some IW specific validations.
 INTRO to _IW.FormValidator
 
 Each field on a form may have zero or more validators.  A validation
 function can do anything, not just validation.  Each validation function
 comes with several things.  1.  The field to validate, 2.  The JS code
 to perform the actual validation, 3.  An optional function to call if the
 validation fails (presumably to inform the user), and 4.  An optional
 hash of validation options.  Some options are specific to the particular
 validator and some options apply to any validator.
 
 DESIGN
 At the lowest level, an HTML form is validated with the ONSUBMIT function.
 If that function returns FALSE, the form is not submitted.  The major
 feature of IWFormValidator is that it can co-exist with existing ONSUBMIT
 code.  When you add a validator with IWFormValidator, IWFormValidator will
 replace the ONSUBMIT function for that form with _validateForm().
 _validateForm() will run all of the validators installed with IWFormValidator
 and then back chain the original ONSUBMIT function.
 */
/*/////////////////////////////////////////////////////////////////////////////////////////////*/

/*
 * Validators - These are tests that return TRUE if OK else FALSE.
 */
_IW.Validators = {



	// use this override the standard blankText
	notBlank: {
		//blankText: 'This field is required.',

		//copy/paste from notEmpty
		predicate: function(value)
		{
			return value && value.length > 0;
		},
		errorMessage: 'This field is required.'
	},


	// is value defined and a string with atleast 1 character?
	notEmpty: {
		predicate: function(value)
		{
			return value && value.length > 0;
		},
		errorMessage: "Please enter a value."
	},
	
	// is the value not empty and a valid email address?
	validEmail: {
		predicate: function(value)
		{
			var re = /^\s*\w+([a-zA-Z0-9_+'*$%#=?`~{}\^&!\.\-\/])*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+\s*$/;
			return value && re.test(value);
		},
		errorMessage: "Please enter a valid email address."
	},
	
	//
	validDate: {
		predicate: function(value, options)
		{
			if (!value) 
				return false;
			
			var delim = "/";
			var mmPos = 0;
			var ddPos = 1;
			var yyyyPos = 2;

			// Validate date with the compareTo option.
			if (options && options.compareTo)
			{
				var strRegExp = "";
				for (i = 0; i < options.compareTo.length; i++) {
					var oneChar = options.compareTo.charAt(i);
					
					if ((oneChar == 'm' || oneChar == 'M') ||
						(oneChar == 'd' || oneChar == 'D') ||
						(oneChar == 'y' || oneChar == 'Y')) {
						strRegExp = strRegExp + '\\d';
					} else {
						delim = oneChar;
						strRegExp = strRegExp + delim;
					}
				}
				
				strRegExp = '^' + strRegExp + '$';
				
				var re = new RegExp(strRegExp);
				if (!re.test(value)) 
					return false;
				
				var maskElements = options.compareTo.split(delim);
				
				if(maskElements.length == 3){
					for(i = 0; i < maskElements.length; i++){
						var part = maskElements[i].toLowerCase();
						
						if(part.indexOf("m") == 0){
							mmPos = i;
						}
						else if(part.indexOf("d") == 0){
							ddPos = i;
						}
						else if(part.indexOf("y") == 0){
							yyyyPos = i;
						}
					}
				}
			}
						
			var dateelements = value.split(delim);
			var mm = dateelements[mmPos];
			var dd = dateelements[ddPos];
			var yyyy = dateelements[yyyyPos];
			
			if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1000) 
				return false;
			
			if (mm == 2 && dd > 29) 
				return false;
			
			// Leapyear check.. note this isn't strictly correct.
			// TODO - Use the native date object for all of this validation?
			if (mm == 2 && dd > 28 && (yyyy % 4) != 0) 
				return false;
			
			switch (parseInt(mm))
			{
				case 2:
				case 4:
				case 6:
				case 9:
				case 11:
				{
					if (dd > 30) 
						return false;
				}
			}
			
			if (options && options.dateIs && options.dateIs != "Any")
			{
				var dateIsValue = options.dateIsValue;
				var dateIsValueElements = dateIsValue.split(delim);
				var omm = dateIsValueElements[mmPos];
				var odd = dateIsValueElements[ddPos];
				var oyyyy = dateIsValueElements[yyyyPos];
				var odate = new Date(oyyyy, omm, odd);
				var vdate = new Date(yyyy, mm, dd);

				if (options.dateIs == "Before")
				{
					if (odate < vdate) {
						this.errorMessage = "Please enter a date that is on or before " + dateIsValue;
						return false;
					}
				}
				else // After
				{
					if (odate > vdate)
					{
					    this.errorMessage = "Please enter a date that is on or after " + dateIsValue;
						return false;
					}
				}
			}
			
			return true;
		},
		errorMessage: "Please enter a valid date"
	},
	
	//
	validMonthYear: {
		predicate: function(value)
		{
			if (!value) 
				return false;
			
			var re = /^\d{1,2}\/\d{4}$/;
			if (!re.test(value)) 
				return false;
			
			var dateelements = value.split("/");
			var mm = dateelements[0];
			var yyyy = dateelements[1];
			
			if (mm < 1 || mm > 12 || yyyy < 1 || yyyy < 1000) 
				return false;
			
			return true;
		},
		errorMessage: "Please enter a valid month and year [mm/yyyy]"
	},
	
	//
	validTime: {
		predicate: function(value)
		{
			if (!value) 
				return false;
			
			var re = /^\d{1,2}\:\d{1,2}$/;
			if (!re.test(value)) 
				return false;
			
			var timeelts = value.split(":");
			var hh = timeelts[0];
			var mm = timeelts[1];
			
			if (hh < 0 || hh > 23 || mm < 0 || mm >= 60) 
				return false;
			
			return true;
		},
		errorMessage: "Please enter a valid time [hh:mm] in 24 hour format. (00:00 to 23:59)"
	},
	
	isInteger: {
      		predicate: function(value)
      		{
      			if (!value)
      				return false;

      			var re = /^-?\d+$/;
      			if (!re.test(value))
      				return false;

      			return true;
      		},
      		errorMessage: "Please enter a valid integer"
      	},

	isPositiveInteger: {

		//strValue is assumed to be a string
		predicate: function(strValue)
		{
			var ok = true;

			if (!strValue) {
				ok = false;
			} else {
				//copy of Ext.isNumeric function - might not always have Ext
				var isNumeric = !isNaN(parseFloat(strValue)) && isFinite(strValue);
				if(isNumeric){
					var n = Number(strValue);
					ok = (n > 0);
				} else {
					ok = false;
				}
			}

			return ok;
		},
		errorMessage: "Please enter a valid positive integer"
	},

	isNumber: {
		predicate: function(value)
		{
			if (!value) 
				return false;
			
			var re = /^-?\d*\.?\d*$/;
			if (!re.test(value)) 
				return false;
			
			return true;
		},
		errorMessage: "Please enter a valid number"
	},
	
	maxDecimalPlaces: {
		predicate: function(value, options)
		{
			if (!value) 
				return true;
			
			if (!options || !options.maxDecimalPlaces)
				return true;
			
			var period = value.indexOf('.');
			if (period < 0)
				return true;
			
			var decimalPart = value.substring(period + 1);
			
			return decimalPart.length <= options.maxDecimalPlaces;
		},
		errorMessage: "Too many decimal places"
	},

	greaterOrEqual: {
		predicate: function(value, options)
		{
			if (!value) 
				return false;
			
			return parseFloat(value) >= parseFloat(options.compareTo);
		},
		errorMessage: "Value must be greater than or equal to"
	},

	lessOrEqual: {
		predicate: function(value, options)
		{
			if (!value) 
				return false;
			
			return parseFloat(value) <= parseFloat(options.compareTo);
		},
		errorMessage: "Value must be greater than or equal to"
	},

	between: {
		predicate: function(value, options)
		{
			if (!value) 
				return false;
			
			return parseFloat(value) >= parseFloat(options.compareTo) && parseFloat(value) <= parseFloat(options.andTo);
		},
		errorMessage: "Value must be between"
	},

	isStringNumberWithLength : {
		predicate : function(value, options)
		{
			if ((options && options.isReqFunc) || (value && value.length != 0))
			{
				if (options.expectedLength)
				{
					if (value.length != options.expectedLength)
					{
						return false;
					}
					else
					{
						// regex to find positive integer only
						var re = /^\d+$/;
						if (!re.test(value))
							return false;
					}
				}
			}

			return true;
		},
		errorMessage : "Value must have digits equal to"
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////////

/*
 * Form Validator. Used in validating forms automatically.
 * NOTE - This code is generic.  Please keep IW specific business logic out.
 * Use UITypeValidator to enforce specific business logic.
 */
_IW.FormValidator = function()
{
	var _forms = [];

	var _findValidatorDataForForm = function(form)
	{
		for (var i = 0; i < _forms.length; i++) 
		{
			var oneData = _forms[i];
			if (oneData.form == form) 
			{
				return oneData;
			}
		}
		
		return null;
	}

	// Inserts a predicate function into the onsubmit chain for the form
	// that the field lives in.
	var _insertValidator = function(field, func, onFailFunc, options)
	{
		if (typeof field == 'string') 
			field = document.getElementById(field);
		
		if (!field.form) 
			return;
		
		// Find the validation functions for this form
		var validatorData = _findValidatorDataForForm(field.form);
		
		if (!validatorData) 
		{
			validatorData = {
				form: field.form,
				validators: [],
				onSubmit: field.form.onsubmit
			};
			
			_forms.push(validatorData);
			
			field.form.onsubmit = function()
			{
				return _validateForm(field.form);
			}
		}
		
		// NOTE - this structure is exposed for getAllValidatorsForField().
		// If we change this, make sure it's backward compatible.
		validatorData.validators.push({
			field: field,
			func: func,
			onFail: onFailFunc,
			options: options
		});
	}
	
	var _addTextFieldValidator = function(field, validatorName, errorMessageOverride, options)
	{
		// field = $(field) - Don't use prototype.js in here.
		if (typeof field == 'string') 
			field = document.getElementById(field);
		
		var validator = _IW.Validators[validatorName];
		
		_insertValidator(field, function()
		{
			var val = field.value;
			
			// Trim
			if (options && options.trim) 
			{
				val = val.replace(/^\s+|\s+$/g, "");
				field.value = val;
			}
			
			// Is "" considered valid?  i.e. this isn't a required field.
			if (options && options.emptyvalid && val.length == 0) 
			{
				return true;
			}
			
			if (!validator.predicate(val, options)) 
				return false;
			
			return true;
		}, function()
		{
			var errorMessage = errorMessageOverride ? errorMessageOverride : validator.errorMessage;
			
			showValidationErrorDialog(field, errorMessage);

		}, options);
	};
	
	// Validate the data joined between several input text fields.
	var _addMultiTextFieldValidator = function(field, validatorName, errorMessageOverride, options)
	{
		if (typeof field == 'string') 
			field = document.getElementById(field);
		
		var validator = _IW.Validators[validatorName];
		var fieldToFocus = document.getElementsByClassName(field.id)[0];
		
		_insertValidator(field, function()
		{
			var val = "";
			var fields = document.getElementsByClassName(field.id);
			for (i=0; i< fields.length; i++) 
			{
				val += fields[i].value; 
			}
			
			// Trim
			if (options && options.trim) 
			{
				// Remove whitespace from both sides of the string
				val = val.replace(/^\s+|\s+$/g, "");
			}
			field.value = val;
			
			if (!validator.predicate(val, options))
			{
				return false;
			}
			
			return true;
		}, function()
		{
			var errorMessage = errorMessageOverride ? errorMessageOverride : validator.errorMessage;
			alert(errorMessage);
			fieldToFocus.focus();
		}, options);
	};
	
	// Validate that the select field has a value != "" (or -None-)
	var _addSingleSelectValidator = function(field, errorMessage, options)
	{
		// field = $(field) - Don't use prototype.js in here.
		if (typeof field == 'string') 
			field = document.getElementById(field);
		
		_insertValidator(field, function()
		{
			var val = _IW.HTML.selectedSelectValue(field);
			return val && val.length > 0 && val != "-None-";
		}, function()
		{
			showValidationErrorDialog(field, errorMessage);
		}, options);
	};
	
	// Validate the number of selected items against a min and max.
	// Either can be null to indicate unlimited.
	var _addMultiSelectValidator = function(field, minimum, maximum, errorMessage, options)
	{
		// field = $(field) - Don't use prototype.js in here.
		if (typeof field == 'string') 
			field = document.getElementById(field);
		
		_insertValidator(field, function()
		{
			// Get the count of selected items
			var count = _IW.HTML.getMultiSelectSelectedItems(field).length;
			
			if ((minimum && count < minimum) || (maximum && count > maximum)) 
				return false;
			
			return true;
		}, function()
		{
			showValidationErrorDialog(field, errorMessage);
		}, options);
	};
	
	var _addCheckboxFieldValidator = function(field, errorMessage, options)
	{
		// field = $(field) - Don't use prototype.js in here.
		if (typeof field == 'string') 
			field = document.getElementById(field);
		
		_insertValidator(field, function()
		{
			return field.checked;
		}, function()
		{
			showValidationErrorDialog(field, errorMessage);
		}, options);
	};
	
	var _getFailingValidators = function(form, optionalSubsetOfFields)
	{
		var failingValidators = [];
		
		var validatorData = _findValidatorDataForForm(form);
		if (!validatorData) 
			return failingValidators;
		
		for (var i = 0; i < validatorData.validators.length; i++) 
		{
			var oneValidator = validatorData.validators[i];
			
			var field = oneValidator.field;
			
			// If we have to work with a subset, make sure this field is in it.
			if (optionalSubsetOfFields) 
			{
				var foundIt = false;
				
				for (var j = 0; !foundIt && j < optionalSubsetOfFields.length; j++) 
				{
					var oneOptionalField = optionalSubsetOfFields[j];
					
					if (typeof oneOptionalField == 'string') 
						foundIt = (oneOptionalField == field.id);
					else 
						foundIt = (oneOptionalField == field);
				}
				
				if (!foundIt) 
					continue;
			}
			
			var options = oneValidator.options;
			
			// Don't execute any validator which is disabled.
			if (options && options.disabled) 
				continue;
			
			// If the field is removed from the form, we ignore it.
			if (!field.parentNode || !field.form) 
				continue;
			
			if (!oneValidator.func()) 
			{
				failingValidators.push(oneValidator);
			}
		}
		
		return failingValidators;
	}
	
	var _validateForm = function(form, optionalSubsetOfFields)
	{
		var validatorData = _findValidatorDataForForm(form);
		if (!validatorData) 
			return true;
		
		var failingValidators = _getFailingValidators(form, optionalSubsetOfFields);
		
		if (failingValidators.length) 
		{
			// TODO - Move the alerts()s out and add support for "error message" in the validator.
			// TODO - Let this function do the alert().
			// TODO - That lets us implement the alert() in other ways.
			var oneValidator = failingValidators[0];
			var onFailFunc = oneValidator.onFail;
			
			if (onFailFunc) 
				onFailFunc();
			
			return false;
		}
		
		return validatorData.onSubmit ? validatorData.onSubmit() : true;
	}
	
	var _getAllValidatorsForField = function(field)
	{
		var all = [];
		
		if (typeof field == 'string') 
			field = document.getElementById(field);
		
		var validatorData = _findValidatorDataForForm(field.form);
		
		if (validatorData) 
		{
			for (var i = 0; i < validatorData.validators.length; i++) 
			{
				var oneValidator = validatorData.validators[i];
				if (oneValidator.field == field && oneValidator.options) 
					all.push(oneValidator);
			}
		}
		
		return all;
	}
		
	// Creates a JQuery validation error dialog.
	// For now, to be consistent with the responsive.css and responsive.js, the mobile check
	// is checking the screen width to see if it's < 769.
	// For desktops, the JQuery dialog is centered in the middle of the screen.
	// For mobile, the JQuery dialog is top centered over the erroneous field to prevent the
	// dialog from being hidden under the soft keyboard.
	showValidationErrorDialog = function(field, errorMessage)
	{
		var errorDiv = document.createElement("div");
		errorDiv.innerHTML = errorMessage;
		var center = document.createElement("center");
		errorDiv.appendChild(center);
		
		// default values for desktop
		var myPos = "center";
		var myAt = "center";
		var myOf = window;
		
		jQuery(errorDiv).dialog({ 
			autoOpen: true,
			modal: true,
			resizable: true,
			maxWidth: 250,
			maxHeight: 250,
			width: 250,
			title: "Error",
			position: { my: myPos, at: myAt, of: myOf },
        	close: function() {field.focus();},
			buttons: {
				"Close": function() {
					// Show the submit button and close the dialog.
					jQuery("#form-wrapper").addClass("mobile-responsive");
					jQuery(this).closest('.ui-dialog-content').dialog('close');
				}
			}
		});		
	}
		
	return {
		insertValidator: _insertValidator,
		addTextFieldValidator: _addTextFieldValidator,
		addMultiTextFieldValidator: _addMultiTextFieldValidator,
		addSingleSelectValidator: _addSingleSelectValidator,
		addMultiSelectValidator: _addMultiSelectValidator,
		addCheckboxFieldValidator: _addCheckboxFieldValidator,
		validateForm: _validateForm,
		getAllValidatorsForField: _getAllValidatorsForField,
		getFailingValidators: _getFailingValidators
	};
	
}();

/////////////////////////////////////////////////////////////////////////////////////////////////

_IW.UITypeValidator = function()
{
	var _addDateTimeValidator = function(dateField, timeField, dateFormat, timeFormat, bRequired)
	{
		if (typeof dateField == 'string') 
			dateField = document.getElementById(dateField);
		if (typeof timeField == 'string') 
			timeField = document.getElementById(timeField);
		
		var validatorOpts = {
			trim: true,
			emptyvalid: true
		};
		
		var dateValidatorOpts = {
			trim: true,
			emptyvalid: true
		};
		
		if (dateFormat != null)
		{
			dateValidatorOpts.compareTo = dateFormat;
		}
		
		var timeValidatorOpts = {
			trim: true,
			emptyvalid: true
		};
		
		if (timeFormat != null)
		{
			timeValidatorOpts.compareTo = timeFormat;
		}
		
		var isReqOpts = {
			trim: true,
			isReqFunc: true
		};
			
		if (!bRequired) 
		{
			isReqOpts.disabled = true;
		}
		
		// If the date and time isn't required, then either both or none must
		// be specified.
		_IW.FormValidator.insertValidator(dateField, function()
		{
			// Make sure dateField and timeField are either both empty or non-empty
			return _IW.Validators.notEmpty.predicate(dateField.value) ==
				_IW.Validators.notEmpty.predicate(timeField.value);
		}, function()
		{
			if (dateField.value.length == 0) 
			{
				showValidationErrorDialog(dateField, "If you enter a time, you must enter a date.");
			}
			else 
			{
				showValidationErrorDialog(timeField, "If you enter a date, you must enter a time.");
			}
		}, validatorOpts);
		
		_IW.FormValidator.addTextFieldValidator(dateField, "notEmpty", null, isReqOpts);
		_IW.FormValidator.addTextFieldValidator(timeField, "notEmpty", null, isReqOpts);
		
		var errorMessage = null;
		
		if (dateFormat != null)
		{
			errorMessage = "Please enter a valid date [" + dateFormat.toLowerCase() + "]";
		}
		
		_IW.FormValidator.addTextFieldValidator(dateField, "validDate", errorMessage, dateValidatorOpts);
		_IW.FormValidator.addTextFieldValidator(timeField, "validTime", null, timeValidatorOpts);
	}
	
	var _addGroupMultiSelectValidator = function(fieldname, label, opts)
	{
		_IW.FormValidator.insertValidator(fieldname, function()
		{
			return _IW.UITypes.groupMultiSelectValidator(fieldname);
		}, function()
		{	
			showValidationErrorDialog(document.getElementById(fieldname), 
					"Please select at least 1 value for " + label);
		}, opts);
	}
	
	var _addDependantFieldValueValidator = function(fieldname, label, dependantFieldname, dependantFieldvalue, opts)
	{
		var thefield = document.getElementById(fieldname);
		
		_IW.FormValidator.insertValidator(thefield, function()
		{
			// Is "" considered valid?  i.e. this isn't a required field.
			if (opts && opts.emptyvalid && thefield.value.length == 0)
			{
				return true;
			}
			
			var dependantField = document.getElementById(dependantFieldname);
			
			var val = _IW.HTML.selectedSelectValue(dependantField);
			
			if(val == dependantFieldvalue){
				return _IW.Validators.notEmpty.predicate(thefield.value);
			}
			
			return true;
		}, function()
		{
			showValidationErrorDialog(theField, label + " must have a value.");
		}, opts);
	}
	
	return {
		addDateTimeValidator: _addDateTimeValidator,
		addGroupMultiSelectValidator: _addGroupMultiSelectValidator,
		addDependantFieldValueValidator: _addDependantFieldValueValidator
	};
}();
