function FasterEntry(template, modifiers, root) {
	if(template == null)	template = this.default_template;
	if(modifiers == null)	modifiers = FasterEntry.money_modifiers;
	if(root == null)	root = document.body;

	this.root = root;
	this.id = FasterEntry.next_id++;

	this.canvas = document.createElement("CANVAS");
	this.canvas.id = "faster_entry_canvas_id_" + this.id;
	this.canvas.obj = this;
	this.canvas.className	= "faster_entry_canvas";

	this.front = document.createElement("DIV");
	this.front.id = "faster_entry_front_id_" + this.id;
	this.front.obj = this;
	this.front.className	= "faster_entry_front";

	this.content	= document.createElement("DIV");
	this.content.id	= "content";
	this.modifiers = modifiers;
	this.front.appendChild(this.content);
	Hammer.plugins.fakeMultitouch();
	Hammer.plugins.showTouches();
	Hammer(this.front)
		.on("dragend",		this._endGetNewValue	)
		.on("drag",		this._onTouchMove	)
		.on("dragstart",	this._onTouchStart	)
	;
}

FasterEntry.next_id = 1;

FasterEntry.default_template = "<span>R$<%= dolars %>,<%= cents %></span>";

FasterEntry.moneyIncrementDollars = function(data, deltaX, deltaY) {
	console.log("moneyIncrementDollars: " + data + ", " + deltaX + ", " + deltaY);
	console.log(data);
	data.dolars -= deltaY;
	if(data.dolars < 0) data.dolars = 0;
}

FasterEntry.moneyIncrementCents = function(data, deltaX, deltaY) {
	console.log("moneyIncrementCents: " + data + ", " + deltaX + ", " + deltaY);
	console.log(data);
	data.cents -= deltaX;
	if(data.cents >= 100) {
		data.dolars += parseInt(data.cents / 100);
		data.cents = data.cents % 100;
	}
	if(data.cents < 0) {
		if(data.dolars <= 0) {
			data.cents = 0;
		} else {
			data.dolars += parseInt(data.cents / 100) - 1;
			data.cents = data.cents % 100;
		}
	}
}

FasterEntry.money_modifiers = {
	dolars: {
		startWithX:	0.5,
		intervalX:	0.3,
		callback:	FasterEntry.moneyIncrementDollars,
	},
	cents: {
		startWithY:	0.5,
		intervalY:	0.3,
		callback:	FasterEntry.moneyIncrementCents,
	},
};

FasterEntry.prototype = {
	root:		document.body,
	front:		null,
	data:		null,
	callback:	null,
	touches:	null,
	actualModifier:	null,
	modLast:	null,
	last:		null,
	template:	new Template(FasterEntry.default_template),
	modifiers:	{},
	setTemplate:		function(template) {
		this.template = new Template(template);
	},
	getNewValueOf:		function(data, callback) {
		this.data = data;
		this.callback = callback;
		this.root.appendChild(this.front);
		this.render();
		this.content.style.top	= (this.front.offsetHeight / 2) - (this.content.offsetHeight / 2);
		this.content.style.left	= (this.front.offsetWidth  / 2) - (this.content.offsetWidth  / 2);
		this.modLast = {};
		this.last = {};
	},
	render:			function() {
		this.content.innerHTML	= this.template.render(this.data);
	},
	close:			function() {
		this.root.removeChild(this.front);
		if(this.callback) this.callback.call(this, this.data);
		this.touches		= [];
		this.callback		= null;
		this.data		= null;
		this.firstTouch		= null;
		this.actualModifier	= null;
		this.modLast		= {};
		this.last		= {};
	},
	touchStartHandler:		function(touch_event) {
		//if(!this.touches) this.touches = [];
		//if(this.touches.length <= 0) {
		//	this.firstTouch = point;
		//	this.last = point;
		//	this.touches.push(point);
		//}
		//console.log(point);
	},
	touchHandler:		function(touch_event) {
		//console.log("touchHandler");
		this.dispatchModifier(touch_event);
	},
	dispatchModifier:	function(touch_event) {
		for(var actual in this.modifiers) {
			var mod = this.modifiers[actual];
			var okX = ! mod.startWithX || mod.startWithX >= touch_event.deltaX;
			var okY = ! mod.startWithY || mod.startWithY >= touch_event.deltaY;

			if(okX && okY) {
console.log(touch_event.deltaX + " - " + mod.startWithX + " = " + (touch_event.deltaX - mod.startWithX));
				var deltaX = 0, deltaY = 0;
				//if(mod.intervalX) deltaX = touch_event.deltaX / mod.intervalX;
				//if(mod.intervalY) deltaY = touch_event.deltaY / mod.intervalY;
				if(mod.intervalX) deltaX = (touch_event.deltaX - mod.startWithX) / mod.intervalX;
				if(mod.intervalY) deltaY = (touch_event.deltaY - mod.startWithY) / mod.intervalY;

console.log("deltaX: " + deltaX + " deltaY: " + deltaY);

				mod.callback.call(this, this.data, deltaX, deltaY);
				this.render();
				return;
			}
		}
	},
	_endGetNewValue:	function(e) {
		e.gesture.preventDefault();
		this.obj.close();
	},
	_onTouchMove:		function(e) {
		e.gesture.preventDefault();
		var gest = e.gesture;
		this.obj.touchHandler(gest);
	},
	_onTouchStart:		function(e) {
		e.gesture.preventDefault();
		var gest = e.gesture;
		this.obj.touchStartHandler(gest);
	},
};
