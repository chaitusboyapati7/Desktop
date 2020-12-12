
_IW.HTML = { };

_IW.HTML.makeElement = function(tag, attrs, innerHTML)
{
	var elt = document.createElement(tag);
	
	if(innerHTML)
		elt.innerHTML = innerHTML;
	
	for (var attrName in attrs)
	{
		var attrValue = attrs[attrName];
		if (typeof attrValue == "string")
			elt.setAttribute(attrName, attrValue);
		else
			elt[attrName] = attrValue;
	}
	
	return elt;
}

_IW.HTML.makeCell = function(nodes, attrs)
{
	var cell = _IW.HTML.makeElement('TD', attrs);

	for (var i = 0; i < nodes.length; i++)
	{
		// Each argument could be an HTML string, a DOM node
		if (typeof nodes[i] == "string")
		{
			cell.innerHTML = nodes[i];
		}
		else
		{
			cell.appendChild(nodes[i]);
		}
	}
	
	return cell;
}

_IW.HTML.makeRow = function(cells)
{
	var newRow = document.createElement('TR');

	for (var i = 0; i < cells.length; i++)
		newRow.appendChild(cells[i]);
	
	return newRow;
}

_IW.HTML.makeSelect = function(name, types, selectedValues)
{
	var select = document.createElement('SELECT');
	
	if (name)
		select.name = name;
	
	_IW.HTML.updateSelect(select, types, selectedValues);
	
	return select;
}

_IW.HTML.clearSelect = function(select)
{
	while (select.length)
		select.remove(0);
}

_IW.HTML.getSelectOptions = function(select)
{
	var values = [ ];
	
	var opts = select.options;
	for (var i = 0; i < opts.length; i ++)
	{
		values.push(opts[i].value);
	}
	
	return values;
}

_IW.HTML.updateSelect = function(select, types, selectedValues)
{
	// Unless told otherwise, maintain the selected item, if we can.
	if (! selectedValues)
	{
		selectedValues = [ ];

		var opts = select.options;
		for (var i = 0; i < opts.length; i ++)
		{
			if (opts[i].selected)
				selectedValues.push(opts[i].value);
		}
	}
			
	_IW.HTML.clearSelect(select);
	
	_IW.HTML.addSelectOptions(select, types, selectedValues);
}

_IW.HTML.addSelectOptions = function(select, values, selectedValues)
{
	if (! selectedValues)
		selectedValues = [ ];

	for (var i = 0; i < values.length; i ++) 
	{
		var oneEntry = values[i];
		
		// If oneEntry is a string, then it's the value and text.
		// If it's an object, then it's got separate value and text keys.
		if (typeof oneEntry == "string")
		{
			var text = oneEntry;
			var value = oneEntry;
		}
		else
		{
			var text = oneEntry.text;
			var value = oneEntry.value;
		}

		var selected = false;
		
		for (var j = 0; j < selectedValues.length; j++)
		{
			if (value == selectedValues[j])
			{
				selected = true;
				break;
			}
		}
		
		_IW.HTML.addSelectOption(select, value, text, selected);
	}
}

_IW.HTML.addSelectOption = function(select, value, text, selected)
{
	var option = document.createElement('OPTION');
	option.selected = selected;
	option.text = text;
	option.value = value;
	
	try
	{
		select.add(option);				// IE
	}
	catch (e)
	{
		select.add(option, null);		// Everyone else
	}
}

_IW.HTML.removeChild = function(elt)
{
	if (elt && elt.parentNode)
		elt.parentNode.removeChild(elt);
}

_IW.HTML.selectedSelectValue = function(select)
{
	var typeIdx = select.selectedIndex;
	return typeIdx < 0 ? null : select.options[typeIdx].value;
}

/*
 * setFoucus()
 * Set focus to specified element, elt.
 * If optional flag, bSelect, is specified and is TRUE, select the contents of the element.
 * @param elementIdSelector - an  element id selector (e.g. '#idOfElement')
 */
_IW.HTML.setFocus = function(elementIdSelector, bSelect)
{
	if (elementIdSelector)
	{
		var f = $(elementIdSelector);
		if (f != null)
		{
			f.focus();
			if (bSelect)
			{
				f.select();
			}
		}
	}
};

_IW.HTML.getMultiSelectSelectedItems = function(select)
{
	var items = [ ];
	
	var opts = select.options;
	for (var i = 0; i < opts.length; i ++)
	{
		if (opts[i].selected)
			items.push(opts[i]);
	}

	return items;
}

_IW.HTML.Mouse = { };

//Old forms uses this JS.. but it doesn't use jQuery.
if (typeof Ext != 'undefined')
{
	Ext.onReady(function() {

		Ext.fly(document.body).on("mousemove", function(e) {
			_IW.HTML.Mouse.x = e.getX();
			_IW.HTML.Mouse.y = e.getY();
		});
		
	});
}