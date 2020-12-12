_IW.CountryState = function ()
{
	var countryArray = null;
	
	var ajaxCall = function(message,callback, async, url){
			async = (async == null) ? true : async;
			
			jQuery.ajax({
				async: async,
				url: url,
				type: "POST",
				cache: false,
				contentType: "application/json",
				data: message,
				dataType: "json",
				processData: false,
				success: function (data, textStatus) {
					if (data.status == "ok")
						callback(data);
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					alert("An error occurred while trying to communicate with the server");
				}
			});
	}
	
	var triggerCountry = function(countryID, isForm)
	{ 
		var oCountry = document.getElementById(countryID);
		var oMessage = "{\"task\":\"getCountries\"}"
		if(!isForm)
			ajaxCall(oMessage, function(data){fillCountries(data,oCountry)},false,'/crm/CountryStateAction.do');
		else
			ajaxCall(oMessage,function(data){fillCountries(data, oCountry)},false,'/crm/forms/countryState');
	}

	var selectState = function (countryID, stateID, isForm)
	{
		var countryName = document.getElementById(countryID).value;
		var oState = document.getElementById(stateID);
		
		// If no dependent state field, return false; 
		if(oState == null)
			return false;
		
		var oMessage = "{\"task\":\"getStates\",\"countryname\":\"" + countryName + "\"}";
		
		if(!isForm)
			ajaxCall(oMessage,function(data){fillStates(data, oState)},false,'/crm/CountryStateAction.do');
		else
			ajaxCall(oMessage,function(data){fillStates(data, oState)},false,'/crm/forms/countryState');
	}
	
	var selectStateByValue = function (countryName, stateID, isForm)
	{
		var oState = document.getElementById(stateID);
		// If no dependent state field, return false; 
		if(oState == null)
			return false;
		
		var oMessage = "{\"task\":\"getStates\",\"countryname\":\"" + countryName + "\"}";
		if(!isForm)
			ajaxCall(oMessage,function(data){fillStates(data, oState)},false,'/crm/CountryStateAction.do');
		else
			ajaxCall(oMessage,function(data){fillFormStates(data, oState)},false,'/crm/forms/countryState');
	}

	var fillFormStates = function(JSON, oCurrent) 
	{
		// fill with new options from JSON array
		var data = eval(JSON);
		for (var i=0;i < data.state.length;i++) {
			oCurrent.options[oCurrent.options.length] = new Option(data.state[i],data.state[i]);
		}
	}
	
	var fillCountries = function(JSON, oCurrent) 
	{
	    // fill with new options from JSON array
	    var data = eval(JSON);
	    for (var i=0;i < data.countryName.length;i++) {
	    	oCurrent.options[oCurrent.options.length] = new Option(data.countryName[i],data.countryName[i]);
	    }
	}
	
	var fillStates = function(JSON, oCurrent) 
	{
		oCurrent.options.length = 0;
		
		// fill with new options from JSON array
		var data = eval(JSON);
		for (var i=0;i < data.state.length;i++) {
			oCurrent.options[oCurrent.options.length] = new Option(data.state[i],data.state[i]);
		}
	}
	
	var fieldLabelProperty = function (sFieldLabel)
	{
		/* TODO if Country, State is a new data type
		  sFieldLabel = sFieldLabel.replace(".", "___");
		sFieldLabel = sFieldLabel.replace("(", "____");
		sFieldLabel = sFieldLabel.replace(")", "_____");
		 */ 
		return "property(" + sFieldLabel + ")";
	}
	
	var addDefaultValue = function (oCurrentField, value)
	{
		var oSelect = document.getElementById(oCurrentField);
		if(oSelect == null)
			return false;
		// Check this value ( Country or State )is already in the List, if not add it.
		var isAlreadyinList = false; 
		
		for(i = 0 ;i < oSelect.options.length; i++)
		{
			if(oSelect.options[i].value == value)
			{
				isAlreadyinList = true;
				break;
			}
		}
		// Add the default value 
		if(!isAlreadyinList)
		{
			oSelect.options[oSelect.options.length] = new Option(value,value,true,true);
		}
	}
	
	return{
		ajaxCall : ajaxCall,
		selectState : selectState,
		fillCountries : fillCountries,
		fillStates : fillStates,
		triggerCountry : triggerCountry,
		fieldLabelProperty : fieldLabelProperty,
		selectStateByValue : selectStateByValue,
		addDefaultValue : addDefaultValue
	};
}();

_IW.Map = function()
{
    // members
    var keyArray = new Array(); // Keys
    var valArray = new Array(); // Values
        
    // functions
    
var put = function( key, val )
{
    var elementIndex = findIt( key );
    
    if( elementIndex == (-1) )
    {
        keyArray.push( key );
        valArray.push( val );
    }
    else
    {
        valArray[ elementIndex ] = val;
    }
}

var get = function ( key )
{
    var result = null;
    var elementIndex = findIt( key );

    if( elementIndex != (-1) )
    {   
        result = valArray[ elementIndex ];
    }  
    
    return result;
}

var remove = function ( key )
{
    var result = null;
    var elementIndex = findIt( key );

    if( elementIndex != (-1) )
    {
        keyArray = keyArray.removeAt(elementIndex);
        valArray = valArray.removeAt(elementIndex);
    }  
    
    return ;
}

var size = function ()
{
    return (keyArray.length);  
}

var clear = function ()
{
    for( var i = 0; i < keyArray.length; i++ )
    {
        keyArray.pop(); valArray.pop();   
    }
}

var keySet = function ()
{
    return (keyArray);
}

var valSet = function ()
{
    return (valArray);   
}

var showMe = function ()
{
    var result = "";
    
    for( var i = 0; i < keyArray.length; i++ )
    {
        result += "Key: " + keyArray[ i ] + "\tValues: " + valArray[ i ] + "\n";
    }
    return result;
}

var findIt = function ( key )
{
    var result = (-1);

    for( var i = 0; i < keyArray.length; i++ )
    {
        if( keyArray[ i ] == key )
        {
            result = i;
            break;
        }
    }
    return result;
}

var removeAt = function ( index )
{
  var part1 = slice( 0, index);
  var part2 = slice( index+1 );

  return( part1.concat( part2 ) );
}

return{
    put : put,
    get : get,
    size : size,  
    clear : clear,
    keySet : keySet,
    valSet : valSet,
    showMe : showMe,   // returns a string with all keys and values in map.
    findIt : findIt
		 
	};

}();

