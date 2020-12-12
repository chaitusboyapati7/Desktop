// $Id$

_IW.FieldDep = function()
{
	var _rootParentFields = {};
	var _depFields = {};
	var _allDepFields = {};	// All dependent fields.
	var _allAllowedValues = {}; // All values not hidden for dependent fields.
	var _dependencies = [];

	var addToDependencies = function(parentFieldId, depFieldId, depmap, parentValMap)
	{
		_dependencies.push({parentFieldId:parentFieldId,depFieldId:depFieldId,depmap:depmap,parentValMap:parentValMap});
	}
	
	var addDependency = function(parentFieldId, depFieldId, depMap, parentValMap)
	{
		var parentFieldElement = document.getElementById(parentFieldId);
		if (parentFieldElement)
		{
			jQuery(parentFieldElement).change(function()
			{
				trigger(this, parentFieldId, depFieldId, depMap, parentValMap);
			});
		}
		else
		{
			trigger(null, parentFieldId, depFieldId, depMap, parentValMap);
		}

		// Register every dependent field (a field that is dependent on another).
		// We'll grab the field's values later.
		if(!_allDepFields[depFieldId])
			_allDepFields[depFieldId] = true;

		//
		// Keep track of every "root" parentField.  A root parentfield is a field
		// that doesn't depend on any other field.  We'll collect the root
		// parentfields and fire off a change() event in order to trigger
		// the setting of initial values.
		//

		// If we're a dependent field, we're not a root parent field.
		if (_depFields[parentFieldId])
			return;

		// If our dep field is currently a parent Field.. demote him!
		delete _rootParentFields[depFieldId];

		_rootParentFields[parentFieldId] = 1;
		_depFields[depFieldId] = 1;
	}

	var trigger = function(parentField, parentFieldId, depFieldId, depMap, parentValuesMap)
	{
		var selectedValue;

		if (parentField)
		{
			selectedValue = jQuery(parentField).val();
		}
		else
		{
			selectedValue = parentValuesMap[parentFieldId];
		}

		var depFieldElement = document.getElementById(depFieldId);
		var depMapValues = depMap[selectedValue] || _IW.HTML.getSelectOptions(depFieldElement) || []; // IW-4645

		if (!depFieldElement)
		{
			return;
		}

		// Ensure the proper allowed values are verified, to make sure the
		// hidden values are accounted for.
		// Grab the form element and if it is not in the _allAllowedValues array,
		// then add it.  This will ensure that only the first render of the element,
		// which has the proper hidden values, is ever added to the _allAllowedValues
		// array.  
		var depFieldEl = document.getElementById(depFieldId);
				
		if((depFieldEl) && !_allAllowedValues[depFieldId])
			_allAllowedValues[depFieldId] = _IW.HTML.getSelectOptions(depFieldEl);
	
		var allowedValues = _allAllowedValues[depFieldId];
		var depValues = [ ];
		
		for (var i = 0; i < depMapValues.length; i++){
			var depMapValue = depMapValues[i];
			
			for (var j = 0; j < allowedValues.length; j++)
			{
				if (depMapValue == allowedValues[j])
				{
					depValues.push(depMapValue);
					break;
				}
			}
		}

		_IW.HTML.updateSelect(depFieldElement, depValues);

		// Chain any change handlers
		jQuery(depFieldElement).change();
	}

	var triggerAll = function()
	{

		// Setup data to handle non-hidden values.  Remember all allowed dependent field values from first render before we clear them out.
		for (depFieldId in _allDepFields){
			// If we aren't already remembering allowed values.
			if(!_allAllowedValues[depFieldId]){
				/*
				 * IMPORTANT - The field dependency initializer fires for every Parent/Child Dependency regardless whether the Child field exists
				 * on the form.  The reasoning behind this is unknown however it is probably due to the fact that traversing the form descriptor 
				 * each time a field is rendered for each and every child field involved in a dependency that exists for a field is expensive. 
				 * It is important because we don't taverse the description for each child field in a dependency that we gracefully skip any fields 
				 * that aren't found o the form.
				 * 
				 * *** Example ***
				 * 
				 * A form with 3 fields, 1 parent and 2 child in dependency relationships.  A third dependency would exist for the parent 
				 * and a child where that child isn't on the form.
				 * 
				 * Dependencies-
				 * 
				 * Parent 1 > Child 1
				 * Parent 1 > Child 2
				 * Parent 1 > Child 3
				 * 
				 * Fields on Form- Parent 1, Child 1, Child 2
				 * Fields not on Form- Child 3
				 */
				var depFieldEl = document.getElementById(depFieldId);
				
				if(depFieldEl)
					_allAllowedValues[depFieldId] = _IW.HTML.getSelectOptions(depFieldEl);
			}
		}

		// Trigger all root parent fields
		for (parentFieldId in _rootParentFields)
			jQuery(document.getElementById(parentFieldId)).change();

		// Zero-out our list.  We'll trigger the next batch, if any, after they're added.
		// Dynamic forms ("Add Another Response") needs this capability.
		_rootParentFields = {};
	}

	var addConditionalDisplay = function(sectionId, logic)
	{
		// Make sure we're 'ready' before continuing..
		var args = arguments;
		jQuery(function() {
			_addConditionalDisplay.apply(this, args);
		});
	}
	
	var _addConditionalDisplay = function(sectionId, logic)
	{	
		// For each field that controls this section, add a callback
		var crit = logic.criteria;

		if (!crit)
			return;
		
		_each(crit, function(oneCrit) 
		{
			if (oneCrit.htmlid)
			{				
				if (_IW.UITypes.isGPMultiSelect(oneCrit.htmlid))
				{
					_IW.UITypes.groupMultiSelectOnChange(oneCrit.htmlid, function() 
					{
						_doConditionalDisplay(sectionId, logic);
					});
				}
				else
				{
					jQuery(document.getElementById(oneCrit.htmlid)).change(function() 
					{
						_doConditionalDisplay(sectionId, logic);
					});
				}
			}
		});
		
		// Fire it right away to set the initial state
		_doConditionalDisplay(sectionId, logic);
	}

	var _doConditionalDisplay = function(sectionId, logic)
	{
		if (_evalConditions(logic))
		{
			jQuery(document.getElementById(sectionId)).removeClass('conditionallyHidden');
		}
		else
		{
			jQuery(document.getElementById(sectionId)).addClass('conditionallyHidden');
		}
	}
	
	var _evalConditions = function(logic)
	{
		for (var i = 0; i < logic.criteria.length; i++)
		{
			var oneCrit = logic.criteria[i];
			
			// If we don't have an htmlid, then that means the field
			// is missing and we'll treat the condition as "FALSE".
			// Note that this may not be technically correct for
			// check-box fields.
			if (!oneCrit.htmlid)
				var pass = false;
			else
				var pass = _checkFieldValue(oneCrit.htmlid, oneCrit.values);
			
			if (pass)
			{
				if (logic.match == "any")
					return true;
			}
			else
			{
				if (logic.match == "all")
					return false;
			}
		}
		
		return logic.match == "all";
	}
	
	var _checkFieldValue = function(field, values)
	{
		if (_IW.UITypes.isGPMultiSelect(field))
		{
			var val = _IW.UITypes.getGroupMultiSelectValues(field);

            for (var prop in values)
            {
                if (values.hasOwnProperty(prop))
                {
                	var haystack = val[prop];
                	var needles = values[prop];
                	
                	if (haystack)
                	{
	        			for (var i = 0; i < haystack.length; i++)
	        			{
	        				for (var j = 0; j < needles.length; j++)
	        				{
	        					if (haystack[i] == needles[j])
	        						return true;
	        				}
	        			}
                	}
                }
            }
		}
		else
		{
			var val = _IW.FormsRuntime.getElementValue(document.getElementById(field));

			if (! jQuery.isArray(values))
				values = [ values ];
	
			if (! jQuery.isArray(val))
				val = [ val ];
	
			for (var i = 0; i < val.length; i++)
			{
				for (var j = 0; j < values.length; j++)
				{
					if (val[i] == values[j])
						return true;
				}
			}
		}
		
		return false;
	}
	
	// Closure-breaking iterator.  Stolen from ExtJS.
    var _each = function(array, fn, scope)
    {
        for (var i = 0; i < array.length; i++)
        {
            if (fn.call(scope || array[i], array[i], i, array) === false)
                return i;
        }
    }
    
    var runAllDependencies = function()
    {
    	if(_dependencies.length != 0)
    	{
    		for(i=0;i < _dependencies.length; i++)
        	{
    			addDependency(_dependencies[i].parentFieldId, _dependencies[i].depFieldId, _dependencies[i].depmap, _dependencies[i].parentValMap);
        	}	
    	}
    }

	// trigger root parent fields/dependency change events
	jQuery(document).ready(triggerAll);
	
	return {
		addDependency: addDependency,
		addConditionalDisplay: addConditionalDisplay,
		addToDependencies: addToDependencies,
		runAllDependencies:runAllDependencies,
		triggerAll: triggerAll
	}
}();
