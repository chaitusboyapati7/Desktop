// $Id$
// _IW.UIType (without "s" on the end) is created in headers.jsp from the UIType.java class statics
// e.g. in crud.js _IW.UIType.TEXTFIELD

_IW.UITypes = function()
{
	var collectMultiSelectValues = function(fieldname)
	{
		var combo = "";
		var selectField = document.getElementById("combo_" + fieldname);
		for ( var i = 0; i < selectField.length; i++)
		{
			var opt = selectField.options[i];
			if (opt.selected)
			{
				if (combo != "")
					combo += ";";

				combo += opt.value;
			}
		}

		document.getElementById(fieldname).value = combo;
	};

	var isGPMultiSelect = function(elementid)
	{
		if (typeof elementid != "string")
			elementid = elementid.id;
		
		return document.getElementById("group_" + elementid + "_0") != null;
	};
	
	// TODO - Re-write me to use getGroupMultiSelectValues()
	var collectGroupMultiSelectValues = function(fieldname)
	{
		var combo = "";
		var atleastOne = false;

		for ( var groupNum = 0;; groupNum++)
		{
			var groupNameField = document.getElementById("group_" + fieldname + "_" + groupNum);
			if (!groupNameField)
				break;

			var newGroup = true;

			var first = true;
			for ( var checkNum = 0;; checkNum++)
			{
				var check = document.getElementById("group_" + fieldname + "_" + groupNum + "_"
						+ checkNum);
				if (!check)
					break;

				if (check.checked)
				{
					// Lazily create the group separator and group prolog
					// to avoid having empty groups listed.
					if (newGroup)
					{
						if (combo.length > 0)
							combo += "##";
						combo += groupNameField.value + "--";
						newGroup = false;
					}

					if (!first)
						combo += "::";
					
					combo += check.value;
					
					atleastOne = true;
					first = false;
				}
			}
		}

		if (!atleastOne)
			combo = "";

		document.getElementById(fieldname).value = combo;
	};

	var getGroupMultiSelectValues = function(fieldname)
	{
		if (typeof fieldname != "string")
			fieldname = fieldname.id;

		var combo = { };

		for (var groupNum = 0;; groupNum++)
		{
			var groupNameField = document.getElementById("group_" + fieldname + "_" + groupNum);
			if (!groupNameField)
				break;

			for (var checkNum = 0;; checkNum++)
			{
				var check = document.getElementById("group_" + fieldname + "_" + groupNum + "_"
						+ checkNum);
				if (!check)
					break;

				if (check.checked)
				{
					var vals = combo[groupNameField.value];
					
					if (! vals)
					{
						vals = [ ];
						combo[groupNameField.value] = vals;
					}

					vals.push(check.value);
				}
			}
		}
		
		return combo;
	};
	
	var groupMultiSelectOnChange = function(fieldname, onChange)
	{
		for (var groupNum = 0;; groupNum++)
		{
			var groupNameField = document.getElementById("group_" + fieldname + "_" + groupNum);
			if (!groupNameField)
				break;

			for (var checkNum = 0;; checkNum++)
			{
				var check = document.getElementById("group_" + fieldname + "_" + groupNum + "_"
						+ checkNum);
				
				if (check)
					jQuery(check).change(onChange);
				else
					break;
			}
		}
	};

	var groupMultiSelectValidator = function(fieldname)
	{
		for ( var groupNum = 0;; groupNum++)
		{
			var groupNameField = document.getElementById("group_" + fieldname + "_" + groupNum);
			if (!groupNameField)
				break;

			for ( var checkNum = 0;; checkNum++)
			{
				var check = document.getElementById("group_" + fieldname + "_" + groupNum + "_"
						+ checkNum);
				if (!check)
					break;

				if (check.checked)
					return true;
			}
		}

		return false;
	};

	var richTextEdit = function(button, propName)
	{
		var div = document.createElement("div");
		div.id = Ext.id();
		div.style.background = "white";
		div.style.className = "x-hide-display";
		document.body.appendChild(div);

		var hidden = document.getElementById(propName);

		var oFCKeditor = new _IW.FCKExt({
			   value: hidden.value
		});
		
		var win = new Ext.Window({
			title: 'Edit',
			modal: true,
			width: 800,
			items: [oFCKeditor],
			buttons: [
					{
						text: 'Done',
						handler: function()
						{
							hidden.value = oFCKeditor.getValue();
							button.setText(hidden.value.length ? "Edit" : "Create");
							win.close();
						}
					}, {
						text: 'Cancel',
						handler: function()
						{
							win.close();
						}
					}
			]
		}).show();

		return false;
	};
	
	

	var previewRichText = function(markup)
	{
		new Ext.Window({
			title: 'Preview',
			width: 700,
			height: 400,
			modal: true,
			html: markup
		}).show();

		return false;
	};

	/**
	 * NOTE this function will be going away with new CRUD.  Don't use this beyond old CRUD.
	 */
	var bindInlineLookup = function(sModule, sSingular, sPlural, sTextFieldId, sHiddenFieldName,
			sInitialValue, searchContext, quickCreateParameters)
	{
		new Ext.ToolTip({
			target: sTextFieldId,
			anchor: 'bottom',
			html: "To find " + sPlural + " simply start typing in the field."
		});
		
		var lf = new _IW.LookupField({
			objectType: sModule,
			objectSingular: sSingular,
			objectPlural: sPlural,
			searchContext: searchContext,
			quickCreateParameters: quickCreateParameters,
			initialValue: sInitialValue,
			canQuickCreate: true,
			hiddenName: sHiddenFieldName,
			name: sTextFieldId,
			width: 200
		});
		
		var tf = Ext.fly(sTextFieldId).dom;
        lf.render(tf.parentNode, tf);
        Ext.removeNode(tf);
	};

	var isInteger = function(uiType)
	{
		if (uiType == _IW.UIType.INTEGER || uiType == _IW.UIType.GENERATEDCOUNTASLINK ||
				uiType == _IW.UIType.GENERATEDCOUNTNOTLINK)
		{
			return true;
		}
		return false;
	};

	return {
		collectMultiSelectValues: collectMultiSelectValues,
		isGPMultiSelect: isGPMultiSelect,
		collectGroupMultiSelectValues: collectGroupMultiSelectValues,
		groupMultiSelectValidator: groupMultiSelectValidator,
		groupMultiSelectOnChange: groupMultiSelectOnChange,
		getGroupMultiSelectValues: getGroupMultiSelectValues,
		richTextEdit: richTextEdit,
		previewRichText: previewRichText,
		bindInlineLookup: bindInlineLookup,
		isInteger: isInteger
	};
}();
