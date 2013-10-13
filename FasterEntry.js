Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (var i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};

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
	this.cancelImage = new Image(this.cancelImgURL);
	Hammer.plugins.fakeMultitouch();
	Hammer.plugins.showTouches();
	Hammer(this.front)
		.on("dragend",		this._endGetNewValue	)
		.on("drag",		this._onTouchMove	)
		.on("dragstart",	this._onTouchStart	)
	;
}

FasterEntry.next_id = 1;

FasterEntry.default_template = "<span>R$<%= parseInt(dolars) %>,<%= parseInt(cents) %></span>";

FasterEntry.moneyIncrementDollars = function(data, deltaX, deltaY) {
	console.log("moneyIncrementDollars: " + data + ", " + deltaX + ", " + deltaY);
	//console.log(data);
	data.dolars -= deltaY;
	if(data.dolars < 0) data.dolars = 0;
	return data;
}

FasterEntry.moneyIncrementCents = function(data, deltaX, deltaY) {
	//console.log("moneyIncrementCents: " + data + ", " + deltaX + ", " + deltaY);
	//console.log(data);
	data.cents += deltaX;
	if(data.cents >= 100) {
		data.dolars += parseInt(data.cents / 100);
		data.cents = data.cents % 100;
	}
	if(data.cents < 0) {
		if(data.dolars <= 0) {
			data.cents = 0;
		} else {
			data.dolars -= parseInt(data.cents / 100) - 1;
			data.cents = 100 + data.cents % 100;
		}
	}
	return data;
}

FasterEntry.money_modifiers = {
	cents: {
		startWithX:	30,
		intervalX:	30,
		callback:	FasterEntry.moneyIncrementCents,
	},
	dolars: {
		startWithY:	50,
		intervalY:	30,
		callback:	FasterEntry.moneyIncrementDollars,
	},
};

FasterEntry.prototype = {
	root:		document.body,
	front:		null,
	initialData:	null,
	actualData:	null,
	callback:	null,
	touches:	null,
	actualModifier:	null,
	modLast:	null,
	last:		null,
	cancelImgURL:	"./cancel.png",
	template:	new Template(FasterEntry.default_template),
	modifiers:	{},
	setTemplate:		function(template) {
		this.template = new Template(template);
	},
	getNewValueOf:		function(data, callback) {
		this.actualData = this.initialData = data;
		this.callback = callback;
		this.root.appendChild(this.front);
		//this.root.appendChild(this.canvas);
		this.canvasContext = this.canvas.getContext("2d");
		this.render();
		this.content.style.top	= (this.front.offsetHeight / 2) - (this.content.offsetHeight / 2);
		this.content.style.left	= (this.front.offsetWidth  / 2) - (this.content.offsetWidth  / 2);
		this.modLast = {};
		this.last = {};
	},
	render:			function() {
		this.content.innerHTML	= this.template.render(this.actualData);
	},
	close:			function() {
		this.root.removeChild(this.front);
		if(this.callback) this.callback.call(this, this.actualData);
		this.touches		= [];
		this.callback		= null;
		this.initialData	= null;
		this.actualData		= null;
		this.firstTouch		= null;
		this.actualModifier	= null;
		this.modLast		= {};
		this.last		= {};
	},
	touchHandler:		function(touch_event) {
		this.dispatchModifier(touch_event);
	},
	dispatchModifier:	function(touch_event) {
		for(var actual in this.modifiers) {
			if(!this.modifiers.hasOwnProperty(actual)) continue;
			var mod = this.modifiers[actual];
			var okX = mod.startWithX == null || Math.abs(mod.startWithX) <= Math.abs(touch_event.deltaX);
			var okY = mod.startWithY == null || Math.abs(mod.startWithY) <= Math.abs(touch_event.deltaY);

			if(mod && okX && okY) {
				var clonedData = this.initialData.clone();
				var deltaX = 0, deltaY = 0;
				if(mod.intervalX) deltaX = (touch_event.deltaX - (touch_event.deltaX / Math.abs(touch_event.deltaX) * mod.startWithX)) / mod.intervalX;
				if(mod.intervalY) deltaY = (touch_event.deltaY - (touch_event.deltaY / Math.abs(touch_event.deltaY) * mod.startWithY)) / mod.intervalY;
				this.actualData = mod.callback.call(this, clonedData, deltaX, deltaY);
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
		this.canvasContext.drawImage(this.cancelImage, gest.pageX, gest.pageY);
	},
};
