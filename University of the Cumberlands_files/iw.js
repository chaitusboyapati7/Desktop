//
// Define and instantiate the _IW singleton
//
// NOTE that _IW is now a real ExtJS Base object with Observable.
// The intention here is to create a singleton for application level events
// 
var _IW;

if(typeof Ext != 'undefined'){
	Ext.define(null, {
		extend: 'Ext.Base',
	    mixins: {
	        observable: 'Ext.util.Observable'
	    },
	    
	    constructor: function (config) {
	        this.mixins.observable.constructor.call(this, config);
	    },
	    
		Ext: { },	// Not sure we need this if we're always using Ext.define().
		currentUserId: undefined
	}, function() {
		_IW = new this();
	});
}
else{
	_IW = { 
		Ext: { },
		currentUserId: undefined
	};
}